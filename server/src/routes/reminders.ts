import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { db } from '../database/config';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

const router = Router();

// 提醒类型枚举
export enum ReminderType {
  TASK_DUE = 'task_due',
  TASK_START = 'task_start',
  MEETING = 'meeting',
  CUSTOM = 'custom'
}

// 提醒状态枚举
export enum ReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DISMISSED = 'dismissed'
}

// 验证模式
const reminderSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.min': '提醒标题不能为空',
    'string.max': '提醒标题最多200个字符',
    'any.required': '提醒标题是必填项'
  }),
  description: Joi.string().max(2000).optional().allow(''),
  type: Joi.string().valid(...Object.values(ReminderType)).required(),
  reminderTime: Joi.date().required(),
  taskId: Joi.string().uuid().optional().allow(null),
  isRecurring: Joi.boolean().default(false),
  recurringPattern: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').optional().allow(null),
  isActive: Joi.boolean().default(true)
});

const updateReminderSchema = reminderSchema.fork(['title', 'type', 'reminderTime'], (schema) => schema.optional());

// 获取提醒列表
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<any>>>) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const type = req.query.type as string;
  const status = req.query.status as string;
  const isActive = req.query.isActive === 'true';

  // 构建查询条件
  let query = db('reminders').where('user_id', userId);
  
  if (type) {
    query = query.where('type', type);
  }
  
  if (status) {
    query = query.where('status', status);
  }
  
  if (isActive !== undefined) {
    query = query.where('is_active', isActive);
  }

  // 获取总数
  const totalQuery = query.clone();
  const [{ count }] = await totalQuery.count('* as count');
  const total = count as number;

  // 获取分页数据
  const records = await query
    .orderBy('reminder_time', 'asc')
    .limit(limit)
    .offset(offset);

  const reminders = records.map(record => ({
    id: record.id,
    title: record.title,
    description: record.description,
    type: record.type,
    reminderTime: new Date(record.reminder_time),
    taskId: record.task_id,
    status: record.status,
    isRecurring: Boolean(record.is_recurring),
    recurringPattern: record.recurring_pattern,
    isActive: Boolean(record.is_active),
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  }));

  res.json({
    success: true,
    data: {
      data: reminders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// 获取单个提醒
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const reminderId = req.params.id;

  const record = await db('reminders')
    .where({ id: reminderId, user_id: userId })
    .first();

  if (!record) {
    throw createError('提醒不存在', 404);
  }

  const reminder = {
    id: record.id,
    title: record.title,
    description: record.description,
    type: record.type,
    reminderTime: new Date(record.reminder_time),
    taskId: record.task_id,
    status: record.status,
    isRecurring: Boolean(record.is_recurring),
    recurringPattern: record.recurring_pattern,
    isActive: Boolean(record.is_active),
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  };

  res.json({
    success: true,
    data: reminder
  });
}));

// 创建提醒
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const { error, value } = reminderSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
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

  const reminderId = uuidv4();
  const now = new Date();

  await db('reminders').insert({
    id: reminderId,
    title: value.title,
    description: value.description,
    type: value.type,
    reminder_time: value.reminderTime,
    task_id: value.taskId,
    status: ReminderStatus.PENDING,
    is_recurring: value.isRecurring,
    recurring_pattern: value.recurringPattern,
    is_active: value.isActive,
    user_id: userId,
    created_at: now,
    updated_at: now
  });

  const reminder = {
    id: reminderId,
    title: value.title,
    description: value.description,
    type: value.type,
    reminderTime: new Date(value.reminderTime),
    taskId: value.taskId,
    status: ReminderStatus.PENDING,
    isRecurring: value.isRecurring,
    recurringPattern: value.recurringPattern,
    isActive: value.isActive,
    userId,
    createdAt: now,
    updatedAt: now
  };

  res.status(201).json({
    success: true,
    data: reminder,
    message: '提醒创建成功'
  });
}));

