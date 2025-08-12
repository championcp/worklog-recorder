import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit3, Trash2, Calendar, Clock, FolderOpen, CheckCircle, AlertCircle, Circle } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, Category, Tag as TagType } from '../types';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import TaskModal from '../components/TaskModal';

// 扩展Task类型以包含children属性
interface TaskWithChildren extends Task {
  children?: TaskWithChildren[];
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 获取任务列表
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: api.getTasks,
  });

  // 获取分类列表
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  });

  // 获取标签列表
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: api.getTags,
  });

  // 删除任务
  const deleteTaskMutation = useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('任务删除成功');
    }
  });

  // 创建任务
  const createTaskMutation = useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowCreateModal(false);
      toast.success('任务创建成功');
    }
  });

  // 更新任务
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => api.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowEditModal(false);
      setEditingTask(null);
      toast.success('任务更新成功');
    }
  });

  // 处理 mutation 错误
  React.useEffect(() => {
    if (deleteTaskMutation.error) {
      toast.error('删除任务失败');
    }
    if (createTaskMutation.error) {
      toast.error('创建任务失败');
    }
    if (updateTaskMutation.error) {
      toast.error('更新任务失败');
    }
  }, [deleteTaskMutation.error, createTaskMutation.error, updateTaskMutation.error]);

  // 处理编辑任务
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  // 处理创建任务提交
  const handleCreateTask = (taskData: Partial<Task>) => {
    createTaskMutation.mutate(taskData);
  };

  // 处理更新任务提交
  const handleUpdateTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data: taskData });
    }
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingTask(null);
  };

  // 构建层级结构
  const buildHierarchy = (tasks: Task[]): TaskWithChildren[] => {
    const taskMap = new Map<string, TaskWithChildren>();
    const rootTasks: TaskWithChildren[] = [];

    // 创建任务映射
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [] });
    });

    // 构建层级关系
    tasks.forEach(task => {
      const taskWithChildren = taskMap.get(task.id)!;
      if (task.parentTaskId) {
        const parent = taskMap.get(task.parentTaskId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(taskWithChildren);
        } else {
          rootTasks.push(taskWithChildren);
        }
      } else {
        rootTasks.push(taskWithChildren);
      }
    });

    return rootTasks;
  };

  // 过滤任务
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // 优先级过滤
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // 分类过滤
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.categoryId === categoryFilter);
    }

    return buildHierarchy(filtered);
  }, [tasks, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  // 获取状态图标
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  // 获取状态文本
  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '进行中';
      default:
        return '待开始';
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // 获取优先级文本
  const getPriorityText = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return '高优先级';
      case 'medium':
        return '中优先级';
      default:
        return '低优先级';
    }
  };

  // 渲染任务卡片
  const renderTaskCard = (task: TaskWithChildren, level: number = 0) => {
    const category = categories.find((cat: Category) => cat.id === task.categoryId);
    const taskTags = task.tags || [];

    return (
      <div key={task.id} className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${level > 0 ? 'ml-6 mt-2' : 'mb-4'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                {getStatusIcon(task.status)}
                <span className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </span>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {getPriorityText(task.priority)}
              </div>
              {category && (
                <div className="flex items-center gap-1 text-gray-600">
                  <FolderOpen className="w-3 h-3" />
                  <span className="text-xs">{category.name}</span>
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
            {task.description && (
              <p className="text-gray-600 text-sm mb-3">{task.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            {taskTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {taskTags.map((tag: TagType | undefined) => {
                  if (!tag) return null;
                  return (
                    <span key={tag.id} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                      {tag.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => handleEditTask(task)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteTaskMutation.mutate(task.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* 渲染子任务 */}
        {task.children && task.children.length > 0 && (
          <div className="mt-4">
            {task.children.map((childTask: TaskWithChildren) => renderTaskCard(childTask, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (tasksLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">任务管理</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建任务
        </button>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索任务..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有状态</option>
            <option value="pending">待开始</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有优先级</option>
            <option value="low">低优先级</option>
            <option value="medium">中优先级</option>
            <option value="high">高优先级</option>
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有分类</option>
            {categories.map((category: Category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">暂无任务</div>
            <p className="text-gray-500">点击上方按钮创建您的第一个任务</p>
          </div>
        ) : (
          filteredTasks.map((task: TaskWithChildren) => renderTaskCard(task))
        )}
      </div>

      {/* 创建任务模态框 */}
      <TaskModal
        show={showCreateModal}
        categories={categories}
        tags={tags}
        onSubmit={handleCreateTask}
        onClose={handleCloseModal}
        isLoading={createTaskMutation.isPending}
      />

      {/* 编辑任务模态框 */}
      <TaskModal
        show={showEditModal}
        task={editingTask}
        categories={categories}
        tags={tags}
        onSubmit={handleUpdateTask}
        onClose={handleCloseModal}
        isLoading={updateTaskMutation.isPending}
      />
    </div>
  );
}