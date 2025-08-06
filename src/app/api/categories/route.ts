import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { CategoryService } from '@/lib/services/CategoryService';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/lib/services/CategoryService';

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

// GET /api/categories - 获取用户的所有分类
export async function GET(request: NextRequest) {
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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';
    const treeFormat = searchParams.get('tree') === 'true';
    const withStats = searchParams.get('stats') === 'true';
    const search = searchParams.get('search');

    let categories;

    if (search) {
      // 搜索分类
      categories = categoryService.searchCategories(user.id, search);
    } else if (withStats) {
      // 获取带统计信息的分类
      categories = categoryService.getCategoryStats(user.id);
    } else if (treeFormat) {
      // 获取树形结构
      categories = categoryService.findUserCategoryTree(user.id, includeInactive);
    } else {
      // 获取平铺列表
      categories = categoryService.findUserCategories(user.id, includeInactive);
    }

    return NextResponse.json<CategoryApiResponse>({
      success: true,
      data: { categories },
      message: '分类列表获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取分类列表失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取分类列表失败';
    
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

// POST /api/categories - 创建新分类
export async function POST(request: NextRequest) {
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

    // 解析请求体
    const body: CreateCategoryInput = await request.json();
    const { name, description, color, icon, parent_id, sort_order } = body;

    // 输入验证
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

    if (description && description.length > 200) {
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '分类描述不能超过200个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '颜色格式不正确，请使用十六进制格式（如: #666666）'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (icon && icon.length > 50) {
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '图标名称不能超过50个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 创建分类
    const category = await categoryService.createCategory(user.id, {
      name: name.trim(),
      description: description?.trim(),
      color,
      icon,
      parent_id,
      sort_order
    });

    return NextResponse.json<CategoryApiResponse>({
      success: true,
      data: { category },
      message: '分类创建成功',
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('分类创建失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '分类创建失败';
    
    return NextResponse.json<CategoryApiResponse>({
      success: false,
      error: {
        code: 'CATEGORY_CREATE_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT /api/categories - 批量重排序分类
export async function PUT(request: NextRequest) {
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

    // 解析请求体
    const body: { orders: { id: number; sort_order: number }[] } = await request.json();

    if (!body.orders || !Array.isArray(body.orders)) {
      return NextResponse.json<CategoryApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求格式不正确'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 批量重排序
    await categoryService.reorderCategories(user.id, body.orders);

    return NextResponse.json<CategoryApiResponse>({
      success: true,
      message: '分类排序更新成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('分类排序更新失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '分类排序更新失败';
    
    return NextResponse.json<CategoryApiResponse>({
      success: false,
      error: {
        code: 'CATEGORY_REORDER_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}