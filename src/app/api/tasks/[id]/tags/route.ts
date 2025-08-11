import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { TagService } from '@/lib/services/TagService';

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

// GET /api/tasks/[id]/tags - 获取任务的所有标签
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

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的任务ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 获取任务的所有标签
    const tags = tagService.getTaskTags(taskId, user.id);

    return NextResponse.json<TagApiResponse>({
      success: true,
      data: { tags },
      message: '任务标签获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取任务标签失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取任务标签失败';
    
    return NextResponse.json<TagApiResponse>({
      success: false,
      error: {
        code: 'TASK_TAG_FETCH_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST /api/tasks/[id]/tags - 为任务添加标签
export async function POST(
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

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的任务ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 解析请求体
    const body: { tag_ids?: number[]; tag_id?: number } = await request.json();

    if (body.tag_ids && Array.isArray(body.tag_ids)) {
      // 批量添加标签
      const tagIds = body.tag_ids.filter((id: any) => typeof id === 'number' && !isNaN(id));
      
      if (tagIds.length === 0) {
        return NextResponse.json<TagApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请提供有效的标签ID列表'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      if (tagIds.length > 10) {
        return NextResponse.json<TagApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '一次最多只能添加10个标签'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      await tagService.addTagsToTask(taskId, tagIds, user.id);

      // 获取更新后的标签列表
      const tags = tagService.getTaskTags(taskId, user.id);

      return NextResponse.json<TagApiResponse>({
        success: true,
        data: { tags },
        message: `成功为任务添加${tagIds.length}个标签`,
        timestamp: new Date().toISOString()
      });

    } else if (body.tag_id && typeof body.tag_id === 'number') {
      // 添加单个标签
      await tagService.addTagToTask(taskId, body.tag_id, user.id);

      // 获取更新后的标签列表
      const tags = tagService.getTaskTags(taskId, user.id);

      return NextResponse.json<TagApiResponse>({
        success: true,
        data: { tags },
        message: '标签添加成功',
        timestamp: new Date().toISOString()
      });

    } else {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请提供tag_id或tag_ids参数'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

  } catch (error) {
    console.error('添加任务标签失败:', error);
    
    let status = 500;
    let errorCode = 'TASK_TAG_ADD_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('不存在') || error.message.includes('无权限')) {
        status = 404;
        errorCode = 'RESOURCE_NOT_FOUND';
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : '添加任务标签失败';
    
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

// DELETE /api/tasks/[id]/tags - 从任务移除标签
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

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的任务ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 从查询参数或请求体获取标签ID
    const { searchParams } = new URL(request.url);
    const tagIdParam = searchParams.get('tag_id');
    
    let tagIds: number[] = [];
    
    if (tagIdParam) {
      // 从查询参数获取单个标签ID
      const tagId = parseInt(tagIdParam);
      if (!isNaN(tagId)) {
        tagIds = [tagId];
      }
    } else {
      // 从请求体获取标签ID列表
      try {
        const body: { tag_ids?: number[]; tag_id?: number } = await request.json();
        
        if (body.tag_ids && Array.isArray(body.tag_ids)) {
          tagIds = body.tag_ids.filter((id: any) => typeof id === 'number' && !isNaN(id));
        } else if (body.tag_id && typeof body.tag_id === 'number') {
          tagIds = [body.tag_id];
        }
      } catch {
        // 如果没有请求体，继续使用空数组
      }
    }

    if (tagIds.length === 0) {
      return NextResponse.json<TagApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请提供要移除的标签ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 移除标签
    if (tagIds.length === 1) {
      await tagService.removeTagFromTask(taskId, tagIds[0], user.id);
    } else {
      await tagService.removeTagsFromTask(taskId, tagIds, user.id);
    }

    // 获取更新后的标签列表
    const tags = tagService.getTaskTags(taskId, user.id);

    return NextResponse.json<TagApiResponse>({
      success: true,
      data: { tags },
      message: `成功移除${tagIds.length}个标签`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('移除任务标签失败:', error);
    
    let status = 500;
    let errorCode = 'TASK_TAG_REMOVE_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('不存在') || error.message.includes('无权限')) {
        status = 404;
        errorCode = 'RESOURCE_NOT_FOUND';
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : '移除任务标签失败';
    
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