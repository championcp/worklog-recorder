import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import type { ApiResponse } from '@/types/auth';

// 强制动态渲染
export const dynamic = 'force-dynamic';

const authService = new AuthService();

export async function GET(request: NextRequest) {
  try {
    // 从cookie中获取token
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: '未找到认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // 验证token
    const user = authService.verifyToken(token);

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token无效或已过期'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { user },
      message: '认证成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('认证验证失败:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: '认证验证失败'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}