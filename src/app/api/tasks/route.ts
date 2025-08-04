import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { WBSTaskService } from '@/lib/services/WBSTaskService';
import type { ProjectApiResponse, CreateWBSTaskInput } from '@/types/project';

const authService = new AuthService();
const wbsTaskService = new WBSTaskService();

// GET /api/tasks?project_id=123 - 获取项目的WBS任务列表
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
    const projectIdParam = searchParams.get('project_id');
    const treeFormat = searchParams.get('tree') === 'true';

    if (!projectIdParam) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '缺少project_id参数'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const projectId = parseInt(projectIdParam);
    if (isNaN(projectId)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的project_id参数'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 获取任务列表
    const tasks = treeFormat 
      ? wbsTaskService.getWBSTaskTree(user.id, projectId)
      : wbsTaskService.findProjectWBSTasks(user.id, projectId);

    // 获取任务统计
    const stats = wbsTaskService.getWBSTaskStats(user.id, projectId);

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { 
        tasks,
        stats,
        total: Array.isArray(tasks) ? tasks.length : 0
      },
      message: '任务列表获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取任务列表失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取任务列表失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'TASKS_FETCH_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST /api/tasks - 创建新的WBS任务
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
    const body: CreateWBSTaskInput = await request.json();
    const { 
      project_id, 
      parent_id, 
      name, 
      description, 
      level_type, 
      start_date, 
      end_date, 
      estimated_hours, 
      priority 
    } = body;

    // 输入验证
    if (!project_id) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '项目ID不能为空'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

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

    if (!level_type) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '任务层级类型不能为空'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const validLevelTypes = ['yearly', 'half_yearly', 'quarterly', 'monthly', 'weekly', 'daily'];
    if (!validLevelTypes.includes(level_type)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的任务层级类型'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (description && description.length > 1000) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '任务描述不能超过1000个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (estimated_hours && (estimated_hours < 0 || estimated_hours > 9999)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '预估工时必须在0-9999小时之间'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
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

    // 创建任务
    const task = await wbsTaskService.createWBSTask(user.id, {
      project_id,
      parent_id,
      name: name.trim(),
      description: description?.trim(),
      level_type,
      start_date,
      end_date,
      estimated_hours,
      priority
    });

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { task },
      message: '任务创建成功',
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('创建任务失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '创建任务失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'TASK_CREATE_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}