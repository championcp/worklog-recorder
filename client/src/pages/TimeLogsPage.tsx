import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Play, Pause, Square, Plus, Calendar, Filter, Download, Edit, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { TimeLog } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const TimeLogsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTimeLog, setEditingTimeLog] = useState<TimeLog | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    taskName: '',
    category: '开发',
    description: '',
    taskId: ''
  });

  const [currentTimerDuration, setCurrentTimerDuration] = useState(0);

  const categories = ['all', '开发', '审查', '会议', '学习', '文档', '其他'];

  // 错误处理函数
  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      console.warn(`Authentication error in ${context}`);
    } else {
      toast.error(`${context}失败`);
    }
  };

  // 获取时间记录
  const { data: timeLogs = [], isLoading, error: timeLogsError } = useQuery({
    queryKey: ['timeLogs', selectedDate, selectedCategory],
    queryFn: async () => {
      try {
        return await api.getTimeLogs({
          startDate: selectedDate,
          endDate: selectedDate,
          categoryId: selectedCategory === 'all' ? undefined : selectedCategory
        });
      } catch (error) {
        handleError(error, '获取时间记录');
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // 获取正在运行的计时器
  const { data: runningTimeLogs = [], error: runningTimerError } = useQuery({
    queryKey: ['runningTimeLogs'],
    queryFn: async () => {
      try {
        return await api.getRunningTimeLogs();
      } catch (error) {
        handleError(error, '获取运行中的计时器');
        throw error;
      }
    },
    refetchInterval: 30000, // 改为30秒刷新一次，避免触发速率限制
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // 获取任务列表
  const { data: tasks = [], error: tasksError } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        return await api.getTasks();
      } catch (error) {
        handleError(error, '获取任务列表');
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    }
  });

  const currentTimer = Array.isArray(runningTimeLogs) && runningTimeLogs.length > 0 ? runningTimeLogs[0] : null;

  // 计算正在运行的计时器的持续时间
  const getCurrentTimerDuration = useCallback(() => {
    if (!currentTimer || !currentTimer.startTime) return 0;
    const now = new Date();
    const startTime = new Date(currentTimer.startTime);
    return Math.floor((now.getTime() - startTime.getTime()) / 1000);
  }, [currentTimer]);

  // 实时更新当前计时器的持续时间
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentTimer) {
      interval = setInterval(() => {
        setCurrentTimerDuration(getCurrentTimerDuration());
      }, 1000);
    } else {
      setCurrentTimerDuration(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentTimer, getCurrentTimerDuration]);

  // 创建时间记录
  const createTimeLogMutation = useMutation({
    mutationFn: (data: Partial<TimeLog>) => api.createTimeLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
      queryClient.invalidateQueries({ queryKey: ['runningTimeLogs'] });
      toast.success('时间记录创建成功');
      setShowCreateModal(false);
      resetForm();
    }
  });

  // 更新时间记录
  const updateTimeLogMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeLog> }) => 
      api.updateTimeLog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
      queryClient.invalidateQueries({ queryKey: ['runningTimeLogs'] });
      toast.success('时间记录更新成功');
      setShowEditModal(false);
      setEditingTimeLog(null);
      resetForm();
    }
  });

  // 删除时间记录
  const deleteTimeLogMutation = useMutation({
    mutationFn: (id: string) => api.deleteTimeLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
      queryClient.invalidateQueries({ queryKey: ['runningTimeLogs'] });
      toast.success('时间记录删除成功');
    }
  });

  // 开始计时
  const startTimerMutation = useMutation({
    mutationFn: ({ taskId, description }: { taskId: string; description?: string }) => 
      api.startTimer(taskId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
      queryClient.invalidateQueries({ queryKey: ['runningTimeLogs'] });
      toast.success('计时器已启动');
      setShowCreateModal(false);
      resetForm();
    }
  });

  // 停止计时
  const stopTimerMutation = useMutation({
    mutationFn: (id: string) => api.stopTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
      queryClient.invalidateQueries({ queryKey: ['runningTimeLogs'] });
      toast.success('计时器已停止');
    }
  });

  // 处理 mutation 错误
  useEffect(() => {
    if (createTimeLogMutation.error) {
      toast.error('创建时间记录失败');
    }
    if (updateTimeLogMutation.error) {
      toast.error('更新时间记录失败');
    }
    if (deleteTimeLogMutation.error) {
      toast.error('删除时间记录失败');
    }
    if (startTimerMutation.error) {
      toast.error('启动计时器失败');
    }
    if (stopTimerMutation.error) {
      toast.error('停止计时器失败');
    }
  }, [
    createTimeLogMutation.error,
    updateTimeLogMutation.error,
    deleteTimeLogMutation.error,
    startTimerMutation.error,
    stopTimerMutation.error
  ]);

  const resetForm = () => {
    setFormData({
      taskName: '',
      category: '开发',
      description: '',
      taskId: ''
    });
  };

  // 格式化持续时间（输入为秒）
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getTotalDuration = () => {
    if (!Array.isArray(timeLogs)) {
      return 0;
    }
    return timeLogs.reduce((total, log) => total + (log.duration || 0), 0);
  };

  const handleStartTimer = () => {
    if (!formData.taskId) {
      toast.error('请选择一个任务');
      return;
    }

    startTimerMutation.mutate({
      taskId: formData.taskId,
      description: formData.description
    });
  };

  const handleStopTimer = () => {
    if (currentTimer) {
      stopTimerMutation.mutate(currentTimer.id);
    }
  };

  const handleEditLog = (log: TimeLog) => {
    setEditingTimeLog(log);
    setFormData({
      taskName: log.taskName || '',
      category: log.category || '开发',
      description: log.description || '',
      taskId: log.taskId || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateLog = () => {
    if (!editingTimeLog) return;

    updateTimeLogMutation.mutate({
      id: editingTimeLog.id,
      data: {
        description: formData.description,
        category: formData.category
      }
    });
  };

  const handleDeleteLog = (logId: string) => {
    if (window.confirm('确定要删除这条时间记录吗？')) {
      deleteTimeLogMutation.mutate(logId);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      '开发': 'bg-blue-100 text-blue-800',
      '审查': 'bg-green-100 text-green-800',
      '会议': 'bg-purple-100 text-purple-800',
      '学习': 'bg-yellow-100 text-yellow-800',
      '文档': 'bg-gray-100 text-gray-800',
      '其他': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // 如果有严重错误，显示错误页面
  if (timeLogsError && timeLogsError.message && !timeLogsError.message.includes('401') && !timeLogsError.message.includes('403')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">页面加载失败</h2>
          <p className="text-gray-600 mb-4">请刷新页面重试</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 检查错误状态
  if (timeLogsError || runningTimerError || tasksError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">加载失败</h2>
          <p className="text-gray-600 mb-6">
            {timeLogsError ? '无法加载时间记录' : 
             runningTimerError ? '无法加载运行中的计时器' : 
             '无法加载任务列表'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">时间记录</h1>
          <p className="text-gray-600 mt-1">记录和管理您的工作时间</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          开始计时
        </button>
      </div>

      {/* 当前计时器 */}
      {currentTimer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{currentTimer.taskName}</h3>
                <p className="text-sm text-gray-600">{currentTimer.description}</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getCategoryColor(currentTimer.category || '其他')}`}>
                  {currentTimer.category || '其他'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right mr-4">
                <div className="text-2xl font-bold text-blue-600">
                  {formatDuration(currentTimerDuration)}
                </div>
                <div className="text-sm text-gray-500">
                  开始于 {currentTimer.startTime ? new Date(currentTimer.startTime).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
              <button
                onClick={handleStopTimer}
                disabled={stopTimerMutation.isPending}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                title="停止"
              >
                <Square className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    今日总时长
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {formatDuration(getTotalDuration())}
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
                <Calendar className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    记录条数
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {Array.isArray(timeLogs) ? timeLogs.length : 0}
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
                <Play className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    平均时长
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {Array.isArray(timeLogs) && timeLogs.length > 0 ? formatDuration(Math.round(getTotalDuration() / timeLogs.length)) : '0h 0m'}
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
                <Filter className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    活跃状态
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {currentTimer ? '计时中' : '空闲'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <label className="text-sm font-medium text-gray-700 mr-2">日期：</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center">
            <Filter className="w-4 h-4 text-gray-400 mr-2" />
            <label className="text-sm font-medium text-gray-700 mr-2">分类：</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? '全部' : category}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-secondary flex items-center ml-auto">
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </button>
        </div>
      </div>

      {/* 时间记录列表 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            时间记录列表
          </h3>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    任务名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    时间段
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    时长
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(timeLogs) && timeLogs.length > 0 ? (
                  timeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.taskName}</div>
                          <div className="text-sm text-gray-500">{log.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(log.category || '其他')}`}>
                          {log.category || '其他'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.startTime ? new Date(log.startTime).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' }) : ''} - {log.endTime ? new Date(log.endTime).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '进行中'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(log.duration || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.isRunning ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                            进行中
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            已完成
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditLog(log)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          disabled={deleteTimeLogMutation.isPending}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      暂无时间记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 创建计时器模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  开始新的计时任务
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">选择任务</label>
                    <select
                      value={formData.taskId}
                      onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">请选择任务</option>
                      {tasks.map(task => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">分类</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categories.filter(cat => cat !== 'all').map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">任务描述</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="输入任务描述（可选）"
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleStartTimer}
                  disabled={startTimerMutation.isPending || !formData.taskId}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {startTimerMutation.isPending ? '启动中...' : '开始计时'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑时间记录模态框 */}
      {showEditModal && editingTimeLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  编辑时间记录
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">任务名称</label>
                    <input
                      type="text"
                      value={editingTimeLog.taskName || ''}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">分类</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categories.filter(cat => cat !== 'all').map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">任务描述</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="输入任务描述（可选）"
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleUpdateLog}
                  disabled={updateTimeLogMutation.isPending}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateTimeLogMutation.isPending ? '更新中...' : '更新'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTimeLog(null);
                    resetForm();
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeLogsPage;