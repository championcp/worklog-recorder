import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { db } from '../database/config';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { Category, ApiResponse } from '../types';

const router = Router();

// 验证模式
const categorySchema = Joi.object({
  name: Joi.string().min(1).max(50).required().messages({
    'string.min': '分类名称不能为空',
    'string.max': '分类名称最多50个字符',
    'any.required': '分类名称是必填项'
  }),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).required().messages({
    'string.pattern.base': '颜色格式不正确，请使用十六进制格式（如#FF0000）',
    'any.required': '颜色是必填项'
  }),
  description: Joi.string().max(200).optional().allow('')
});

// 获取分类列表
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Category[]>>) => {
  const userId = req.user!.id;

  const records = await db('categories')
    .where('user_id', userId)
    .orderBy('created_at', 'desc');

  const categories: Category[] = records.map(record => ({
    id: record.id,
    name: record.name,
    color: record.color,
    description: record.description,
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  }));

  res.json({
    success: true,
    data: categories
  });
}));

// 获取分类统计信息
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Record<string, number>>>) => {
  const userId = req.user!.id;

  // 获取每个分类的任务数量
  const stats = await db('tasks')
    .select('category_id')
    .count('* as task_count')
    .where('user_id', userId)
    .whereNotNull('category_id')
    .groupBy('category_id');

  // 转换为对象格式
  const categoryStats: Record<string, number> = {};
  stats.forEach(stat => {
    categoryStats[stat.category_id] = Number(stat.task_count);
  });

  res.json({
    success: true,
    data: categoryStats
  });
}));

// 获取单个分类
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Category>>) => {
  const userId = req.user!.id;
  const categoryId = req.params.id;

  const record = await db('categories').where({ id: categoryId, user_id: userId }).first();
  if (!record) {
    throw createError('分类不存在', 404);
  }

  const category: Category = {
    id: record.id,
    name: record.name,
    color: record.color,
    description: record.description,
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  };

  res.json({
    success: true,
    data: category
  });
}));

// 创建分类
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Category>>) => {
  const { error, value } = categorySchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const userId = req.user!.id;
  const { name, color, description } = value;

  // 检查分类名称是否已存在
  const existingCategory = await db('categories').where({ name, user_id: userId }).first();
  if (existingCategory) {
    throw createError('分类名称已存在', 409);
  }

  const categoryId = uuidv4();
  const now = new Date();

  await db('categories').insert({
    id: categoryId,
    name,
    color,
    description,
    user_id: userId,
    created_at: now,
    updated_at: now
  });

  const category: Category = {
    id: categoryId,
    name,
    color,
    description,
    userId,
    createdAt: now,
    updatedAt: now
  };

  res.status(201).json({
    success: true,
    data: category,
    message: '分类创建成功'
  });
}));

// 更新分类
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Category>>) => {
  const { error, value } = categorySchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const userId = req.user!.id;
  const categoryId = req.params.id;
  const { name, color, description } = value;

  // 检查分类是否存在
  const existingCategory = await db('categories').where({ id: categoryId, user_id: userId }).first();
  if (!existingCategory) {
    throw createError('分类不存在', 404);
  }

  // 检查分类名称是否已被其他分类使用
  const duplicateCategory = await db('categories')
    .where({ name, user_id: userId })
    .whereNot('id', categoryId)
    .first();
  if (duplicateCategory) {
    throw createError('分类名称已存在', 409);
  }

  const now = new Date();

  await db('categories').where('id', categoryId).update({
    name,
    color,
    description,
    updated_at: now
  });

  const category: Category = {
    id: categoryId,
    name,
    color,
    description,
    userId,
    createdAt: new Date(existingCategory.created_at),
    updatedAt: now
  };

  res.json({
    success: true,
    data: category,
    message: '分类更新成功'
  });
}));

// 删除分类
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const categoryId = req.params.id;

  // 检查分类是否存在
  const existingCategory = await db('categories').where({ id: categoryId, user_id: userId }).first();
  if (!existingCategory) {
    throw createError('分类不存在', 404);
  }

  // 检查是否有任务使用此分类
  const tasksUsingCategory = await db('tasks').where('category_id', categoryId).first();
  if (tasksUsingCategory) {
    throw createError('无法删除分类，仍有任务使用此分类', 409);
  }

  await db('categories').where('id', categoryId).del();

  res.json({
    success: true,
    message: '分类删除成功'
  });
}));

export { router as categoryRoutes };