// 更新提醒
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const reminderId = req.params.id;
  const { error, value } = updateReminderSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const existingReminder = await db('reminders')
    .where({ id: reminderId, user_id: userId })
    .first();

  if (!existingReminder) {
    throw createError('提醒不存在', 404);
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
  if (value.type !== undefined) updateData.type = value.type;
  if (value.reminderTime !== undefined) updateData.reminder_time = value.reminderTime;
  if (value.taskId !== undefined) updateData.task_id = value.taskId;
  if (value.isRecurring !== undefined) updateData.is_recurring = value.isRecurring;
  if (value.recurringPattern !== undefined) updateData.recurring_pattern = value.recurringPattern;
  if (value.isActive !== undefined) updateData.is_active = value.isActive;

  await db('reminders')
    .where({ id: reminderId, user_id: userId })
    .update(updateData);

  // 获取更新后的提醒
  const updatedRecord = await db('reminders')
    .where({ id: reminderId, user_id: userId })
    .first();

  const reminder = {
    id: updatedRecord.id,
    title: updatedRecord.title,
    description: updatedRecord.description,
    type: updatedRecord.type,
    reminderTime: new Date(updatedRecord.reminder_time),
    taskId: updatedRecord.task_id,
    status: updatedRecord.status,
    isRecurring: Boolean(updatedRecord.is_recurring),
    recurringPattern: updatedRecord.recurring_pattern,
    isActive: Boolean(updatedRecord.is_active),
    userId: updatedRecord.user_id,
    createdAt: new Date(updatedRecord.created_at),
    updatedAt: new Date(updatedRecord.updated_at)
  };

  res.json({
    success: true,
    data: reminder,
    message: '提醒更新成功'
  });
}));

// 删除提醒
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const reminderId = req.params.id;

  const existingReminder = await db('reminders')
    .where({ id: reminderId, user_id: userId })
    .first();

  if (!existingReminder) {
    throw createError('提醒不存在', 404);
  }

  await db('reminders').where({ id: reminderId, user_id: userId }).del();

  res.json({
    success: true,
    message: '提醒删除成功'
  });
}));

// 标记提醒为已发送
router.post('/:id/mark-sent', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const reminderId = req.params.id;

  const existingReminder = await db('reminders')
    .where({ id: reminderId, user_id: userId })
    .first();

  if (!existingReminder) {
    throw createError('提醒不存在', 404);
  }

  await db('reminders')
    .where({ id: reminderId, user_id: userId })
    .update({
      status: ReminderStatus.SENT,
      updated_at: new Date()
    });

  res.json({
    success: true,
    message: '提醒已标记为已发送'
  });
}));

// 忽略提醒
router.post('/:id/dismiss', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const reminderId = req.params.id;

  const existingReminder = await db('reminders')
    .where({ id: reminderId, user_id: userId })
    .first();

  if (!existingReminder) {
    throw createError('提醒不存在', 404);
  }

  await db('reminders')
    .where({ id: reminderId, user_id: userId })
    .update({
      status: ReminderStatus.DISMISSED,
      updated_at: new Date()
    });

  res.json({
    success: true,
    message: '提醒已忽略'
  });
}));

// 获取待发送的提醒
router.get('/pending/due', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const now = new Date();

  const records = await db('reminders')
    .where('user_id', userId)
    .where('status', ReminderStatus.PENDING)
    .where('is_active', true)
    .where('reminder_time', '<=', now)
    .orderBy('reminder_time', 'asc');

  const reminders = records.map(record => ({
    id: record.id,
    title: record.title,
    description: record.description,
    type: record.type,
    reminderTime: new Date(record.reminder_time),
    taskId: record.task_id,
    status: record.status,
    isRecurring: Boolean(record.is_recurring),
    recurringPattern: record.recurring_pattern,
    isActive: Boolean(record.is_active),
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  }));

  res.json({
    success: true,
    data: reminders
  });
}));

