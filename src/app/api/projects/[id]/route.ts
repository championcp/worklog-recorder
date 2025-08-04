import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { ProjectService } from '@/lib/services/ProjectService';
import type { ProjectApiResponse, UpdateProjectInput } from '@/types/project';

const authService = new AuthService();
const projectService = new ProjectService();

// GET /api/projects/[id] - 获取单个项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'INVALID_PROJECT_ID',
          message: '无效的项目ID'
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

    // 获取项目
    const project = projectService.findProjectById(user.id, projectId);
    if (!project) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: '项目不存在'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // 获取项目统计
    const stats = projectService.getProjectStats(user.id, projectId);

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { 
        project,
        stats
      },
      message: '项目详情获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取项目详情失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取项目详情失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'PROJECT_FETCH_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT /api/projects/[id] - 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'INVALID_PROJECT_ID',
          message: '无效的项目ID'
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
    const body: UpdateProjectInput = await request.json();
    const { name, description, color, is_active } = body;

    // 输入验证
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json<ProjectApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '项目名称不能为空'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      if (name.length > 255) {
        return NextResponse.json<ProjectApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '项目名称不能超过255个字符'
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
          message: '项目描述不能超过1000个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (color !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '颜色格式不正确，请使用十六进制格式（如: #1976d2）'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 更新项目
    const updatedProject = await projectService.updateProject(user.id, projectId, {
      name: name?.trim(),
      description: description?.trim(),
      color,
      is_active
    });

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { project: updatedProject },
      message: '项目更新成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('项目更新失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '项目更新失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'PROJECT_UPDATE_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'INVALID_PROJECT_ID',
          message: '无效的项目ID'
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

    // 删除项目
    await projectService.deleteProject(user.id, projectId);

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      message: '项目删除成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('项目删除失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '项目删除失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'PROJECT_DELETE_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}