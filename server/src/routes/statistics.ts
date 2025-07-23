import { Router, Response } from 'express';
import { db } from '../database/config';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();

// 获取任务统计
router.get('/tasks', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const categoryId = req.query.categoryId as string;

  let query = db('tasks').where('user_id', userId);
  
  if (startDate) {
    query = query.where('created_at', '>=', startDate);
  }
  
  if (endDate) {
    query = query.where('created_at', '<=', endDate);
  }
  
  if (categoryId) {
    query = query.where('category_id', categoryId);
  }

  // 总任务数
  const [totalResult] = await query.clone().count('* as total');
  const total = totalResult.total as number;

  // 按状态统计
  const statusStats = await query.clone()
    .groupBy('status')
    .select('status')
    .count('* as count');

  // 按优先级统计
  const priorityStats = await query.clone()
    .groupBy('priority')
    .select('priority')
    .count('* as count');

  // 按分类统计
  const categoryStats = await query.clone()
    .join('categories', 'tasks.category_id', 'categories.id')
    .groupBy('categories.id', 'categories.name')
    .select('categories.id', 'categories.name')
    .count('tasks.id as count');

  // 完成率
  const [completedResult] = await query.clone()
    .where('status', 'completed')
    .count('* as completed');
  const completed = completedResult.completed as number;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  // 逾期任务
  const [overdueResult] = await query.clone()
    .where('due_date', '<', new Date())
    .whereNot('status', 'completed')
    .count('* as overdue');
  const overdue = overdueResult.overdue as number;

  // 今日任务
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayResult] = await db('tasks')
    .where('user_id', userId)
    .where('due_date', '>=', today)
    .where('due_date', '<', tomorrow)
    .count('* as today');
  const todayTasks = todayResult.today as number;

  res.json({
    success: true,
    data: {
      total,
      completed,
      completionRate: Math.round(completionRate * 100) / 100,
      overdue,
      todayTasks,
      statusStats,
      priorityStats,
      categoryStats
    }
  });
}));

// 获取时间统计
router.get('/time', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const categoryId = req.query.categoryId as string;

  let query = db('time_logs').where('user_id', userId);
  
  if (startDate) {
    query = query.where('start_time', '>=', startDate);
  }
  
  if (endDate) {
    query = query.where('start_time', '<=', endDate);
  }
  
  if (categoryId) {
    query = query.where('category_id', categoryId);
  }

  // 总时长
  const [totalResult] = await query.clone().sum('duration as total_duration');
  const totalDuration = totalResult.total_duration || 0;

  // 总记录数
  const [countResult] = await query.clone().count('* as total_count');
  const totalCount = countResult.total_count as number;

  // 平均时长
  const [avgResult] = await query.clone().avg('duration as avg_duration');
  const avgDuration = avgResult.avg_duration || 0;

  // 按分类统计
  const categoryStats = await query.clone()
    .join('categories', 'time_logs.category_id', 'categories.id')
    .groupBy('categories.id', 'categories.name')
    .select('categories.id', 'categories.name')
    .sum('time_logs.duration as total_duration')
    .count('time_logs.id as count');

  // 按日期统计（最近7天）
  const dailyStats = await db.raw(`
    SELECT 
      DATE(start_time) as date,
      SUM(duration) as total_duration,
      COUNT(*) as count
    FROM time_logs 
    WHERE user_id = ? 
      AND start_time >= DATE('now', '-7 days')
      ${categoryId ? 'AND category_id = ?' : ''}
    GROUP BY DATE(start_time)
    ORDER BY date DESC
  `, categoryId ? [userId, categoryId] : [userId]);

  // 今日工作时长
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayResult] = await db('time_logs')
    .where('user_id', userId)
    .where('start_time', '>=', today)
    .where('start_time', '<', tomorrow)
    .sum('duration as today_duration');
  const todayDuration = todayResult.today_duration || 0;

  res.json({
    success: true,
    data: {
      totalDuration,
      totalCount,
      avgDuration: Math.round(avgDuration * 100) / 100,
      todayDuration,
      categoryStats,
      dailyStats
    }
  });
}));

// 获取效率统计
router.get('/efficiency', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  let taskQuery = db('tasks').where('user_id', userId);
  let timeQuery = db('time_logs').where('user_id', userId);
  
  if (startDate) {
    taskQuery = taskQuery.where('created_at', '>=', startDate);
    timeQuery = timeQuery.where('start_time', '>=', startDate);
  }
  
  if (endDate) {
    taskQuery = taskQuery.where('created_at', '<=', endDate);
    timeQuery = timeQuery.where('start_time', '<=', endDate);
  }

  // 任务完成效率
  const [totalTasksResult] = await taskQuery.clone().count('* as total');
  const totalTasks = totalTasksResult.total as number;

  const [completedTasksResult] = await taskQuery.clone()
    .where('status', 'completed')
    .count('* as completed');
  const completedTasks = completedTasksResult.completed as number;

  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // 时间利用效率
  const [totalTimeResult] = await timeQuery.clone().sum('duration as total_time');
  const totalTime = totalTimeResult.total_time || 0;

  // 计算工作日数（排除周末）
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  
  let workDays = 0;
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 排除周日(0)和周六(6)
      workDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  const avgDailyTime = workDays > 0 ? totalTime / workDays : 0;

  // 预估vs实际时间对比
  const taskTimeComparison = await taskQuery.clone()
    .whereNotNull('estimated_hours')
    .whereNotNull('actual_hours')
    .select('estimated_hours', 'actual_hours');

  let totalEstimated = 0;
  let totalActual = 0;
  taskTimeComparison.forEach(task => {
    totalEstimated += task.estimated_hours || 0;
    totalActual += task.actual_hours || 0;
  });

  const timeAccuracy = totalEstimated > 0 ? (1 - Math.abs(totalActual - totalEstimated) / totalEstimated) * 100 : 0;

  // 按小时统计工作分布
  const hourlyDistribution = await db.raw(`
    SELECT 
      CAST(strftime('%H', start_time) AS INTEGER) as hour,
      SUM(duration) as total_duration,
      COUNT(*) as count
    FROM time_logs 
    WHERE user_id = ? 
      ${startDate ? 'AND start_time >= ?' : ''}
      ${endDate ? 'AND start_time <= ?' : ''}
    GROUP BY CAST(strftime('%H', start_time) AS INTEGER)
    ORDER BY hour
  `, [userId, startDate, endDate].filter(Boolean));

  res.json({
    success: true,
    data: {
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
      totalTasks,
      completedTasks,
      totalTime,
      avgDailyTime: Math.round(avgDailyTime * 100) / 100,
      workDays,
      timeAccuracy: Math.round(timeAccuracy * 100) / 100,
      totalEstimated,
      totalActual,
      hourlyDistribution
    }
  });
}));

// 获取趋势统计
router.get('/trends', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const period = req.query.period as string || 'week'; // week, month, quarter, year
  const categoryId = req.query.categoryId as string;

  let dateFormat: string;
  let dateRange: string;
  
  switch (period) {
    case 'month':
      dateFormat = '%Y-%m-%d';
      dateRange = '-30 days';
      break;
    case 'quarter':
      dateFormat = '%Y-%W';
      dateRange = '-90 days';
      break;
    case 'year':
      dateFormat = '%Y-%m';
      dateRange = '-365 days';
      break;
    default:
      dateFormat = '%Y-%m-%d';
      dateRange = '-7 days';
  }

  // 任务创建趋势
  const taskTrends = await db.raw(`
    SELECT 
      strftime('${dateFormat}', created_at) as period,
      COUNT(*) as created_count,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
    FROM tasks 
    WHERE user_id = ? 
      AND created_at >= date('now', '${dateRange}')
      ${categoryId ? 'AND category_id = ?' : ''}
    GROUP BY strftime('${dateFormat}', created_at)
    ORDER BY period
  `, categoryId ? [userId, categoryId] : [userId]);

  // 时间记录趋势
  const timeTrends = await db.raw(`
    SELECT 
      strftime('${dateFormat}', start_time) as period,
      SUM(duration) as total_duration,
      COUNT(*) as log_count,
      AVG(duration) as avg_duration
    FROM time_logs 
    WHERE user_id = ? 
      AND start_time >= date('now', '${dateRange}')
      ${categoryId ? 'AND category_id = ?' : ''}
    GROUP BY strftime('${dateFormat}', start_time)
    ORDER BY period
  `, categoryId ? [userId, categoryId] : [userId]);

  // 效率趋势
  const efficiencyTrends = [];
  for (const taskTrend of taskTrends) {
    const timeTrend = timeTrends.find((t: any) => t.period === taskTrend.period);
    const createdCount = Number(taskTrend.created_count);
    const completedCount = Number(taskTrend.completed_count);
    const efficiency = createdCount > 0 ? 
      (completedCount / createdCount) * 100 : 0;
    
    efficiencyTrends.push({
      period: taskTrend.period,
      efficiency: Math.round(efficiency * 100) / 100,
      tasksCreated: createdCount,
      tasksCompleted: completedCount,
      timeSpent: timeTrend ? Number(timeTrend.total_duration) : 0
    });
  }

  res.json({
    success: true,
    data: {
      period,
      taskTrends,
      timeTrends,
      efficiencyTrends
    }
  });
}));

