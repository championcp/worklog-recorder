import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { db } from '../database/config';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { Task, TaskStatus, TaskPriority, ApiResponse, PaginatedResponse, TaskFilters } from '../types';

const router = Router();

// 验证模式
const taskSchema = Joi.object({
  tagIds: Joi.array().items(Joi.number()),
  title: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  status: Joi.string().valid('pending', 'in_progress', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: Joi.date().optional().allow(null),
  completedAt: Joi.date().optional().allow(null),
  parentTaskId: Joi.string().optional().allow(null, ''),
  categoryId: Joi.string().optional().allow(null, ''),
  tags: Joi.array().items(Joi.string()).optional(),
  estimatedHours: Joi.number().optional().allow(null),
  startedAt: Joi.date().optional().allow(null),
});

const updateTaskSchema = taskSchema.fork(['title'], (schema) => schema.optional());

// 获取指定分类下的任务
router.get('/category/:categoryId', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { categoryId } = req.params;
  const userId = req.user!.id;

  // 验证分类是否存在且属于当前用户
  const category = await db('categories')
    .where({ id: categoryId, user_id: userId })
    .first();

  if (!category) {
    throw createError('分类不存在', 404);
  }

  // 获取该分类下的所有任务
  const tasks = await db('tasks')
    .select(
      'tasks.*',
      'categories.name as category_name',
      'categories.color as category_color'
    )
    .leftJoin('categories', 'tasks.category_id', 'categories.id')
    .where('tasks.category_id', categoryId)
    .where('tasks.user_id', userId)
    .orderBy('tasks.created_at', 'desc');

  const response: ApiResponse<Task[]> = {
    success: true,
    data: tasks,
    message: '获取分类任务成功'
  };

  res.json(response);
}));

// 获取任务列表
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<Task>>>) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  // 构建查询条件
  let query = db('tasks')
    .where('user_id', userId)
    .orderBy('created_at', 'desc');

  // 应用筛选条件
  const filters: TaskFilters = req.query as any;
  
  if (filters.status && filters.status.length > 0) {
    query = query.whereIn('status', filters.status);
  }
  
  if (filters.priority && filters.priority.length > 0) {
    query = query.whereIn('priority', filters.priority);
  }
  
  if (filters.categoryId && filters.categoryId.length > 0) {
    query = query.whereIn('category_id', filters.categoryId);
  }
  
  if (filters.startDate) {
    query = query.where('start_date', '>=', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.where('end_date', '<=', filters.endDate);
  }
  
  if (filters.search) {
    query = query.where(function() {
      this.where('title', 'like', `%${filters.search}%`)
          .orWhere('description', 'like', `%${filters.search}%`);
    });
  }

  // 获取总数
  const totalQuery = query.clone();
  const [{ count }] = await totalQuery.count('* as count');
  const total = count as number;

  // 获取分页数据
  const taskRecords = await query.limit(limit).offset(offset);

  // 获取任务的分类和标签信息
  const tasks: Task[] = [];
  for (const record of taskRecords) {
    // 获取分类信息
    let category = null;
    if (record.category_id) {
      category = await db('categories').where('id', record.category_id).first();
    }

    // 获取标签信息
    const tagRecords = await db('task_tags')
      .join('tags', 'task_tags.tag_id', 'tags.id')
      .where('task_tags.task_id', record.id)
      .select('tags.*');

    const tags = tagRecords.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      userId: tag.user_id,
      createdAt: new Date(tag.created_at),
      updatedAt: new Date(tag.updated_at)
    }));

    // 获取子任务
    const subtaskRecords = await db('tasks').where('parent_task_id', record.id);
    const subtasks = subtaskRecords.map(subtask => ({
      id: subtask.id,
      title: subtask.title,
      description: subtask.description,
      status: subtask.status as TaskStatus,
      priority: subtask.priority as TaskPriority,
      categoryId: subtask.category_id,
      tags: [],
      startDate: subtask.start_date ? new Date(subtask.start_date) : undefined,
      endDate: subtask.end_date ? new Date(subtask.end_date) : undefined,
      dueDate: subtask.due_date ? new Date(subtask.due_date) : undefined,
      estimatedHours: subtask.estimated_hours,
      actualHours: subtask.actual_hours,
      userId: subtask.user_id,
      parentTaskId: subtask.parent_task_id,
      createdAt: new Date(subtask.created_at),
      updatedAt: new Date(subtask.updated_at)
    }));

    const task: Task = {
      id: record.id,
      title: record.title,
      description: record.description,
      status: record.status as TaskStatus,
      priority: record.priority as TaskPriority,
      categoryId: record.category_id,
      category: category ? {
        id: category.id,
        name: category.name,
        color: category.color,
        description: category.description,
        userId: category.user_id,
        createdAt: new Date(category.created_at),
        updatedAt: new Date(category.updated_at)
      } : undefined,
      tags,
      startDate: record.start_date ? new Date(record.start_date) : undefined,
      endDate: record.end_date ? new Date(record.end_date) : undefined,
      dueDate: record.due_date ? new Date(record.due_date) : undefined,
      estimatedHours: record.estimated_hours,
      actualHours: record.actual_hours,
      userId: record.user_id,
      parentTaskId: record.parent_task_id,
      subtasks,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    };

    tasks.push(task);
  }

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      data: tasks,
      total,
      page,
      limit,
      totalPages
    }
  });
}));

