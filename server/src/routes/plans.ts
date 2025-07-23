import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { db } from '../database/config';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { Plan, ApiResponse, PaginatedResponse, TaskStatus, TaskPriority } from '../types';

const router = Router();

// 验证模式
const planSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.min': '计划标题不能为空',
    'string.max': '计划标题最多200个字符',
    'any.required': '计划标题是必填项'
  }),
  description: Joi.string().max(2000).optional().allow(''),
  timeRange: Joi.string().valid('day', 'week', 'month', 'year').required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  parentPlanId: Joi.string().uuid().optional().allow(null)
});

const updatePlanSchema = planSchema.fork(['title', 'timeRange', 'startDate', 'endDate'], (schema) => schema.optional());

// 获取计划列表（支持层级查询）
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<Plan>>>) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const timeRange = req.query.timeRange as string;
  const year = req.query.year ? parseInt(req.query.year as string) : undefined;
  const parentPlanId = req.query.parentPlanId as string;
  const includeHierarchy = req.query.includeHierarchy === 'true';

  // 构建查询条件
  let query = db('plans').where('user_id', userId);
  
  if (timeRange) {
    query = query.where('time_range', timeRange);
  }
  
  if (year) {
    query = query.whereRaw("strftime('%Y', start_date) = ?", [year.toString()]);
  }

  // 如果指定了父计划ID，只查询子计划
  if (parentPlanId) {
    query = query.where('parent_plan_id', parentPlanId);
  } else if (!includeHierarchy) {
    // 如果不包含层级且没有指定父计划，只查询顶级计划
    query = query.whereNull('parent_plan_id');
  }

  // 获取总数
  const totalQuery = query.clone();
  const [{ count }] = await totalQuery.count('* as count');
  const total = count as number;

  // 获取分页数据
  const records = await query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  // 获取每个计划的任务和子计划
  const plans: Plan[] = [];
  for (const record of records) {
    const tasks = await db('tasks')
      .join('plan_tasks', 'tasks.id', 'plan_tasks.task_id')
      .where('plan_tasks.plan_id', record.id)
      .select('tasks.*');

    const planTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status as TaskStatus,
      priority: task.priority as TaskPriority,
      categoryId: task.category_id,
      tags: [],
      startDate: task.start_date ? new Date(task.start_date) : undefined,
      endDate: task.end_date ? new Date(task.end_date) : undefined,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      estimatedHours: task.estimated_hours,
      actualHours: task.actual_hours,
      userId: task.user_id,
      parentTaskId: task.parent_task_id,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at)
    }));

    // 如果需要包含层级，递归获取子计划
    let childPlans: Plan[] = [];
    if (includeHierarchy) {
      const childRecords = await db('plans')
        .where('parent_plan_id', record.id)
        .orderBy('created_at', 'desc');
      
      for (const childRecord of childRecords) {
        const childTasks = await db('tasks')
          .join('plan_tasks', 'tasks.id', 'plan_tasks.task_id')
          .where('plan_tasks.plan_id', childRecord.id)
          .select('tasks.*');

        const childPlanTasks = childTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status as TaskStatus,
          priority: task.priority as TaskPriority,
          categoryId: task.category_id,
          tags: [],
          startDate: task.start_date ? new Date(task.start_date) : undefined,
          endDate: task.end_date ? new Date(task.end_date) : undefined,
          dueDate: task.due_date ? new Date(task.due_date) : undefined,
          estimatedHours: task.estimated_hours,
          actualHours: task.actual_hours,
          userId: task.user_id,
          parentTaskId: task.parent_task_id,
          createdAt: new Date(task.created_at),
          updatedAt: new Date(task.updated_at)
        }));

        childPlans.push({
          id: childRecord.id,
          title: childRecord.title,
          description: childRecord.description,
          timeRange: childRecord.time_range,
          startDate: new Date(childRecord.start_date),
          endDate: new Date(childRecord.end_date),
          parentPlanId: childRecord.parent_plan_id,
          tasks: childPlanTasks,
          childPlans: [], // 暂时不递归更深层级
          userId: childRecord.user_id,
          createdAt: new Date(childRecord.created_at),
          updatedAt: new Date(childRecord.updated_at)
        });
      }
    }

    plans.push({
      id: record.id,
      title: record.title,
      description: record.description,
      timeRange: record.time_range,
      startDate: new Date(record.start_date),
      endDate: new Date(record.end_date),
      parentPlanId: record.parent_plan_id,
      tasks: planTasks,
      childPlans,
      userId: record.user_id,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    });
  }

  res.json({
    success: true,
    data: {
      data: plans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// 获取单个计划
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Plan>>) => {
  const userId = req.user!.id;
  const planId = req.params.id;

  const record = await db('plans')
    .where({ id: planId, user_id: userId })
    .first();

  if (!record) {
    throw createError('计划不存在', 404);
  }

  // 获取计划的任务
  const tasks = await db('tasks')
    .join('plan_tasks', 'tasks.id', 'plan_tasks.task_id')
    .where('plan_tasks.plan_id', planId)
    .select('tasks.*');

  const planTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    categoryId: task.category_id,
    tags: [],
    startDate: task.start_date ? new Date(task.start_date) : undefined,
    endDate: task.end_date ? new Date(task.end_date) : undefined,
    dueDate: task.due_date ? new Date(task.due_date) : undefined,
    estimatedHours: task.estimated_hours,
    actualHours: task.actual_hours,
    userId: task.user_id,
    parentTaskId: task.parent_task_id,
    createdAt: new Date(task.created_at),
    updatedAt: new Date(task.updated_at)
  }));

  const plan: Plan = {
    id: record.id,
    title: record.title,
    description: record.description,
    timeRange: record.time_range,
    startDate: new Date(record.start_date),
    endDate: new Date(record.end_date),
    tasks: planTasks,
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  };

  res.json({
    success: true,
    data: plan
  });
}));

