import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { ProjectService } from '@/lib/services/ProjectService';
import type { ProjectApiResponse, CreateProjectInput } from '@/types/project';

// 强制动态渲染
export const dynamic = 'force-dynamic';

const authService = new AuthService();
const projectService = new ProjectService();

// GET /api/projects - 获取用户的所有项目
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
    const includeInactive = searchParams.get('include_inactive') === 'true';
    const search = searchParams.get('search');

    let projects;
    if (search) {
      projects = projectService.searchProjects(user.id, search);
    } else {
      projects = projectService.findUserProjects(user.id, includeInactive);
    }

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { projects },
      message: '项目列表获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取项目列表失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取项目列表失败';
    
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

// POST /api/projects - 创建新项目
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
    const body: CreateProjectInput = await request.json();
    const { name, description, color } = body;

    // 输入验证
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

    if (description && description.length > 1000) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '项目描述不能超过1000个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json<ProjectApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '颜色格式不正确，请使用十六进制格式（如: #1976d2）'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 创建项目
    const project = await projectService.createProject(user.id, {
      name: name.trim(),
      description: description?.trim(),
      color
    });

    return NextResponse.json<ProjectApiResponse>({
      success: true,
      data: { project },
      message: '项目创建成功',
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('项目创建失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '项目创建失败';
    
    return NextResponse.json<ProjectApiResponse>({
      success: false,
      error: {
        code: 'PROJECT_CREATE_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}