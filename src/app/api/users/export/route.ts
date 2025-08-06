import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { UserSettingsService } from '@/lib/services/UserSettingsService';
import type { ExportConfig } from '@/lib/services/UserSettingsService';

const authService = new AuthService();
const userSettingsService = new UserSettingsService();

interface ExportApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
  timestamp: string;
}

// POST /api/users/export - 导出用户数据
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<ExportApiResponse>({
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
      return NextResponse.json<ExportApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '无效的认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // 解析请求体
    const body: ExportConfig = await request.json();
    const { format, scope, options } = body;

    // 输入验证
    if (!format || !['json', 'csv', 'excel'].includes(format)) {
      return NextResponse.json<ExportApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '不支持的导出格式'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!scope || !scope.data_types || !Array.isArray(scope.data_types) || scope.data_types.length === 0) {
      return NextResponse.json<ExportApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请选择要导出的数据类型'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const validDataTypes = ['projects', 'tasks', 'time_logs', 'categories', 'tags', 'settings'];
    const invalidTypes = scope.data_types.filter(type => !validDataTypes.includes(type));
    if (invalidTypes.length > 0) {
      return NextResponse.json<ExportApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `不支持的数据类型: ${invalidTypes.join(', ')}`
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 验证日期范围
    if (scope.date_range) {
      if (scope.date_range.start && scope.date_range.end) {
        const start = new Date(scope.date_range.start);
        const end = new Date(scope.date_range.end);
        if (start > end) {
          return NextResponse.json<ExportApiResponse>({
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

    // 验证加密选项
    if (options.encrypt && !options.password) {
      return NextResponse.json<ExportApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '启用加密时必须提供密码'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (options.password && options.password.length < 8) {
      return NextResponse.json<ExportApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '加密密码至少需要8个字符'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 导出数据
    const exportContent = await userSettingsService.exportUserData(user.id, body);

    // 设置响应头
    const filename = `nobody-logger-export-${user.id}-${new Date().toISOString().split('T')[0]}.${format}`;
    const headers = {
      'Content-Type': format === 'json' ? 'application/json' : 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': Buffer.byteLength(exportContent, 'utf8').toString()
    };

    return new NextResponse(exportContent, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('数据导出失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '数据导出失败';
    
    return NextResponse.json<ExportApiResponse>({
      success: false,
      error: {
        code: 'DATA_EXPORT_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}