import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { db } from '../database/config';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { Tag, ApiResponse } from '../types';

const router = Router();

// 验证模式
const tagSchema = Joi.object({
  name: Joi.string().min(1).max(30).required().messages({
    'string.min': '标签名称不能为空',
    'string.max': '标签名称最多30个字符',
    'any.required': '标签名称是必填项'
  }),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).required().messages({
    'string.pattern.base': '颜色格式不正确，请使用十六进制格式（如#FF0000）',
    'any.required': '颜色是必填项'
  })
});

// 获取标签列表
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Tag[]>>) => {
  const userId = req.user!.id;

  const records = await db('tags')
    .where('user_id', userId)
    .orderBy('created_at', 'desc');

  const tags: Tag[] = records.map(record => ({
    id: record.id,
    name: record.name,
    color: record.color,
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  }));

  res.json({
    success: true,
    data: tags
  });
}));

// 获取单个标签
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Tag>>) => {
  const userId = req.user!.id;
  const tagId = req.params.id;

  const record = await db('tags').where({ id: tagId, user_id: userId }).first();
  if (!record) {
    throw createError('标签不存在', 404);
  }

  const tag: Tag = {
    id: record.id,
    name: record.name,
    color: record.color,
    userId: record.user_id,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  };

  res.json({
    success: true,
    data: tag
  });
}));

// 创建标签
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Tag>>) => {
  const { error, value } = tagSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const userId = req.user!.id;
  const { name, color } = value;

  // 检查标签名称是否已存在
  const existingTag = await db('tags').where({ name, user_id: userId }).first();
  if (existingTag) {
    throw createError('标签名称已存在', 409);
  }

  const tagId = uuidv4();
  const now = new Date();

  await db('tags').insert({
    id: tagId,
    name,
    color,
    user_id: userId,
    created_at: now,
    updated_at: now
  });

  const tag: Tag = {
    id: tagId,
    name,
    color,
    userId,
    createdAt: now,
    updatedAt: now
  };

  res.status(201).json({
    success: true,
    data: tag,
    message: '标签创建成功'
  });
}));

// 更新标签
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<Tag>>) => {
  const { error, value } = tagSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const userId = req.user!.id;
  const tagId = req.params.id;
  const { name, color } = value;

  // 检查标签是否存在
  const existingTag = await db('tags').where({ id: tagId, user_id: userId }).first();
  if (!existingTag) {
    throw createError('标签不存在', 404);
  }

  // 检查标签名称是否已被其他标签使用
  const duplicateTag = await db('tags')
    .where({ name, user_id: userId })
    .whereNot('id', tagId)
    .first();
  if (duplicateTag) {
    throw createError('标签名称已存在', 409);
  }

  const now = new Date();

  await db('tags').where('id', tagId).update({
    name,
    color,
    updated_at: now
  });

  const tag: Tag = {
    id: tagId,
    name,
    color,
    userId,
    createdAt: new Date(existingTag.created_at),
    updatedAt: now
  };

  res.json({
    success: true,
    data: tag,
    message: '标签更新成功'
  });
}));

// 删除标签
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const tagId = req.params.id;

  // 检查标签是否存在
  const existingTag = await db('tags').where({ id: tagId, user_id: userId }).first();
  if (!existingTag) {
    throw createError('标签不存在', 404);
  }

  // 删除标签（会自动删除相关的任务标签关联）
  await db('tags').where('id', tagId).del();

  res.json({
    success: true,
    message: '标签删除成功'
  });
}));

export { router as tagRoutes };