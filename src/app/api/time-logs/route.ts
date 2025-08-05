import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { TimeLogService } from '@/lib/services/TimeLogService';
import type { ProjectApiResponse, CreateTimeLogInput } from '@/types/project';

const authService = new AuthService();
const timeLogService = new TimeLogService();

// GET /api/time-logs?task_id=123&project_id=456&start_date=2024-01-01&end_date=2024-01-31&limit=50&offset=0
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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id') ? parseInt(searchParams.get('task_id')!) : undefined;
    const projectId = searchParams.get('project_id') ? parseInt(searchParams.get('project_id')!) : undefined;
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    const statsOnly = searchParams.get('stats') === 'true';

    // 如果只要统计数据
    if (statsOnly) {
      const stats = timeLogService.getTimeStats(user.id, {
        taskId,
        projectId,
        startDate,
        endDate
      });

      const dailyStats = timeLogService.getDailyTimeStats(user.id, {
        startDate,
        endDate,
        projectId
      });

      return NextResponse.json<ProjectApiResponse>({
        success: true,
        data: { 
          stats,
          dailyStats
        },
        message: '时间统计获取成功',
        timestamp: new Date().toISOString()
      });
    }

    // 获取时间记录列表
    const timeLogs = timeLogService.findUserTimeLogs(user.id, {
      taskId,
      projectId,
      startDate,
      endDate,
      limit,
      offset
    });

    // 获取统计信息
    const stats = timeLogService.getTimeStats(user.id, {
      taskId,
      projectId,
      startDate,
      endDate
    });

    // 获取当前活跃的计时器
    const activeTimer = timeLogService.getActiveTimer(user.id);

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { 
        timeLogs,
        stats,
        activeTimer,
        total: timeLogs.length
      },
      message: '时间记录获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取时间记录失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取时间记录失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'TIME_LOGS_FETCH_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST /api/time-logs - 创建新的时间记录
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
    const body: CreateTimeLogInput = await request.json();
    const { 
      task_id, 
      description, 
      start_time, 
      end_time, 
      is_manual 
    } = body;

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

    if (!start_time) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '开始时间不能为空'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 验证时间格式
    const startDate = new Date(start_time);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '开始时间格式不正确'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (end_time) {
      const endDate = new Date(end_time);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json<ProjectApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '结束时间格式不正确'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      if (endDate <= startDate) {
        return NextResponse.json<ProjectApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '结束时间必须晚于开始时间'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
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

    // 创建时间记录
    const timeLog = await timeLogService.createTimeLog(user.id, {
      task_id,
      description: description?.trim(),
      start_time,
      end_time,
      is_manual
    });

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { timeLog },
      message: '时间记录创建成功',
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('创建时间记录失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '创建时间记录失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'TIME_LOG_CREATE_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}