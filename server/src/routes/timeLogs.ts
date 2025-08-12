import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { db } from '../database/config';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { TimeLog, ApiResponse, PaginatedResponse } from '../types';

const router = Router();

// 验证模式
const timeLogSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.min': '时间记录标题不能为空',
    'string.max': '时间记录标题最多200个字符',
    'any.required': '时间记录标题是必填项'
  }),
  description: Joi.string().max(2000).optional().allow(''),
  categoryId: Joi.string().uuid().optional().allow(null),
  taskId: Joi.string().uuid().optional().allow(null),
  startTime: Joi.date().required(),
  endTime: Joi.date().optional().allow(null),
  duration: Joi.number().min(0).optional(),
  isRunning: Joi.boolean().default(false)
});

const updateTimeLogSchema = timeLogSchema.fork(['title', 'startTime'], (schema) => schema.optional());

// 获取时间记录列表
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<TimeLog>>>) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const categoryId = req.query.categoryId as string;
  const taskId = req.query.taskId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const isRunning = req.query.isRunning === 'true';

  // 构建查询条件
  let query = db('time_logs')
    .leftJoin('tasks', 'time_logs.task_id', 'tasks.id')
    .leftJoin('categories', 'time_logs.category_id', 'categories.id')
    .where('time_logs.user_id', userId)
    .select(
      'time_logs.*',
      'tasks.title as task_title',
      'categories.name as category_name'
    );
  
  if (categoryId) {
    query = query.where('time_logs.category_id', categoryId);
  }
  
  if (taskId) {
    query = query.where('time_logs.task_id', taskId);
  }
  
  if (startDate) {
    query = query.where('time_logs.start_time', '>=', startDate);
  }
  
  if (endDate) {
    query = query.where('time_logs.start_time', '<=', endDate);
  }
  
  if (isRunning !== undefined) {
    query = query.where('time_logs.is_running', isRunning);
  }

  // 获取总数
  const totalQuery = db('time_logs').where('user_id', userId);
  if (categoryId) totalQuery.where('category_id', categoryId);
  if (taskId) totalQuery.where('task_id', taskId);
  if (startDate) totalQuery.where('start_time', '>=', startDate);
  if (endDate) totalQuery.where('start_time', '<=', endDate);
  if (isRunning !== undefined) totalQuery.where('is_running', isRunning);
  
  const [{ count }] = await totalQuery.count('* as count');
  const total = count as number;

  // 获取分页数据
  const records = await query
    .orderBy('time_logs.start_time', 'desc')
    .limit(limit)
    .offset(offset);

  const timeLogs: TimeLog[] = records.map(record => ({
    id: record.id,
    title: record.title,
    description: record.description,
    categoryId: record.category_id,
    taskId: record.task_id,
    taskName: record.task_title || '',
    category: record.category_name || '',
    startTime: new Date(record.start_time),
    endTime: record.end_time ? new Date(record.end_time) : undefined,
    duration: record.duration,
    isRunning: Boolean(record.is_running),
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  }));

  res.json({
    success: true,
    data: {
      data: timeLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// 获取单个时间记录
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<TimeLog>>) => {
  const userId = req.user!.id;
  const timeLogId = req.params.id;

  const record = await db('time_logs')
    .leftJoin('tasks', 'time_logs.task_id', 'tasks.id')
    .leftJoin('categories', 'time_logs.category_id', 'categories.id')
    .where({ 'time_logs.id': timeLogId, 'time_logs.user_id': userId })
    .select(
      'time_logs.*',
      'tasks.title as task_title',
      'categories.name as category_name'
    )
    .first();

  if (!record) {
    throw createError('时间记录不存在', 404);
  }

  const timeLog: TimeLog = {
    id: record.id,
    title: record.title,
    description: record.description,
    categoryId: record.category_id,
    taskId: record.task_id,
    taskName: record.task_title || '',
    category: record.category_name || '',
    startTime: new Date(record.start_time),
    endTime: record.end_time ? new Date(record.end_time) : undefined,
    duration: record.duration,
    isRunning: Boolean(record.is_running),
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  };

  res.json({
    success: true,
    data: timeLog
  });
}));