// 获取单个任务
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Task>>) => {
  const userId = req.user!.id;
  const taskId = req.params.id;

  const record = await db('tasks').where({ id: taskId, user_id: userId }).first();
  if (!record) {
    throw createError('任务不存在', 404);
  }

  // 获取分类信息
  let category = null;
  if (record.category_id) {
    category = await db('categories').where('id', record.category_id).first();
  }

  // 获取标签信息
  const tagRecords = await db('task_tags')
    .join('tags', 'task_tags.tag_id', 'tags.id')
    .where('task_tags.task_id', record.id)
    .select('tags.*');

  const tags = tagRecords.map(tag => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    userId: tag.user_id,
    createdAt: new Date(tag.created_at),
    updatedAt: new Date(tag.updated_at)
  }));

  // 获取子任务
  const subtaskRecords = await db('tasks').where('parent_task_id', record.id);
  const subtasks = subtaskRecords.map(subtask => ({
    id: subtask.id,
    title: subtask.title,
    description: subtask.description,
    status: subtask.status as TaskStatus,
    priority: subtask.priority as TaskPriority,
    categoryId: subtask.category_id,
    tags: [],
    startDate: subtask.start_date ? new Date(subtask.start_date) : undefined,
    endDate: subtask.end_date ? new Date(subtask.end_date) : undefined,
    dueDate: subtask.due_date ? new Date(subtask.due_date) : undefined,
    estimatedHours: subtask.estimated_hours,
    actualHours: subtask.actual_hours,
    userId: subtask.user_id,
    parentTaskId: subtask.parent_task_id,
    createdAt: new Date(subtask.created_at),
    updatedAt: new Date(subtask.updated_at)
  }));

  const task: Task = {
    id: record.id,
    title: record.title,
    description: record.description,
    status: record.status as TaskStatus,
    priority: record.priority as TaskPriority,
    categoryId: record.category_id,
    category: category ? {
      id: category.id,
      name: category.name,
      color: category.color,
      description: category.description,
      userId: category.user_id,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    } : undefined,
    tags,
    startDate: record.start_date ? new Date(record.start_date) : undefined,
    endDate: record.end_date ? new Date(record.end_date) : undefined,
    dueDate: record.due_date ? new Date(record.due_date) : undefined,
    estimatedHours: record.estimated_hours,
    actualHours: record.actual_hours,
    userId: record.user_id,
    parentTaskId: record.parent_task_id,
    subtasks,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  };

  res.json({
    success: true,
    data: task
  });
}));

// 创建任务
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Task>>) => {
  const { error, value } = taskSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const userId = req.user!.id;
  const taskId = uuidv4();
  const now = new Date();

  const {
    title,
    description,
    status = TaskStatus.PENDING,
    priority = TaskPriority.MEDIUM,
    categoryId,
    tagIds = [],
    startDate,
    endDate,
    dueDate,
    estimatedHours,
    parentTaskId
  } = value;

  // 验证分类是否属于当前用户
  if (categoryId && categoryId !== '') {
    const category = await db('categories').where({ id: categoryId, user_id: userId }).first();
    if (!category) {
      throw createError('分类不存在', 404);
    }
  }

  // 验证父任务是否属于当前用户
  if (parentTaskId && parentTaskId !== '') {
    const parentTask = await db('tasks').where({ id: parentTaskId, user_id: userId }).first();
    if (!parentTask) {
      throw createError('父任务不存在', 404);
    }
  }

  // 创建任务
  await db('tasks').insert({
    id: taskId,
    title,
    description,
    status,
    priority,
    category_id: categoryId && categoryId !== '' ? categoryId : null,
    start_date: startDate,
    end_date: endDate,
    due_date: dueDate,
    estimated_hours: estimatedHours,
    user_id: userId,
    parent_task_id: parentTaskId && parentTaskId !== '' ? parentTaskId : null,
    created_at: now,
    updated_at: now
  });

  // 添加标签关联
  if (tagIds.length > 0) {
    // 验证标签是否属于当前用户
    const tags = await db('tags').whereIn('id', tagIds).where('user_id', userId);
    if (tags.length !== tagIds.length) {
      throw createError('部分标签不存在', 404);
    }

    const taskTagInserts = tagIds.map((tagId: string) => ({
      task_id: taskId,
      tag_id: tagId
    }));
    await db('task_tags').insert(taskTagInserts);
  }

  // 获取创建的任务
  const createdTask = await db('tasks').where('id', taskId).first();
  
  const task: Task = {
    id: createdTask.id,
    title: createdTask.title,
    description: createdTask.description,
    status: createdTask.status as TaskStatus,
    priority: createdTask.priority as TaskPriority,
    categoryId: createdTask.category_id,
    tags: [],
    startDate: createdTask.start_date ? new Date(createdTask.start_date) : undefined,
    endDate: createdTask.end_date ? new Date(createdTask.end_date) : undefined,
    dueDate: createdTask.due_date ? new Date(createdTask.due_date) : undefined,
    estimatedHours: createdTask.estimated_hours,
    actualHours: createdTask.actual_hours,
    userId: createdTask.user_id,
    parentTaskId: createdTask.parent_task_id,
    subtasks: [],
    createdAt: new Date(createdTask.created_at),
    updatedAt: new Date(createdTask.updated_at)
  };

  res.status(201).json({
    success: true,
    data: task,
    message: '任务创建成功'
  });
}));

