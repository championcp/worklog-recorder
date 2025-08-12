import React from 'react';
import { BarChart3, CheckCircle, Clock, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    {
      name: '总任务数',
      value: '24',
      icon: BarChart3,
      change: '+12%',
      changeType: 'increase' as const,
    },
    {
      name: '已完成',
      value: '18',
      icon: CheckCircle,
      change: '+8%',
      changeType: 'increase' as const,
    },
    {
      name: '进行中',
      value: '4',
      icon: Clock,
      change: '-2%',
      changeType: 'decrease' as const,
    },
    {
      name: '团队成员',
      value: '8',
      icon: Users,
      change: '+1',
      changeType: 'increase' as const,
    },
  ];

  const recentTasks = [
    {
      id: 1,
      title: '完成项目文档',
      status: '进行中',
      priority: '高',
      dueDate: '2024-01-15',
    },
    {
      id: 2,
      title: '代码审查',
      status: '待开始',
      priority: '中',
      dueDate: '2024-01-16',
    },
    {
      id: 3,
      title: '用户界面设计',
      status: '已完成',
      priority: '高',
      dueDate: '2024-01-14',
    },
    {
      id: 4,
      title: '数据库优化',
      status: '进行中',
      priority: '低',
      dueDate: '2024-01-18',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已完成':
        return 'bg-green-100 text-green-800';
      case '进行中':
        return 'bg-blue-100 text-blue-800';
      case '待开始':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '高':
        return 'bg-red-100 text-red-800';
      case '中':
        return 'bg-yellow-100 text-yellow-800';
      case '低':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 按钮点击处理函数
  const handleCreateTask = () => {
    alert('创建新任务功能 - 将跳转到任务创建页面');
    navigate('/tasks');
  };

  const handleViewAllTasks = () => {
    alert('查看所有任务功能 - 跳转到任务管理页面');
    navigate('/tasks');
  };

  const handleGenerateReport = () => {
    alert('生成报告功能 - 这里可以生成各种统计报告');
    // 这里可以添加生成报告的逻辑
  };

  return (
    <div className="space-y-6">
      {/* 欢迎信息 */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-medium text-lg">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                欢迎回来，{user?.username}！
              </h1>
              <p className="text-gray-600">
                今天是 {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {item.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.changeType === 'increase' ? (
                          <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                        ) : (
                          <TrendingUp className="self-center flex-shrink-0 h-4 w-4 transform rotate-180" />
                        )}
                        <span className="ml-1">{item.change}</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 最近任务 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            最近任务
          </h3>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    任务名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    优先级
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    截止日期
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            快速操作
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button 
              className="btn-primary"
              onClick={handleCreateTask}
            >
              创建新任务
            </button>
            <button 
              className="btn-secondary"
              onClick={handleViewAllTasks}
            >
              查看所有任务
            </button>
            <button 
              className="btn-secondary"
              onClick={handleGenerateReport}
            >
              生成报告
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;