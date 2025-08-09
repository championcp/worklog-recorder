import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { CategoryService } from '@/lib/services/CategoryService';
import type { UpdateCategoryInput } from '@/lib/services/CategoryService';

// 强制动态渲染
export const dynamic = 'force-dynamic';

const authService = new AuthService();
const categoryService = new CategoryService();

interface CategoryApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
  timestamp: string;
}

// GET /api/categories/[id] - 获取单个分类
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<CategoryApiResponse>({
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
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',  
          message: '无效的认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的分类ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const category = categoryService.findCategoryById(categoryId, user.id);
    if (!category) {
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: '分类不存在'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    return NextResponse.json<CategoryApiResponse>({
      success: true,
      data: { category },
      message: '分类获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取分类失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取分类失败';
    
    return NextResponse.json<CategoryApiResponse>({
      success: false,
      error: {
        code: 'CATEGORY_FETCH_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT /api/categories/[id] - 更新分类
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<CategoryApiResponse>({
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
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '无效的认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的分类ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 解析请求体
    const body: UpdateCategoryInput = await request.json();
    const { name, description, color, icon, parent_id, sort_order, is_active } = body;

    // 输入验证
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json<CategoryApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '分类名称不能为空'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      if (name.length > 100) {
        return NextResponse.json<CategoryApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '分类名称不能超过100个字符'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    if (description !== undefined && description && description.length > 200) {
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '分类描述不能超过200个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (color !== undefined && (!/^#[0-9A-Fa-f]{6}$/.test(color))) {
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '颜色格式不正确，请使用十六进制格式（如: #666666）'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (icon !== undefined && icon && icon.length > 50) {
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '图标名称不能超过50个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 更新分类
    const category = await categoryService.updateCategory(categoryId, user.id, {
      name: name?.trim(),
      description: description?.trim(),
      color,
      icon,
      parent_id,
      sort_order,
      is_active
    });

    return NextResponse.json<CategoryApiResponse>({
      success: true,
      data: { category },
      message: '分类更新成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('分类更新失败:', error);
    
    let status = 500;
    let errorCode = 'CATEGORY_UPDATE_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('不存在') || error.message.includes('not found')) {
        status = 404;
        errorCode = 'CATEGORY_NOT_FOUND';
      } else if (error.message.includes('已存在') || error.message.includes('名称')) {
        status = 400;
        errorCode = 'VALIDATION_ERROR';
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : '分类更新失败';
    
    return NextResponse.json<CategoryApiResponse>({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status });
  }
}

// DELETE /api/categories/[id] - 删除分类
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<CategoryApiResponse>({
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
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '无效的认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的分类ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 删除分类
    await categoryService.deleteCategory(categoryId, user.id);

    return NextResponse.json<CategoryApiResponse>({
      success: true,
      message: '分类删除成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('分类删除失败:', error);
    
    let status = 500;
    let errorCode = 'CATEGORY_DELETE_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('不存在') || error.message.includes('not found')) {
        status = 404;
        errorCode = 'CATEGORY_NOT_FOUND';
      } else if (error.message.includes('子分类') || error.message.includes('任务')) {
        status = 400;
        errorCode = 'CATEGORY_HAS_DEPENDENCIES';
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : '分类删除失败';
    
    return NextResponse.json<CategoryApiResponse>({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status });
  }
}