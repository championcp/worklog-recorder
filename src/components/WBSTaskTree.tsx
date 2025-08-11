'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { WBSTask, WBSTaskTree, CreateWBSTaskInput, UpdateWBSTaskInput } from '@/types/project';

interface WBSTaskTreeProps {
  projectId: number;
  onTaskSelect?: (task: WBSTask) => void;
  onBack?: () => void;
  projectName?: string;
}

export default function WBSTaskTreeComponent({ projectId, onTaskSelect, onBack, projectName }: WBSTaskTreeProps) {
  const [taskTree, setTaskTree] = useState<WBSTaskTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [parentTaskForCreate, setParentTaskForCreate] = useState<WBSTask | null>(null);
  const [editingTask, setEditingTask] = useState<WBSTask | null>(null);

  // 获取任务树
  const fetchTaskTree = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks?project_id=${projectId}&tree=true`);
      const data = await response.json();

      if (data.success) {
        setTaskTree(data.data.tasks);
      } else {
        setError(data.error?.message || '获取任务列表失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
      console.error('获取任务列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTaskTree();
  }, [fetchTaskTree]);

  // 切换节点展开状态
  const toggleExpanded = (taskId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedNodes(newExpanded);
  };

  // 展开所有节点
  const expandAll = () => {
    const allTaskIds = new Set<number>();
    const collectIds = (tasks: WBSTaskTree[]) => {
      tasks.forEach(task => {
        allTaskIds.add(task.id);
        if (task.children && task.children.length > 0) {
          collectIds(task.children);
        }
      });
    };
    collectIds(taskTree);
    setExpandedNodes(allTaskIds);
  };

  // 折叠所有节点
  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // 创建任务
  const createTask = async (taskData: CreateWBSTaskInput) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchTaskTree(); // 重新获取任务树
        setShowCreateForm(false);
        setParentTaskForCreate(null);
        return data.data.task;
      } else {
        throw new Error(data.error?.message || '创建任务失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建任务失败';
      setError(errorMessage);
      throw err;
    }
  };

  // 更新任务
  const updateTask = async (taskId: number, taskData: UpdateWBSTaskInput) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchTaskTree(); // 重新获取任务树
        setEditingTask(null);
        return data.data.task;
      } else {
        throw new Error(data.error?.message || '更新任务失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新任务失败';
      setError(errorMessage);
      throw err;
    }
  };

  // 删除任务
  const deleteTask = async (taskId: number) => {
    if (!confirm('确定要删除这个任务吗？删除后无法恢复。')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchTaskTree(); // 重新获取任务树
      } else {
        setError(data.error?.message || '删除任务失败');
      }
    } catch (err) {
      setError('删除任务失败');
      console.error('删除任务失败:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载任务列表...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 头部 */}
      <div className="p-6 border-b border-gray-200">
        {/* 返回按钮 */}
        {onBack && (
          <div className="mb-4">
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              ← 返回项目列表
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {projectName ? `${projectName} - WBS任务管理` : 'WBS任务管理'}
            </h3>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={expandAll}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              展开全部
            </button>
            <button
              onClick={collapseAll}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              折叠全部
            </button>
            <button
              onClick={() => {
                setParentTaskForCreate(null);
                setShowCreateForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              新建根任务
            </button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 任务树 */}
      <div className="p-6">
        {taskTree.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">暂无任务</h3>
            <p className="text-sm text-gray-500 mb-6">创建您的第一个任务来开始使用WBS管理</p>
            <button
              onClick={() => {
                setParentTaskForCreate(null);
                setShowCreateForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              创建任务
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {taskTree.map(task => (
              <TaskNode
                key={task.id}
                task={task}
                isExpanded={expandedNodes.has(task.id)}
                onToggleExpanded={toggleExpanded}
                onCreateChild={(parentTask) => {
                  setParentTaskForCreate(parentTask);
                  setShowCreateForm(true);
                }}
                onEdit={(task) => {
                  setEditingTask(task);
                }}
                onDelete={deleteTask}
                onSelect={onTaskSelect}
                depth={0}
                expandedNodes={expandedNodes}
              />
            ))}
          </div>
        )}
      </div>

      {/* 创建任务表单 */}
      {showCreateForm && (
        <CreateTaskForm
          projectId={projectId}
          parentTask={parentTaskForCreate}
          onSubmit={createTask}
          onCancel={() => {
            setShowCreateForm(false);
            setParentTaskForCreate(null);
          }}
        />
      )}

      {/* 编辑任务表单 */}
      {editingTask && (
        <EditTaskForm
          task={editingTask}
          onSubmit={(taskData) => updateTask(editingTask.id, taskData)}
          onCancel={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}

// 任务节点组件
interface TaskNodeProps {
  task: WBSTaskTree;
  isExpanded: boolean;
  onToggleExpanded: (taskId: number) => void;
  onCreateChild: (parentTask: WBSTask) => void;
  onEdit: (task: WBSTask) => void;
  onDelete: (taskId: number) => void;
  onSelect?: (task: WBSTask) => void;
  depth: number;
  expandedNodes: Set<number>;
}

function TaskNode({ 
  task, 
  isExpanded, 
  onToggleExpanded, 
  onCreateChild, 
  onEdit, 
  onDelete, 
  onSelect,
  depth,
  expandedNodes
}: TaskNodeProps) {
  const hasChildren = task.children && task.children.length > 0;
  const canAddChild = task.level < 3; // 最多3级

  // 状态颜色映射
  const statusColors = {
    'not_started': 'bg-gray-100 text-gray-700',
    'in_progress': 'bg-blue-100 text-blue-700',
    'completed': 'bg-green-100 text-green-700',
    'paused': 'bg-yellow-100 text-yellow-700',
    'cancelled': 'bg-red-100 text-red-700'
  };

  // 优先级颜色映射
  const priorityColors = {
    'low': 'text-gray-500',
    'medium': 'text-blue-500',
    'high': 'text-orange-500',
    'urgent': 'text-red-500'
  };

  return (
    <div>
      <div 
        className={`flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors ${
          depth > 0 ? 'ml-6 border-l-2 border-gray-200' : ''
        }`}
      >
        <div className="flex items-center flex-1 min-w-0">
          {/* 展开折叠按钮 */}
          {hasChildren ? (
            <button
              onClick={() => onToggleExpanded(task.id)}
              className="mr-2 p-1 rounded hover:bg-gray-200 transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6 mr-2"></div>
          )}

          {/* WBS编码 */}
          <span className="text-xs font-mono text-gray-500 mr-3 w-20 flex-shrink-0">
            {task.wbs_code}
          </span>

          {/* 任务名称 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {task.name}
              </h4>
              {task.description && (
                <span className="ml-2 text-xs text-gray-500" title={task.description}>
                  ℹ️
                </span>
              )}
            </div>
            <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
              <span className={priorityColors[task.priority]}>
                {task.priority === 'low' ? '低' : 
                 task.priority === 'medium' ? '中' : 
                 task.priority === 'high' ? '高' : '紧急'}
              </span>
              {task.estimated_hours && (
                <span>预估: {task.estimated_hours}h</span>
              )}
              {task.start_date && (
                <span>开始: {new Date(task.start_date).toLocaleDateString('zh-CN')}</span>
              )}
            </div>
          </div>
        </div>

        {/* 状态和进度 */}
        <div className="flex items-center space-x-3 ml-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
            {task.status === 'not_started' ? '未开始' :
             task.status === 'in_progress' ? '进行中' :
             task.status === 'completed' ? '已完成' :
             task.status === 'paused' ? '已暂停' : '已取消'}
          </span>
          
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${task.progress_percentage}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-600 w-8 text-right">
              {task.progress_percentage}%
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center space-x-1 ml-4">
          {canAddChild && (
            <button
              onClick={() => onCreateChild(task)}
              className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
              title="添加子任务"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
            title="编辑任务"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 rounded hover:bg-red-100 text-red-500 hover:text-red-700"
            title="删除任务"
          >
            🗑️
          </button>
          {onSelect && (
            <button
              onClick={() => onSelect(task)}
              className="p-1 rounded hover:bg-blue-100 text-blue-500 hover:text-blue-700"
              title="选择任务"
            >
              👆
            </button>
          )}
        </div>
      </div>

      {/* 子任务 */}
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {task.children!.map(child => (
            <TaskNode
              key={child.id}
              task={child}
              isExpanded={expandedNodes.has(child.id)}
              onToggleExpanded={onToggleExpanded}
              onCreateChild={onCreateChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onSelect={onSelect}
              depth={depth + 1}
              expandedNodes={expandedNodes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 创建任务表单组件
interface CreateTaskFormProps {
  projectId: number;
  parentTask: WBSTask | null;
  onSubmit: (data: CreateWBSTaskInput) => Promise<WBSTask>;
  onCancel: () => void;
}

function CreateTaskForm({ projectId, parentTask, onSubmit, onCancel }: CreateTaskFormProps) {
  const [formData, setFormData] = useState<CreateWBSTaskInput>({
    project_id: projectId,
    parent_id: parentTask?.id,
    name: '',
    description: '',
    level_type: parentTask ? getLowerLevelType(parentTask.level_type) : 'yearly',
    start_date: '',
    end_date: '',
    estimated_hours: undefined,
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  function getLowerLevelType(currentType: string): 'yearly' | 'half_yearly' | 'quarterly' | 'monthly' | 'weekly' | 'daily' {
    const hierarchy: {[key: string]: 'yearly' | 'half_yearly' | 'quarterly' | 'monthly' | 'weekly' | 'daily'} = {
      'yearly': 'half_yearly',
      'half_yearly': 'quarterly',
      'quarterly': 'monthly',
      'monthly': 'weekly',
      'weekly': 'daily',
      'daily': 'daily'
    };
    return hierarchy[currentType] || 'monthly';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '任务名称不能为空';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      setErrors({});
    } catch (err) {
      // 错误已在父组件处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {parentTask ? `在 "${parentTask.name}" 下创建子任务` : '创建根任务'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 任务名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                任务名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="输入任务名称"
                disabled={loading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 任务描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                任务描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入任务描述（可选）"
                disabled={loading}
              />
            </div>

            {/* 层级类型和优先级 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  层级类型
                </label>
                <select
                  value={formData.level_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, level_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="yearly">年度</option>
                  <option value="half_yearly">半年</option>
                  <option value="quarterly">季度</option>
                  <option value="monthly">月度</option>
                  <option value="weekly">周</option>
                  <option value="daily">日</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优先级
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
            </div>

            {/* 时间和工时 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始日期
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束日期
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  预估工时
                </label>
                <input
                  type="number"
                  min="0"
                  max="9999"
                  step="0.5"
                  value={formData.estimated_hours || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="小时"
                  disabled={loading}
                />
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
                {loading ? '创建中...' : '创建任务'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 编辑任务表单组件
interface EditTaskFormProps {
  task: WBSTask;
  onSubmit: (data: UpdateWBSTaskInput) => Promise<WBSTask>;
  onCancel: () => void;
}

function EditTaskForm({ task, onSubmit, onCancel }: EditTaskFormProps) {
  const [formData, setFormData] = useState<UpdateWBSTaskInput>({
    name: task.name,
    description: task.description || '',
    start_date: task.start_date || '',
    end_date: task.end_date || '',
    estimated_hours: task.estimated_hours,
    status: task.status,
    progress_percentage: task.progress_percentage,
    priority: task.priority
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = '任务名称不能为空';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      setErrors({});
    } catch (err) {
      // 错误已在父组件处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            编辑任务 - {task.name}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 任务名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                任务名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="输入任务名称"
                disabled={loading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 任务描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                任务描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入任务描述（可选）"
                disabled={loading}
              />
            </div>

            {/* 状态和优先级 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="not_started">未开始</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="paused">已暂停</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优先级
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
            </div>

            {/* 进度百分比 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                完成进度: {formData.progress_percentage}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, progress_percentage: parseInt(e.target.value) }))}
                className="w-full"
                disabled={loading}
              />
            </div>

            {/* 时间和工时 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始日期
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束日期
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  预估工时
                </label>
                <input
                  type="number"
                  min="0"
                  max="9999"
                  step="0.5"
                  value={formData.estimated_hours || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="小时"
                  disabled={loading}
                />
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
                {loading ? '更新中...' : '更新任务'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}