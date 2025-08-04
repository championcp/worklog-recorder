'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
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
  }, [router]);

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
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Nobody Logger</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">欢迎，{user?.username}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                欢迎来到Nobody Logger仪表板
              </h2>
              <p className="text-gray-600 mb-6">
                您已成功登录，这里将显示您的工作日志和统计信息
              </p>
              
              {/* 用户信息卡片 */}
              <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">用户信息</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">用户名:</span> {user?.username}</p>
                  <p><span className="font-medium">邮箱:</span> {user?.email}</p>
                  <p><span className="font-medium">用户ID:</span> {user?.id}</p>
                </div>
              </div>

              {/* 快速操作 */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">快速操作</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg">
                    <div className="text-sm font-medium">创建新任务</div>
                    <div className="text-xs text-blue-100 mt-1">开始记录工作</div>
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg">
                    <div className="text-sm font-medium">查看统计</div>
                    <div className="text-xs text-green-100 mt-1">分析工作数据</div>
                  </button>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg">
                    <div className="text-sm font-medium">生成报告</div>
                    <div className="text-xs text-purple-100 mt-1">导出工作报告</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}