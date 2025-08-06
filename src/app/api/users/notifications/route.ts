import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/AuthService';
import { UserSettingsService } from '@/lib/services/UserSettingsService';
import type { NotificationSettings } from '@/lib/services/UserSettingsService';

const authService = new AuthService();
const userSettingsService = new UserSettingsService();

interface NotificationApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
  timestamp: string;
}

// GET /api/users/notifications - 获取通知设置
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<NotificationApiResponse>({
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
      return NextResponse.json<NotificationApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '无效的认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // 获取通知设置
    const notificationSettings = await userSettingsService.getNotificationSettings(user.id);

    return NextResponse.json<NotificationApiResponse>({
      success: true,
      data: { settings: notificationSettings },
      message: '通知设置获取成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取通知设置失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '获取通知设置失败';
    
    return NextResponse.json<NotificationApiResponse>({
      success: false,
      error: {
        code: 'NOTIFICATION_SETTINGS_FETCH_ERROR',
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT /api/users/notifications - 更新通知设置
export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json<NotificationApiResponse>({
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
      return NextResponse.json<NotificationApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '无效的认证token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // 解析请求体
    const body: Partial<NotificationSettings> = await request.json();

    // 输入验证
    if (body.categories) {
      const validCategories = ['tasks', 'projects', 'team', 'system'];
      const validFrequencies = ['immediate', 'digest', 'batch'];
      const validChannels = ['in_app', 'email', 'browser', 'mobile'];

      Object.entries(body.categories).forEach(([category, settings]) => {
        if (!validCategories.includes(category)) {
          throw new Error(`无效的通知分类: ${category}`);
        }

        if (settings.frequency && !validFrequencies.includes(settings.frequency)) {
          throw new Error(`无效的通知频率: ${settings.frequency}`);
        }

        if (settings.channels) {
          settings.channels.forEach(channel => {
            if (!validChannels.includes(channel)) {
              throw new Error(`无效的通知渠道: ${channel}`);
            }
          });
        }
      });
    }

    if (body.schedule) {
      // 验证时间格式
      if (body.schedule.work_hours) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (body.schedule.work_hours.start && !timeRegex.test(body.schedule.work_hours.start)) {
          return NextResponse.json<NotificationApiResponse>({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '工作时间开始时间格式不正确'
            },
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        if (body.schedule.work_hours.end && !timeRegex.test(body.schedule.work_hours.end)) {
          return NextResponse.json<NotificationApiResponse>({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '工作时间结束时间格式不正确'
            },
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
      }

      if (body.schedule.quiet_hours) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (body.schedule.quiet_hours.start && !timeRegex.test(body.schedule.quiet_hours.start)) {
          return NextResponse.json<NotificationApiResponse>({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '免打扰开始时间格式不正确'
            },
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        if (body.schedule.quiet_hours.end && !timeRegex.test(body.schedule.quiet_hours.end)) {
          return NextResponse.json<NotificationApiResponse>({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '免打扰结束时间格式不正确'
            },
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
      }
    }

    if (body.templates) {
      if (body.templates.email_format && !['simple', 'detailed', 'digest'].includes(body.templates.email_format)) {
        return NextResponse.json<NotificationApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '无效的邮件格式'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      if (body.templates.language && !['zh-CN', 'en-US'].includes(body.templates.language)) {
        return NextResponse.json<NotificationApiResponse>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '不支持的通知语言'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    // 更新通知设置
    const updatedSettings = await userSettingsService.updateNotificationSettings(user.id, body);

    return NextResponse.json<NotificationApiResponse>({
      success: true,
      data: { settings: updatedSettings },
      message: '通知设置更新成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('通知设置更新失败:', error);
    
    let status = 500;
    let errorCode = 'NOTIFICATION_SETTINGS_UPDATE_ERROR';
    
    if (error instanceof Error && error.message.includes('无效')) {
      status = 400;
      errorCode = 'VALIDATION_ERROR';
    }
    
    const errorMessage = error instanceof Error ? error.message : '通知设置更新失败';
    
    return NextResponse.json<NotificationApiResponse>({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status });
  }
}