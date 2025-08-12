import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { createError } from './errorHandler';
import { User } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next(createError('访问令牌缺失', 401));
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return next(createError('JWT密钥未配置', 500));
  }

  (jwt.verify as any)(token, jwtSecret, (err: any, decoded: any) => {
    if (err) {
      return next(createError('访问令牌无效', 403));
    }

    req.user = decoded as User;
    next();
  });
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return next();
  }

  (jwt.verify as any)(token, jwtSecret, (err: any, decoded: any) => {
    if (!err) {
      req.user = decoded as User;
    }
    next();
  });
}