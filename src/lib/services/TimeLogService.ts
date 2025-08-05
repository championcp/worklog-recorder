import { getDatabase } from '../db/client';
import type { TimeLog, CreateTimeLogInput, UpdateTimeLogInput } from '@/types/project';

export class TimeLogService {
  private db = getDatabase();

  // 创建时间记录
  async createTimeLog(userId: number, input: CreateTimeLogInput): Promise<TimeLog> {
    const { 
      task_id, 
      description, 
      start_time, 
      end_time, 
      is_manual = true 
    } = input;

    // 验证任务存在且用户有权限
    const taskCheck = this.db.prepare(`
      SELECT t.id, t.project_id, p.user_id 
      FROM wbs_tasks t 
      JOIN projects p ON t.project_id = p.id 
      WHERE t.id = ? AND t.is_deleted = 0 AND p.is_deleted = 0
    `).get(task_id) as { id: number; project_id: number; user_id: number } | undefined;

    if (!taskCheck || taskCheck.user_id !== userId) {
      throw new Error('任务不存在或没有权限');
    }

    // 计算持续时间（如果有结束时间）
    let duration_seconds: number | null = null;
    if (end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      
      if (end <= start) {
        throw new Error('结束时间必须晚于开始时间');
      }
      
      duration_seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    }

    // 获取日志日期（基于开始时间）
    const log_date = new Date(start_time).toISOString().split('T')[0];

    // 插入时间记录
    const stmt = this.db.prepare(`
      INSERT INTO time_logs (
        user_id, task_id, description, start_time, end_time, 
        duration_seconds, is_manual, log_date, created_at, updated_at, sync_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 1)
    `);

    const result = stmt.run(
      userId, task_id, description, start_time, end_time,
      duration_seconds, is_manual ? 1 : 0, log_date
    );

    const timeLogId = result.lastInsertRowid as number;

    // 如果有持续时间，更新任务的实际工时
    if (duration_seconds) {
      await this.updateTaskActualHours(task_id, duration_seconds);
    }

    return this.findTimeLogById(timeLogId)!;
  }

  // 根据ID查找时间记录
  findTimeLogById(timeLogId: number): TimeLog | null {
    const stmt = this.db.prepare(`
      SELECT * FROM time_logs WHERE id = ? AND is_deleted = 0
    `);
    return stmt.get(timeLogId) as TimeLog | null;
  }

  // 获取用户的时间记录列表
  findUserTimeLogs(
    userId: number, 
    options: {
      taskId?: number;
      projectId?: number;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): TimeLog[] {
    let query = `
      SELECT tl.*, t.name as task_name, t.wbs_code, p.name as project_name, p.color as project_color
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE tl.user_id = ? AND tl.is_deleted = 0 AND t.is_deleted = 0 AND p.is_deleted = 0
    `;
    
    const params: any[] = [userId];

    if (options.taskId) {
      query += ` AND tl.task_id = ?`;
      params.push(options.taskId);
    }

    if (options.projectId) {
      query += ` AND t.project_id = ?`;
      params.push(options.projectId);
    }

    if (options.startDate) {
      query += ` AND tl.log_date >= ?`;
      params.push(options.startDate);
    }

    if (options.endDate) {
      query += ` AND tl.log_date <= ?`;
      params.push(options.endDate);
    }

    query += ` ORDER BY tl.start_time DESC`;

    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
      
      if (options.offset) {
        query += ` OFFSET ?`;
        params.push(options.offset);
      }
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as TimeLog[];
  }

  // 更新时间记录
  async updateTimeLog(userId: number, timeLogId: number, input: UpdateTimeLogInput): Promise<TimeLog> {
    // 验证时间记录存在和权限
    const timeLog = this.db.prepare(`
      SELECT tl.*, t.project_id, p.user_id 
      FROM time_logs tl 
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE tl.id = ? AND tl.is_deleted = 0 AND t.is_deleted = 0 AND p.is_deleted = 0
    `).get(timeLogId) as (TimeLog & { user_id: number }) | undefined;

    if (!timeLog || timeLog.user_id !== userId) {
      throw new Error('时间记录不存在或没有权限');
    }

    const { description, start_time, end_time } = input;

    // 构建更新语句
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (start_time !== undefined) {
      updateFields.push('start_time = ?');
      updateValues.push(start_time);
      
      // 更新日志日期
      const log_date = new Date(start_time).toISOString().split('T')[0];
      updateFields.push('log_date = ?');
      updateValues.push(log_date);
    }

    if (end_time !== undefined) {
      updateFields.push('end_time = ?');
      updateValues.push(end_time);
    }

    // 重新计算持续时间
    const finalStartTime = start_time || timeLog.start_time;
    const finalEndTime = end_time !== undefined ? end_time : timeLog.end_time;

    let duration_seconds: number | null = null;
    if (finalEndTime) {
      const start = new Date(finalStartTime);
      const end = new Date(finalEndTime);
      
      if (end <= start) {
        throw new Error('结束时间必须晚于开始时间');
      }
      
      duration_seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
      updateFields.push('duration_seconds = ?');
      updateValues.push(duration_seconds);
    }

    if (updateFields.length === 0) {
      return this.findTimeLogById(timeLogId)!;
    }

    // 添加更新时间和同步版本
    updateFields.push('updated_at = ?', 'sync_version = sync_version + 1');
    updateValues.push(new Date().toISOString());
    updateValues.push(timeLogId);

    const stmt = this.db.prepare(`
      UPDATE time_logs 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `);

    stmt.run(...updateValues);

    // 更新任务的实际工时
    if (duration_seconds !== null) {
      await this.recalculateTaskActualHours(timeLog.task_id);
    }

    return this.findTimeLogById(timeLogId)!;
  }

  // 删除时间记录
  async deleteTimeLog(userId: number, timeLogId: number): Promise<void> {
    // 验证时间记录存在和权限
    const timeLog = this.db.prepare(`
      SELECT tl.*, t.project_id, p.user_id 
      FROM time_logs tl 
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE tl.id = ? AND tl.is_deleted = 0 AND t.is_deleted = 0 AND p.is_deleted = 0
    `).get(timeLogId) as (TimeLog & { user_id: number }) | undefined;

    if (!timeLog || timeLog.user_id !== userId) {
      throw new Error('时间记录不存在或没有权限');
    }

    // 软删除时间记录
    const stmt = this.db.prepare(`
      UPDATE time_logs 
      SET is_deleted = 1, updated_at = ?, sync_version = sync_version + 1 
      WHERE id = ?
    `);

    stmt.run(new Date().toISOString(), timeLogId);

    // 重新计算任务的实际工时
    await this.recalculateTaskActualHours(timeLog.task_id);
  }

  // 开始计时（创建进行中的时间记录）
  async startTimer(userId: number, taskId: number, description?: string): Promise<TimeLog> {
    // 检查是否已有正在进行的计时
    const activeTimer = this.db.prepare(`
      SELECT tl.id 
      FROM time_logs tl 
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE tl.user_id = ? AND tl.end_time IS NULL AND tl.is_deleted = 0 
        AND t.is_deleted = 0 AND p.is_deleted = 0
    `).get(userId) as { id: number } | undefined;

    if (activeTimer) {
      throw new Error('已有正在进行的计时，请先停止当前计时');
    }

    return this.createTimeLog(userId, {
      task_id: taskId,
      description,
      start_time: new Date().toISOString(),
      is_manual: false
    });
  }

  // 停止计时
  async stopTimer(userId: number, timeLogId: number): Promise<TimeLog> {
    const endTime = new Date().toISOString();
    
    return this.updateTimeLog(userId, timeLogId, {
      end_time: endTime
    });
  }

  // 获取当前正在进行的计时
  getActiveTimer(userId: number): (TimeLog & { task_name: string; project_name: string; project_color: string }) | null {
    const stmt = this.db.prepare(`
      SELECT tl.*, t.name as task_name, t.wbs_code, p.name as project_name, p.color as project_color
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE tl.user_id = ? AND tl.end_time IS NULL AND tl.is_deleted = 0 
        AND t.is_deleted = 0 AND p.is_deleted = 0
      ORDER BY tl.start_time DESC
      LIMIT 1
    `);
    
    return stmt.get(userId) as any;
  }

  // 获取时间统计
  getTimeStats(
    userId: number, 
    options: {
      taskId?: number;
      projectId?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): {
    total_entries: number;
    total_hours: number;
    total_seconds: number;
    avg_session_hours: number;
    days_with_entries: number;
  } {
    let query = `
      SELECT 
        COUNT(*) as total_entries,
        SUM(COALESCE(duration_seconds, 0)) as total_seconds,
        AVG(COALESCE(duration_seconds, 0)) as avg_session_seconds,
        COUNT(DISTINCT log_date) as days_with_entries
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE tl.user_id = ? AND tl.is_deleted = 0 AND t.is_deleted = 0 AND p.is_deleted = 0
        AND tl.duration_seconds IS NOT NULL
    `;
    
    const params: any[] = [userId];

    if (options.taskId) {
      query += ` AND tl.task_id = ?`;
      params.push(options.taskId);
    }

    if (options.projectId) {
      query += ` AND t.project_id = ?`;
      params.push(options.projectId);
    }

    if (options.startDate) {
      query += ` AND tl.log_date >= ?`;
      params.push(options.startDate);
    }

    if (options.endDate) {
      query += ` AND tl.log_date <= ?`;
      params.push(options.endDate);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as {
      total_entries: number;
      total_seconds: number;
      avg_session_seconds: number;
      days_with_entries: number;
    } | undefined;

    if (!result) {
      return {
        total_entries: 0,
        total_hours: 0,
        total_seconds: 0,
        avg_session_hours: 0,
        days_with_entries: 0
      };
    }

    return {
      total_entries: result.total_entries || 0,
      total_hours: Math.round((result.total_seconds || 0) / 3600 * 100) / 100,
      total_seconds: result.total_seconds || 0,
      avg_session_hours: Math.round((result.avg_session_seconds || 0) / 3600 * 100) / 100,
      days_with_entries: result.days_with_entries || 0
    };
  }

  // 获取每日时间统计
  getDailyTimeStats(
    userId: number,
    options: {
      startDate?: string;
      endDate?: string;
      projectId?: number;
    } = {}
  ): Array<{
    date: string;
    total_hours: number;
    total_seconds: number;
    entry_count: number;
  }> {
    let query = `
      SELECT 
        tl.log_date as date,
        SUM(COALESCE(tl.duration_seconds, 0)) as total_seconds,
        COUNT(*) as entry_count
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE tl.user_id = ? AND tl.is_deleted = 0 AND t.is_deleted = 0 AND p.is_deleted = 0
        AND tl.duration_seconds IS NOT NULL
    `;
    
    const params: any[] = [userId];

    if (options.projectId) {
      query += ` AND t.project_id = ?`;
      params.push(options.projectId);
    }

    if (options.startDate) {
      query += ` AND tl.log_date >= ?`;
      params.push(options.startDate);
    }

    if (options.endDate) {
      query += ` AND tl.log_date <= ?`;
      params.push(options.endDate);
    }

    query += ` GROUP BY tl.log_date ORDER BY tl.log_date DESC`;

    const stmt = this.db.prepare(query);
    const results = stmt.all(...params) as Array<{
      date: string;
      total_seconds: number;
      entry_count: number;
    }>;

    return results.map(row => ({
      date: row.date,
      total_hours: Math.round(row.total_seconds / 3600 * 100) / 100,
      total_seconds: row.total_seconds,
      entry_count: row.entry_count
    }));
  }

  // 更新任务的实际工时（增量更新）
  private async updateTaskActualHours(taskId: number, additionalSeconds: number): Promise<void> {
    const additionalHours = additionalSeconds / 3600;
    
    const stmt = this.db.prepare(`
      UPDATE wbs_tasks 
      SET actual_hours = actual_hours + ?, updated_at = ?, sync_version = sync_version + 1
      WHERE id = ?
    `);
    
    stmt.run(additionalHours, new Date().toISOString(), taskId);
  }

  // 重新计算任务的实际工时（完全重新计算）
  private async recalculateTaskActualHours(taskId: number): Promise<void> {
    const totalSeconds = this.db.prepare(`
      SELECT SUM(COALESCE(duration_seconds, 0)) as total_seconds
      FROM time_logs 
      WHERE task_id = ? AND is_deleted = 0 AND duration_seconds IS NOT NULL
    `).get(taskId) as { total_seconds: number } | undefined;

    const totalHours = (totalSeconds?.total_seconds || 0) / 3600;
    
    const stmt = this.db.prepare(`
      UPDATE wbs_tasks 
      SET actual_hours = ?, updated_at = ?, sync_version = sync_version + 1
      WHERE id = ?
    `);
    
    stmt.run(totalHours, new Date().toISOString(), taskId);
  }
}