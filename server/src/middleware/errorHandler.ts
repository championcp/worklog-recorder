import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  // 记录错误日志
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${statusCode} - ${message}`);
  console.error(err.stack);

  // 开发环境返回详细错误信息
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    message: isDevelopment ? message : '服务器内部错误',
    error: isDevelopment ? err.stack : undefined
  });
}

export function createError(message: string, statusCode: number = 500): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}