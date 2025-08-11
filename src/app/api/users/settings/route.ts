import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { UserSettingsService } from '@/lib/services/UserSettingsService';
import type { UserSettings } from '@/lib/services/UserSettingsService';

// 强制动态渲染
export const dynamic = 'force-dynamic';

const authService = new AuthService();
const userSettingsService = new UserSettingsService();

interface SettingsApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
  timestamp: string;
}

// GET /api/users/settings - 获取用户设置
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<SettingsApiResponse>({
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
      return NextResponse.json<SettingsApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '无效的认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // 获取用户设置
    const settings = await userSettingsService.getUserSettings(user.id);

    return NextResponse.json<SettingsApiResponse>({
      success: true,
      data: { settings },
      message: '用户设置获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取用户设置失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取用户设置失败';
    
    return NextResponse.json<SettingsApiResponse>({
      success: false,
      error: {
        code: 'SETTINGS_FETCH_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT /api/users/settings - 更新用户设置
export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<SettingsApiResponse>({
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
      return NextResponse.json<SettingsApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '无效的认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // 解析请求体
    const body: Partial<UserSettings> = await request.json();

    // 输入验证
    if (body.theme_mode && !['light', 'dark', 'auto'].includes(body.theme_mode)) {
      return NextResponse.json<SettingsApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的主题模式'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (body.primary_color && !/^#[0-9A-Fa-f]{6}$/.test(body.primary_color)) {
      return NextResponse.json<SettingsApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的主色调格式'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (body.font_size && !['small', 'normal', 'large', 'xlarge'].includes(body.font_size)) {
      return NextResponse.json<SettingsApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的字体大小'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (body.density && !['compact', 'normal', 'spacious'].includes(body.density)) {
      return NextResponse.json<SettingsApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的界面密度'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (body.language && !['zh-CN', 'en-US'].includes(body.language)) {
      return NextResponse.json<SettingsApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '不支持的语言'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (body.time_format && !['12h', '24h'].includes(body.time_format)) {
      return NextResponse.json<SettingsApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的时间格式'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (body.page_size !== undefined) {
      if (!Number.isInteger(body.page_size) || body.page_size < 10 || body.page_size > 100) {
        return NextResponse.json<SettingsApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '页面大小必须在10-100之间'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    if (body.auto_save_interval !== undefined) {
      if (!Number.isInteger(body.auto_save_interval) || body.auto_save_interval < 5 || body.auto_save_interval > 300) {
        return NextResponse.json<SettingsApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '自动保存间隔必须在5-300秒之间'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    // 更新用户设置
    const updatedSettings = await userSettingsService.updateUserSettings(user.id, body);

    return NextResponse.json<SettingsApiResponse>({
      success: true,
      data: { settings: updatedSettings },
      message: '用户设置更新成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('用户设置更新失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '用户设置更新失败';
    
    return NextResponse.json<SettingsApiResponse>({
      success: false,
      error: {
        code: 'SETTINGS_UPDATE_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE /api/users/settings - 重置用户设置
export async function DELETE(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<SettingsApiResponse>({
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
      return NextResponse.json<SettingsApiResponse>({
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
    const keysParam = searchParams.get('keys');
    const settingKeys = keysParam ? keysParam.split(',') : undefined;

    // 重置用户设置
    const resetSettings = await userSettingsService.resetUserSettings(user.id, settingKeys);

    return NextResponse.json<SettingsApiResponse>({
      success: true,
      data: { settings: resetSettings },
      message: settingKeys ? `已重置指定设置项` : '已重置所有设置为默认值',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('重置用户设置失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '重置用户设置失败';
    
    return NextResponse.json<SettingsApiResponse>({
      success: false,
      error: {
        code: 'SETTINGS_RESET_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}