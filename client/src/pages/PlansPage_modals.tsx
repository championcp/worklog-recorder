import React from 'react';
import { PlanType, TaskStatus, HierarchicalPlan, Task, TaskPriority } from '../types';
import { X } from 'lucide-react';

interface EditPlanModalProps {
  show: boolean;
  plan: HierarchicalPlan | null;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const EditPlanModal: React.FC<EditPlanModalProps> = ({
  show,
  plan,
  formData,
  setFormData,
  onSubmit,
  onClose
}) => {
  if (!show || !plan) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">编辑计划</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                计划标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                计划描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                计划类型
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, type: e.target.value as PlanType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={PlanType.YEARLY}>年度计划</option>
                <option value={PlanType.HALF_YEARLY}>半年度计划</option>
                <option value={PlanType.QUARTERLY}>季度计划</option>
                <option value={PlanType.MONTHLY}>月度计划</option>
                <option value={PlanType.WEEKLY}>周计划</option>
                <option value={PlanType.DAILY}>日计划</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始日期
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束日期
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              保存更改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TaskModalProps {
  show: boolean;
  plan: HierarchicalPlan | null;
  taskFormData: any;
  setTaskFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onUpdateTaskStatus: (planId: string, taskId: string, status: TaskStatus) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  show,
  plan,
  taskFormData,
  setTaskFormData,
  onSubmit,
  onClose,
  onUpdateTaskStatus
}) => {
  if (!show || !plan) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">管理任务 - {plan.title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 现有任务列表 */}
        {plan.tasks && plan.tasks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">现有任务</h3>
            <div className="space-y-2">
              {plan.tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onUpdateTaskStatus(plan.id, task.id, 
                        task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED
                      )}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        task.status === TaskStatus.COMPLETED 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {task.status === TaskStatus.COMPLETED && '✓'}
                    </button>
                    <div>
                      <div className={`font-medium ${
                        task.status === TaskStatus.COMPLETED ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-gray-600">{task.description}</div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>预计: {task.estimatedHours}h</span>
                        <span>实际: {task.actualHours}h</span>
                        {task.dueDate && (
                          <span>截止: {task.dueDate.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    task.priority === TaskPriority.HIGH ? 'bg-red-100 text-red-800' :
                    task.priority === TaskPriority.MEDIUM ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority === TaskPriority.HIGH ? '高' : task.priority === TaskPriority.MEDIUM ? '中' : '低'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 添加新任务表单 */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">添加新任务</h3>
          <form onSubmit={onSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务标题
                </label>
                <input
                  type="text"
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData((prev: any) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务描述
                </label>
                <textarea
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    优先级
                  </label>
                  <select
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData((prev: any) => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={TaskPriority.LOW}>低</option>
                    <option value={TaskPriority.MEDIUM}>中</option>
                    <option value={TaskPriority.HIGH}>高</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    预计工时
                  </label>
                  <input
                    type="number"
                    value={taskFormData.estimatedHours}
                    onChange={(e) => setTaskFormData((prev: any) => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    截止日期
                  </label>
                  <input
                    type="date"
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData((prev: any) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                关闭
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                添加任务
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};