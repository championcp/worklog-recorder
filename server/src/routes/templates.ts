import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { db } from '../database/config';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

const router = Router();

// 模板类型枚举
export enum TemplateType {
  TASK = 'task',
  PLAN = 'plan',
  PROJECT = 'project'
}

// 验证模式
const templateSchema = Joi.object({
  name: Joi.string().min(1).max(200).required().messages({
    'string.min': '模板名称不能为空',
    'string.max': '模板名称最多200个字符',
    'any.required': '模板名称是必填项'
  }),
  description: Joi.string().max(2000).optional().allow(''),
  type: Joi.string().valid(...Object.values(TemplateType)).required(),
  content: Joi.object().required().messages({
    'any.required': '模板内容是必填项'
  }),
  tags: Joi.array().items(Joi.string()).optional().default([]),
  isPublic: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true)
});

const updateTemplateSchema = templateSchema.fork(['name', 'type', 'content'], (schema) => schema.optional());

// 获取模板列表
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<any>>>) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const type = req.query.type as string;
  const isPublic = req.query.isPublic === 'true';
  const search = req.query.search as string;

  // 构建查询条件
  let query = db('templates').where(function() {
    this.where('user_id', userId).orWhere('is_public', true);
  });
  
  if (type) {
    query = query.where('type', type);
  }
  
  if (isPublic !== undefined) {
    query = query.where('is_public', isPublic);
  }

  if (search) {
    query = query.where(function() {
      this.where('name', 'like', `%${search}%`)
          .orWhere('description', 'like', `%${search}%`);
    });
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

  const templates = records.map(record => ({
    id: record.id,
    name: record.name,
    description: record.description,
    type: record.type,
    content: JSON.parse(record.content),
    tags: record.tags ? JSON.parse(record.tags) : [],
    isPublic: Boolean(record.is_public),
    isActive: Boolean(record.is_active),
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  }));

  res.json({
    success: true,
    data: {
      data: templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// 获取单个模板
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const templateId = req.params.id;

  const record = await db('templates')
    .where(function() {
      this.where({ id: templateId, user_id: userId })
          .orWhere({ id: templateId, is_public: true });
    })
    .first();

  if (!record) {
    throw createError('模板不存在', 404);
  }

  const template = {
    id: record.id,
    name: record.name,
    description: record.description,
    type: record.type,
    content: JSON.parse(record.content),
    tags: record.tags ? JSON.parse(record.tags) : [],
    isPublic: Boolean(record.is_public),
    isActive: Boolean(record.is_active),
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  };

  res.json({
    success: true,
    data: template
  });
}));

// 创建模板
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const { error, value } = templateSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const templateId = uuidv4();
  const now = new Date();

  await db('templates').insert({
    id: templateId,
    name: value.name,
    description: value.description,
    type: value.type,
    content: JSON.stringify(value.content),
    tags: JSON.stringify(value.tags),
    is_public: value.isPublic,
    is_active: value.isActive,
    user_id: userId,
    created_at: now,
    updated_at: now
  });

  const template = {
    id: templateId,
    name: value.name,
    description: value.description,
    type: value.type,
    content: value.content,
    tags: value.tags,
    isPublic: value.isPublic,
    isActive: value.isActive,
    userId,
    createdAt: now,
    updatedAt: now
  };

  res.status(201).json({
    success: true,
    data: template,
    message: '模板创建成功'
  });
}));

// 更新模板
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const templateId = req.params.id;
  const { error, value } = updateTemplateSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const existingTemplate = await db('templates')
    .where({ id: templateId, user_id: userId })
    .first();

  if (!existingTemplate) {
    throw createError('模板不存在或无权限修改', 404);
  }

  const updateData: any = {
    updated_at: new Date()
  };

  if (value.name !== undefined) updateData.name = value.name;
  if (value.description !== undefined) updateData.description = value.description;
  if (value.type !== undefined) updateData.type = value.type;
  if (value.content !== undefined) updateData.content = JSON.stringify(value.content);
  if (value.tags !== undefined) updateData.tags = JSON.stringify(value.tags);
  if (value.isPublic !== undefined) updateData.is_public = value.isPublic;
  if (value.isActive !== undefined) updateData.is_active = value.isActive;

  await db('templates')
    .where({ id: templateId, user_id: userId })
    .update(updateData);

  // 获取更新后的模板
  const updatedRecord = await db('templates')
    .where({ id: templateId, user_id: userId })
    .first();

  const template = {
    id: updatedRecord.id,
    name: updatedRecord.name,
    description: updatedRecord.description,
    type: updatedRecord.type,
    content: JSON.parse(updatedRecord.content),
    tags: updatedRecord.tags ? JSON.parse(updatedRecord.tags) : [],
    isPublic: Boolean(updatedRecord.is_public),
    isActive: Boolean(updatedRecord.is_active),
    userId: updatedRecord.user_id,
    createdAt: new Date(updatedRecord.created_at),
    updatedAt: new Date(updatedRecord.updated_at)
  };

  res.json({
    success: true,
    data: template,
    message: '模板更新成功'
  });
}));

// 删除模板
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const templateId = req.params.id;

  const existingTemplate = await db('templates')
    .where({ id: templateId, user_id: userId })
    .first();

  if (!existingTemplate) {
    throw createError('模板不存在或无权限删除', 404);
  }

  await db('templates').where({ id: templateId, user_id: userId }).del();

  res.json({
    success: true,
    message: '模板删除成功'
  });
}));

// 复制模板
router.post('/:id/duplicate', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const templateId = req.params.id;

  const originalTemplate = await db('templates')
    .where(function() {
      this.where({ id: templateId, user_id: userId })
          .orWhere({ id: templateId, is_public: true });
    })
    .first();

  if (!originalTemplate) {
    throw createError('模板不存在', 404);
  }

  const newTemplateId = uuidv4();
  const now = new Date();

  await db('templates').insert({
    id: newTemplateId,
    name: `${originalTemplate.name} (副本)`,
    description: originalTemplate.description,
    type: originalTemplate.type,
    content: originalTemplate.content,
    tags: originalTemplate.tags,
    is_public: false, // 复制的模板默认为私有
    is_active: true,
    user_id: userId,
    created_at: now,
    updated_at: now
  });

  const template = {
    id: newTemplateId,
    name: `${originalTemplate.name} (副本)`,
    description: originalTemplate.description,
    type: originalTemplate.type,
    content: JSON.parse(originalTemplate.content),
    tags: originalTemplate.tags ? JSON.parse(originalTemplate.tags) : [],
    isPublic: false,
    isActive: true,
    userId,
    createdAt: now,
    updatedAt: now
  };

  res.status(201).json({
    success: true,
    data: template,
    message: '模板复制成功'
  });
}));

// 从模板创建任务
router.post('/:id/create-task', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const templateId = req.params.id;
  const { customData = {} } = req.body;

  const template = await db('templates')
    .where(function() {
      this.where({ id: templateId, user_id: userId })
          .orWhere({ id: templateId, is_public: true });
    })
    .where('type', TemplateType.TASK)
    .first();

  if (!template) {
    throw createError('任务模板不存在', 404);
  }

  const templateContent = JSON.parse(template.content);
  const taskId = uuidv4();
  const now = new Date();

  // 合并模板内容和自定义数据
  const taskData = {
    id: taskId,
    title: customData.title || templateContent.title,
    description: customData.description || templateContent.description,
    status: customData.status || templateContent.status || 'todo',
    priority: customData.priority || templateContent.priority || 'medium',
    category_id: customData.categoryId || templateContent.categoryId,
    due_date: customData.dueDate || templateContent.dueDate,
    estimated_hours: customData.estimatedHours || templateContent.estimatedHours,
    parent_task_id: customData.parentTaskId || templateContent.parentTaskId,
    user_id: userId,
    created_at: now,
    updated_at: now
  };

  await db('tasks').insert(taskData);

  // 处理标签
  if (templateContent.tags && templateContent.tags.length > 0) {
    const tagInserts = templateContent.tags.map((tagId: string) => ({
      task_id: taskId,
      tag_id: tagId
    }));
    await db('task_tags').insert(tagInserts);
  }

  res.status(201).json({
    success: true,
    data: { taskId },
    message: '从模板创建任务成功'
  });
}));

