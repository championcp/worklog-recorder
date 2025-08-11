import Database from 'better-sqlite3';
import path from 'path';

export interface UserSettings {
  theme_mode: 'light' | 'dark' | 'auto';
  primary_color: string;
  font_size: 'small' | 'normal' | 'large' | 'xlarge';
  density: 'compact' | 'normal' | 'spacious';
  language: 'zh-CN' | 'en-US';
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
  default_view: string;
  page_size: number;
  auto_save_interval: number;
  sidebar_collapsed: boolean;
  enabled_modules: string[];
  shortcuts: Record<string, string>;
  dashboard_layout: object;
}

export interface NotificationSettings {
  channels: {
    in_app: boolean;
    email: boolean;
    browser: boolean;
    mobile?: boolean;
  };
  categories: {
    tasks: {
      enabled: boolean;
      channels: string[];
      frequency: 'immediate' | 'digest' | 'batch';
    };
    projects: {
      enabled: boolean;
      channels: string[];
      frequency: 'immediate' | 'digest' | 'batch';
    };
    team: {
      enabled: boolean;
      channels: string[];
      frequency: 'immediate' | 'digest' | 'batch';
    };
    system: {
      enabled: boolean;
      channels: string[];
      frequency: 'immediate' | 'digest' | 'batch';
    };
  };
  schedule: {
    work_hours: {
      start: string;
      end: string;
      timezone: string;
    };
    quiet_hours: {
      start: string;
      end: string;
    };
    weekend_mode: boolean;
    holiday_mode: boolean;
  };
  templates: {
    email_format: 'simple' | 'detailed' | 'digest';
    language: string;
    include_personalization: boolean;
  };
}

export interface ExportConfig {
  format: 'json' | 'csv' | 'excel';
  scope: {
    data_types: string[];
    date_range?: {
      start: string;
      end: string;
    };
    project_ids?: number[];
    include_deleted: boolean;
  };
  options: {
    include_sensitive: boolean;
    encrypt: boolean;
    password?: string;
    compression: boolean;
  };
}

export interface ImportConfig {
  format: 'json' | 'csv';
  validation: {
    strict_mode: boolean;
    skip_errors: boolean;
  };
  conflict_resolution: {
    duplicate_handling: 'skip' | 'overwrite' | 'merge';
  };
}

export class UserSettingsService {
  private db: Database.Database;
  
  constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'nobody-logger.db');
    this.db = new Database(dbPath);
  }

  /**
   * 获取用户的所有设置
   */
  async getUserSettings(userId: number): Promise<UserSettings> {
    const query = `
      SELECT setting_key, setting_value, setting_type 
      FROM user_settings 
      WHERE user_id = ?
    `;
    
    const rows = this.db.prepare(query).all(userId) as Array<{
      setting_key: string;
      setting_value: string;
      setting_type: string;
    }>;
    
    // 默认设置
    const defaultSettings: UserSettings = {
      theme_mode: 'light',
      primary_color: '#1976d2',
      font_size: 'normal',
      density: 'normal',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      date_format: 'YYYY-MM-DD',
      time_format: '24h',
      default_view: 'dashboard',
      page_size: 20,
      auto_save_interval: 30,
      sidebar_collapsed: false,
      enabled_modules: ['tasks', 'projects', 'time_logs', 'reports'],
      shortcuts: {},
      dashboard_layout: {}
    };

    // 合并用户设置
    const userSettings: any = { ...defaultSettings };
    
    rows.forEach(row => {
      const key = row.setting_key;
      let value: any = row.setting_value;
      
      // 根据类型转换值
      switch (row.setting_type) {
        case 'boolean':
          value = value === 'true' || value === '1';
          break;
        case 'number':
          value = parseInt(value) || 0;
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch {
            value = {};
          }
          break;
        default:
          // string 类型保持原样
          break;
      }
      
      userSettings[key] = value;
    });

    return userSettings;
  }

  /**
   * 更新用户设置
   */
  async updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings> {
    const transaction = this.db.transaction(() => {
      Object.entries(settings).forEach(([key, value]) => {
        if (value === undefined) return;
        
        let settingValue: string;
        let settingType: string;
        
        if (typeof value === 'boolean') {
          settingValue = value ? '1' : '0';
          settingType = 'boolean';
        } else if (typeof value === 'number') {
          settingValue = value.toString();
          settingType = 'number';
        } else if (typeof value === 'object') {
          settingValue = JSON.stringify(value);
          settingType = 'json';
        } else {
          settingValue = String(value);
          settingType = 'string';
        }
        
        const upsertQuery = `
          INSERT INTO user_settings (user_id, setting_key, setting_value, setting_type)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id, setting_key) 
          DO UPDATE SET 
            setting_value = excluded.setting_value,
            setting_type = excluded.setting_type,
            updated_at = CURRENT_TIMESTAMP
        `;
        
        this.db.prepare(upsertQuery).run(userId, key, settingValue, settingType);
      });
    });

    transaction();
    
    return this.getUserSettings(userId);
  }

  /**
   * 获取用户通知设置
   */
  async getNotificationSettings(userId: number): Promise<NotificationSettings> {
    const query = `
      SELECT channel_type, category, enabled, frequency, 
             work_hours_start, work_hours_end, quiet_hours_start, quiet_hours_end,
             weekend_mode, holiday_mode
      FROM user_notification_settings 
      WHERE user_id = ?
    `;
    
    const rows = this.db.prepare(query).all(userId) as Array<{
      channel_type: string;
      category: string;
      enabled: number;
      frequency: string;
      work_hours_start: string;
      work_hours_end: string;
      quiet_hours_start: string;
      quiet_hours_end: string;
      weekend_mode: number;
      holiday_mode: number;
    }>;

    // 默认通知设置
    const defaultSettings: NotificationSettings = {
      channels: {
        in_app: true,
        email: true,
        browser: false,
        mobile: false
      },
      categories: {
        tasks: { enabled: true, channels: ['in_app'], frequency: 'immediate' },
        projects: { enabled: true, channels: ['in_app', 'email'], frequency: 'digest' },
        team: { enabled: true, channels: ['in_app'], frequency: 'immediate' },
        system: { enabled: true, channels: ['in_app', 'email'], frequency: 'immediate' }
      },
      schedule: {
        work_hours: { start: '09:00', end: '18:00', timezone: 'Asia/Shanghai' },
        quiet_hours: { start: '22:00', end: '08:00' },
        weekend_mode: false,
        holiday_mode: false
      },
      templates: {
        email_format: 'detailed',
        language: 'zh-CN',
        include_personalization: true
      }
    };

    // 如果没有设置，返回默认值
    if (rows.length === 0) {
      return defaultSettings;
    }

    // 合并用户设置
    const settings = { ...defaultSettings };
    
    // 处理通道和分类设置
    const channelSettings = new Map<string, boolean>();
    const categorySettings = new Map<string, any>();
    
    rows.forEach(row => {
      channelSettings.set(row.channel_type, Boolean(row.enabled));
      
      const categoryKey = `${row.category}`;
      if (!categorySettings.has(categoryKey)) {
        categorySettings.set(categoryKey, {
          enabled: Boolean(row.enabled),
          channels: [],
          frequency: row.frequency || 'immediate'
        });
      }
      
      if (row.enabled) {
        const categoryData = categorySettings.get(categoryKey);
        if (!categoryData.channels.includes(row.channel_type)) {
          categoryData.channels.push(row.channel_type);
        }
      }
      
      // 更新时间设置（从第一行获取）
      if (row.work_hours_start) {
        settings.schedule.work_hours.start = row.work_hours_start;
        settings.schedule.work_hours.end = row.work_hours_end;
        settings.schedule.quiet_hours.start = row.quiet_hours_start;
        settings.schedule.quiet_hours.end = row.quiet_hours_end;
        settings.schedule.weekend_mode = Boolean(row.weekend_mode);
        settings.schedule.holiday_mode = Boolean(row.holiday_mode);
      }
    });

    // 应用设置
    settings.channels = {
      in_app: channelSettings.get('in_app') ?? true,
      email: channelSettings.get('email') ?? true,
      browser: channelSettings.get('browser') ?? false,
      mobile: channelSettings.get('mobile') ?? false
    };

    ['tasks', 'projects', 'team', 'system'].forEach(category => {
      const categoryData = categorySettings.get(category);
      if (categoryData) {
        (settings.categories as any)[category] = categoryData;
      }
    });

    return settings;
  }

  /**
   * 更新用户通知设置
   */
  async updateNotificationSettings(userId: number, settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const transaction = this.db.transaction(() => {
      // 删除现有设置
      const deleteQuery = `DELETE FROM user_notification_settings WHERE user_id = ?`;
      this.db.prepare(deleteQuery).run(userId);

      // 获取完整设置（合并默认值）
      const currentSettings = this.getNotificationSettings(userId);
      const mergedSettings = { ...currentSettings, ...settings };

      // 插入新设置
      const insertQuery = `
        INSERT INTO user_notification_settings (
          user_id, channel_type, category, enabled, frequency,
          work_hours_start, work_hours_end, quiet_hours_start, quiet_hours_end,
          weekend_mode, holiday_mode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const stmt = this.db.prepare(insertQuery);
      
      // 为每个通道和分类组合创建记录
      Object.entries(mergedSettings.channels || {}).forEach(([channelType, enabled]) => {
        Object.entries(mergedSettings.categories || {}).forEach(([category, categorySettings]) => {
          const isChannelEnabledForCategory = enabled && 
            categorySettings.enabled && 
            categorySettings.channels.includes(channelType);

          stmt.run(
            userId,
            channelType,
            category,
            isChannelEnabledForCategory ? 1 : 0,
            categorySettings.frequency,
            mergedSettings.schedule?.work_hours?.start || '09:00',
            mergedSettings.schedule?.work_hours?.end || '18:00',
            mergedSettings.schedule?.quiet_hours?.start || '22:00',
            mergedSettings.schedule?.quiet_hours?.end || '08:00',
            mergedSettings.schedule?.weekend_mode ? 1 : 0,
            mergedSettings.schedule?.holiday_mode ? 1 : 0
          );
        });
      });
    });

    transaction();
    
    return this.getNotificationSettings(userId);
  }

  /**
   * 导出用户数据
   */
  async exportUserData(userId: number, config: ExportConfig): Promise<string> {
    const { format, scope, options } = config;
    
    // 收集要导出的数据
    const exportData: any = {
      export_info: {
        user_id: userId,
        export_date: new Date().toISOString(),
        format,
        version: '1.0'
      },
      data: {}
    };

    // 导出项目数据
    if (scope.data_types.includes('projects')) {
      let projectQuery = `
        SELECT * FROM projects 
        WHERE user_id = ? AND is_deleted = 0
      `;
      const projectParams: any[] = [userId];

      if (scope.date_range) {
        projectQuery += ` AND created_at >= ? AND created_at <= ?`;
        projectParams.push(scope.date_range.start, scope.date_range.end);
      }

      if (scope.project_ids && scope.project_ids.length > 0) {
        projectQuery += ` AND id IN (${scope.project_ids.map(() => '?').join(',')})`;
        projectParams.push(...scope.project_ids);
      }

      exportData.data.projects = this.db.prepare(projectQuery).all(...projectParams);
    }

    // 导出任务数据
    if (scope.data_types.includes('tasks')) {
      let taskQuery = `
        SELECT wt.* FROM wbs_tasks wt
        INNER JOIN projects p ON wt.project_id = p.id
        WHERE p.user_id = ? AND wt.is_deleted = 0
      `;
      const taskParams: any[] = [userId];

      if (scope.date_range) {
        taskQuery += ` AND wt.created_at >= ? AND wt.created_at <= ?`;
        taskParams.push(scope.date_range.start, scope.date_range.end);
      }

      if (scope.project_ids && scope.project_ids.length > 0) {
        taskQuery += ` AND p.id IN (${scope.project_ids.map(() => '?').join(',')})`;
        taskParams.push(...scope.project_ids);
      }

      exportData.data.tasks = this.db.prepare(taskQuery).all(...taskParams);
    }

    // 导出时间记录
    if (scope.data_types.includes('time_logs')) {
      let timeLogQuery = `
        SELECT tl.* FROM time_logs tl
        INNER JOIN wbs_tasks wt ON tl.task_id = wt.id
        INNER JOIN projects p ON wt.project_id = p.id
        WHERE p.user_id = ? AND tl.is_deleted = 0
      `;
      const timeLogParams: any[] = [userId];

      if (scope.date_range) {
        timeLogQuery += ` AND tl.created_at >= ? AND tl.created_at <= ?`;
        timeLogParams.push(scope.date_range.start, scope.date_range.end);
      }

      exportData.data.time_logs = this.db.prepare(timeLogQuery).all(...timeLogParams);
    }

    // 导出分类和标签
    if (scope.data_types.includes('categories')) {
      exportData.data.categories = this.db.prepare(`
        SELECT * FROM categories WHERE user_id = ? AND is_deleted = 0
      `).all(userId);
    }

    if (scope.data_types.includes('tags')) {
      exportData.data.tags = this.db.prepare(`
        SELECT * FROM tags WHERE user_id = ? AND is_deleted = 0
      `).all(userId);
    }

    // 导出用户设置（如果不包含敏感信息）
    if (scope.data_types.includes('settings') && !options.include_sensitive) {
      exportData.data.settings = await this.getUserSettings(userId);
      exportData.data.notification_settings = await this.getNotificationSettings(userId);
    }

    // 根据格式生成导出内容
    let exportContent: string;

    switch (format) {
      case 'json':
        exportContent = JSON.stringify(exportData, null, 2);
        break;
      case 'csv':
        // 简化的CSV导出（仅支持平铺数据）
        exportContent = this.convertToCSV(exportData.data);
        break;
      default:
        throw new Error('不支持的导出格式');
    }

    // 如果需要加密
    if (options.encrypt && options.password) {
      // 这里应该实现加密逻辑
      // 为了简化，暂时跳过加密
    }

    return exportContent;
  }

  /**
   * 导入用户数据
   */
  async importUserData(userId: number, data: string, config: ImportConfig): Promise<{
    success: boolean;
    imported_count: number;
    skipped_count: number;
    error_count: number;
    errors: string[];
  }> {
    const result = {
      success: true,
      imported_count: 0,
      skipped_count: 0,
      error_count: 0,
      errors: [] as string[]
    };

    try {
      let importData: any;
      
      // 解析导入数据
      if (config.format === 'json') {
        importData = JSON.parse(data);
      } else {
        throw new Error('暂不支持CSV格式导入');
      }

      // 验证数据格式
      if (!importData.data) {
        throw new Error('无效的导入数据格式');
      }

      const transaction = this.db.transaction(() => {
        // 导入项目
        if (importData.data.projects) {
          for (const project of importData.data.projects) {
            try {
              // 检查是否存在重复项目
              const existing = this.db.prepare(`
                SELECT id FROM projects WHERE user_id = ? AND name = ?
              `).get(userId, project.name);

              if (existing && config.conflict_resolution.duplicate_handling === 'skip') {
                result.skipped_count++;
                continue;
              }

              // 插入或更新项目
              const insertQuery = `
                INSERT INTO projects (user_id, name, description, color)
                VALUES (?, ?, ?, ?)
              `;
              
              this.db.prepare(insertQuery).run(
                userId,
                project.name,
                project.description,
                project.color
              );
              
              result.imported_count++;
            } catch (error) {
              result.error_count++;
              result.errors.push(`导入项目失败: ${project.name} - ${error}`);
              
              if (config.validation.strict_mode) {
                throw error;
              }
            }
          }
        }

        // 可以继续添加其他数据类型的导入逻辑
      });

      transaction();

    } catch (error) {
      result.success = false;
      result.errors.push(`导入失败: ${error}`);
    }

    return result;
  }

  /**
   * 重置用户设置为默认值
   */
  async resetUserSettings(userId: number, settingKeys?: string[]): Promise<UserSettings> {
    const transaction = this.db.transaction(() => {
      if (settingKeys && settingKeys.length > 0) {
        // 删除指定设置
        const deleteQuery = `
          DELETE FROM user_settings 
          WHERE user_id = ? AND setting_key IN (${settingKeys.map(() => '?').join(',')})
        `;
        this.db.prepare(deleteQuery).run(userId, ...settingKeys);
      } else {
        // 删除所有设置
        const deleteQuery = `DELETE FROM user_settings WHERE user_id = ?`;
        this.db.prepare(deleteQuery).run(userId);
      }
    });

    transaction();
    
    return this.getUserSettings(userId);
  }

  /**
   * 转换为CSV格式（简化版本）
   */
  private convertToCSV(data: any): string {
    // 这里实现简单的CSV转换逻辑
    // 实际应用中需要更复杂的处理
    const lines = ['数据类型,数量'];
    
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        lines.push(`${key},${value.length}`);
      }
    });
    
    return lines.join('\n');
  }
}