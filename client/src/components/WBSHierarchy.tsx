import React, { useState, useCallback } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit3, 
  Trash2, 
  Target,
  Calendar,
  BarChart3,
  Users,
  Clock
} from 'lucide-react';
import { HierarchicalPlan, PlanType, TaskStatus } from '../types';

interface WBSHierarchyProps {
  plans: HierarchicalPlan[];
  onCreateSubPlan: (parentPlan: HierarchicalPlan) => void;
  onEditPlan: (plan: HierarchicalPlan) => void;
  onDeletePlan: (planId: string) => void;
  onManageTasks: (plan: HierarchicalPlan) => void;
}

interface WBSNodeProps {
  plan: HierarchicalPlan;
  level: number;
  isExpanded: boolean;
  onToggleExpand: (planId: string) => void;
  onCreateSubPlan: (parentPlan: HierarchicalPlan) => void;
  onEditPlan: (plan: HierarchicalPlan) => void;
  onDeletePlan: (planId: string) => void;
  onManageTasks: (plan: HierarchicalPlan) => void;
}

const WBSNode: React.FC<WBSNodeProps> = ({
  plan,
  level,
  isExpanded,
  onToggleExpand,
  onCreateSubPlan,
  onEditPlan,
  onDeletePlan,
  onManageTasks
}) => {
  const hasChildren = plan.childPlans && plan.childPlans.length > 0;
  const indentWidth = level * 24;

  const getPlanTypeColor = (type: PlanType): string => {
    switch (type) {
      case PlanType.YEARLY:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case PlanType.HALF_YEARLY:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case PlanType.QUARTERLY:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case PlanType.MONTHLY:
        return 'bg-green-100 text-green-800 border-green-200';
      case PlanType.WEEKLY:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case PlanType.DAILY:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlanTypeLabel = (type: PlanType): string => {
    const labels = {
      [PlanType.YEARLY]: '年度',
      [PlanType.HALF_YEARLY]: '半年',
      [PlanType.QUARTERLY]: '季度',
      [PlanType.MONTHLY]: '月度',
      [PlanType.WEEKLY]: '周',
      [PlanType.DAILY]: '日'
    };
    return labels[type];
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="wbs-node">
      <div 
        className="flex items-center py-3 px-4 hover:bg-gray-50 border-l-4 border-transparent hover:border-blue-300 transition-all duration-200"
        style={{ paddingLeft: `${16 + indentWidth}px` }}
      >
        {/* 展开/收起按钮 */}
        <button
          onClick={() => onToggleExpand(plan.id)}
          className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        {/* 计划信息 */}
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* 计划标题 */}
            <h4 className="font-medium text-gray-900">{plan.title}</h4>
            
            {/* 计划类型标签 */}
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPlanTypeColor(plan.type)}`}>
              {getPlanTypeLabel(plan.type)}
            </span>
            
            {/* 状态标签 */}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(plan.status)}`}>
              {getStatusLabel(plan.status)}
            </span>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {/* 任务数量 */}
            <div className="flex items-center space-x-1">
              <Target className="w-4 h-4" />
              <span>{plan.tasks?.length || 0}</span>
            </div>
            
            {/* 进度 */}
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${plan.progress}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium">{plan.progress}%</span>
            </div>
            
            {/* 时间范围 */}
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">
                {plan.startDate.toLocaleDateString()} - {plan.endDate.toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center space-x-1 ml-4">
            <button
              onClick={() => onCreateSubPlan(plan)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="创建子计划"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onManageTasks(plan)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="管理任务"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEditPlan(plan)}
              className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
              title="编辑计划"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeletePlan(plan.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="删除计划"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 子计划 */}
      {hasChildren && isExpanded && (
        <div className="border-l border-gray-200 ml-4">
          {plan.childPlans!.map(childPlan => (
            <WBSNode
              key={childPlan.id}
              plan={childPlan}
              level={level + 1}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              onCreateSubPlan={onCreateSubPlan}
              onEditPlan={onEditPlan}
              onDeletePlan={onDeletePlan}
              onManageTasks={onManageTasks}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const WBSHierarchy: React.FC<WBSHierarchyProps> = ({
  plans,
  onCreateSubPlan,
  onEditPlan,
  onDeletePlan,
  onManageTasks
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleToggleExpand = useCallback((planId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  }, []);

  const expandAll = () => {
    const allPlanIds = new Set<string>();
    const collectPlanIds = (planList: HierarchicalPlan[]) => {
      planList.forEach(plan => {
        allPlanIds.add(plan.id);
        if (plan.childPlans) {
          collectPlanIds(plan.childPlans);
        }
      });
    };
    collectPlanIds(plans);
    setExpandedNodes(allPlanIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无计划</h3>
        <p className="text-gray-600">开始创建您的第一个计划吧</p>
      </div>
    );
  }

  return (
    <div className="wbs-hierarchy bg-white rounded-lg border border-gray-200">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">WBS 工作分解结构</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            展开全部
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
          >
            收起全部
          </button>
        </div>
      </div>

      {/* 层级结构 */}
      <div className="divide-y divide-gray-100">
        {plans.map(plan => (
          <WBSNode
            key={plan.id}
            plan={plan}
            level={0}
            isExpanded={expandedNodes.has(plan.id)}
            onToggleExpand={handleToggleExpand}
            onCreateSubPlan={onCreateSubPlan}
            onEditPlan={onEditPlan}
            onDeletePlan={onDeletePlan}
            onManageTasks={onManageTasks}
          />
        ))}
      </div>
    </div>
  );
};

export default WBSHierarchy;