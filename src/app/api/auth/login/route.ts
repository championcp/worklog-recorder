import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import type { ApiResponse, LoginCredentials } from '@/types/auth';

const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    const { email, password } = body;

    // 输入验证
    if (!email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '邮箱和密码都是必填项'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 用户登录
    const result = await authService.login({ email, password });

    // 设置HTTP-only cookie存储token
    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: result,
      message: '登录成功',
      timestamp: new Date().toISOString()
    });

    // 设置cookie
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7天
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('登录失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '登录失败';
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 401 });
  }
}