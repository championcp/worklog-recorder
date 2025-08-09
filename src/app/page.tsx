'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  const checkAuthAndRedirect = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success) {
        // 已认证，跳转到仪表板
        router.push('/dashboard');
      }
      // 未认证则保持在首页，显示登录注册按钮
    } catch (error) {
      // 网络错误或其他问题，保持在首页
      console.error('认证检查失败:', error);
    }
  }, [router]);

  useEffect(() => {
    // 检查认证状态并重定向
    checkAuthAndRedirect();
  }, [checkAuthAndRedirect]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          {/* Logo和标题 */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Nobody Logger
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              个人工作日志记录和时间管理系统
            </p>
          </div>

          {/* 特性介绍 */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                WBS多层级管理
              </h3>
              <p className="text-gray-600">
                支持年→半年→季度→月→周→日的完整工作分解结构
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                时间记录分析
              </h3>
              <p className="text-gray-600">
                智能时间统计，深度分析工作效率和时间分配
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                自动报告生成
              </h3>
              <p className="text-gray-600">
                自动汇总日报、周报、月报，提升工作总结效率
              </p>
            </div>
          </div>

          {/* CTA按钮 */}
          <div className="space-x-4">
            <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-block">
              开始使用
            </Link>
            <Link href="/login" className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-8 rounded-lg border border-gray-300 transition-colors duration-200 inline-block">
              立即登录
            </Link>
          </div>

          {/* 状态信息 */}
          <div className="mt-16 p-6 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-green-800">
                核心功能已完成
              </h3>
            </div>
            <p className="text-green-700">
              认证系统、项目管理、WBS任务管理、时间记录和分类管理功能已实现并可正常使用
            </p>
            <div className="mt-4">
              <div className="bg-green-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
              <p className="text-sm text-green-600 mt-2">
                开发进度: 80% - Sprint 1-4完成，Sprint 5开发中
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}