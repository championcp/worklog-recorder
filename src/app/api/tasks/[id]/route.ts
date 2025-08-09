import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { WBSTaskService } from '@/lib/services/WBSTaskService';

// 强制动态渲染
export const dynamic = 'force-dynamic';
import type { ProjectApiResponse, UpdateWBSTaskInput } from '@/types/project';

const authService = new AuthService();
const wbsTaskService = new WBSTaskService();

// GET /api/tasks/[id] - 获取单个任务详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'INVALID_TASK_ID',
          message: '无效的任务ID'
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

    // 获取任务详情
    const task = wbsTaskService.findWBSTaskById(taskId);
    if (!task) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: '任务不存在'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // 验证用户权限（通过项目权限验证）
    try {
      wbsTaskService.findProjectWBSTasks(user.id, task.project_id);
    } catch (error) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '没有访问此任务的权限'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { task },
      message: '任务详情获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取任务详情失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取任务详情失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'TASK_FETCH_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT /api/tasks/[id] - 更新任务
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'INVALID_TASK_ID',
          message: '无效的任务ID'
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
    const body: UpdateWBSTaskInput = await request.json();
    const { 
      name, 
      description, 
      start_date, 
      end_date, 
      estimated_hours, 
      status, 
      progress_percentage, 
      priority 
    } = body;

    // 输入验证
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json<ProjectApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '任务名称不能为空'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      if (name.length > 255) {
        return NextResponse.json<ProjectApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '任务名称不能超过255个字符'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    if (description !== undefined && description.length > 1000) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '任务描述不能超过1000个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (estimated_hours !== undefined && (estimated_hours < 0 || estimated_hours > 9999)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '预估工时必须在0-9999小时之间'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (status !== undefined && !['not_started', 'in_progress', 'completed', 'paused', 'cancelled'].includes(status)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的任务状态'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (progress_percentage !== undefined && (progress_percentage < 0 || progress_percentage > 100)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '进度百分比必须在0-100之间'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (priority !== undefined && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的优先级'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 日期验证
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (startDate > endDate) {
        return NextResponse.json<ProjectApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '开始日期不能晚于结束日期'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    // 更新任务
    const updatedTask = await wbsTaskService.updateWBSTask(user.id, taskId, {
      name: name?.trim(),
      description: description?.trim(),
      start_date,
      end_date,
      estimated_hours,
      status,
      progress_percentage,
      priority
    });

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { task: updatedTask },
      message: '任务更新成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('任务更新失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '任务更新失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'TASK_UPDATE_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] - 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'INVALID_TASK_ID',
          message: '无效的任务ID'
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

    // 删除任务
    await wbsTaskService.deleteWBSTask(user.id, taskId);

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      message: '任务删除成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('任务删除失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '任务删除失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'TASK_DELETE_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}