// 从模板创建计划
router.post('/:id/create-plan', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const templateId = req.params.id;
  const { customData = {} } = req.body;

  const template = await db('templates')
    .where(function() {
      this.where({ id: templateId, user_id: userId })
          .orWhere({ id: templateId, is_public: true });
    })
    .where('type', TemplateType.PLAN)
    .first();

  if (!template) {
    throw createError('计划模板不存在', 404);
  }

  const templateContent = JSON.parse(template.content);
  const planId = uuidv4();
  const now = new Date();

  // 合并模板内容和自定义数据
  const planData = {
    id: planId,
    title: customData.title || templateContent.title,
    description: customData.description || templateContent.description,
    start_date: customData.startDate || templateContent.startDate,
    end_date: customData.endDate || templateContent.endDate,
    status: customData.status || templateContent.status || 'active',
    user_id: userId,
    created_at: now,
    updated_at: now
  };

  await db('plans').insert(planData);

  // 处理计划中的任务
  if (templateContent.tasks && templateContent.tasks.length > 0) {
    for (const taskTemplate of templateContent.tasks) {
      const taskId = uuidv4();
      
      await db('tasks').insert({
        id: taskId,
        title: taskTemplate.title,
        description: taskTemplate.description,
        status: taskTemplate.status || 'todo',
        priority: taskTemplate.priority || 'medium',
        category_id: taskTemplate.categoryId,
        due_date: taskTemplate.dueDate,
        estimated_hours: taskTemplate.estimatedHours,
        user_id: userId,
        created_at: now,
        updated_at: now
      });

      // 关联任务到计划
      await db('plan_tasks').insert({
        plan_id: planId,
        task_id: taskId
      });
    }
  }

  res.status(201).json({
    success: true,
    data: { planId },
    message: '从模板创建计划成功'
  });
}));

// 获取模板统计
router.get('/stats/overview', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;

  // 获取用户模板统计
  const userTemplates = await db('templates')
    .where('user_id', userId)
    .select('type')
    .count('* as count')
    .groupBy('type');

  // 获取公共模板统计
  const publicTemplates = await db('templates')
    .where('is_public', true)
    .select('type')
    .count('* as count')
    .groupBy('type');

  // 获取最近使用的模板（这里简化为最近创建的）
  const recentTemplates = await db('templates')
    .where(function() {
      this.where('user_id', userId).orWhere('is_public', true);
    })
    .orderBy('created_at', 'desc')
    .limit(5)
    .select('id', 'name', 'type', 'created_at');

  const stats = {
    userTemplates: userTemplates.reduce((acc, item) => {
      acc[item.type] = item.count;
      return acc;
    }, {} as Record<string, number>),
    publicTemplates: publicTemplates.reduce((acc, item) => {
      acc[item.type] = item.count;
      return acc;
    }, {} as Record<string, number>),
    recentTemplates: recentTemplates.map(template => ({
      id: template.id,
      name: template.name,
      type: template.type,
      createdAt: new Date(template.created_at)
    }))
  };

  res.json({
    success: true,
    data: stats
  });
}));

// 获取推荐模板
router.get('/recommendations/list', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  const userId = req.user!.id;
  const limit = parseInt(req.query.limit as string) || 10;

  // 获取用户最常用的模板类型
  const userPreferences = await db('templates')
    .where('user_id', userId)
    .select('type')
    .count('* as count')
    .groupBy('type')
    .orderBy('count', 'desc')
    .limit(3);

  const preferredTypes = userPreferences.map(p => p.type);

  // 获取推荐的公共模板
  let query = db('templates')
    .where('is_public', true)
    .where('is_active', true);

  if (preferredTypes.length > 0) {
    query = query.whereIn('type', preferredTypes);
  }

  const recommendations = await query
    .orderBy('created_at', 'desc')
    .limit(limit);

  const templates = recommendations.map(record => ({
    id: record.id,
    name: record.name,
    description: record.description,
    type: record.type,
    tags: record.tags ? JSON.parse(record.tags) : [],
    createdAt: new Date(record.created_at)
  }));

  res.json({
    success: true,
    data: templates
  });
}));

export { router as templateRoutes };