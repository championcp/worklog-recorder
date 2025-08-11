import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import type { ApiResponse, RegisterInput } from '@/types/auth';

const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
    const body: RegisterInput = await request.json();
    const { email, password, username } = body;

    // 输入验证
    if (!email || !password || !username) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '邮箱、密码和用户名都是必填项'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: '邮箱格式不正确'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 密码强度验证
    if (password.length < 6) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: '密码长度至少为6位'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 用户名验证
    if (username.length < 2 || username.length > 20) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INVALID_USERNAME',
          message: '用户名长度应为2-20位'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 注册用户
    const result = await authService.register(email, password, username);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
      message: '注册成功',
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('注册失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '注册失败';
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'REGISTER_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}