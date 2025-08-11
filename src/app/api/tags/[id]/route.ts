import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { TagService } from '@/lib/services/TagService';
import type { UpdateTagInput } from '@/lib/services/TagService';

// 强制动态渲染
export const dynamic = 'force-dynamic';

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

// GET /api/tags/[id] - 获取单个标签
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tagId = parseInt(params.id);
    if (isNaN(tagId)) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的标签ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const withStats = searchParams.get('stats') === 'true';

    let responseData;

    if (withStats) {
      // 获取带统计信息的标签
      const stats = tagService.getTagUsageStats(tagId, user.id);
      if (!stats) {
        return NextResponse.json<TagApiResponse>({
          success: false,
          error: {
            code: 'TAG_NOT_FOUND',
            message: '标签不存在'
          },
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
      responseData = { tag: stats };
    } else {
      // 获取基本标签信息
      const tag = tagService.findTagById(tagId, user.id);
      if (!tag) {
        return NextResponse.json<TagApiResponse>({
          success: false,
          error: {
            code: 'TAG_NOT_FOUND',
            message: '标签不存在'
          },
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
      responseData = { tag };
    }

    return NextResponse.json<TagApiResponse>({
      success: true,
      data: responseData,
      message: '标签获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取标签失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取标签失败';
    
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

// PUT /api/tags/[id] - 更新标签
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tagId = parseInt(params.id);
    if (isNaN(tagId)) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的标签ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 解析请求体
    const body: UpdateTagInput = await request.json();
    const { name, color, icon, description } = body;

    // 输入验证
    if (name !== undefined) {
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
    }

    if (description !== undefined && description && description.length > 100) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '标签描述不能超过100个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (color !== undefined && (!/^#[0-9A-Fa-f]{6}$/.test(color))) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '颜色格式不正确，请使用十六进制格式（如: #999999）'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (icon !== undefined && icon && icon.length > 50) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '图标名称不能超过50个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 更新标签
    const tag = await tagService.updateTag(tagId, user.id, {
      name: name?.trim(),
      color,
      icon,
      description: description?.trim()
    });

    return NextResponse.json<TagApiResponse>({
      success: true,
      data: { tag },
      message: '标签更新成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('标签更新失败:', error);
    
    let status = 500;
    let errorCode = 'TAG_UPDATE_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('不存在') || error.message.includes('not found')) {
        status = 404;
        errorCode = 'TAG_NOT_FOUND';
      } else if (error.message.includes('已存在') || error.message.includes('名称')) {
        status = 400;
        errorCode = 'VALIDATION_ERROR';
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : '标签更新失败';
    
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

// DELETE /api/tags/[id] - 删除标签
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tagId = parseInt(params.id);
    if (isNaN(tagId)) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的标签ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 删除标签
    await tagService.deleteTag(tagId, user.id);

    return NextResponse.json<TagApiResponse>({
      success: true,
      message: '标签删除成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('标签删除失败:', error);
    
    let status = 500;
    let errorCode = 'TAG_DELETE_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('不存在') || error.message.includes('not found')) {
        status = 404;
        errorCode = 'TAG_NOT_FOUND';
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : '标签删除失败';
    
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