import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { TimeLogService } from '@/lib/services/TimeLogService';
import type { ProjectApiResponse } from '@/types/project';

// 强制动态渲染
export const dynamic = 'force-dynamic';

const authService = new AuthService();
const timeLogService = new TimeLogService();

// POST /api/time-logs/timer/stop - 停止计时
export async function POST(request: NextRequest) {
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

    // 解析请求体
    const body = await request.json();
    const { time_log_id } = body;

    // 输入验证
    if (!time_log_id) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '时间记录ID不能为空'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 停止计时
    const timeLog = await timeLogService.stopTimer(user.id, time_log_id);

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { timeLog },
      message: '计时停止成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('停止计时失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '停止计时失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'TIMER_STOP_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}