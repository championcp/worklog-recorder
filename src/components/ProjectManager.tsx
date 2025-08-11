'use client';

import { useState, useEffect } from 'react';
import type { Project, CreateProjectInput } from '@/types/project';

interface ProjectManagerProps {
  userId: number;
  onProjectSelect?: (project: Project) => void;
}

export default function ProjectManager({ userId, onProjectSelect }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // 获取项目列表
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      const data = await response.json();

      if (data.success) {
        setProjects(data.data.projects);
      } else {
        setError(data.error?.message || '获取项目列表失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
      console.error('获取项目列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 创建新项目
  const createProject = async (projectData: CreateProjectInput) => {
    try {
      setCreateLoading(true);
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (data.success) {
        setProjects(prev => [data.data.project, ...prev]);
        setShowCreateForm(false);
        return data.data.project;
      } else {
        throw new Error(data.error?.message || '创建项目失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建项目失败';
      setError(errorMessage);
      throw err;
    } finally {
      setCreateLoading(false);
    }
  };

  // 删除项目
  const deleteProject = async (projectId: number) => {
    if (!confirm('确定要删除这个项目吗？删除后无法恢复。')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } else {
        setError(data.error?.message || '删除项目失败');
      }
    } catch (err) {
      setError('删除项目失败');
      console.error('删除项目失败:', err);
    }
  };

  // 切换项目状态
  const toggleProjectStatus = async (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !project.is_active
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProjects(prev => prev.map(p => 
          p.id === projectId ? data.data.project : p
        ));
      } else {
        setError(data.error?.message || '更新项目状态失败');
      }
    } catch (err) {
      setError('更新项目状态失败');
      console.error('更新项目状态失败:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载项目列表...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 头部 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">项目管理</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            新建项目
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 项目列表 */}
      <div className="p-6">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无项目</h3>
            <p className="mt-1 text-sm text-gray-500">创建您的第一个项目来开始使用</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              创建项目
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={() => onProjectSelect?.(project)}
                onDelete={() => deleteProject(project.id)}
                onToggleStatus={() => toggleProjectStatus(project.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 创建项目表单 */}
      {showCreateForm && (
        <CreateProjectForm
          onSubmit={createProject}
          onCancel={() => setShowCreateForm(false)}
          loading={createLoading}
        />
      )}
    </div>
  );
}

// 项目卡片组件
interface ProjectCardProps {
  project: Project;
  onSelect: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

function ProjectCard({ project, onSelect, onDelete, onToggleStatus }: ProjectCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      {/* 项目头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div 
            className="w-4 h-4 rounded-full mr-3"
            style={{ backgroundColor: project.color }}
          />
          <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggleStatus}
            className={`p-1 rounded-full text-xs ${
              project.is_active 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-500'
            }`}
            title={project.is_active ? '激活中' : '已暂停'}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded-full text-red-500 hover:bg-red-50"
            title="删除项目"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 112 0v4a1 1 0 11-2 0V9zm4 0a1 1 0 112 0v4a1 1 0 11-2 0V9z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* 项目描述 */}
      {project.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* 项目信息 */}
      <div className="text-xs text-gray-500 mb-3">
        创建于 {new Date(project.created_at).toLocaleDateString('zh-CN')}
      </div>

      {/* 操作按钮 */}
      <button
        onClick={onSelect}
        className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        进入项目
      </button>
    </div>
  );
}

// 创建项目表单组件
interface CreateProjectFormProps {
  onSubmit: (data: CreateProjectInput) => Promise<Project>;
  onCancel: () => void;
  loading: boolean;
}

function CreateProjectForm({ onSubmit, onCancel, loading }: CreateProjectFormProps) {
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    description: '',
    color: '#1976d2'
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '项目名称不能为空';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({ name: '', description: '', color: '#1976d2' });
      setErrors({});
    } catch (err) {
      // 错误已在父组件处理
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">创建新项目</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 项目名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                项目名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="输入项目名称"
                disabled={loading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 项目描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                项目描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入项目描述（可选）"
                disabled={loading}
              />
            </div>

            {/* 项目颜色 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                项目颜色
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  disabled={loading}
                />
                <span className="text-sm text-gray-600">{formData.color}</span>
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
                disabled={loading}
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? '创建中...' : '创建项目'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}