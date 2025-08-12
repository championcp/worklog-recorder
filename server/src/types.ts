// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// 任务状态枚举
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// 任务优先级
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 时间范围类型
export enum TimeRange {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

// 工作分类
export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 标签
export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 任务
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  categoryId?: string;
  category?: Category;
  tags: Tag[];
  startDate?: Date;
  endDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  userId: string;
  parentTaskId?: string;
  subtasks?: Task[];
  createdAt: Date;
  updatedAt: Date;
}

// 计划
export interface Plan {
  id: string;
  title: string;
  description?: string;
  timeRange: TimeRange;
  startDate: Date;
  endDate: Date;
  parentPlanId?: string;
  childPlans?: Plan[];
  tasks: Task[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 时间记录
export interface TimeLog {
  id: string;
  title?: string;
  description?: string;
  categoryId?: string;
  taskId?: string;
  task?: Task;
  taskName?: string; // 任务名称
  category?: string; // 分类名称
  startTime: Date;
  endTime?: Date;
  duration?: number; // 秒
  isRunning?: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 提醒设置
export interface Reminder {
  id: string;
  taskId: string;
  task?: Task;
  reminderTime: Date;
  message: string;
  isRecurring: boolean;
  recurringPattern?: string; // cron表达式
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 模板
export interface Template {
  id: string;
  name: string;
  type: 'task' | 'plan';
  content: any; // JSON格式的模板内容
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 统计数据
export interface Statistics {
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
  categoryStats: Array<{
    category: Category;
    taskCount: number;
    totalHours: number;
  }>;
  timeRangeStats: Array<{
    date: string;
    taskCount: number;
    completedCount: number;
    totalHours: number;
  }>;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 筛选参数
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  categoryId?: string[];
  tagIds?: string[];
  startDate?: Date;
  endDate?: Date;
  search?: string;
}