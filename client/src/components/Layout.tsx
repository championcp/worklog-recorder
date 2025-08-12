import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderOpen, 
  Tag, 
  Calendar,
  Clock,
  BookOpen,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
  User,
  Bell,
  FileBarChart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import { Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: '仪表板', href: '/', icon: LayoutDashboard },
    { name: '任务管理', href: '/tasks', icon: CheckSquare },
    { name: '分类管理', href: '/categories', icon: FolderOpen },
    { name: '标签管理', href: '/tags', icon: Tag },
    { name: '计划管理', href: '/plans', icon: Calendar },
    { name: '时间记录', href: '/time-logs', icon: Clock },
    { name: '工作日志', href: '/work-logs', icon: BookOpen },
    { name: '模板管理', href: '/templates', icon: FileText },
    { name: '统计分析', href: '/statistics', icon: BarChart3 },
    { name: '报告管理', href: '/reports', icon: FileText },
    { name: '提醒管理', href: '/reminders', icon: Bell },
    { name: '设置', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">工作日志</h1>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 用户信息和退出 */}
          <div className="border-t border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5 mr-3" />
              退出登录
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 顶部导航栏 */}
        <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6 text-gray-500" />
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;