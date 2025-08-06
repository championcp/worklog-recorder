import { getDatabase } from '../db/client';
import type Database from 'better-sqlite3';
import { 
  DashboardData, 
  DashboardDataRequest, 
  TimeAnalysisData, 
  ProjectProgressData,
  ActivityData,
  TimeDistributionData,
  HeatmapPoint,
  TrendPoint,
  TimeInsights
} from '../../types/analytics';

export class AnalyticsService {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDatabase();
  }

  /**
   * 获取仪表板概览数据
   */
  async getDashboardData(params: DashboardDataRequest & { userId: number }): Promise<DashboardData> {
    const { userId, timeRange = 'month', startDate, endDate, projectIds } = params;
    
    // 构建时间范围条件
    const { start, end } = this.getTimeRange(timeRange, startDate, endDate);
    
    // 构建项目筛选条件
    const projectFilter = projectIds && projectIds.length > 0 
      ? `AND p.id IN (${projectIds.map(() => '?').join(',')})` 
      : '';
    
    const projectParams = projectIds && projectIds.length > 0 ? projectIds : [];

    // 获取概览统计数据
    const overview = await this.getOverviewStats(userId, start, end, projectFilter, projectParams);
    
    // 获取项目进度数据
    const projectProgress = await this.getProjectProgressData(userId, start, end, projectFilter, projectParams);
    
    // 获取最近活动
    const recentActivity = await this.getRecentActivity(userId, start, end, projectFilter, projectParams);
    
    // 获取时间分布数据
    const timeDistribution = await this.getTimeDistribution(userId, start, end, projectFilter, projectParams);

    return {
      overview,
      projectProgress,
      recentActivity,
      timeDistribution
    };
  }

  /**
   * 获取概览统计数据
   */
  private async getOverviewStats(
    userId: number, 
    start: string, 
    end: string, 
    projectFilter: string, 
    projectParams: number[]
  ) {
    // 项目统计
    const projectStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects
      FROM projects p
      WHERE p.user_id = ? ${projectFilter}
    `).get([userId, ...projectParams]) as any;

    // 任务统计
    const taskStats = this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(*) as total_tasks
      FROM wbs_tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = ? 
        AND t.is_deleted = 0
        AND t.created_at BETWEEN ? AND ?
        ${projectFilter}
    `).get([userId, start, end, ...projectParams]) as any;

    // 时间统计
    const timeStats = this.db.prepare(`
      SELECT 
        COALESCE(SUM(tl.duration_seconds), 0) / 3600.0 as total_hours
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = ? 
        AND tl.is_deleted = 0
        AND tl.start_time BETWEEN ? AND ?
        ${projectFilter}
    `, [userId, start, end, ...projectParams]);

    // 计算效率评分
    const efficiencyScore = await this.calculateEfficiencyScore(userId, start, end, projectFilter, projectParams);

    return {
      totalProjects: projectStats?.total_projects || 0,
      activeProjects: projectStats?.active_projects || 0,
      completedTasks: taskStats?.completed_tasks || 0,
      totalHours: Math.round((timeStats?.total_hours || 0) * 10) / 10,
      efficiencyScore
    };
  }

  /**
   * 获取项目进度数据
   */
  private async getProjectProgressData(
    userId: number, 
    start: string, 
    end: string, 
    projectFilter: string, 
    projectParams: number[]
  ): Promise<ProjectProgressData[]> {
    const sql = `
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.color,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.end_date < date('now') AND t.status != 'completed' THEN 1 END) as overdue_tasks,
        MIN(t.start_date) as earliest_start,
        MAX(t.end_date) as latest_end
      FROM projects p
      LEFT JOIN wbs_tasks t ON p.id = t.project_id AND t.is_deleted = 0
      WHERE p.user_id = ? ${projectFilter}
      GROUP BY p.id, p.name, p.color
      HAVING COUNT(t.id) > 0
      ORDER BY p.updated_at DESC
      LIMIT 10
    `;

    const results = this.db.prepare(sql, [userId, ...projectParams]);

    return results.map(row => {
      const progress = row.total_tasks > 0 ? (row.completed_tasks / row.total_tasks) * 100 : 0;
      const status = row.overdue_tasks > 0 ? 'delayed' : 
                    progress < 50 ? 'at_risk' : 'on_track';
      
      return {
        projectId: row.project_id,
        projectName: row.project_name,
        progress: Math.round(progress),
        status: status as 'on_track' | 'at_risk' | 'delayed',
        remainingTasks: row.total_tasks - row.completed_tasks,
        estimatedCompletion: row.latest_end || '',
        color: row.color || '#1976d2'
      };
    });
  }

  /**
   * 获取最近活动数据
   */
  private async getRecentActivity(
    userId: number, 
    start: string, 
    end: string, 
    projectFilter: string, 
    projectParams: number[]
  ): Promise<ActivityData[]> {
    const sql = `
      SELECT 
        'task_created' as type,
        '创建了任务 "' || t.name || '"' as title,
        t.description as description,
        t.created_at as timestamp,
        u.id as user_id,
        u.username,
        u.avatar_url as avatar
      FROM wbs_tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
        AND t.created_at BETWEEN ? AND ?
        AND t.is_deleted = 0
        ${projectFilter}
      
      UNION ALL
      
      SELECT 
        'time_logged' as type,
        '记录了 ' || printf('%.1f', tl.duration_seconds / 3600.0) || ' 小时工作时间' as title,
        tl.description as description,
        tl.start_time as timestamp,
        u.id as user_id,
        u.username,
        u.avatar_url as avatar
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
        AND tl.start_time BETWEEN ? AND ?
        AND tl.is_deleted = 0
        ${projectFilter}
      
      ORDER BY timestamp DESC
      LIMIT 20
    `;

    const results = this.db.prepare(sql, [
      userId, start, end, ...projectParams,
      userId, start, end, ...projectParams
    ]);

    return results.map((row, index) => ({
      id: index + 1,
      type: row.type,
      title: row.title,
      description: row.description || '',
      timestamp: row.timestamp,
      userId: row.user_id,
      username: row.username,
      avatar: row.avatar
    }));
  }

  /**
   * 获取时间分布数据
   */
  private async getTimeDistribution(
    userId: number, 
    start: string, 
    end: string, 
    projectFilter: string, 
    projectParams: number[]
  ): Promise<TimeDistributionData[]> {
    const sql = `
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.color,
        SUM(tl.duration_seconds) / 3600.0 as hours
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = ?
        AND tl.start_time BETWEEN ? AND ?
        AND tl.is_deleted = 0
        ${projectFilter}
      GROUP BY p.id, p.name, p.color
      HAVING hours > 0
      ORDER BY hours DESC
    `;

    const results = this.db.prepare(sql, [userId, start, end, ...projectParams]);
    const totalHours = results.reduce((sum, row) => sum + row.hours, 0);

    return results.map(row => ({
      projectId: row.project_id,
      projectName: row.project_name,
      hours: Math.round(row.hours * 10) / 10,
      percentage: totalHours > 0 ? Math.round((row.hours / totalHours) * 100) : 0,
      color: row.color || '#1976d2'
    }));
  }

  /**
   * 获取时间分析数据
   */
  async getTimeAnalysisData(params: {
    userId: number;
    type: 'heatmap' | 'trend' | 'distribution';
    timeRange: 'week' | 'month' | 'quarter' | 'custom';
    startDate?: string;
    endDate?: string;
    projectId?: number;
  }): Promise<TimeAnalysisData> {
    const { userId, type, timeRange, startDate, endDate, projectId } = params;
    const { start, end } = this.getTimeRange(timeRange, startDate, endDate);
    
    const projectFilter = projectId ? 'AND t.project_id = ?' : '';
    const projectParams = projectId ? [projectId] : [];

    let heatmapData: HeatmapPoint[] | undefined;
    let trendData: TrendPoint[] | undefined;
    
    if (type === 'heatmap') {
      heatmapData = await this.getHeatmapData(userId, start, end, projectFilter, projectParams);
    } else if (type === 'trend') {
      trendData = await this.getTrendData(userId, start, end, projectFilter, projectParams);
    }

    const insights = await this.getTimeInsights(userId, start, end, projectFilter, projectParams);

    return {
      type,
      heatmapData,
      trendData,
      insights
    };
  }

  /**
   * 获取热力图数据
   */
  private async getHeatmapData(
    userId: number, 
    start: string, 
    end: string, 
    projectFilter: string, 
    projectParams: number[]
  ): Promise<HeatmapPoint[]> {
    const sql = `
      SELECT 
        DATE(tl.start_time) as date,
        CAST(strftime('%H', tl.start_time) AS INTEGER) as hour,
        SUM(tl.duration_seconds) / 60 as minutes,
        COUNT(DISTINCT tl.task_id) as task_count
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = ?
        AND tl.start_time BETWEEN ? AND ?
        AND tl.is_deleted = 0
        ${projectFilter}
      GROUP BY DATE(tl.start_time), CAST(strftime('%H', tl.start_time) AS INTEGER)
      ORDER BY date, hour
    `;

    const results = this.db.prepare(sql, [userId, start, end, ...projectParams]);

    return results.map(row => ({
      date: row.date,
      hour: row.hour,
      value: Math.round(row.minutes),
      taskCount: row.task_count
    }));
  }

  /**
   * 获取趋势数据
   */
  private async getTrendData(
    userId: number, 
    start: string, 
    end: string, 
    projectFilter: string, 
    projectParams: number[]
  ): Promise<TrendPoint[]> {
    const sql = `
      SELECT 
        DATE(tl.start_time) as date,
        SUM(tl.duration_seconds) / 3600.0 as hours,
        COUNT(DISTINCT tl.task_id) as tasks,
        AVG(CASE 
          WHEN t.estimated_hours > 0 
          THEN (tl.duration_seconds / 3600.0) / t.estimated_hours 
          ELSE 1 
        END) * 100 as efficiency
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = ?
        AND tl.start_time BETWEEN ? AND ?
        AND tl.is_deleted = 0
        ${projectFilter}
      GROUP BY DATE(tl.start_time)
      ORDER BY date
    `;

    const results = this.db.prepare(sql, [userId, start, end, ...projectParams]);

    return results.map(row => ({
      date: row.date,
      hours: Math.round(row.hours * 10) / 10,
      tasks: row.tasks,
      efficiency: Math.min(Math.round(row.efficiency), 100)
    }));
  }

  /**
   * 获取时间洞察
   */
  private async getTimeInsights(
    userId: number, 
    start: string, 
    end: string, 
    projectFilter: string, 
    projectParams: number[]
  ): Promise<TimeInsights> {
    // 总工作时长
    const totalHours = this.db.prepare(`
      SELECT SUM(tl.duration_seconds) / 3600.0 as hours
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = ? AND tl.start_time BETWEEN ? AND ? ${projectFilter}
    `, [userId, start, end, ...projectParams]);

    // 工作天数
    const workDays = this.db.prepare(`
      SELECT COUNT(DISTINCT DATE(tl.start_time)) as days
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = ? AND tl.start_time BETWEEN ? AND ? ${projectFilter}
    `, [userId, start, end, ...projectParams]);

    // 高峰时段
    const peakHours = this.db.prepare(`
      SELECT 
        printf('%02d:00', CAST(strftime('%H', tl.start_time) AS INTEGER)) as hour,
        SUM(tl.duration_seconds) as total_seconds
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = ? AND tl.start_time BETWEEN ? AND ? ${projectFilter}
      GROUP BY CAST(strftime('%H', tl.start_time) AS INTEGER)
      ORDER BY total_seconds DESC
      LIMIT 3
    `, [userId, start, end, ...projectParams]);

    // 最高效的工作日
    const productiveDay = this.db.prepare(`
      SELECT 
        CASE CAST(strftime('%w', tl.start_time) AS INTEGER)
          WHEN 0 THEN 'Sunday'
          WHEN 1 THEN 'Monday'
          WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday'
          WHEN 4 THEN 'Thursday'
          WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday'
        END as day_name,
        SUM(tl.duration_seconds) as total_seconds
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = ? AND tl.start_time BETWEEN ? AND ? ${projectFilter}
      GROUP BY CAST(strftime('%w', tl.start_time) AS INTEGER)
      ORDER BY total_seconds DESC
      LIMIT 1
    `, [userId, start, end, ...projectParams]);

    const averageDailyHours = workDays?.days > 0 
      ? (totalHours?.hours || 0) / workDays.days 
      : 0;

    const efficiencyScore = await this.calculateEfficiencyScore(userId, start, end, projectFilter, projectParams);

    return {
      totalHours: Math.round((totalHours?.hours || 0) * 10) / 10,
      averageDailyHours: Math.round(averageDailyHours * 10) / 10,
      peakHours: peakHours.map(row => row.hour),
      mostProductiveDay: productiveDay?.day_name || 'Monday',
      efficiencyScore,
      recommendations: this.generateRecommendations(efficiencyScore, averageDailyHours, peakHours.length)
    };
  }

  /**
   * 计算效率评分
   */
  private async calculateEfficiencyScore(
    userId: number, 
    start: string, 
    end: string, 
    projectFilter: string, 
    projectParams: number[]
  ): Promise<number> {
    const result = this.db.prepare(`
      SELECT 
        AVG(CASE 
          WHEN t.estimated_hours > 0 
          THEN LEAST((tl.duration_seconds / 3600.0) / t.estimated_hours, 1.5) * 100
          ELSE 80 
        END) as avg_efficiency
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = ? 
        AND tl.start_time BETWEEN ? AND ? 
        AND t.estimated_hours > 0
        ${projectFilter}
    `, [userId, start, end, ...projectParams]);

    return Math.round(Math.min(result?.avg_efficiency || 75, 100));
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    efficiencyScore: number, 
    averageDailyHours: number, 
    peakHoursCount: number
  ): string[] {
    const recommendations: string[] = [];

    if (efficiencyScore < 60) {
      recommendations.push('考虑重新评估任务的时间预估，可能过于乐观');
    }

    if (averageDailyHours > 10) {
      recommendations.push('工作时间较长，建议适当休息以保持效率');
    } else if (averageDailyHours < 4) {
      recommendations.push('可以考虑增加每日工作时间以提高产出');
    }

    if (peakHoursCount < 2) {
      recommendations.push('尝试找到更多高效工作时段，合理安排重要任务');
    }

    if (recommendations.length === 0) {
      recommendations.push('保持当前的工作节奏，效率表现良好！');
    }

    return recommendations;
  }

  /**
   * 获取时间范围
   */
  private getTimeRange(
    timeRange: string, 
    startDate?: string, 
    endDate?: string
  ): { start: string; end: string } {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (timeRange) {
      case 'day':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start = new Date(now);
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start = new Date(now);
        start.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = endDate ? new Date(endDate) : now;
        break;
      default:
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }
}