// 创建时间记录
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<TimeLog>>) => {
  const userId = req.user!.id;
  const { error, value } = timeLogSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  // 验证分类是否存在
  if (value.categoryId) {
    const category = await db('categories')
      .where({ id: value.categoryId, user_id: userId })
      .first();
    if (!category) {
      throw createError('分类不存在', 400);
    }
  }

  // 验证任务是否存在
  if (value.taskId) {
    const task = await db('tasks')
      .where({ id: value.taskId, user_id: userId })
      .first();
    if (!task) {
      throw createError('任务不存在', 400);
    }
  }

  const timeLogId = uuidv4();
  const now = new Date();

  // 计算持续时间
  let duration = value.duration;
  if (!duration && value.endTime) {
    duration = Math.floor((new Date(value.endTime).getTime() - new Date(value.startTime).getTime()) / 1000);
  }

  await db('time_logs').insert({
    id: timeLogId,
    title: value.title,
    description: value.description,
    category_id: value.categoryId,
    task_id: value.taskId,
    start_time: value.startTime,
    end_time: value.endTime,
    duration,
    is_running: value.isRunning,
    user_id: userId,
    created_at: now,
    updated_at: now
  });

  const timeLog: TimeLog = {
    id: timeLogId,
    title: value.title,
    description: value.description,
    categoryId: value.categoryId,
    taskId: value.taskId,
    startTime: new Date(value.startTime),
    endTime: value.endTime ? new Date(value.endTime) : undefined,
    duration,
    isRunning: value.isRunning,
    userId,
    createdAt: now,
    updatedAt: now
  };

  res.status(201).json({
    success: true,
    data: timeLog,
    message: '时间记录创建成功'
  });
}));

// 更新时间记录
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<TimeLog>>) => {
  const userId = req.user!.id;
  const timeLogId = req.params.id;
  const { error, value } = updateTimeLogSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const existingTimeLog = await db('time_logs')
    .where({ id: timeLogId, user_id: userId })
    .first();

  if (!existingTimeLog) {
    throw createError('时间记录不存在', 404);
  }

  // 验证分类是否存在
  if (value.categoryId) {
    const category = await db('categories')
      .where({ id: value.categoryId, user_id: userId })
      .first();
    if (!category) {
      throw createError('分类不存在', 400);
    }
  }

  // 验证任务是否存在
  if (value.taskId) {
    const task = await db('tasks')
      .where({ id: value.taskId, user_id: userId })
      .first();
    if (!task) {
      throw createError('任务不存在', 400);
    }
  }

  const updateData: any = {
    updated_at: new Date()
  };

  if (value.title !== undefined) updateData.title = value.title;
  if (value.description !== undefined) updateData.description = value.description;
  if (value.categoryId !== undefined) updateData.category_id = value.categoryId;
  if (value.taskId !== undefined) updateData.task_id = value.taskId;
  if (value.startTime !== undefined) updateData.start_time = value.startTime;
  if (value.endTime !== undefined) updateData.end_time = value.endTime;
  if (value.isRunning !== undefined) updateData.is_running = value.isRunning;

  // 重新计算持续时间
  if (value.startTime !== undefined || value.endTime !== undefined) {
    const startTime = value.startTime ? new Date(value.startTime) : new Date(existingTimeLog.start_time);
    const endTime = value.endTime ? new Date(value.endTime) : (existingTimeLog.end_time ? new Date(existingTimeLog.end_time) : null);
    
    if (endTime) {
      updateData.duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    }
  }

  await db('time_logs')
    .where({ id: timeLogId, user_id: userId })
    .update(updateData);

  // 获取更新后的时间记录
  const updatedRecord = await db('time_logs')
    .leftJoin('tasks', 'time_logs.task_id', 'tasks.id')
    .leftJoin('categories', 'time_logs.category_id', 'categories.id')
    .where({ 'time_logs.id': timeLogId, 'time_logs.user_id': userId })
    .select(
      'time_logs.*',
      'tasks.title as task_title',
      'categories.name as category_name'
    )
    .first();

  const timeLog: TimeLog = {
    id: updatedRecord.id,
    title: updatedRecord.title,
    description: updatedRecord.description,
    categoryId: updatedRecord.category_id,
    taskId: updatedRecord.task_id,
    taskName: updatedRecord.task_title || '',
    category: updatedRecord.category_name || '',
    startTime: new Date(updatedRecord.start_time),
    endTime: updatedRecord.end_time ? new Date(updatedRecord.end_time) : undefined,
    duration: updatedRecord.duration,
    isRunning: Boolean(updatedRecord.is_running),
    userId: updatedRecord.user_id,
    createdAt: new Date(updatedRecord.created_at),
    updatedAt: new Date(updatedRecord.updated_at)
  };

  res.json({
    success: true,
    data: timeLog,
    message: '时间记录更新成功'
  });
}));

// 删除时间记录
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const timeLogId = req.params.id;

  const existingTimeLog = await db('time_logs')
    .where({ id: timeLogId, user_id: userId })
    .first();

  if (!existingTimeLog) {
    throw createError('时间记录不存在', 404);
  }

  await db('time_logs').where({ id: timeLogId, user_id: userId }).del();

  res.json({
    success: true,
    message: '时间记录删除成功'
  });
}));

// 开始计时
router.post('/:id/start', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<TimeLog>>) => {
  const userId = req.user!.id;
  const timeLogId = req.params.id;

  const existingTimeLog = await db('time_logs')
    .where({ id: timeLogId, user_id: userId })
    .first();

  if (!existingTimeLog) {
    throw createError('时间记录不存在', 404);
  }

  if (existingTimeLog.is_running) {
    throw createError('时间记录已在运行中', 400);
  }

  // 停止其他正在运行的时间记录
  await db('time_logs')
    .where({ user_id: userId, is_running: true })
    .update({ 
      is_running: false,
      end_time: new Date(),
      updated_at: new Date()
    });

  // 开始当前时间记录
  const now = new Date();
  await db('time_logs')
    .where({ id: timeLogId, user_id: userId })
    .update({
      is_running: true,
      start_time: now,
      end_time: null,
      duration: null,
      updated_at: now
    });

  // 获取更新后的时间记录
  const updatedRecord = await db('time_logs')
    .where({ id: timeLogId, user_id: userId })
    .first();

  const timeLog: TimeLog = {
    id: updatedRecord.id,
    title: updatedRecord.title,
    description: updatedRecord.description,
    categoryId: updatedRecord.category_id,
    taskId: updatedRecord.task_id,
    startTime: new Date(updatedRecord.start_time),
    endTime: updatedRecord.end_time ? new Date(updatedRecord.end_time) : undefined,
    duration: updatedRecord.duration,
    isRunning: Boolean(updatedRecord.is_running),
    userId: updatedRecord.user_id,
    createdAt: new Date(updatedRecord.created_at),
    updatedAt: new Date(updatedRecord.updated_at)
  };

  res.json({
    success: true,
    data: timeLog,
    message: '计时开始'
  });
}));

// 停止计时
router.post('/:id/stop', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<TimeLog>>) => {
  const userId = req.user!.id;
  const timeLogId = req.params.id;

  const existingTimeLog = await db('time_logs')
    .where({ id: timeLogId, user_id: userId })
    .first();

  if (!existingTimeLog) {
    throw createError('时间记录不存在', 404);
  }

  if (!existingTimeLog.is_running) {
    throw createError('时间记录未在运行中', 400);
  }

  const now = new Date();
  const startTime = new Date(existingTimeLog.start_time);
  const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);

  await db('time_logs')
    .where({ id: timeLogId, user_id: userId })
    .update({
      is_running: false,
      end_time: now,
      duration,
      updated_at: now
    });

  // 获取更新后的时间记录
  const updatedRecord = await db('time_logs')
    .where({ id: timeLogId, user_id: userId })
    .first();

  const timeLog: TimeLog = {
    id: updatedRecord.id,
    title: updatedRecord.title,
    description: updatedRecord.description,
    categoryId: updatedRecord.category_id,
    taskId: updatedRecord.task_id,
    startTime: new Date(updatedRecord.start_time),
    endTime: updatedRecord.end_time ? new Date(updatedRecord.end_time) : undefined,
    duration: updatedRecord.duration,
    isRunning: Boolean(updatedRecord.is_running),
    userId: updatedRecord.user_id,
    createdAt: new Date(updatedRecord.created_at),
    updatedAt: new Date(updatedRecord.updated_at)
  };

  res.json({
    success: true,
    data: timeLog,
    message: '计时停止'
  });
}));

// 获取正在运行的时间记录
router.get('/running', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<TimeLog | null>>) => {
  const userId = req.user!.id;

  const record = await db('time_logs')
    .leftJoin('tasks', 'time_logs.task_id', 'tasks.id')
    .leftJoin('categories', 'time_logs.category_id', 'categories.id')
    .where({ 'time_logs.user_id': userId, 'time_logs.is_running': true })
    .select(
      'time_logs.*',
      'tasks.title as task_title',
      'categories.name as category_name'
    )
    .first();

  if (!record) {
    res.json({
      success: true,
      data: null
    });
    return;
  }

  const timeLog: TimeLog = {
    id: record.id,
    title: record.title,
    description: record.description,
    categoryId: record.category_id,
    taskId: record.task_id,
    taskName: record.task_title || '',
    category: record.category_name || '',
    startTime: new Date(record.start_time),
    endTime: record.end_time ? new Date(record.end_time) : undefined,
    duration: record.duration,
    isRunning: Boolean(record.is_running),
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  };

  res.json({
    success: true,
    data: timeLog
  });
}));

