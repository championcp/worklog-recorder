import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, Calendar, Tag, Users } from 'lucide-react';
import { Task, Category, Tag as TagType } from '../types';

interface TaskHierarchyProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  isDeleting?: boolean;
}

interface TaskNodeProps {
  task: Task;
  level: number;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  expandedTasks: Set<string>;
  onToggleExpand: (taskId: string) => void;
  isDeleting?: boolean;
}

const TaskNode: React.FC<TaskNodeProps> = ({
  task,
  level,
  onEditTask,
  onDeleteTask,
  expandedTasks,
  onToggleExpand,
  isDeleting = false,
}) => {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isExpanded = expandedTasks.has(task.id);
  const indentWidth = level * 24; // 每级缩进24px

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '进行中';
      case 'pending':
        return '待开始';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const calculateProgress = (task: Task): number => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task.status === 'completed' ? 100 : 0;
    }

    const completedSubtasks = task.subtasks.filter(subtask => subtask.status === 'completed').length;
    return Math.round((completedSubtasks / task.subtasks.length) * 100);
  };

  const progress = calculateProgress(task);

  return (
    <div className="border-l-2 border-gray-200">
      {/* 主任务行 */}
      <div 
        className="flex items-center py-3 px-4 hover:bg-gray-50 border-b border-gray-100"
        style={{ paddingLeft: `${16 + indentWidth}px` }}
      >
        {/* 展开/收起按钮 */}
        <div className="w-6 h-6 flex items-center justify-center mr-2">
          {hasSubtasks ? (
            <button
              onClick={() => onToggleExpand(task.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>

        {/* 任务信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {task.title}
                </h3>
                {hasSubtasks && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    <Users className="h-3 w-3 mr-1" />
                    {task.subtasks!.length}
                  </span>
                )}
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-500 truncate mt-1">
                  {task.description}
                </p>
              )}

              {/* 标签 */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.map((tag: TagType) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* 进度条（仅对有子任务的任务显示） */}
              {hasSubtasks && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 min-w-0">
                      {progress}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 状态和优先级 */}
            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                {getStatusText(task.status)}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                {getPriorityText(task.priority)}
              </span>
            </div>

            {/* 截止日期 */}
            <div className="text-sm text-gray-500 min-w-0">
              {task.dueDate ? (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                </div>
              ) : (
                '-'
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onEditTask(task)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="编辑任务"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="删除任务"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 子任务 */}
      {hasSubtasks && isExpanded && (
        <div className="bg-gray-50">
          {task.subtasks!.map((subtask) => (
            <TaskNode
              key={subtask.id}
              task={subtask}
              level={level + 1}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              expandedTasks={expandedTasks}
              onToggleExpand={onToggleExpand}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TaskHierarchy: React.FC<TaskHierarchyProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  isDeleting = false,
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const handleToggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleExpandAll = () => {
    const allTaskIds = new Set<string>();
    
    const collectTaskIds = (taskList: Task[]) => {
      taskList.forEach(task => {
        if (task.subtasks && task.subtasks.length > 0) {
          allTaskIds.add(task.id);
          collectTaskIds(task.subtasks);
        }
      });
    };
    
    collectTaskIds(tasks);
    setExpandedTasks(allTaskIds);
  };

  const handleCollapseAll = () => {
    setExpandedTasks(new Set());
  };

  // 只显示顶级任务（没有父任务的任务）
  const topLevelTasks = tasks.filter(task => !task.parentTaskId);

  if (topLevelTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">暂无任务</div>
        <p className="text-gray-500">点击上方按钮创建第一个任务</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900">任务层级视图</h3>
            <span className="text-sm text-gray-500">
              ({topLevelTasks.length} 个顶级任务)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExpandAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              展开全部
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleCollapseAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              收起全部
            </button>
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="divide-y divide-gray-200">
        {topLevelTasks.map((task) => (
          <TaskNode
            key={task.id}
            task={task}
            level={0}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            expandedTasks={expandedTasks}
            onToggleExpand={handleToggleExpand}
            isDeleting={isDeleting}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskHierarchy;