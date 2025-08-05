'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProjectManager from '@/components/ProjectManager';
import WBSTaskTree from '@/components/WBSTaskTree';
import TimeEntryForm from '@/components/TimeEntryForm';
import type { Project, TimeLog } from '@/types/project';

interface User {
  id: number;
  email: string;
  username: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentView, setCurrentView] = useState<'overview' | 'projects' | 'tasks' | 'timetracking'>('overview');
  const router = useRouter();

  const fetchProjects = useCallback(async (userId: number) => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data.projects || []);
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        // 获取用户项目列表
        await fetchProjects(data.data.user.id);
      } else {
        // 未认证，跳转到登录页
        router.push('/login');
      }
    } catch (error) {
      console.error('认证检查失败:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, fetchProjects]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('tasks');
  };

  const handleTimeLogCreated = (timeLog: TimeLog) => {
    // 时间记录创建成功的回调
    console.log('新时间记录已创建:', timeLog);
  };

  const handleTimeLogUpdated = (timeLog: TimeLog) => {
    // 时间记录更新成功的回调
    console.log('时间记录已更新:', timeLog);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Nobody Logger</h1>
              
              {/* 导航菜单 */}
              <div className="hidden md:flex space-x-6">
                <button
                  onClick={() => setCurrentView('overview')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentView === 'overview'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  概览
                </button>
                <button
                  onClick={() => setCurrentView('projects')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentView === 'projects'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  项目管理
                </button>
                <button
                  onClick={() => setCurrentView('timetracking')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentView === 'timetracking'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  时间记录
                </button>
                {selectedProject && (
                  <button
                    onClick={() => setCurrentView('tasks')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentView === 'tasks'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {selectedProject.name}
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">欢迎，{user?.username}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {currentView === 'overview' && (
            <DashboardOverview 
              user={user!} 
              onNavigateToProjects={() => setCurrentView('projects')}
              onNavigateToTimeTracking={() => setCurrentView('timetracking')}
            />
          )}
          
          {currentView === 'projects' && (
            <ProjectManager 
              userId={user!.id} 
              onProjectSelect={handleProjectSelect}
            />
          )}

          {currentView === 'timetracking' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">时间记录管理</h2>
                <p className="text-gray-600 mb-6">记录和管理您的工作时间</p>
              </div>
              
              <TimeEntryForm
                userId={user!.id}
                projects={projects}
                onTimeLogCreated={handleTimeLogCreated}
                onTimeLogUpdated={handleTimeLogUpdated}
              />
            </div>
          )}
          
          {currentView === 'tasks' && selectedProject && (
            <WBSTaskTree 
              projectId={selectedProject.id}
              projectName={selectedProject.name}
              onBack={() => setCurrentView('projects')}
              onTaskSelect={(task) => {
                // 可以在这里添加任务选择的逻辑
                console.log('Selected task:', task);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// 仪表板概览组件
interface DashboardOverviewProps {
  user: User;
  onNavigateToProjects: () => void;
  onNavigateToTimeTracking: () => void;
}

function DashboardOverview({ user, onNavigateToProjects, onNavigateToTimeTracking }: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          欢迎来到Nobody Logger仪表板
        </h2>
        <p className="text-gray-600 mb-6">
          您的个人工作日志记录和时间管理系统
        </p>
        
        {/* 用户信息卡片 */}
        <div className="bg-gray-50 rounded-lg p-4 max-w-md">
          <h3 className="text-lg font-medium text-gray-900 mb-3">用户信息</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-gray-700">用户名:</span> <span className="text-gray-900">{user.username}</span></p>
            <p><span className="font-medium text-gray-700">邮箱:</span> <span className="text-gray-900">{user.email}</span></p>
            <p><span className="font-medium text-gray-700">用户ID:</span> <span className="text-gray-900">{user.id}</span></p>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={onNavigateToProjects}
            className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center mb-2">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <div className="text-base font-medium">项目管理</div>
            </div>
            <div className="text-sm text-blue-100">创建和管理您的项目</div>
          </button>
          
          <button 
            onClick={onNavigateToTimeTracking}
            className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center mb-2">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-base font-medium">时间记录</div>
            </div>
            <div className="text-sm text-green-100">记录和分析工作时间</div>
          </button>
          
          <button className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg transition-colors text-left">
            <div className="flex items-center mb-2">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-base font-medium">生成报告</div>
            </div>
            <div className="text-sm text-purple-100">导出工作报告和统计</div>
          </button>
        </div>
      </div>

      {/* 系统状态 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">开发进度</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">用户认证系统</span>
            <span className="text-sm text-green-600 font-medium">✓ 已完成</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">项目管理功能</span>
            <span className="text-sm text-green-600 font-medium">✓ 已完成</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">WBS任务管理</span>
            <span className="text-sm text-green-600 font-medium">✓ 已完成</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">时间记录功能</span>
            <span className="text-sm text-green-600 font-medium">✓ 已完成</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            总体进度: 100% - Sprint 3 时间追踪系统开发完成
          </p>
        </div>
      </div>
    </div>
  );
}