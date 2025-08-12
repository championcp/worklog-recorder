import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  X,
  Settings,
  Volume2,
  VolumeX,
  Repeat,
  Target
} from 'lucide-react';
import { Reminder } from '../types';

interface ReminderSystemProps {
  onReminderTriggered?: (reminder: Reminder) => void;
}

const ReminderSystem: React.FC<ReminderSystemProps> = ({
  onReminderTriggered
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [filterType, setFilterType] = useState<Reminder['type'] | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'snoozed'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // 表单状态
  const [formData, setFormData] = useState<Partial<Reminder>>({
    title: '',
    description: '',
    type: 'custom',
    priority: 'medium',
    triggerTime: new Date(),
    isRecurring: false,
    isActive: true,
    notificationMethods: ['browser'],
    tags: []
  });

  // 检查提醒的定时器
  useEffect(() => {
    const interval = setInterval(checkReminders, 60000); // 每分钟检查一次
    checkReminders(); // 立即检查一次
    return () => clearInterval(interval);
  }, [reminders]);

  // 加载提醒数据
  useEffect(() => {
    loadReminders();
    checkNotificationPermission();
  }, []);

  const loadReminders = () => {
    const savedReminders = localStorage.getItem('work_log_reminders');
    if (savedReminders) {
      const parsed = JSON.parse(savedReminders).map((r: any) => ({
        ...r,
        triggerTime: new Date(r.triggerTime),
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
        completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
        snoozeUntil: r.snoozeUntil ? new Date(r.snoozeUntil) : undefined,
        recurringPattern: r.recurringPattern ? {
          ...r.recurringPattern,
          endDate: r.recurringPattern.endDate ? new Date(r.recurringPattern.endDate) : undefined
        } : undefined
      }));
      setReminders(parsed);
    }
  };

  const saveReminders = (remindersToSave: Reminder[]) => {
    localStorage.setItem('work_log_reminders', JSON.stringify(remindersToSave));
  };

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      }
    }
  };

  const checkReminders = () => {
    const now = new Date();
    const triggered: Reminder[] = [];

    reminders.forEach(reminder => {
      if (!reminder.isActive || reminder.isCompleted) return;
      
      // 检查是否被暂停
      if (reminder.snoozeUntil && reminder.snoozeUntil > now) return;

      // 检查是否到达触发时间
      if (reminder.triggerTime <= now) {
        triggered.push(reminder);
        
        // 如果是重复提醒，计算下次触发时间
        if (reminder.isRecurring && reminder.recurringPattern) {
          const nextTriggerTime = calculateNextTriggerTime(reminder);
          if (nextTriggerTime) {
            updateReminderTriggerTime(reminder.id, nextTriggerTime);
          }
        } else {
          // 非重复提醒，标记为已完成
          markReminderCompleted(reminder.id);
        }
      }
    });

    if (triggered.length > 0) {
      setActiveReminders(triggered);
      triggered.forEach(reminder => {
        triggerNotification(reminder);
        if (onReminderTriggered) {
          onReminderTriggered(reminder);
        }
      });
    }
  };

  const calculateNextTriggerTime = (reminder: Reminder): Date | null => {
    if (!reminder.recurringPattern) return null;

    const { type, interval, daysOfWeek, dayOfMonth, endDate } = reminder.recurringPattern;
    const currentTime = new Date(reminder.triggerTime);
    let nextTime = new Date(currentTime);

    switch (type) {
      case 'daily':
        nextTime.setDate(nextTime.getDate() + interval);
        break;
      
      case 'weekly':
        if (daysOfWeek && daysOfWeek.length > 0) {
          // 找到下一个指定的星期几
          const currentDay = nextTime.getDay();
          const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
          let nextDay = sortedDays.find(day => day > currentDay);
          
          if (!nextDay) {
            // 如果本周没有更多的日子，跳到下周的第一个日子
            nextDay = sortedDays[0];
            nextTime.setDate(nextTime.getDate() + (7 - currentDay + nextDay));
          } else {
            nextTime.setDate(nextTime.getDate() + (nextDay - currentDay));
          }
        } else {
          nextTime.setDate(nextTime.getDate() + (7 * interval));
        }
        break;
      
      case 'monthly':
        if (dayOfMonth) {
          nextTime.setMonth(nextTime.getMonth() + interval);
          nextTime.setDate(dayOfMonth);
        } else {
          nextTime.setMonth(nextTime.getMonth() + interval);
        }
        break;
      
      case 'yearly':
        nextTime.setFullYear(nextTime.getFullYear() + interval);
        break;
    }

    // 检查是否超过结束日期
    if (endDate && nextTime > endDate) {
      return null;
    }

    return nextTime;
  };

  const updateReminderTriggerTime = (reminderId: string, newTriggerTime: Date) => {
    const updatedReminders = reminders.map(r => 
      r.id === reminderId 
        ? { ...r, triggerTime: newTriggerTime, updatedAt: new Date() }
        : r
    );
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const markReminderCompleted = (reminderId: string) => {
    const updatedReminders = reminders.map(r => 
      r.id === reminderId 
        ? { ...r, isCompleted: true, completedAt: new Date(), updatedAt: new Date() }
        : r
    );
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const triggerNotification = (reminder: Reminder) => {
    const { title, description, notificationMethods } = reminder;

    // 浏览器通知
    if (notificationMethods.includes('browser') && notificationPermission === 'granted') {
      new Notification(title, {
        body: description,
        icon: '/favicon.ico',
        tag: reminder.id
      });
    }

    // 声音通知
    if (notificationMethods.includes('sound') && soundEnabled) {
      playNotificationSound();
    }

    // 邮件通知 (这里只是示例，实际需要后端支持)
    if (notificationMethods.includes('email')) {
      console.log('Email notification would be sent:', { title, description });
    }
  };

  const playNotificationSound = () => {
    // 创建音频上下文播放提示音
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const handleCreateReminder = () => {
    const newReminder: Reminder = {
      id: `reminder-${Date.now()}`,
      title: formData.title || '',
      description: formData.description || '',
      type: formData.type || 'custom',
      priority: formData.priority || 'medium',
      triggerTime: formData.triggerTime || new Date(),
      isRecurring: formData.isRecurring || false,
      recurringPattern: formData.recurringPattern,
      isActive: true,
      isCompleted: false,
      notificationMethods: formData.notificationMethods || ['browser'],
      relatedTaskId: formData.relatedTaskId,
      relatedPlanId: formData.relatedPlanId,
      tags: formData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
    setShowCreateModal(false);
    resetForm();
  };

  const handleEditReminder = () => {
    if (!selectedReminder) return;

    const updatedReminder: Reminder = {
      ...selectedReminder,
      ...formData,
      updatedAt: new Date()
    };

    const updatedReminders = reminders.map(r => 
      r.id === selectedReminder.id ? updatedReminder : r
    );
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
    setShowEditModal(false);
    setSelectedReminder(null);
    resetForm();
  };

  const handleDeleteReminder = (reminderId: string) => {
    if (window.confirm('确定要删除这个提醒吗？')) {
      const updatedReminders = reminders.filter(r => r.id !== reminderId);
      setReminders(updatedReminders);
      saveReminders(updatedReminders);
    }
  };

  const handleSnoozeReminder = (reminderId: string, minutes: number) => {
    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

    const updatedReminders = reminders.map(r => 
      r.id === reminderId 
        ? { ...r, snoozeUntil, updatedAt: new Date() }
        : r
    );
    setReminders(updatedReminders);
    saveReminders(updatedReminders);

    // 从活跃提醒中移除
    setActiveReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const handleDismissReminder = (reminderId: string) => {
    setActiveReminders(prev => prev.filter(r => r.id !== reminderId));
    
    // 如果不是重复提醒，标记为已完成
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder && !reminder.isRecurring) {
      markReminderCompleted(reminderId);
    }
  };

  const toggleReminderActive = (reminderId: string) => {
    const updatedReminders = reminders.map(r => 
      r.id === reminderId 
        ? { ...r, isActive: !r.isActive, updatedAt: new Date() }
        : r
    );
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'custom',
      priority: 'medium',
      triggerTime: new Date(),
      isRecurring: false,
      isActive: true,
      notificationMethods: ['browser'],
      tags: []
    });
  };

  const getTypeLabel = (type: Reminder['type']): string => {
    const labels = {
      task: '任务',
      plan: '计划',
      meeting: '会议',
      deadline: '截止日期',
      break: '休息',
      custom: '自定义'
    };
    return labels[type];
  };

  const getTypeColor = (type: Reminder['type']): string => {
    const colors = {
      task: 'bg-blue-100 text-blue-800',
      plan: 'bg-green-100 text-green-800',
      meeting: 'bg-purple-100 text-purple-800',
      deadline: 'bg-red-100 text-red-800',
      break: 'bg-yellow-100 text-yellow-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[type];
  };

  const getPriorityColor = (priority: Reminder['priority']): string => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority];
  };

  const filteredReminders = reminders.filter(reminder => {
    if (filterType !== 'all' && reminder.type !== filterType) return false;
    
    switch (filterStatus) {
      case 'active':
        return reminder.isActive && !reminder.isCompleted;
      case 'completed':
        return reminder.isCompleted;
      case 'snoozed':
        return reminder.snoozeUntil && reminder.snoozeUntil > new Date();
      default:
        return true;
    }
  });

  return (
    <div className="reminder-system">
      {/* 活跃提醒通知 */}
      {activeReminders.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {activeReminders.map(reminder => (
            <div key={reminder.id} className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(reminder.type)}`}>
                    {getTypeLabel(reminder.type)}
                  </span>
                </div>
                <button
                  onClick={() => handleDismissReminder(reminder.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <h4 className="font-semibold text-gray-900 mb-1">{reminder.title}</h4>
              {reminder.description && (
                <p className="text-sm text-gray-600 mb-3">{reminder.description}</p>
              )}
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSnoozeReminder(reminder.id, 5)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  5分钟后
                </button>
                <button
                  onClick={() => handleSnoozeReminder(reminder.id, 15)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  15分钟后
                </button>
                <button
                  onClick={() => handleDismissReminder(reminder.id)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  知道了
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 头部工具栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">提醒管理</h2>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            title={soundEnabled ? '关闭声音' : '开启声音'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>创建提醒</span>
        </button>
      </div>

      {/* 过滤器 */}
      <div className="flex items-center space-x-4 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as Reminder['type'] | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">所有类型</option>
          <option value="task">任务</option>
          <option value="plan">计划</option>
          <option value="meeting">会议</option>
          <option value="deadline">截止日期</option>
          <option value="break">休息</option>
          <option value="custom">自定义</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">所有状态</option>
          <option value="active">活跃</option>
          <option value="completed">已完成</option>
          <option value="snoozed">已暂停</option>
        </select>
      </div>

      {/* 提醒列表 */}
      <div className="space-y-4">
        {filteredReminders.map(reminder => (
          <div key={reminder.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{reminder.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(reminder.type)}`}>
                    {getTypeLabel(reminder.type)}
                  </span>
                  <span className={`text-sm font-medium ${getPriorityColor(reminder.priority)}`}>
                    {reminder.priority.toUpperCase()}
                  </span>
                  {reminder.isRecurring && (
                    <Repeat className="w-4 h-4 text-blue-600" />
                  )}
                  {!reminder.isActive && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      已暂停
                    </span>
                  )}
                  {reminder.isCompleted && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
                
                {reminder.description && (
                  <p className="text-gray-600 mb-2">{reminder.description}</p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{reminder.triggerTime.toLocaleString()}</span>
                  </div>
                  
                  {reminder.snoozeUntil && reminder.snoozeUntil > new Date() && (
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>暂停至 {reminder.snoozeUntil.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {reminder.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <span>标签:</span>
                      <span>{reminder.tags.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleReminderActive(reminder.id)}
                  className={`p-2 rounded transition-colors ${
                    reminder.isActive 
                      ? 'text-green-600 hover:bg-green-50' 
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                  title={reminder.isActive ? '暂停提醒' : '启用提醒'}
                >
                  <Target className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => {
                    setSelectedReminder(reminder);
                    setFormData(reminder);
                    setShowEditModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="编辑"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDeleteReminder(reminder.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReminders.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无提醒</h3>
          <p className="text-gray-600">创建您的第一个提醒吧</p>
        </div>
      )}

      {/* 创建/编辑提醒模态框 */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                {showCreateModal ? '创建提醒' : '编辑提醒'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 基本信息 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提醒标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入提醒标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提醒描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="请输入提醒描述"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    提醒类型
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Reminder['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="custom">自定义</option>
                    <option value="task">任务</option>
                    <option value="plan">计划</option>
                    <option value="meeting">会议</option>
                    <option value="deadline">截止日期</option>
                    <option value="break">休息</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    优先级
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Reminder['priority'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  触发时间 *
                </label>
                <input
                  type="datetime-local"
                  value={formData.triggerTime ? formData.triggerTime.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, triggerTime: new Date(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 重复设置 */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">重复提醒</span>
                </label>
              </div>

              {formData.isRecurring && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        重复类型
                      </label>
                      <select
                        value={formData.recurringPattern?.type || 'daily'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          recurringPattern: {
                            ...prev.recurringPattern,
                            type: e.target.value as any,
                            interval: 1
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">每日</option>
                        <option value="weekly">每周</option>
                        <option value="monthly">每月</option>
                        <option value="yearly">每年</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        间隔
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.recurringPattern?.interval || 1}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          recurringPattern: {
                            type: 'daily',
                            ...prev.recurringPattern,
                            interval: parseInt(e.target.value) || 1
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      结束日期 (可选)
                    </label>
                    <input
                      type="date"
                      value={formData.recurringPattern?.endDate ? formData.recurringPattern.endDate.toISOString().slice(0, 10) : ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurringPattern: {
                          type: 'daily',
                          interval: 1,
                          ...prev.recurringPattern,
                          endDate: e.target.value ? new Date(e.target.value) : undefined
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* 通知方式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通知方式
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'browser', label: '浏览器通知' },
                    { value: 'sound', label: '声音提醒' },
                    { value: 'email', label: '邮件通知' }
                  ].map(method => (
                    <label key={method.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.notificationMethods?.includes(method.value as any) || false}
                        onChange={(e) => {
                          const methods = formData.notificationMethods || [];
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              notificationMethods: [...methods, method.value as any]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              notificationMethods: methods.filter(m => m !== method.value)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={showCreateModal ? handleCreateReminder : handleEditReminder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showCreateModal ? '创建提醒' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderSystem;