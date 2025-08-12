import React, { useState, useEffect } from 'react';
import { Plus, Bell, Clock, Calendar, Settings, Search, Filter } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import ReminderSystem from '../components/ReminderSystem';
import { Reminder } from '../types';
import { reminderApi } from '../services/api';

const RemindersPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'completed'>('all');
  const queryClient = useQueryClient();

  // 获取提醒列表
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const response = await reminderApi.getReminders();
      return response.data.data || [];
    }
  });

  // 删除提醒
  const deleteMutation = useMutation({
    mutationFn: (id: string) => reminderApi.deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('提醒已删除');
    },
    onError: () => {
      toast.error('删除提醒失败');
    }
  });

  // 过滤提醒
  const filteredReminders = reminders.filter((reminder: Reminder) => {
    const matchesSearch = reminder.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reminder.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'active' && reminder.isActive && !reminder.isCompleted) ||
                         (filterType === 'completed' && reminder.isCompleted);
    
    return matchesSearch && matchesFilter;
  });

  const handleReminderTriggered = (reminder: Reminder) => {
    toast.success(`提醒: ${reminder.title}`);
  };

  const handleDeleteReminder = (id: string) => {
    if (window.confirm('确定要删除这个提醒吗？')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">提醒管理</h1>
          <p className="text-gray-600 mt-1">管理您的任务提醒和通知</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          创建提醒
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总提醒数</p>
              <p className="text-2xl font-bold text-gray-900">{reminders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">活跃提醒</p>
              <p className="text-2xl font-bold text-gray-900">
                {reminders.filter((r: Reminder) => r.isActive && !r.isCompleted).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今日提醒</p>
              <p className="text-2xl font-bold text-gray-900">
                {reminders.filter((r: Reminder) => {
                  const today = new Date();
                  const reminderDate = new Date(r.triggerTime);
                  return reminderDate.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">重复提醒</p>
              <p className="text-2xl font-bold text-gray-900">
                {reminders.filter((r: Reminder) => r.isRecurring).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索提醒..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部提醒</option>
              <option value="active">活跃提醒</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>
      </div>

      {/* 提醒系统组件 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">提醒列表</h2>
          <ReminderSystem
            onReminderTriggered={handleReminderTriggered}
          />
        </div>
      </div>

      {/* 空状态 */}
      {!isLoading && filteredReminders.length === 0 && (
        <div className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无提醒</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterType !== 'all' 
              ? '没有找到匹配的提醒' 
              : '开始创建您的第一个提醒吧'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                创建提醒
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RemindersPage;