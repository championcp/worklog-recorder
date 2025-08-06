import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { TagService } from '@/lib/services/TagService';
import type { CreateTagInput } from '@/lib/services/TagService';

const authService = new AuthService();
const tagService = new TagService();

interface TagApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
  timestamp: string;
}

// GET /api/tags - 获取用户的所有标签
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<TagApiResponse>({
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
      return NextResponse.json<TagApiResponse>({
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
    const sortBy = searchParams.get('sort') as 'name' | 'usage' | 'created' || 'name';
    const search = searchParams.get('search');
    const popular = searchParams.get('popular') === 'true';
    const recent = searchParams.get('recent') === 'true';
    const cloud = searchParams.get('cloud') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let tags;

    if (search) {
      // 搜索标签
      tags = tagService.searchTags(user.id, search);
    } else if (popular) {
      // 获取热门标签
      tags = tagService.getPopularTags(user.id, limit);
    } else if (recent) {
      // 获取最近使用的标签
      tags = tagService.getRecentlyUsedTags(user.id, limit);
    } else if (cloud) {
      // 获取标签云数据
      tags = tagService.getTagCloud(user.id);
    } else {
      // 获取所有标签
      tags = tagService.findUserTags(user.id, sortBy);
    }

    return NextResponse.json<TagApiResponse>({
      success: true,
      data: { tags },
      message: '标签列表获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取标签列表失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取标签列表失败';
    
    return NextResponse.json<TagApiResponse>({
      success: false,
      error: {
        code: 'TAG_FETCH_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST /api/tags - 创建新标签
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<TagApiResponse>({
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
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '无效的认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // 解析请求体
    const body: CreateTagInput = await request.json();
    const { name, color, icon, description } = body;

    // 输入验证
    if (!name || name.trim().length === 0) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '标签名称不能为空'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '标签名称不能超过50个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (description && description.length > 100) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '标签描述不能超过100个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '颜色格式不正确，请使用十六进制格式（如: #999999）'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (icon && icon.length > 50) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '图标名称不能超过50个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 创建标签
    const tag = await tagService.createTag(user.id, {
      name: name.trim(),
      color,
      icon,
      description: description?.trim()
    });

    return NextResponse.json<TagApiResponse>({
      success: true,
      data: { tag },
      message: '标签创建成功',
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('标签创建失败:', error);
    
    let status = 500;
    let errorCode = 'TAG_CREATE_ERROR';
    
    if (error instanceof Error && error.message.includes('已存在')) {
      status = 400;
      errorCode = 'VALIDATION_ERROR';
    }
    
    const errorMessage = error instanceof Error ? error.message : '标签创建失败';
    
    return NextResponse.json<TagApiResponse>({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status });
  }
}

// DELETE /api/tags - 批量清理未使用的标签
export async function DELETE(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<TagApiResponse>({
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
      return NextResponse.json<TagApiResponse>({
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
    const daysUnused = parseInt(searchParams.get('days') || '30');

    if (daysUnused < 1 || daysUnused > 365) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '天数参数必须在1-365之间'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 清理未使用的标签
    const deletedCount = await tagService.cleanupUnusedTags(user.id, daysUnused);

    return NextResponse.json<TagApiResponse>({
      success: true,
      data: { deletedCount },
      message: `已清理${deletedCount}个未使用的标签`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('清理标签失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '清理标签失败';
    
    return NextResponse.json<TagApiResponse>({
      success: false,
      error: {
        code: 'TAG_CLEANUP_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}