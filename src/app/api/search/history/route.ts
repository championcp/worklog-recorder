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

// GET /api/search/history - 获取搜索历史
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // 获取搜索历史
    const history = searchService.getSearchHistory(user.id, limit);

    return NextResponse.json<SearchApiResponse>({
      success: true,
      data: { history },
      message: '搜索历史获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取搜索历史失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取搜索历史失败';
    
    return NextResponse.json<SearchApiResponse>({
      success: false,
      error: {
        code: 'SEARCH_HISTORY_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE /api/search/history - 清理搜索历史
export async function DELETE(request: NextRequest) {
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
    const daysToKeep = Math.max(parseInt(searchParams.get('days') || '30'), 1);

    if (daysToKeep > 365) {
      return NextResponse.json<SearchApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '保留天数不能超过365天'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 清理搜索历史
    const deletedCount = await searchService.cleanupSearchHistory(user.id, daysToKeep);

    return NextResponse.json<SearchApiResponse>({
      success: true,
      data: { deletedCount },
      message: `已清理${deletedCount}条搜索历史记录`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('清理搜索历史失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '清理搜索历史失败';
    
    return NextResponse.json<SearchApiResponse>({
      success: false,
      error: {
        code: 'SEARCH_HISTORY_CLEANUP_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}