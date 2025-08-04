// 用户相关类型
export interface User {
  id: number;
  email: string;
  password_hash: string;
  username: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  is_active: boolean;
  sync_version: number;
  last_sync_at?: string;
  device_id?: string;
}

export interface CreateUserInput {
  email: string;
  password_hash: string;
  username: string;
  device_id?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  request_id?: string;
}

// 认证相关类型
export interface AuthUser {
  id: number;
  email: string;
  username: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  iat: number;
  exp: number;
}