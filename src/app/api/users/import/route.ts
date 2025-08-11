import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { UserSettingsService } from '@/lib/services/UserSettingsService';
import type { ImportConfig } from '@/lib/services/UserSettingsService';

// 强制动态渲染
export const dynamic = 'force-dynamic';

const authService = new AuthService();
const userSettingsService = new UserSettingsService();

interface ImportApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
  timestamp: string;
}

// POST /api/users/import - 导入用户数据
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<ImportApiResponse>({
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
      return NextResponse.json<ImportApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '无效的认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // 获取表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const configStr = formData.get('config') as string;

    if (!file) {
      return NextResponse.json<ImportApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请选择要导入的文件'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 文件大小限制 (10MB)
    const maxFileSize = 10 * 1024 * 1024;
    if (file.size > maxFileSize) {
      return NextResponse.json<ImportApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '文件大小不能超过10MB'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 文件类型验证
    const allowedTypes = ['application/json', 'text/csv', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<ImportApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '不支持的文件类型，请上传JSON或CSV文件'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 解析配置
    let config: ImportConfig;
    try {
      config = configStr ? JSON.parse(configStr) : {
        format: file.type.includes('json') ? 'json' : 'csv',
        validation: {
          strict_mode: false,
          skip_errors: true
        },
        conflict_resolution: {
          duplicate_handling: 'skip'
        }
      };
    } catch {
      return NextResponse.json<ImportApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的配置格式'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 验证配置
    if (!config.format || !['json', 'csv'].includes(config.format)) {
      return NextResponse.json<ImportApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '不支持的导入格式'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!config.conflict_resolution || !['skip', 'overwrite', 'merge'].includes(config.conflict_resolution.duplicate_handling)) {
      return NextResponse.json<ImportApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的冲突处理策略'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 读取文件内容
    const fileContent = await file.text();
    
    if (!fileContent.trim()) {
      return NextResponse.json<ImportApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '文件内容不能为空'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 执行导入
    const importResult = await userSettingsService.importUserData(user.id, fileContent, config);

    let message = `导入完成: 成功${importResult.imported_count}条`;
    if (importResult.skipped_count > 0) {
      message += `, 跳过${importResult.skipped_count}条`;
    }
    if (importResult.error_count > 0) {
      message += `, 失败${importResult.error_count}条`;
    }

    const status = importResult.success ? 200 : 207; // 207 Multi-Status for partial success

    return NextResponse.json<ImportApiResponse>({
      success: importResult.success,
      data: {
        imported_count: importResult.imported_count,
        skipped_count: importResult.skipped_count,
        error_count: importResult.error_count,
        errors: importResult.errors
      },
      message,
      timestamp: new Date().toISOString()
    }, { status });

  } catch (error) {
    console.error('数据导入失败:', error);
    
    let errorMessage = '数据导入失败';
    let errorCode = 'DATA_IMPORT_ERROR';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('JSON') || error.message.includes('格式')) {
        errorCode = 'INVALID_FILE_FORMAT';
      }
    }
    
    return NextResponse.json<ImportApiResponse>({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}