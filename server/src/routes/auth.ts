import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { db } from '../database/config';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { User, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../types';

const router = Router();

// 验证模式
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': '用户名只能包含字母和数字',
    'string.min': '用户名至少3个字符',
    'string.max': '用户名最多30个字符',
    'any.required': '用户名是必填项'
  }),
  email: Joi.string().email().required().messages({
    'string.email': '请输入有效的邮箱地址',
    'any.required': '邮箱是必填项'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '密码至少6个字符',
    'any.required': '密码是必填项'
  })
});

const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': '用户名是必填项'
  }),
  password: Joi.string().required().messages({
    'any.required': '密码是必填项'
  })
});

// 注册
router.post('/register', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<AuthResponse>>) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { username, email, password }: RegisterRequest = value;

  // 检查用户名是否已存在
  const existingUser = await db('users').where({ username }).first();
  if (existingUser) {
    throw createError('用户名已存在', 409);
  }

  // 检查邮箱是否已存在
  const existingEmail = await db('users').where({ email }).first();
  if (existingEmail) {
    throw createError('邮箱已被注册', 409);
  }

  // 加密密码
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 创建用户
  const userId = uuidv4();
  const now = new Date();

  await db('users').insert({
    id: userId,
    username,
    email,
    password_hash: passwordHash,
    created_at: now,
    updated_at: now
  });

  // 获取用户信息
  const user: User = {
    id: userId,
    username,
    email,
    createdAt: now,
    updatedAt: now
  };

  // 生成JWT令牌
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createError('JWT密钥未配置', 500);
  }
  
  const token = (jwt.sign as any)(
    { id: user.id, username: user.username, email: user.email },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.status(201).json({
    success: true,
    data: { user, token },
    message: '注册成功'
  });
}));

// 登录
router.post('/login', asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<AuthResponse>>) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { username, password }: LoginRequest = value;

  // 查找用户
  const userRecord = await db('users').where({ username }).first();
  if (!userRecord) {
    throw createError('用户名或密码错误', 401);
  }

  // 验证密码
  const isValidPassword = await bcrypt.compare(password, userRecord.password_hash);
  if (!isValidPassword) {
    throw createError('用户名或密码错误', 401);
  }

  // 构建用户对象
  const user: User = {
    id: userRecord.id,
    username: userRecord.username,
    email: userRecord.email,
    createdAt: new Date(userRecord.created_at),
    updatedAt: new Date(userRecord.updated_at)
  };

  // 生成JWT令牌
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createError('JWT密钥未配置', 500);
  }
  
  const token = (jwt.sign as any)(
    { id: user.id, username: user.username, email: user.email },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    success: true,
    data: { user, token },
    message: '登录成功'
  });
}));

// 获取当前用户信息
router.get('/me', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<User>>) => {
  const userRecord = await db('users').where({ id: req.user!.id }).first();
  if (!userRecord) {
    throw createError('用户不存在', 404);
  }

  const user: User = {
    id: userRecord.id,
    username: userRecord.username,
    email: userRecord.email,
    createdAt: new Date(userRecord.created_at),
    updatedAt: new Date(userRecord.updated_at)
  };

  res.json({
    success: true,
    data: user
  });
}));

// 刷新令牌
router.post('/refresh', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse<{ token: string }>>) => {
  const user = req.user!;

  // 生成新的JWT令牌
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createError('JWT密钥未配置', 500);
  }
  
  const token = (jwt.sign as any)(
    { id: user.id, username: user.username, email: user.email },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    success: true,
    data: { token },
    message: '令牌刷新成功'
  });
}));

// 修改密码验证模式
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'any.required': '旧密码是必填项'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': '新密码至少6个字符',
    'any.required': '新密码是必填项'
  })
});

// 修改密码
router.post('/change-password', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { oldPassword, newPassword } = value;

  // 获取当前用户
  const userRecord = await db('users').where({ id: req.user!.id }).first();
  if (!userRecord) {
    throw createError('用户不存在', 404);
  }

  // 验证旧密码
  const isValid = await bcrypt.compare(oldPassword, userRecord.password_hash);
  if (!isValid) {
    throw createError('旧密码错误', 401);
  }

  // 加密新密码
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // 更新密码
  await db('users').where({ id: req.user!.id }).update({
    password_hash: newPasswordHash,
    updated_at: new Date()
  });

  res.json({
    success: true,
    message: '密码修改成功'
  });
}));

export { router as authRoutes };