// 开始新的时间记录
router.post('/start', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<TimeLog>>) => {
  const userId = req.user!.id;
  const { taskId, description } = req.body;

  // 验证任务是否存在
  let taskTitle = '';
  let categoryName = '';
  if (taskId) {
    const task = await db('tasks')
      .leftJoin('categories', 'tasks.category_id', 'categories.id')
      .where({ 'tasks.id': taskId, 'tasks.user_id': userId })
      .select('tasks.title', 'categories.name as category_name')
      .first();
    if (!task) {
      throw createError('任务不存在', 400);
    }
    taskTitle = task.title;
    categoryName = task.category_name || '';
  }

  // 停止其他正在运行的时间记录
  await db('time_logs')
    .where({ user_id: userId, is_running: true })
    .update({ 
      is_running: false,
      end_time: new Date(),
      updated_at: new Date()
    });

  // 创建新的时间记录
  const timeLogId = uuidv4();
  const now = new Date();

  // 获取任务信息作为标题
  let title = '时间记录';
  if (taskId && taskTitle) {
    title = taskTitle;
  }

  await db('time_logs').insert({
    id: timeLogId,
    title,
    description: description || '',
    category_id: null,
    task_id: taskId,
    start_time: now,
    end_time: null,
    duration: null,
    is_running: true,
    user_id: userId,
    created_at: now,
    updated_at: now
  });

  const timeLog: TimeLog = {
    id: timeLogId,
    title,
    description: description || '',
    categoryId: undefined,
    taskId,
    taskName: taskTitle,
    category: categoryName,
    startTime: now,
    endTime: undefined,
    duration: undefined,
    isRunning: true,
    userId,
    createdAt: now,
    updatedAt: now
  };

  res.status(201).json({
    success: true,
    data: timeLog,
    message: '计时开始'
  });
}));

// 获取正在运行的时间记录
router.get('/running/current', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<TimeLog | null>>) => {
  const userId = req.user!.id;

  const record = await db('time_logs')
    .leftJoin('tasks', 'time_logs.task_id', 'tasks.id')
    .leftJoin('categories', 'time_logs.category_id', 'categories.id')
    .where({ 'time_logs.user_id': userId, 'time_logs.is_running': true })
    .select(
      'time_logs.*',
      'tasks.title as task_title',
      'categories.name as category_name'
    )
    .first();

  if (!record) {
    res.json({
      success: true,
      data: null
    });
    return;
  }

  const timeLog: TimeLog = {
    id: record.id,
    title: record.title,
    description: record.description,
    categoryId: record.category_id,
    taskId: record.task_id,
    taskName: record.task_title || '',
    category: record.category_name || '',
    startTime: new Date(record.start_time),
    endTime: record.end_time ? new Date(record.end_time) : undefined,
    duration: record.duration,
    isRunning: Boolean(record.is_running),
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  };

  res.json({
    success: true,
    data: timeLog
  });
}));

// 获取时间统计
router.get('/statistics/summary', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const categoryId = req.query.categoryId as string;

  let query = db('time_logs').where('user_id', userId);
  
  if (startDate) {
    query = query.where('start_time', '>=', startDate);
  }
  
  if (endDate) {
    query = query.where('start_time', '<=', endDate);
  }
  
  if (categoryId) {
    query = query.where('category_id', categoryId);
  }

  const [totalResult] = await query.clone().sum('duration as total_duration');
  const [countResult] = await query.clone().count('* as total_count');
  const [avgResult] = await query.clone().avg('duration as avg_duration');

  const categoryStats = await query.clone()
    .join('categories', 'time_logs.category_id', 'categories.id')
    .groupBy('categories.id', 'categories.name')
    .select('categories.id', 'categories.name')
    .sum('time_logs.duration as total_duration')
    .count('time_logs.id as count');

  res.json({
    success: true,
    data: {
      totalDuration: totalResult.total_duration || 0,
      totalCount: countResult.total_count || 0,
      avgDuration: avgResult.avg_duration || 0,
      categoryStats
    }
  });
}));

export { router as timeLogRoutes };