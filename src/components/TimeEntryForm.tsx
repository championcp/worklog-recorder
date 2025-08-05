'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlayIcon, StopIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import type { TimeLog, CreateTimeLogInput, WBSTask, Project } from '@/types/project';

interface TimeEntryFormProps {
  userId: number;
  projects: Project[];
  onTimeLogCreated?: (timeLog: TimeLog) => void;
  onTimeLogUpdated?: (timeLog: TimeLog) => void;
}

export default function TimeEntryForm({ 
  userId, 
  projects, 
  onTimeLogCreated, 
  onTimeLogUpdated 
}: TimeEntryFormProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [availableTasks, setAvailableTasks] = useState<WBSTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<WBSTask | null>(null);
  const [activeTimer, setActiveTimer] = useState<(TimeLog & { task_name: string; project_name: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 手动时间记录表单状态
  const [manualEntry, setManualEntry] = useState({
    description: '',
    start_time: '',
    end_time: '',
    date: new Date().toISOString().split('T')[0]
  });

  // 计时器描述
  const [timerDescription, setTimerDescription] = useState('');

  // 获取活跃计时器
  const fetchActiveTimer = useCallback(async () => {
    try {
      const response = await fetch('/api/time-logs/timer');
      const data = await response.json();

      if (data.success) {
        setActiveTimer(data.data.activeTimer);
      }
    } catch (err) {
      console.error('获取活跃计时器失败:', err);
    }
  }, []);

  // 获取项目任务
  const fetchProjectTasks = useCallback(async (projectId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks?project_id=${projectId}&tree=false`);
      const data = await response.json();

      if (data.success) {
        setAvailableTasks(data.data.tasks || []);
      } else {
        setError(data.error?.message || '获取任务列表失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
      console.error('获取任务列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 开始计时
  const startTimer = async () => {
    if (!selectedTask) {
      setError('请选择要计时的任务');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/time-logs/timer/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: selectedTask.id,
          description: timerDescription.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchActiveTimer();
        setTimerDescription('');
        setError(null);
      } else {
        setError(data.error?.message || '开始计时失败');
      }
    } catch (err) {
      setError('开始计时失败');
      console.error('开始计时失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 停止计时
  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      setLoading(true);
      const response = await fetch('/api/time-logs/timer/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time_log_id: activeTimer.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setActiveTimer(null);
        setError(null);
        if (onTimeLogUpdated) {
          onTimeLogUpdated(data.data.timeLog);
        }
      } else {
        setError(data.error?.message || '停止计时失败');
      }
    } catch (err) {
      setError('停止计时失败');
      console.error('停止计时失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 创建手动时间记录
  const createManualTimeLog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTask) {
      setError('请选择任务');
      return;
    }

    if (!manualEntry.start_time) {
      setError('请设置开始时间');
      return;
    }

    try {
      setLoading(true);
      
      // 构建开始和结束时间的完整ISO字符串
      const startDateTime = `${manualEntry.date}T${manualEntry.start_time}:00`;
      const endDateTime = manualEntry.end_time ? `${manualEntry.date}T${manualEntry.end_time}:00` : null;

      const timeLogData: CreateTimeLogInput = {
        task_id: selectedTask.id,
        description: manualEntry.description.trim(),
        start_time: startDateTime,
        end_time: endDateTime || undefined,
        is_manual: true
      };

      const response = await fetch('/api/time-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timeLogData),
      });

      const data = await response.json();

      if (data.success) {
        // 重置表单
        setManualEntry({
          description: '',
          start_time: '',
          end_time: '',
          date: new Date().toISOString().split('T')[0]
        });
        setError(null);
        
        if (onTimeLogCreated) {
          onTimeLogCreated(data.data.timeLog);
        }
      } else {
        setError(data.error?.message || '创建时间记录失败');
      }
    } catch (err) {
      setError('创建时间记录失败');
      console.error('创建时间记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 计算计时器持续时间
  const getTimerDuration = useCallback(() => {
    if (!activeTimer) return '00:00:00';
    
    const start = new Date(activeTimer.start_time);
    const now = currentTime;
    const diff = now.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [activeTimer, currentTime]);

  // 项目选择处理
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setSelectedTask(null);
    setAvailableTasks([]);
    fetchProjectTasks(project.id);
  };

  // 组件挂载时初始化
  useEffect(() => {
    fetchActiveTimer();
  }, [fetchActiveTimer]);

  // 更新当前时间（用于计时器显示）
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 错误提示 */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* 活跃计时器显示 */}
        {activeTimer && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center text-blue-600">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  <span className="font-medium">正在计时</span>
                </div>
                <div className="ml-4">
                  <span className="text-sm text-gray-600">{activeTimer.project_name}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="text-sm font-medium">{activeTimer.task_name}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-mono font-bold text-blue-600">
                  {getTimerDuration()}
                </div>
                <button
                  onClick={stopTimer}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <StopIcon className="w-4 h-4 mr-1" />
                  停止计时
                </button>
              </div>
            </div>
            {activeTimer.description && (
              <p className="mt-2 text-sm text-gray-600">{activeTimer.description}</p>
            )}
          </div>
        )}

        {/* 项目和任务选择 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择项目
            </label>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === parseInt(e.target.value));
                if (project) handleProjectSelect(project);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择项目</option>
              {projects.filter(p => p.is_active).map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择任务
            </label>
            <select
              value={selectedTask?.id || ''}
              onChange={(e) => {
                const task = availableTasks.find(t => t.id === parseInt(e.target.value));
                setSelectedTask(task || null);
              }}
              disabled={!selectedProject || loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <option value="">请选择任务</option>
              {availableTasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.wbs_code} - {task.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 计时器控制 */}
        {!activeTimer && selectedTask && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">快速计时</h3>
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  计时描述（可选）
                </label>
                <input
                  type="text"
                  value={timerDescription}
                  onChange={(e) => setTimerDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入工作描述..."
                  maxLength={500}
                />
              </div>
              <button
                onClick={startTimer}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                开始计时
              </button>
            </div>
          </div>
        )}

        {/* 手动时间记录表单 */}
        {selectedTask && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">手动添加时间记录</h3>
            
            <form onSubmit={createManualTimeLog} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  工作描述
                </label>
                <textarea
                  value={manualEntry.description}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入工作内容描述..."
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日期 *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={manualEntry.date}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <CalendarIcon className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间 *
                  </label>
                  <input
                    type="time"
                    value={manualEntry.start_time}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束时间（可选）
                  </label>
                  <input
                    type="time"
                    value={manualEntry.end_time}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setManualEntry({
                    description: '',
                    start_time: '',
                    end_time: '',
                    date: new Date().toISOString().split('T')[0]
                  })}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  重置
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? '创建中...' : '创建记录'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 选择提示 */}
        {!selectedProject && (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>请先选择项目和任务开始记录时间</p>
          </div>
        )}
      </div>
    </div>
  );
}