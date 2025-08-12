import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, PieChart, TrendingUp, Calendar, Download, Filter, Clock, Target, CheckCircle, Users } from 'lucide-react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface StatisticsData {
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
  timeStats: {
    totalHours: number;
    averageDaily: number;
    mostProductiveHour: string;
    efficiency: number;
  };
  categoryStats: {
    name: string;
    hours: number;
    tasks: number;
    percentage: number;
  }[];
  weeklyData: {
    day: string;
    hours: number;
    tasks: number;
  }[];
  monthlyTrend: {
    month: string;
    completed: number;
    created: number;
  }[];
}

const StatisticsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 获取任务统计数据
  const { data: taskStats, isLoading: taskStatsLoading } = useQuery({
    queryKey: ['taskStatistics', selectedPeriod, selectedCategory],
    queryFn: () => api.getTaskStatistics({ 
      period: selectedPeriod,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined
    }),
  });

  // 获取时间统计数据
  const { data: timeStats, isLoading: timeStatsLoading } = useQuery({
    queryKey: ['timeStatistics', selectedPeriod, selectedCategory],
    queryFn: () => api.getTimeStatistics({ 
      period: selectedPeriod,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined
    }),
  });

  // 获取效率统计数据
  const { data: efficiencyStats, isLoading: efficiencyStatsLoading } = useQuery({
    queryKey: ['efficiencyStatistics', selectedPeriod, selectedCategory],
    queryFn: () => api.getEfficiencyStatistics({ 
      period: selectedPeriod,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined
    }),
  });

  // 获取趋势统计数据
  const { data: trendStats, isLoading: trendStatsLoading } = useQuery({
    queryKey: ['trendStatistics', selectedPeriod, selectedCategory],
    queryFn: () => api.getTrendStatistics({ 
      period: selectedPeriod,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined
    }),
  });

  const isLoading = taskStatsLoading || timeStatsLoading || efficiencyStatsLoading || trendStatsLoading;

  // 如果数据还在加载中，显示加载状态
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 转换后端数据格式以匹配前端期望的格式
  const statisticsData: StatisticsData = {
    taskStats: {
      total: taskStats?.total || 0,
      completed: taskStats?.completed || 0,
      inProgress: taskStats?.statusStats?.find((s: any) => s.status === 'in_progress')?.count || 0,
      pending: taskStats?.statusStats?.find((s: any) => s.status === 'pending')?.count || 0
    },
    timeStats: {
      totalHours: timeStats?.totalDuration ? Math.round((timeStats.totalDuration / 60) * 100) / 100 : 0,
      averageDaily: timeStats?.avgDuration ? Math.round((timeStats.avgDuration / 60) * 100) / 100 : 0,
      mostProductiveHour: efficiencyStats?.hourlyDistribution?.reduce((max: any, current: any) => 
        current.total_duration > (max?.total_duration || 0) ? current : max
      )?.hour ? `${efficiencyStats.hourlyDistribution.reduce((max: any, current: any) => 
        current.total_duration > (max?.total_duration || 0) ? current : max
      ).hour}:00-${efficiencyStats.hourlyDistribution.reduce((max: any, current: any) => 
        current.total_duration > (max?.total_duration || 0) ? current : max
      ).hour + 1}:00` : '10:00-11:00',
      efficiency: efficiencyStats?.taskCompletionRate || 0
    },
    categoryStats: timeStats?.categoryStats?.map((cat: any) => ({
      name: cat.name,
      hours: Math.round((cat.total_duration / 60) * 100) / 100,
      tasks: cat.count,
      percentage: timeStats.totalDuration > 0 ? 
        Math.round((cat.total_duration / timeStats.totalDuration) * 10000) / 100 : 0
    })) || [],
    weeklyData: timeStats?.dailyStats?.map((day: any) => ({
      day: new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' }),
      hours: Math.round((day.total_duration / 60) * 100) / 100,
      tasks: day.count
    })) || [],
    monthlyTrend: trendStats?.taskTrends?.map((trend: any) => ({
      month: new Date(trend.period).toLocaleDateString('zh-CN', { month: 'short' }),
      completed: trend.completed_count,
      created: trend.created_count
    })) || []
  };

  const getCompletionRate = () => {
    const { completed, total } = statisticsData.taskStats;
    return Math.round((completed / total) * 100);
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'text-green-600';
    if (efficiency >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-indigo-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">统计分析</h1>
          <p className="text-gray-600 mt-1">查看您的工作效率和任务完成情况</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="quarter">本季度</option>
            <option value="year">本年</option>
          </select>
          <button className="btn-secondary flex items-center">
            <Download className="w-4 h-4 mr-2" />
            导出报告
          </button>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    任务完成率
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {getCompletionRate()}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    总工作时长
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {statisticsData.timeStats.totalHours}h
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    工作效率
                  </dt>
                  <dd className={`text-2xl font-semibold ${getEfficiencyColor(statisticsData.timeStats.efficiency)}`}>
                    {statisticsData.timeStats.efficiency}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    日均工作时长
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {statisticsData.timeStats.averageDaily}h
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 任务状态分布 */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">任务状态分布</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">已完成</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900 mr-2">
                  {statisticsData.taskStats.completed}
                </span>
                <span className="text-xs text-gray-500">
                  ({Math.round((statisticsData.taskStats.completed / statisticsData.taskStats.total) * 100)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">进行中</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900 mr-2">
                  {statisticsData.taskStats.inProgress}
                </span>
                <span className="text-xs text-gray-500">
                  ({Math.round((statisticsData.taskStats.inProgress / statisticsData.taskStats.total) * 100)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">待开始</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900 mr-2">
                  {statisticsData.taskStats.pending}
                </span>
                <span className="text-xs text-gray-500">
                  ({Math.round((statisticsData.taskStats.pending / statisticsData.taskStats.total) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 分类时间分布 */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">分类时间分布</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {statisticsData.categoryStats.map((category, index) => (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  <span className="text-sm text-gray-600">{category.hours}h ({category.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getCategoryColor(index)}`}
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 周工作量趋势 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">周工作量趋势</h3>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-7 gap-4">
          {statisticsData.weeklyData.map((day, index) => (
            <div key={day.day} className="text-center">
              <div className="text-xs text-gray-500 mb-2">{day.day}</div>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-20 flex items-end justify-center">
                  <div
                    className="bg-blue-500 rounded-full w-full transition-all duration-300"
                    style={{ height: `${(day.hours / 10) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs font-medium text-gray-900 mt-1">{day.hours}h</div>
                <div className="text-xs text-gray-500">{day.tasks}个任务</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 月度趋势 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">月度任务趋势</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-500">月份</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">创建任务</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">完成任务</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">完成率</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">趋势</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {statisticsData.monthlyTrend.map((month, index) => {
                const completionRate = Math.round((month.completed / month.created) * 100);
                const prevRate = index > 0 ? Math.round((statisticsData.monthlyTrend[index - 1].completed / statisticsData.monthlyTrend[index - 1].created) * 100) : 0;
                const trend = index > 0 ? completionRate - prevRate : 0;
                
                return (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="py-3 text-sm font-medium text-gray-900">{month.month}</td>
                    <td className="py-3 text-sm text-gray-600">{month.created}</td>
                    <td className="py-3 text-sm text-gray-600">{month.completed}</td>
                    <td className="py-3 text-sm text-gray-600">{completionRate}%</td>
                    <td className="py-3 text-sm">
                      {trend > 0 ? (
                        <span className="text-green-600 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          +{trend}%
                        </span>
                      ) : trend < 0 ? (
                        <span className="text-red-600 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1 transform rotate-180" />
                          {trend}%
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 效率分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">效率分析</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">最高效时段</span>
              <span className="text-sm font-medium text-gray-900">
                {statisticsData.timeStats.mostProductiveHour}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">平均任务完成时间</span>
              <span className="text-sm font-medium text-gray-900">2.3小时</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">任务延期率</span>
              <span className="text-sm font-medium text-red-600">12%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">工作专注度</span>
              <span className="text-sm font-medium text-green-600">89%</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">改进建议</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                建议在10-11点安排重要任务，这是您效率最高的时段
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                开发类任务占比较高，可以考虑优化开发流程提升效率
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                会议时间较多，建议优化会议效率或减少不必要的会议
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                任务延期率偏高，建议合理评估任务时间并设置缓冲时间
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;