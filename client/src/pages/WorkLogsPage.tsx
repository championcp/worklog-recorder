import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Timer, 
  Edit2,
  CheckCircle,
  Circle,
  AlertCircle
} from 'lucide-react';
import { Task } from '../types';
import { api } from '../services/api';
import { TimeLog } from '../types';

const WorkLogsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 获取选定日期的时间记录
  const { data: timeLogs, isLoading: timeLogsLoading } = useQuery({
    queryKey: ['timeLogs', selectedDate],
    queryFn: () => api.getTimeLogs({
      startDate: `${selectedDate}T00:00:00.000Z`,
      endDate: `${selectedDate}T23:59:59.999Z`
    }),
  });

  // 获取选定日期的任务
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', selectedDate],
    queryFn: () => api.getTasks({
      dueDate: selectedDate
    }),
  });

  // 创建时间记录的mutation
  const createTimeLogMutation = useMutation({
    mutationFn: (data: Partial<TimeLog>) => api.createTimeLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs', selectedDate] });
      setShowCreateModal(false);
    },
    onError: (error) => {
      console.error('创建时间记录失败:', error);
    }
  });

  // 更新时间记录的mutation
  const updateTimeLogMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeLog> }) => 
      api.updateTimeLog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs', selectedDate] });
    },
    onError: (error) => {
      console.error('更新时间记录失败:', error);
    }
  });

  const isLoading = timeLogsLoading || tasksLoading;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return '待开始';
      case 'in_progress':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return '未知';
    }
  };

  // 添加时间记录
  const handleAddTask = (data: any) => {
    const timeLogData: Partial<TimeLog> = {
      title: data.description, // 后端要求title字段
      description: data.description,
      taskId: data.taskId,
      duration: data.duration, // 已经转换为秒
      startTime: new Date(`${selectedDate}T09:00:00`),
      endTime: new Date(`${selectedDate}T${String(9 + (data.duration / 3600)).padStart(2, '0')}:00:00`),
      isRunning: false
    };

    createTimeLogMutation.mutate(timeLogData);
  };

  // 更新时间记录
  const updateTimeLog = (timeLogId: string, updates: Partial<TimeLog>) => {
    updateTimeLogMutation.mutate({ id: timeLogId, data: updates });
  };

  // 渲染时间记录卡片
  const renderTimeLogCard = (timeLog: TimeLog) => {
    const duration = Math.round((timeLog.duration || 0) / 60); // 转换为分钟
    
    return (
      <div key={timeLog.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">
              {timeLog.description}
            </h4>
            {timeLog.task && (
              <p className="text-sm text-gray-600 mb-2">
                关联任务: {timeLog.task.title}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {duration} 分钟
              </span>
              <span>
                {new Date(timeLog.startTime).toLocaleTimeString('zh-CN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} - {timeLog.endTime ? new Date(timeLog.endTime).toLocaleTimeString('zh-CN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : '进行中'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // TODO: 实现编辑时间记录功能
              }}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 加载状态
  if (timeLogsLoading || tasksLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 计算统计数据
  const calculateStats = () => {
    // 确保 timeLogs 和 tasks 都是数组格式
    const timeLogsArray = Array.isArray(timeLogs) ? timeLogs : [];
    const tasksArray = Array.isArray(tasks) ? tasks : [];
    
    const totalTimeSpent = timeLogsArray.reduce((sum, log) => sum + ((log.duration || 0) / 60), 0);
    const plannedTasksCount = timeLogsArray.filter(log => log.taskId).length;
    const unplannedTasksCount = timeLogsArray.filter(log => !log.taskId).length;
    const completedTasksCount = tasksArray.filter(task => task.status === 'completed').length;
    const totalTasksCount = tasksArray.length;
    const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
    
    return {
      totalTimeSpent: Math.round(totalTimeSpent),
      plannedTasksCount,
      unplannedTasksCount,
      completedTasksCount,
      totalTasksCount,
      completionRate
    };
  };

  const stats = calculateStats();

  const CreateTaskModal = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) => {
    const [description, setDescription] = useState('');
    const [taskId, setTaskId] = useState('');
    const [duration, setDuration] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!description.trim() || !duration) return;

      onSubmit({
        description: description.trim(),
        taskId: taskId || undefined,
        duration: parseFloat(duration) * 60, // 转换为秒
      });

      // 重置表单
      setDescription('');
      setTaskId('');
      setDuration('');
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">添加时间记录</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入时间记录描述"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关联任务（可选）
              </label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择任务</option>
                {tasks?.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                耗时（小时）
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.5"
                required
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!description.trim() || !duration || createTimeLogMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createTimeLogMutation.isPending ? '添加中...' : '添加'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };



  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">工作日志</h1>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>+</span>
            <span>添加时间记录</span>
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">总耗时</div>
          <div className="text-2xl font-bold text-gray-900">{Math.round(stats.totalTimeSpent)} 分钟</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">计划内记录</div>
          <div className="text-2xl font-bold text-blue-600">{stats.plannedTasksCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">计划外记录</div>
          <div className="text-2xl font-bold text-orange-600">{stats.unplannedTasksCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">完成率</div>
          <div className="text-2xl font-bold text-green-600">{Math.round(stats.completionRate)}%</div>
        </div>
      </div>

      {/* 关联任务 */}
      {tasks && tasks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">当日任务</h2>
          <div className="grid gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                       {getStatusText(task.status)}
                     </span>
                    {task.priority && (
                      <span className="text-xs text-gray-500">
                        优先级: {task.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 时间记录列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">时间记录</h2>
          <span className="text-sm text-gray-500">
            共 {timeLogs?.length || 0} 条记录
          </span>
        </div>
        <div className="space-y-3">
          {timeLogs && timeLogs.length > 0 ? (
            timeLogs.map((timeLog) => renderTimeLogCard(timeLog))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无时间记录</p>
              <p className="text-sm">点击上方按钮添加第一条记录</p>
            </div>
          )}
        </div>
      </div>

      {/* 添加任务模态框 */}
      {showCreateModal && (
        <CreateTaskModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleAddTask}
        />
      )}
    </div>
  );
};

export default WorkLogsPage;