// 创建计划
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Plan>>) => {
  const userId = req.user!.id;
  const { error, value } = planSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  // 如果指定了父计划，验证父计划是否存在且属于当前用户
  if (value.parentPlanId) {
    const parentPlan = await db('plans')
      .where({ id: value.parentPlanId, user_id: userId })
      .first();
    
    if (!parentPlan) {
      throw createError('父计划不存在或无权限', 400);
    }
  }

  const planId = uuidv4();
  const now = new Date();

  await db('plans').insert({
    id: planId,
    title: value.title,
    description: value.description,
    time_range: value.timeRange,
    start_date: value.startDate,
    end_date: value.endDate,
    parent_plan_id: value.parentPlanId || null,
    user_id: userId,
    created_at: now,
    updated_at: now
  });

  const plan: Plan = {
    id: planId,
    title: value.title,
    description: value.description,
    timeRange: value.timeRange,
    startDate: new Date(value.startDate),
    endDate: new Date(value.endDate),
    parentPlanId: value.parentPlanId,
    tasks: [],
    childPlans: [],
    userId,
    createdAt: now,
    updatedAt: now
  };

  res.status(201).json({
    success: true,
    data: plan,
    message: '计划创建成功'
  });
}));

// 更新计划
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Plan>>) => {
  const userId = req.user!.id;
  const planId = req.params.id;
  const { error, value } = updatePlanSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const existingPlan = await db('plans')
    .where({ id: planId, user_id: userId })
    .first();

  if (!existingPlan) {
    throw createError('计划不存在', 404);
  }

  const updateData: any = {
    updated_at: new Date()
  };

  if (value.title !== undefined) updateData.title = value.title;
  if (value.description !== undefined) updateData.description = value.description;
  if (value.timeRange !== undefined) updateData.time_range = value.timeRange;
  if (value.startDate !== undefined) updateData.start_date = value.startDate;
  if (value.endDate !== undefined) updateData.end_date = value.endDate;

  await db('plans')
    .where({ id: planId, user_id: userId })
    .update(updateData);

  // 获取更新后的计划
  const updatedRecord = await db('plans')
    .where({ id: planId, user_id: userId })
    .first();

  const tasks = await db('tasks')
    .join('plan_tasks', 'tasks.id', 'plan_tasks.task_id')
    .where('plan_tasks.plan_id', planId)
    .select('tasks.*');

  const planTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    categoryId: task.category_id,
    tags: [],
    startDate: task.start_date ? new Date(task.start_date) : undefined,
    endDate: task.end_date ? new Date(task.end_date) : undefined,
    dueDate: task.due_date ? new Date(task.due_date) : undefined,
    estimatedHours: task.estimated_hours,
    actualHours: task.actual_hours,
    userId: task.user_id,
    parentTaskId: task.parent_task_id,
    createdAt: new Date(task.created_at),
    updatedAt: new Date(task.updated_at)
  }));

  const plan: Plan = {
    id: updatedRecord.id,
    title: updatedRecord.title,
    description: updatedRecord.description,
    timeRange: updatedRecord.time_range,
    startDate: new Date(updatedRecord.start_date),
    endDate: new Date(updatedRecord.end_date),
    tasks: planTasks,
    userId: updatedRecord.user_id,
    createdAt: new Date(updatedRecord.created_at),
    updatedAt: new Date(updatedRecord.updated_at)
  };

  res.json({
    success: true,
    data: plan,
    message: '计划更新成功'
  });
}));

// 删除计划
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const planId = req.params.id;

  const existingPlan = await db('plans')
    .where({ id: planId, user_id: userId })
    .first();

  if (!existingPlan) {
    throw createError('计划不存在', 404);
  }

  // 删除计划任务关联
  await db('plan_tasks').where('plan_id', planId).del();
  
  // 删除计划
  await db('plans').where({ id: planId, user_id: userId }).del();

  res.json({
    success: true,
    message: '计划删除成功'
  });
}));

// 为计划添加任务
router.post('/:id/tasks', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const planId = req.params.id;
  const { taskIds } = req.body;

  if (!Array.isArray(taskIds)) {
    throw createError('任务ID列表格式不正确', 400);
  }

  const existingPlan = await db('plans')
    .where({ id: planId, user_id: userId })
    .first();

  if (!existingPlan) {
    throw createError('计划不存在', 404);
  }

  // 验证任务是否属于当前用户
  const tasks = await db('tasks')
    .whereIn('id', taskIds)
    .where('user_id', userId);

  if (tasks.length !== taskIds.length) {
    throw createError('部分任务不存在或无权限', 400);
  }

  // 添加计划任务关联
  const planTasks = taskIds.map((taskId: string) => ({
    plan_id: planId,
    task_id: taskId
  }));

  await db('plan_tasks').insert(planTasks).onConflict(['plan_id', 'task_id']).ignore();

  res.json({
    success: true,
    message: '任务添加成功'
  });
}));

// 从计划中移除任务
router.delete('/:id/tasks/:taskId', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const planId = req.params.id;
  const taskId = req.params.taskId;

  const existingPlan = await db('plans')
    .where({ id: planId, user_id: userId })
    .first();

  if (!existingPlan) {
    throw createError('计划不存在', 404);
  }

  await db('plan_tasks')
    .where({ plan_id: planId, task_id: taskId })
    .del();

  res.json({
    success: true,
    message: '任务移除成功'
  });
}));

export { router as planRoutes };