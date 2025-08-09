import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { TimeLogService } from '@/lib/services/TimeLogService';
import type { ProjectApiResponse } from '@/types/project';

// 强制动态渲染
export const dynamic = 'force-dynamic';

const authService = new AuthService();
const timeLogService = new TimeLogService();

// POST /api/time-logs/timer/start - 开始计时
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
    const { task_id, description } = body;

    // 输入验证
    if (!task_id) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '任务ID不能为空'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (description && description.length > 500) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '描述不能超过500个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 开始计时
    const timeLog = await timeLogService.startTimer(user.id, task_id, description?.trim());

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { timeLog },
      message: '计时开始成功',
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('开始计时失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '开始计时失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'TIMER_START_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}