import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { TimeLogService } from '@/lib/services/TimeLogService';
import type { ProjectApiResponse } from '@/types/project';

const authService = new AuthService();
const timeLogService = new TimeLogService();

// GET /api/time-logs/timer - 获取当前活跃的计时器
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未找到认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const user = authService.verifyToken(token);
    if (!user) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '无效的认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // 获取活跃的计时器
    const activeTimer = timeLogService.getActiveTimer(user.id);

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { activeTimer },
      message: activeTimer ? '获取活跃计时器成功' : '当前无活跃计时器',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取活跃计时器失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取活跃计时器失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'ACTIVE_TIMER_FETCH_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}