// 获取综合仪表盘数据
router.get('/dashboard', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 今日统计
  const [todayTasks] = await db('tasks')
    .where('user_id', userId)
    .where('due_date', '>=', today)
    .where('due_date', '<', tomorrow)
    .count('* as count');

  const [todayCompletedTasks] = await db('tasks')
    .where('user_id', userId)
    .where('status', 'completed')
    .where('updated_at', '>=', today)
    .count('* as count');

  const [todayTimeSpent] = await db('time_logs')
    .where('user_id', userId)
    .where('start_time', '>=', today)
    .where('start_time', '<', tomorrow)
    .sum('duration as total');

  // 本周统计
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  const [weekTasks] = await db('tasks')
    .where('user_id', userId)
    .where('created_at', '>=', weekStart)
    .count('* as count');

  const [weekCompletedTasks] = await db('tasks')
    .where('user_id', userId)
    .where('status', 'completed')
    .where('updated_at', '>=', weekStart)
    .count('* as count');

  const [weekTimeSpent] = await db('time_logs')
    .where('user_id', userId)
    .where('start_time', '>=', weekStart)
    .sum('duration as total');

  // 总体统计
  const [totalTasks] = await db('tasks')
    .where('user_id', userId)
    .count('* as count');

  const [totalCompletedTasks] = await db('tasks')
    .where('user_id', userId)
    .where('status', 'completed')
    .count('* as count');

  const [totalTimeSpent] = await db('time_logs')
    .where('user_id', userId)
    .sum('duration as total');

  // 逾期任务
  const [overdueTasks] = await db('tasks')
    .where('user_id', userId)
    .where('due_date', '<', today)
    .whereNot('status', 'completed')
    .count('* as count');

  // 正在进行的任务
  const [inProgressTasks] = await db('tasks')
    .where('user_id', userId)
    .where('status', 'in_progress')
    .count('* as count');

  // 最近活动
  const recentActivities = await db('tasks')
    .where('user_id', userId)
    .orderBy('updated_at', 'desc')
    .limit(5)
    .select('id', 'title', 'status', 'updated_at');

  res.json({
    success: true,
    data: {
      today: {
        tasks: Number(todayTasks.count),
        completedTasks: Number(todayCompletedTasks.count),
        timeSpent: Number(todayTimeSpent.total) || 0
      },
      week: {
        tasks: Number(weekTasks.count),
        completedTasks: Number(weekCompletedTasks.count),
        timeSpent: Number(weekTimeSpent.total) || 0
      },
      total: {
        tasks: Number(totalTasks.count),
        completedTasks: Number(totalCompletedTasks.count),
        timeSpent: Number(totalTimeSpent.total) || 0,
        completionRate: Number(totalTasks.count) > 0 ? 
          Math.round((Number(totalCompletedTasks.count) / Number(totalTasks.count)) * 10000) / 100 : 0
      },
      overdueTasks: Number(overdueTasks.count),
      inProgressTasks: Number(inProgressTasks.count),
      recentActivities
    }
  });
}));

export { router as statisticsRoutes };