// 更新任务
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Task>>) => {
  const { error, value } = updateTaskSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const userId = req.user!.id;
  const taskId = req.params.id;

  // 检查任务是否存在
  const existingTask = await db('tasks').where({ id: taskId, user_id: userId }).first();
  if (!existingTask) {
    throw createError('任务不存在', 404);
  }

  const {
    title,
    description,
    status,
    priority,
    categoryId,
    tagIds,
    startDate,
    endDate,
    dueDate,
    estimatedHours,
    parentTaskId
  } = value;

  // 验证分类是否属于当前用户
  if (categoryId && categoryId !== '') {
    const category = await db('categories').where({ id: categoryId, user_id: userId }).first();
    if (!category) {
      throw createError('分类不存在', 404);
    }
  }

  // 验证父任务是否属于当前用户
  if (parentTaskId && parentTaskId !== '') {
    const parentTask = await db('tasks').where({ id: parentTaskId, user_id: userId }).first();
    if (!parentTask) {
      throw createError('父任务不存在', 404);
    }
  }

  // 更新任务
  const updateData: any = {
    updated_at: new Date()
  };

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (priority !== undefined) updateData.priority = priority;
  if (categoryId !== undefined) updateData.category_id = categoryId && categoryId !== '' ? categoryId : null;
  if (startDate !== undefined) updateData.start_date = startDate;
  if (endDate !== undefined) updateData.end_date = endDate;
  if (dueDate !== undefined) updateData.due_date = dueDate;
  if (estimatedHours !== undefined) updateData.estimated_hours = estimatedHours;
  if (parentTaskId !== undefined) updateData.parent_task_id = parentTaskId && parentTaskId !== '' ? parentTaskId : null;

  await db('tasks').where('id', taskId).update(updateData);

  // 更新标签关联
  if (tagIds !== undefined) {
    // 删除现有标签关联
    await db('task_tags').where('task_id', taskId).del();

    // 添加新的标签关联
    if (tagIds.length > 0) {
      // 验证标签是否属于当前用户
      const tags = await db('tags').whereIn('id', tagIds).where('user_id', userId);
      if (tags.length !== tagIds.length) {
        throw createError('部分标签不存在', 404);
      }

      const taskTagInserts = tagIds.map((tagId: string) => ({
        task_id: taskId,
        tag_id: tagId
      }));
      await db('task_tags').insert(taskTagInserts);
    }
  }

  // 获取更新后的任务
  const updatedRecord = await db('tasks').where('id', taskId).first();
  
  const task: Task = {
    id: updatedRecord.id,
    title: updatedRecord.title,
    description: updatedRecord.description,
    status: updatedRecord.status as TaskStatus,
    priority: updatedRecord.priority as TaskPriority,
    categoryId: updatedRecord.category_id,
    tags: [],
    startDate: updatedRecord.start_date ? new Date(updatedRecord.start_date) : undefined,
    endDate: updatedRecord.end_date ? new Date(updatedRecord.end_date) : undefined,
    dueDate: updatedRecord.due_date ? new Date(updatedRecord.due_date) : undefined,
    estimatedHours: updatedRecord.estimated_hours,
    actualHours: updatedRecord.actual_hours,
    userId: updatedRecord.user_id,
    parentTaskId: updatedRecord.parent_task_id,
    subtasks: [],
    createdAt: new Date(updatedRecord.created_at),
    updatedAt: new Date(updatedRecord.updated_at)
  };

  res.json({
    success: true,
    data: task,
    message: '任务更新成功'
  });
}));

// 删除任务
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const taskId = req.params.id;

  // 检查任务是否存在
  const existingTask = await db('tasks').where({ id: taskId, user_id: userId }).first();
  if (!existingTask) {
    throw createError('任务不存在', 404);
  }

  // 删除任务（级联删除相关数据）
  await db('tasks').where('id', taskId).del();

  res.json({
    success: true,
    message: '任务删除成功'
  });
}));

export { router as taskRoutes };