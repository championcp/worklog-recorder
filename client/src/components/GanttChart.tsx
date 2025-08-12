import React, { useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { HierarchicalPlan, Task, TaskStatus, PlanType } from '../types';
import { Calendar, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface GanttChartProps {
  plans: HierarchicalPlan[];
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onPlanClick?: (plan: HierarchicalPlan) => void;
}

type ViewMode = 'day' | 'week' | 'month';

interface GanttItem {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  type: 'plan' | 'task';
  status: TaskStatus;
  planType?: PlanType;
  level: number;
  parentId?: string;
}

const GanttChart: React.FC<GanttChartProps> = ({
  plans,
  tasks,
  onTaskClick,
  onPlanClick
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // 将计划和任务转换为甘特图项目
  const ganttItems = useMemo(() => {
    const items: GanttItem[] = [];

    const addPlanItems = (planList: HierarchicalPlan[], level: number = 0) => {
      planList.forEach(plan => {
        items.push({
          id: plan.id,
          title: plan.title,
          startDate: plan.startDate,
          endDate: plan.endDate,
          progress: plan.progress,
          type: 'plan',
          status: plan.status,
          planType: plan.type,
          level,
          parentId: plan.parentPlanId
        });

        // 添加计划下的任务
        if (plan.tasks) {
          plan.tasks.forEach(task => {
            items.push({
              id: task.id,
              title: task.title,
              startDate: task.createdAt,
              endDate: task.dueDate || task.createdAt,
              progress: task.status === TaskStatus.COMPLETED ? 100 : 
                       task.status === TaskStatus.IN_PROGRESS ? 50 : 0,
              type: 'task',
              status: task.status,
              level: level + 1,
              parentId: plan.id
            });
          });
        }

        // 递归添加子计划
        if (plan.childPlans) {
          addPlanItems(plan.childPlans, level + 1);
        }
      });
    };

    addPlanItems(plans);
    return items;
  }, [plans, tasks]);

  // 计算时间范围
  const timeRange = useMemo(() => {
    if (ganttItems.length === 0) {
      const today = new Date();
      return {
        start: startOfWeek(today, { locale: zhCN }),
        end: endOfWeek(today, { locale: zhCN })
      };
    }

    const allDates = ganttItems.flatMap(item => [item.startDate, item.endDate]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    switch (viewMode) {
      case 'day':
        return {
          start: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 3),
          end: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 10)
        };
      case 'week':
        return {
          start: startOfWeek(minDate, { locale: zhCN }),
          end: endOfWeek(maxDate, { locale: zhCN })
        };
      case 'month':
        return {
          start: new Date(minDate.getFullYear(), minDate.getMonth() - 1, 1),
          end: new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0)
        };
      default:
        return { start: minDate, end: maxDate };
    }
  }, [ganttItems, viewMode, currentDate]);

  // 生成时间列
  const timeColumns = useMemo(() => {
    return eachDayOfInterval({ start: timeRange.start, end: timeRange.end });
  }, [timeRange]);

  const getStatusColor = (status: TaskStatus, type: 'plan' | 'task'): string => {
    const baseColors = {
      [TaskStatus.COMPLETED]: type === 'plan' ? 'bg-green-500' : 'bg-green-400',
      [TaskStatus.IN_PROGRESS]: type === 'plan' ? 'bg-blue-500' : 'bg-blue-400',
      [TaskStatus.PENDING]: type === 'plan' ? 'bg-yellow-500' : 'bg-yellow-400',
      [TaskStatus.CANCELLED]: type === 'plan' ? 'bg-red-500' : 'bg-red-400'
    };
    return baseColors[status];
  };

  const getPlanTypeColor = (planType?: PlanType): string => {
    if (!planType) return 'bg-gray-500';
    
    const colors = {
      [PlanType.YEARLY]: 'bg-purple-600',
      [PlanType.HALF_YEARLY]: 'bg-indigo-600',
      [PlanType.QUARTERLY]: 'bg-blue-600',
      [PlanType.MONTHLY]: 'bg-green-600',
      [PlanType.WEEKLY]: 'bg-yellow-600',
      [PlanType.DAILY]: 'bg-orange-600'
    };
    return colors[planType];
  };

  const calculateBarPosition = (item: GanttItem) => {
    const totalDays = timeColumns.length;
    const startIndex = timeColumns.findIndex(date => 
      isSameDay(date, item.startDate) || date >= item.startDate
    );
    const endIndex = timeColumns.findIndex(date => 
      isSameDay(date, item.endDate) || date >= item.endDate
    );

    if (startIndex === -1 || endIndex === -1) return null;

    const left = (startIndex / totalDays) * 100;
    const width = ((endIndex - startIndex + 1) / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  const navigateTime = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 14 : -14));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="gantt-chart bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            甘特图
          </h3>
          
          {/* 视图模式切换 */}
          <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 p-1">
            {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {mode === 'day' ? '日' : mode === 'week' ? '周' : '月'}
              </button>
            ))}
          </div>
        </div>

        {/* 时间导航 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateTime('prev')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
            {format(timeRange.start, 'yyyy年MM月dd日', { locale: zhCN })} - {format(timeRange.end, 'MM月dd日', { locale: zhCN })}
          </span>
          <button
            onClick={() => navigateTime('next')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            今天
          </button>
        </div>
      </div>

      {/* 甘特图主体 */}
      <div className="flex">
        {/* 左侧任务列表 */}
        <div className="w-80 border-r border-gray-200 bg-gray-50">
          <div className="p-3 border-b border-gray-200 bg-gray-100">
            <h4 className="font-medium text-gray-900">任务/计划</h4>
          </div>
          <div className="overflow-y-auto max-h-96">
            {ganttItems.map(item => (
              <div
                key={item.id}
                className={`p-3 border-b border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors ${
                  item.level > 0 ? 'pl-' + (3 + item.level * 4) : ''
                }`}
                style={{ paddingLeft: `${12 + item.level * 16}px` }}
                onClick={() => {
                  if (item.type === 'plan' && onPlanClick) {
                    const plan = plans.find(p => p.id === item.id);
                    if (plan) onPlanClick(plan);
                  } else if (item.type === 'task' && onTaskClick) {
                    const task = tasks.find(t => t.id === item.id);
                    if (task) onTaskClick(task);
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item.type === 'plan' 
                        ? getPlanTypeColor(item.planType)
                        : getStatusColor(item.status, item.type)
                    }`}
                  />
                  <span className={`text-sm ${item.type === 'plan' ? 'font-medium' : ''} text-gray-900 truncate`}>
                    {item.title}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {item.progress}% 完成
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧时间轴和甘特条 */}
        <div className="flex-1 overflow-x-auto">
          {/* 时间轴头部 */}
          <div className="flex border-b border-gray-200 bg-gray-100 sticky top-0 z-10">
            {timeColumns.map(date => (
              <div
                key={date.toISOString()}
                className="flex-1 min-w-[40px] p-2 text-center border-r border-gray-200 last:border-r-0"
              >
                <div className="text-xs font-medium text-gray-900">
                  {format(date, 'MM/dd', { locale: zhCN })}
                </div>
                <div className="text-xs text-gray-500">
                  {format(date, 'EEE', { locale: zhCN })}
                </div>
              </div>
            ))}
          </div>

          {/* 甘特条 */}
          <div className="relative">
            {ganttItems.map((item, index) => {
              const position = calculateBarPosition(item);
              if (!position) return null;

              return (
                <div
                  key={item.id}
                  className="flex items-center h-12 border-b border-gray-100 relative"
                  style={{ paddingLeft: `${item.level * 16}px` }}
                >
                  {/* 时间网格背景 */}
                  <div className="absolute inset-0 flex">
                    {timeColumns.map(date => (
                      <div
                        key={date.toISOString()}
                        className="flex-1 min-w-[40px] border-r border-gray-100 last:border-r-0"
                      />
                    ))}
                  </div>

                  {/* 甘特条 */}
                  <div
                    className={`absolute h-6 rounded ${
                      item.type === 'plan'
                        ? getPlanTypeColor(item.planType)
                        : getStatusColor(item.status, item.type)
                    } opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                    style={position}
                    onClick={() => {
                      if (item.type === 'plan' && onPlanClick) {
                        const plan = plans.find(p => p.id === item.id);
                        if (plan) onPlanClick(plan);
                      } else if (item.type === 'task' && onTaskClick) {
                        const task = tasks.find(t => t.id === item.id);
                        if (task) onTaskClick(task);
                      }
                    }}
                  >
                    {/* 进度条 */}
                    <div
                      className="h-full bg-white bg-opacity-30 rounded"
                      style={{ width: `${item.progress}%` }}
                    />
                    
                    {/* 标题 */}
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-xs font-medium text-white truncate">
                        {item.title}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-700">计划类型:</span>
            {Object.entries({
              [PlanType.YEARLY]: '年度',
              [PlanType.HALF_YEARLY]: '半年',
              [PlanType.QUARTERLY]: '季度',
              [PlanType.MONTHLY]: '月度',
              [PlanType.WEEKLY]: '周',
              [PlanType.DAILY]: '日'
            }).map(([type, label]) => (
              <div key={type} className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded ${getPlanTypeColor(type as PlanType)}`} />
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-700">任务状态:</span>
            {Object.entries({
              [TaskStatus.PENDING]: '待开始',
              [TaskStatus.IN_PROGRESS]: '进行中',
              [TaskStatus.COMPLETED]: '已完成',
              [TaskStatus.CANCELLED]: '已取消'
            }).map(([status, label]) => (
              <div key={status} className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded ${getStatusColor(status as TaskStatus, 'task')}`} />
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;