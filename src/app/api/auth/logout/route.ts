import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/auth';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 清除认证cookie
    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: '登出成功',
      timestamp: new Date().toISOString()
    });

    // 删除cookie
    response.cookies.delete('auth-token');

    return response;

  } catch (error) {
    console.error('登出失败:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: '登出失败'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}