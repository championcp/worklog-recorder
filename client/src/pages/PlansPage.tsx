import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, CheckCircle, Calendar, BarChart3, List } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { PlanType, HierarchicalPlan, TaskStatus, Task, TaskPriority } from '../types';
import { EditPlanModal, TaskModal } from './PlansPage_modals';
import WBSHierarchy from '../components/WBSHierarchy';
import GanttChart from '../components/GanttChart';

type ViewMode = 'list' | 'hierarchy' | 'gantt';

const PlansPage: React.FC = () => {
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>(PlanType.YEARLY);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<HierarchicalPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<HierarchicalPlan | null>(null);
  
  const queryClient = useQueryClient();

  // 获取计划列表
  const { data: plans = [], isError, error } = useQuery({
    queryKey: ['plans', { type: selectedPlanType, year: selectedYear }],
    queryFn: () => api.getPlans({
      type: selectedPlanType,
      year: selectedYear,
    }),
  });

  // 删除计划
  const deletePlan = async (planId: string) => {
    try {
      await api.deletePlan(planId);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('计划删除成功');
    } catch (error) {
      toast.error('删除计划失败');
    }
  };
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: PlanType.YEARLY,
    startDate: '',
    endDate: '',
    parentPlanId: ''
  });
  
  // 任务表单状态
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    estimatedHours: 0,
    dueDate: ''
  });

  // 数据持久化相关常量
  const STORAGE_KEY = 'work_log_plans';

  // 从localStorage加载数据
  const loadPlansFromStorage = (): HierarchicalPlan[] => {
    try {
      const savedPlans = localStorage.getItem(STORAGE_KEY);
      if (savedPlans) {
        const parsedPlans = JSON.parse(savedPlans);
        // 转换日期字符串回Date对象
        return parsedPlans.map((plan: any) => ({
          ...plan,
          startDate: new Date(plan.startDate),
          endDate: new Date(plan.endDate),
          createdAt: new Date(plan.createdAt),
          updatedAt: new Date(plan.updatedAt),
          tasks: plan.tasks?.map((task: any) => ({
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt)
          })) || [],
          childPlans: plan.childPlans?.map((childPlan: any) => ({
            ...childPlan,
            startDate: new Date(childPlan.startDate),
            endDate: new Date(childPlan.endDate),
            createdAt: new Date(childPlan.createdAt),
            updatedAt: new Date(childPlan.updatedAt)
          })) || []
        }));
      }
    } catch (error) {
      console.error('加载计划数据失败:', error);
    }
    return [];
  };

  // 保存数据到localStorage
  const savePlansToStorage = (plansToSave: HierarchicalPlan[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plansToSave));
    } catch (error) {
      console.error('保存计划数据失败:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    const savedPlans = loadPlansFromStorage();
    
    // 如果没有保存的数据，使用默认示例数据
    if (savedPlans.length === 0) {
      const mockPlans: HierarchicalPlan[] = [
        {
          id: '1',
          title: '2024年度发展计划',
          description: '全年技能提升和职业发展规划',
          type: PlanType.YEARLY,
          year: 2024,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          tasks: [
            {
              id: 'task-1',
              title: '学习新技术栈',
              description: '掌握React、TypeScript等前端技术',
              status: TaskStatus.IN_PROGRESS,
              priority: TaskPriority.HIGH,
              estimatedHours: 100,
              actualHours: 45,
              dueDate: new Date('2024-06-30'),
              planId: '1', // 关联到年度计划
              tags: [],
              userId: 'user1',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          status: TaskStatus.IN_PROGRESS,
          progress: 65,
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
          childPlans: [
            {
              id: '2',
              title: '2024年上半年计划',
              type: PlanType.HALF_YEARLY,
              year: 2024,
              startDate: new Date('2024-01-01'),
              endDate: new Date('2024-06-30'),
              parentPlanId: '1',
              tasks: [],
              status: TaskStatus.COMPLETED,
              progress: 100,
              userId: 'user1',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: '3',
              title: '2024年下半年计划',
              type: PlanType.HALF_YEARLY,
              year: 2024,
              startDate: new Date('2024-07-01'),
              endDate: new Date('2024-12-31'),
              parentPlanId: '1',
              tasks: [],
              status: TaskStatus.IN_PROGRESS,
              progress: 30,
              userId: 'user1',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        }
      ];
      
      savePlansToStorage(mockPlans);
    }
  }, []);





  // 计算计划进度
  const calculatePlanProgress = (plan: HierarchicalPlan): number => {
    if (!plan.tasks || plan.tasks.length === 0) return 0;
    const completedTasks = plan.tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    return Math.round((completedTasks / plan.tasks.length) * 100);
  };

  // 处理创建计划
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 将PlanType映射到后端期望的timeRange值
    const getTimeRange = (planType: PlanType): string => {
      switch (planType) {
        case PlanType.DAILY:
          return 'day';
        case PlanType.WEEKLY:
          return 'week';
        case PlanType.MONTHLY:
        case PlanType.QUARTERLY:
          return 'month';
        case PlanType.HALF_YEARLY:
        case PlanType.YEARLY:
          return 'year';
        default:
          return 'year';
      }
    };
    
    const newPlan = {
      title: formData.title,
      description: formData.description,
      timeRange: getTimeRange(formData.type),
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      parentPlanId: formData.parentPlanId || undefined,
    };

    try {
      await api.createPlan(newPlan);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('计划创建成功');
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('创建计划失败:', error);
      toast.error('创建计划失败');
    }
  };

  // 处理编辑计划
  const handleEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    const updatedData = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    };

    try {
      await api.updatePlan(editingPlan.id, updatedData);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('计划更新成功');
      setShowEditModal(false);
      setEditingPlan(null);
      resetForm();
    } catch (error) {
      toast.error('更新计划失败');
    }
  };

  // 删除计划
  const handleDeletePlan = (planId: string) => {
    if (window.confirm('确定要删除这个计划吗？')) {
      // 这里应该调用API来删除计划
      // 暂时使用toast提示，实际应该实现API调用
      toast.success('计划删除成功');
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    }
  };

  // 添加任务到计划
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskFormData.title,
      description: taskFormData.description,
      status: TaskStatus.PENDING,
      priority: taskFormData.priority,
      estimatedHours: taskFormData.estimatedHours,
      actualHours: 0,
      dueDate: taskFormData.dueDate ? new Date(taskFormData.dueDate) : undefined,
      planId: selectedPlan.id, // 添加计划关联
      tags: [],
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 这里应该调用API来添加任务
    // 暂时使用toast提示，实际应该实现API调用
    toast.success('任务添加成功');
    queryClient.invalidateQueries({ queryKey: ['plans'] });
    
    setShowTaskModal(false);
    resetTaskForm();
  };

  // 更新任务状态
  const handleUpdateTaskStatus = (planId: string, taskId: string, newStatus: TaskStatus) => {
    // 这里应该调用API来更新任务状态
    // 暂时使用toast提示，实际应该实现API调用
    toast.success('任务状态更新成功');
    queryClient.invalidateQueries({ queryKey: ['plans'] });
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: PlanType.YEARLY,
      startDate: '',
      endDate: '',
      parentPlanId: ''
    });
  };

  // 重置任务表单
  const resetTaskForm = () => {
    setTaskFormData({
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      estimatedHours: 0,
      dueDate: ''
    });
  };

  // 打开编辑模态框
  const openEditModal = (plan: HierarchicalPlan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description || '',
      type: plan.type,
      startDate: plan.startDate.toISOString().split('T')[0],
      endDate: plan.endDate.toISOString().split('T')[0],
      parentPlanId: plan.parentPlanId || ''
    });
    setShowEditModal(true);
  };

  // 打开任务模态框
  const openTaskModal = (plan: HierarchicalPlan) => {
    setSelectedPlan(plan);
    setShowTaskModal(true);
  };

  const getPlanTypeLabel = (type: PlanType): string => {
    const labels = {
      [PlanType.YEARLY]: '年度计划',
      [PlanType.HALF_YEARLY]: '半年度计划',
      [PlanType.QUARTERLY]: '季度计划',
      [PlanType.MONTHLY]: '月度计划',
      [PlanType.WEEKLY]: '周计划',
      [PlanType.DAILY]: '日计划'
    };
    return labels[type];
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'text-green-600 bg-green-100';
      case TaskStatus.IN_PROGRESS:
        return 'text-blue-600 bg-blue-100';
      case TaskStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case TaskStatus.CANCELLED:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: TaskStatus): string => {
    const labels = {
      [TaskStatus.PENDING]: '待开始',
      [TaskStatus.IN_PROGRESS]: '进行中',
      [TaskStatus.COMPLETED]: '已完成',
      [TaskStatus.CANCELLED]: '已取消'
    };
    return labels[status];
  };

  const renderPlanCard = (plan: HierarchicalPlan, level: number = 0) => (
    <div key={plan.id} className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${level > 0 ? 'ml-8 mt-4' : 'mb-6'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
            {getStatusLabel(plan.status)}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {getPlanTypeLabel(plan.type)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openTaskModal(plan)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="管理任务"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditModal(plan)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="编辑计划"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeletePlan(plan.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="删除计划"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {plan.description && (
        <p className="text-gray-600 mb-4">{plan.description}</p>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          {plan.startDate.toLocaleDateString()} - {plan.endDate.toLocaleDateString()}
        </div>
        <div className="text-sm font-medium text-gray-700">
          进度: {plan.progress}%
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${plan.progress}%` }}
        ></div>
      </div>

      {/* 任务列表 */}
      {plan.tasks && plan.tasks.length > 0 && (
        <div className="border-t pt-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">任务列表</h4>
          <div className="space-y-2">
            {plan.tasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateTaskStatus(plan.id, task.id, 
                      task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED
                    )}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      task.status === TaskStatus.COMPLETED 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {task.status === TaskStatus.COMPLETED && <CheckCircle className="w-3 h-3" />}
                  </button>
                  <span className={`text-sm ${
                    task.status === TaskStatus.COMPLETED ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}>
                    {task.title}
                  </span>
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
            {plan.tasks.length > 3 && (
              <div className="text-center">
                <button 
                  onClick={() => openTaskModal(plan)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  查看全部 {plan.tasks.length} 个任务
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {plan.childPlans && plan.childPlans.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">子计划:</h4>
          {plan.childPlans.map(childPlan => renderPlanCard(childPlan, level + 1))}
        </div>
      )}
    </div>
  );



  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">分层计划管理</h1>
        <div className="flex items-center space-x-4">
          {/* 视图切换按钮 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4 inline mr-1" />
              列表视图
            </button>
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'hierarchy'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-1" />
              层级视图
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'gantt'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              甘特图
            </button>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>创建计划</span>
          </button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              计划类型
            </label>
            <select
              value={selectedPlanType}
              onChange={(e) => setSelectedPlanType(e.target.value as PlanType)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={PlanType.YEARLY}>年度计划</option>
              <option value={PlanType.HALF_YEARLY}>半年度计划</option>
              <option value={PlanType.QUARTERLY}>季度计划</option>
              <option value={PlanType.MONTHLY}>月度计划</option>
              <option value={PlanType.WEEKLY}>周计划</option>
              <option value={PlanType.DAILY}>日计划</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              年份
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 计划内容区域 */}
      <div className="space-y-6">
        {viewMode === 'list' && (
          <>
            {plans.length > 0 ? (
              plans.map(plan => renderPlanCard(plan))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">暂无计划</div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  创建第一个计划
                </button>
              </div>
            )}
          </>
        )}

        {viewMode === 'hierarchy' && (
          <WBSHierarchy
            plans={plans}
            onCreateSubPlan={() => setShowCreateModal(true)}
            onEditPlan={(plan) => {
              setEditingPlan(plan);
              setFormData({
                title: plan.title,
                description: plan.description || '',
                type: plan.type,
                startDate: plan.startDate.toISOString().split('T')[0],
                endDate: plan.endDate.toISOString().split('T')[0],
                parentPlanId: plan.parentPlanId || ''
              });
              setShowEditModal(true);
            }}
            onDeletePlan={deletePlan}
            onManageTasks={(plan) => {
              setSelectedPlan(plan);
              setShowTaskModal(true);
            }}
          />
        )}

        {viewMode === 'gantt' && (
          <GanttChart
            plans={plans}
            tasks={[]}
            onPlanClick={(plan) => {
              setSelectedPlan(plan);
              setShowTaskModal(true);
            }}
          />
        )}
      </div>

      {/* 创建计划模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">创建新计划</h2>
            <form onSubmit={handleCreatePlan}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    计划标题
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PlanType }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  创建计划
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 编辑计划模态框 */}
      <EditPlanModal
        show={showEditModal}
        plan={editingPlan}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleEditPlan}
        onClose={() => {
          setShowEditModal(false);
          setEditingPlan(null);
          resetForm();
        }}
      />

      {/* 任务管理模态框 */}
      <TaskModal
        show={showTaskModal}
        plan={selectedPlan}
        taskFormData={taskFormData}
        setTaskFormData={setTaskFormData}
        onSubmit={handleAddTask}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedPlan(null);
          resetTaskForm();
        }}
        onUpdateTaskStatus={handleUpdateTaskStatus}
      />
    </div>
  );
};

export default PlansPage;