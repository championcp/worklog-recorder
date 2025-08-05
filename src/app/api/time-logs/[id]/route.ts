import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { TimeLogService } from '@/lib/services/TimeLogService';
import type { ProjectApiResponse, UpdateTimeLogInput } from '@/types/project';

const authService = new AuthService();
const timeLogService = new TimeLogService();

// GET /api/time-logs/[id] - 获取单个时间记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timeLogId = parseInt(params.id);
    if (isNaN(timeLogId)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'INVALID_TIME_LOG_ID',
          message: '无效的时间记录ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

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

    // 获取时间记录详情
    const timeLog = timeLogService.findTimeLogById(timeLogId);
    if (!timeLog) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'TIME_LOG_NOT_FOUND',
          message: '时间记录不存在'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // 验证用户权限（通过查找用户的时间记录来验证）
    const userTimeLogs = timeLogService.findUserTimeLogs(user.id, { limit: 1 });
    const hasAccess = userTimeLogs.some(log => log.id === timeLog.id);
    
    if (!hasAccess) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '没有访问此时间记录的权限'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { timeLog },
      message: '时间记录详情获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取时间记录详情失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取时间记录详情失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'TIME_LOG_FETCH_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT /api/time-logs/[id] - 更新时间记录
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timeLogId = parseInt(params.id);
    if (isNaN(timeLogId)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'INVALID_TIME_LOG_ID',
          message: '无效的时间记录ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

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
    const body: UpdateTimeLogInput = await request.json();
    const { description, start_time, end_time } = body;

    // 输入验证
    if (start_time !== undefined) {
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
    }

    if (end_time !== undefined) {
      if (end_time !== null) {
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
      }
    }

    if (description !== undefined && description !== null && description.length > 500) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '描述不能超过500个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 更新时间记录
    const updatedTimeLog = await timeLogService.updateTimeLog(user.id, timeLogId, {
      description: description?.trim(),
      start_time,
      end_time
    });

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { timeLog: updatedTimeLog },
      message: '时间记录更新成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('时间记录更新失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '时间记录更新失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'TIME_LOG_UPDATE_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE /api/time-logs/[id] - 删除时间记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timeLogId = parseInt(params.id);
    if (isNaN(timeLogId)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'INVALID_TIME_LOG_ID',
          message: '无效的时间记录ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

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

    // 删除时间记录
    await timeLogService.deleteTimeLog(user.id, timeLogId);

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      message: '时间记录删除成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('时间记录删除失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '时间记录删除失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'TIME_LOG_DELETE_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}