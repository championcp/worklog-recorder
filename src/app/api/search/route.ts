import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { SearchService } from '@/lib/services/SearchService';

// 强制动态渲染
export const dynamic = 'force-dynamic';

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

// GET /api/search - 全局搜索
export async function GET(request: NextRequest) {
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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');
    const type = searchParams.get('type') as 'all' | 'tasks' | 'projects' | 'categories' | 'tags' || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // 验证查询参数
    if (!query || query.trim().length === 0) {
      return NextResponse.json<SearchApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '搜索关键词不能为空'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (query.length < 2) {
      return NextResponse.json<SearchApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '搜索关键词至少需要2个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (query.length > 200) {
      return NextResponse.json<SearchApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '搜索关键词不能超过200个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 执行搜索
    const searchResult = await searchService.globalSearch(
      user.id,
      query.trim(),
      type,
      limit,
      offset
    );

    return NextResponse.json<SearchApiResponse>({
      success: true,
      data: searchResult,
      message: `找到${searchResult.total}条相关结果`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('搜索失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '搜索失败';
    
    return NextResponse.json<SearchApiResponse>({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}