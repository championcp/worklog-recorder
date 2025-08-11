// Sprint 5 数据分析相关类型定义
export interface DashboardConfig {
  id: number;
  userId: number;
  name: string;
  description?: string;
  layout: DashboardLayout;
  isDefault: boolean;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardLayout {
  items: DashboardItem[];
}

export interface DashboardItem {
  i: string;          // 小部件唯一ID
  x: number;          // X坐标
  y: number;          // Y坐标
  w: number;          // 宽度
  h: number;          // 高度
  config: WidgetConfig;
  static?: boolean;   // 是否静态(不可拖拽)
  minW?: number;      // 最小宽度
  minH?: number;      // 最小高度
}

export interface WidgetConfig {
  type: WidgetType;
  title: string;
  refresh?: number;   // 刷新间隔(秒)
  filters?: Record<string, any>;
  settings?: Record<string, any>;
}

export type WidgetType = 
  | 'overview'
  | 'project_progress'
  | 'time_analysis'
  | 'task_summary'
  | 'activity_feed'
  | 'time_heatmap'
  | 'efficiency_chart'
  | 'workload_distribution';

// 仪表板数据接口
export interface DashboardData {
  overview: {
    totalProjects: number;
    activeProjects: number;
    completedTasks: number;
    totalHours: number;
    efficiencyScore: number;
  };
  projectProgress: ProjectProgressData[];
  recentActivity: ActivityData[];
  timeDistribution: TimeDistributionData[];
}

export interface ProjectProgressData {
  projectId: number;
  projectName: string;
  progress: number;        // 0-100
  status: 'on_track' | 'at_risk' | 'delayed';
  remainingTasks: number;
  estimatedCompletion: string;
  color: string;
}

export interface ActivityData {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  userId: number;
  username: string;
  avatar?: string;
}

export interface TimeDistributionData {
  projectId: number;
  projectName: string;
  hours: number;
  percentage: number;
  color: string;
}

// 时间分析相关类型
export interface TimeAnalysisData {
  type: 'heatmap' | 'trend' | 'distribution';
  heatmapData?: HeatmapPoint[];
  trendData?: TrendPoint[];
  distributionData?: DistributionData[];
  insights: TimeInsights;
}

export interface HeatmapPoint {
  date: string;
  hour: number;
  value: number;        // 工作时长(分钟)
  taskCount: number;
}

export interface TrendPoint {
  date: string;
  hours: number;
  tasks: number;
  efficiency: number;
}

export interface DistributionData {
  category: string;     // 项目名或分类
  hours: number;
  percentage: number;
  color: string;
}

export interface TimeInsights {
  totalHours: number;
  averageDailyHours: number;
  peakHours: string[];        // ["14:00", "15:00"]
  mostProductiveDay: string;  // "Tuesday"
  efficiencyScore: number;
  recommendations: string[];
}

// 小部件定义
export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  category: 'overview' | 'project' | 'time' | 'team';
  defaultSize: {
    w: number;
    h: number;
  };
  minSize: {
    w: number;
    h: number;
  };
  configurable: boolean;
  refreshable: boolean;
}

// API请求和响应类型
export interface DashboardDataRequest {
  timeRange?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  projectIds?: number[];
  refresh?: boolean;
}

export interface CreateDashboardRequest {
  name: string;
  description?: string;
  layout: DashboardLayout;
  isDefault?: boolean;
}

export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  layout?: DashboardLayout;
  isDefault?: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

// 小部件库配置
export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    type: 'overview',
    name: '概览统计',
    description: '显示项目总数、完成任务数等关键指标',
    icon: 'BarChart3',
    category: 'overview',
    defaultSize: { w: 12, h: 3 },
    minSize: { w: 6, h: 2 },
    configurable: true,
    refreshable: true
  },
  {
    type: 'project_progress',
    name: '项目进度',
    description: '显示所有项目的进度和状态',
    icon: 'TrendingUp',
    category: 'project',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    configurable: true,
    refreshable: true
  },
  {
    type: 'time_analysis',
    name: '时间分析',
    description: '显示时间使用趋势和分布',
    icon: 'Clock',
    category: 'time',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    configurable: true,
    refreshable: true
  },
  {
    type: 'task_summary',
    name: '任务汇总',
    description: '显示任务完成情况和待办事项',
    icon: 'CheckSquare',
    category: 'project',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    configurable: false,
    refreshable: true
  },
  {
    type: 'activity_feed',
    name: '活动流',
    description: '显示最新的项目活动和更新',
    icon: 'Activity',
    category: 'overview',
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 4 },
    configurable: true,
    refreshable: true
  },
  {
    type: 'time_heatmap',
    name: '工作热力图',
    description: '显示工作时间的热力图分布',
    icon: 'Calendar',
    category: 'time',
    defaultSize: { w: 8, h: 4 },
    minSize: { w: 6, h: 3 },
    configurable: true,
    refreshable: false
  },
  {
    type: 'efficiency_chart',
    name: '效率趋势',
    description: '显示工作效率的变化趋势',
    icon: 'LineChart',
    category: 'time',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 2 },
    configurable: true,
    refreshable: true
  },
  {
    type: 'workload_distribution',
    name: '工作负载',
    description: '显示团队成员的工作负载分布',
    icon: 'Users',
    category: 'team',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 2 },
    configurable: true,
    refreshable: true
  }
];

// 响应式断点配置
export const DASHBOARD_BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0
};

export const DASHBOARD_COLS = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2
};

// 颜色主题配置
export const DASHBOARD_THEMES = {
  blue: {
    primary: '#1976d2',
    secondary: '#42a5f5',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    background: '#fafafa'
  },
  green: {
    primary: '#388e3c',
    secondary: '#66bb6a',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    background: '#f1f8e9'
  },
  purple: {
    primary: '#7b1fa2',
    secondary: '#ba68c8',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    background: '#f3e5f5'
  }
};