// 获取今日提醒
router.get('/today/list', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const records = await db('reminders')
    .where('user_id', userId)
    .where('is_active', true)
    .where('reminder_time', '>=', today)
    .where('reminder_time', '<', tomorrow)
    .orderBy('reminder_time', 'asc');

  const reminders = records.map(record => ({
    id: record.id,
    title: record.title,
    description: record.description,
    type: record.type,
    reminderTime: new Date(record.reminder_time),
    taskId: record.task_id,
    status: record.status,
    isRecurring: Boolean(record.is_recurring),
    recurringPattern: record.recurring_pattern,
    isActive: Boolean(record.is_active),
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  }));

  res.json({
    success: true,
    data: reminders
  });
}));

// 批量创建任务提醒
router.post('/batch/task-reminders', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const { taskIds, reminderMinutes = 30 } = req.body;

  if (!Array.isArray(taskIds)) {
    throw createError('任务ID列表格式不正确', 400);
  }

  // 验证任务是否属于当前用户
  const tasks = await db('tasks')
    .whereIn('id', taskIds)
    .where('user_id', userId)
    .whereNotNull('due_date');

  if (tasks.length === 0) {
    throw createError('没有找到有效的任务', 400);
  }

  const reminders = [];
  const now = new Date();

  for (const task of tasks) {
    const reminderTime = new Date(task.due_date);
    reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);

    // 只为未来的任务创建提醒
    if (reminderTime > now) {
      const reminderId = uuidv4();
      
      await db('reminders').insert({
        id: reminderId,
        title: `任务提醒: ${task.title}`,
        description: `任务 "${task.title}" 将在 ${reminderMinutes} 分钟后到期`,
        type: ReminderType.TASK_DUE,
        reminder_time: reminderTime,
        task_id: task.id,
        status: ReminderStatus.PENDING,
        is_recurring: false,
        recurring_pattern: null,
        is_active: true,
        user_id: userId,
        created_at: now,
        updated_at: now
      });

      reminders.push({
        id: reminderId,
        title: `任务提醒: ${task.title}`,
        taskId: task.id,
        reminderTime
      });
    }
  }

  res.json({
    success: true,
    data: reminders,
    message: `成功创建 ${reminders.length} 个任务提醒`
  });
}));

// 处理循环提醒
router.post('/process-recurring', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const now = new Date();

  // 获取已发送的循环提醒
  const sentRecurringReminders = await db('reminders')
    .where('user_id', userId)
    .where('status', ReminderStatus.SENT)
    .where('is_recurring', true)
    .where('is_active', true);

  const newReminders = [];

  for (const reminder of sentRecurringReminders) {
    const lastReminderTime = new Date(reminder.reminder_time);
    let nextReminderTime: Date;

    switch (reminder.recurring_pattern) {
      case 'daily':
        nextReminderTime = new Date(lastReminderTime);
        nextReminderTime.setDate(nextReminderTime.getDate() + 1);
        break;
      case 'weekly':
        nextReminderTime = new Date(lastReminderTime);
        nextReminderTime.setDate(nextReminderTime.getDate() + 7);
        break;
      case 'monthly':
        nextReminderTime = new Date(lastReminderTime);
        nextReminderTime.setMonth(nextReminderTime.getMonth() + 1);
        break;
      case 'yearly':
        nextReminderTime = new Date(lastReminderTime);
        nextReminderTime.setFullYear(nextReminderTime.getFullYear() + 1);
        break;
      default:
        continue;
    }

    // 创建下一个循环提醒
    const newReminderId = uuidv4();
    
    await db('reminders').insert({
      id: newReminderId,
      title: reminder.title,
      description: reminder.description,
      type: reminder.type,
      reminder_time: nextReminderTime,
      task_id: reminder.task_id,
      status: ReminderStatus.PENDING,
      is_recurring: true,
      recurring_pattern: reminder.recurring_pattern,
      is_active: true,
      user_id: userId,
      created_at: now,
      updated_at: now
    });

    newReminders.push({
      id: newReminderId,
      title: reminder.title,
      reminderTime: nextReminderTime
    });
  }

  res.json({
    success: true,
    data: newReminders,
    message: `处理了 ${newReminders.length} 个循环提醒`
  });
}));

export { router as reminderRoutes };