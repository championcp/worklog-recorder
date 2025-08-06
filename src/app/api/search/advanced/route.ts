import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { SearchService } from '@/lib/services/SearchService';
import type { AdvancedSearchCriteria } from '@/lib/services/SearchService';

const authService = new AuthService();
const searchService = new SearchService();

interface SearchApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
  timestamp: string;
}

// POST /api/search/advanced - 高级搜索
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<SearchApiResponse>({
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
      return NextResponse.json<SearchApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '无效的认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // 解析请求体
    const body: AdvancedSearchCriteria = await request.json();
    const { keywords, filters, sort_by, sort_order, limit, offset } = body;

    // 输入验证
    if (keywords && keywords.trim().length > 0) {
      if (keywords.length < 2) {
        return NextResponse.json<SearchApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '搜索关键词至少需要2个字符'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      if (keywords.length > 200) {
        return NextResponse.json<SearchApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '搜索关键词不能超过200个字符'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    // 验证筛选条件
    if (filters) {
      if (filters.categories && filters.categories.length > 20) {
        return NextResponse.json<SearchApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '最多只能选择20个分类进行筛选'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      if (filters.tags && filters.tags.length > 50) {
        return NextResponse.json<SearchApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '最多只能选择50个标签进行筛选'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      if (filters.projects && filters.projects.length > 10) {
        return NextResponse.json<SearchApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '最多只能选择10个项目进行筛选'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      // 验证日期范围
      if (filters.date_range) {
        if (filters.date_range.start && filters.date_range.end) {
          const start = new Date(filters.date_range.start);
          const end = new Date(filters.date_range.end);
          if (start > end) {
            return NextResponse.json<SearchApiResponse>({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: '开始日期不能晚于结束日期'
              },
              timestamp: new Date().toISOString()
            }, { status: 400 });
          }
        }
      }
    }

    // 验证排序参数
    const validSortBy = ['relevance', 'created', 'updated', 'priority', 'deadline'];
    if (sort_by && !validSortBy.includes(sort_by)) {
      return NextResponse.json<SearchApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的排序字段'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const validSortOrder = ['asc', 'desc'];
    if (sort_order && !validSortOrder.includes(sort_order)) {
      return NextResponse.json<SearchApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的排序顺序'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 验证分页参数
    const finalLimit = Math.min(limit || 50, 100);
    const finalOffset = Math.max(offset || 0, 0);

    // 如果没有关键词和筛选条件，返回错误
    if ((!keywords || keywords.trim().length === 0) && (!filters || Object.keys(filters).length === 0)) {
      return NextResponse.json<SearchApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请提供搜索关键词或筛选条件'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 执行高级搜索
    const searchResult = await searchService.advancedSearch(user.id, {
      keywords: keywords?.trim(),
      filters,
      sort_by,
      sort_order,
      limit: finalLimit,
      offset: finalOffset
    });

    return NextResponse.json<SearchApiResponse>({
      success: true,
      data: searchResult,
      message: `找到${searchResult.total}条相关结果`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('高级搜索失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '高级搜索失败';
    
    return NextResponse.json<SearchApiResponse>({
      success: false,
      error: {
        code: 'ADVANCED_SEARCH_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}