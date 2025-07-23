import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  CheckSquare, 
  Calendar, 
  Clock, 
  BarChart3, 
  Settings,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  currentPage,
  onNavigate
}) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigationItems = [
    { id: 'dashboard', label: '仪表盘', icon: Home },
    { id: 'tasks', label: '任务', icon: CheckSquare },
    { id: 'plans', label: '计划', icon: Calendar },
    { id: 'worklogs', label: '工作日志', icon: Clock },
    { id: 'reports', label: '报告', icon: BarChart3 },
    { id: 'settings', label: '设置', icon: Settings }
  ];

  const getCurrentPageTitle = () => {
    const item = navigationItems.find(item => item.id === currentPage);
    return item?.label || '工作日志';
  };

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="mobile-layout h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSidebar(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {getCurrentPageTitle()}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 侧边栏 */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <div className="bg-white w-64 h-full shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">工作日志</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <nav className="p-4">
              <ul className="space-y-2">
                {navigationItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          onNavigate(item.id);
                          setShowSidebar(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
          
          <div 
            className="flex-1 bg-black bg-opacity-50"
            onClick={() => setShowSidebar(false)}
          />
        </div>
      )}

      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* 底部导航栏 */}
      <nav className="bg-white border-t border-gray-200 px-2 py-1">
        <div className="flex items-center justify-around">
          {navigationItems.slice(0, 5).map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 浮动操作按钮 */}
      <button className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

// 移动端任务卡片组件
interface MobileTaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
    tags?: string[];
  };
  onEdit?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: string) => void;
}

export const MobileTaskCard: React.FC<MobileTaskCardProps> = ({
  task,
  onEdit,
  onStatusChange
}) => {
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'border-l-green-500',
      medium: 'border-l-yellow-500',
      high: 'border-l-orange-500',
      urgent: 'border-l-red-500'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className={`bg-white border-l-4 ${getPriorityColor(task.priority)} rounded-lg shadow-sm p-4 mb-3`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900 flex-1 pr-2">{task.title}</h3>
        <button
          onClick={() => onEdit?.(task.id)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
            {task.status === 'pending' ? '待处理' : 
             task.status === 'in_progress' ? '进行中' : '已完成'}
          </span>
          
          {task.dueDate && (
            <span className="text-xs text-gray-500">
              {task.dueDate.toLocaleDateString()}
            </span>
          )}
        </div>
        
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-xs text-gray-500">+{task.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 移动端时间记录组件
interface MobileTimeLogProps {
  timeLog: {
    id: string;
    title: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    isRunning: boolean;
    category?: string;
  };
  onStart?: (id: string) => void;
  onStop?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export const MobileTimeLog: React.FC<MobileTimeLogProps> = ({
  timeLog,
  onStart,
  onStop,
  onEdit
}) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{timeLog.title}</h3>
          {timeLog.category && (
            <span className="text-sm text-gray-500">{timeLog.category}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {timeLog.isRunning ? (
            <button
              onClick={() => onStop?.(timeLog.id)}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
            >
              停止
            </button>
          ) : (
            <button
              onClick={() => onStart?.(timeLog.id)}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            >
              开始
            </button>
          )}
          
          <button
            onClick={() => onEdit?.(timeLog.id)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{timeLog.startTime.toLocaleTimeString()}</span>
        <span className="font-medium">{formatDuration(timeLog.duration)}</span>
        {timeLog.endTime && (
          <span>{timeLog.endTime.toLocaleTimeString()}</span>
        )}
      </div>
      
      {timeLog.isRunning && (
        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '100%' }} />
        </div>
      )}
    </div>
  );
};

// 移动端快速操作面板
interface MobileQuickActionsProps {
  onCreateTask?: () => void;
  onStartTimer?: () => void;
  onCreatePlan?: () => void;
  onViewReports?: () => void;
}

export const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({
  onCreateTask,
  onStartTimer,
  onCreatePlan,
  onViewReports
}) => {
  const actions = [
    { label: '新建任务', icon: CheckSquare, onClick: onCreateTask, color: 'bg-blue-500' },
    { label: '开始计时', icon: Clock, onClick: onStartTimer, color: 'bg-green-500' },
    { label: '创建计划', icon: Calendar, onClick: onCreatePlan, color: 'bg-purple-500' },
    { label: '查看报告', icon: BarChart3, onClick: onViewReports, color: 'bg-orange-500' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h3 className="font-medium text-gray-900 mb-3">快速操作</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`${action.color} text-white rounded-lg p-3 flex flex-col items-center space-y-2 hover:opacity-90 transition-opacity`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 移动端统计卡片
interface MobileStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

export const MobileStatsCard: React.FC<MobileStatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  color = 'bg-blue-500'
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {trend && (
          <span className={`text-xs font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      
      <div className="flex items-end space-x-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {subtitle && (
          <span className="text-sm text-gray-500 pb-1">{subtitle}</span>
        )}
      </div>
      
      <div className={`h-1 ${color} rounded-full mt-3`} />
    </div>
  );
};

// 移动端搜索和过滤组件
interface MobileSearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: {
    label: string;
    value: string;
    options: { label: string; value: string }[];
  }[];
  onFilterChange?: (filterValue: string, optionValue: string) => void;
}

export const MobileSearchFilter: React.FC<MobileSearchFilterProps> = ({
  searchValue,
  onSearchChange,
  filters,
  onFilterChange
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {filters && filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {showFilters && filters && (
        <div className="space-y-3">
          {filters.map((filter, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {filter.label}
              </label>
              <select
                value={filter.value}
                onChange={(e) => onFilterChange?.(filter.value, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {filter.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileLayout;