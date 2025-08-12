import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit3, Trash2, Calendar, Clock, User, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { Category, Task } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const CategoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 获取分类详情
  const { data: category, isLoading: categoryLoading, error: categoryError } = useQuery({
    queryKey: ['category', id],
    queryFn: () => api.getCategory(id!),
    enabled: !!id,
  });

  // 获取该分类下的任务
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'category', id],
    queryFn: () => api.getTasksByCategory(id!),
    enabled: !!id,
  });

  const handleBack = () => {
    navigate('/categories');
  };

  const handleEdit = () => {
    // TODO: 实现编辑功能，可以打开编辑模态框
    toast('编辑功能将在后续版本中实现');
  };

  const handleDelete = () => {
    // TODO: 实现删除功能
    toast('删除功能将在后续版本中实现');
  };

  if (categoryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (categoryError || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">分类不存在</h2>
          <p className="text-gray-600 mb-6">您要查看的分类可能已被删除或不存在。</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回分类列表
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待处理';
      case 'in_progress':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return priority;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 头部导航 */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回分类列表
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className="w-8 h-8 rounded-full mr-4"
              style={{ backgroundColor: category.color }}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              {category.description && (
                <p className="text-gray-600 mt-1">{category.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              编辑
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </button>
          </div>
        </div>
      </div>

      {/* 分类信息卡片 */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">分类信息</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">分类名称</dt>
            <dd className="mt-1 text-sm text-gray-900">{category.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">颜色</dt>
            <dd className="mt-1 flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm text-gray-900">{category.color}</span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">描述</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {category.description || '暂无描述'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">关联任务数</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {tasks?.length || 0} 个任务
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">创建时间</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(category.createdAt).toLocaleString('zh-CN')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">更新时间</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(category.updatedAt).toLocaleString('zh-CN')}
            </dd>
          </div>
        </dl>
      </div>

      {/* 关联任务列表 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">关联任务</h2>
        </div>
        
        {tasksLoading ? (
          <div className="p-6 text-center">
            <LoadingSpinner />
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    任务标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    优先级
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    截止时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {getStatusText(task.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityText(task.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.dueDate ? (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                        </div>
                      ) : (
                        <span className="text-gray-400">无截止时间</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无关联任务</h3>
            <p className="mt-1 text-sm text-gray-500">
              该分类下还没有任务。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetailPage;