// 项目相关类型定义
import type { ApiResponse } from './auth';

export interface Project {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sync_version: number;
  last_sync_at?: string;
  is_deleted: boolean;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

// WBS任务相关类型
export interface WBSTask {
  id: number;
  project_id: number;
  parent_id?: number;
  wbs_code?: string;
  name: string;
  description?: string;
  level: number;
  level_type: 'yearly' | 'half_yearly' | 'quarterly' | 'monthly' | 'weekly' | 'daily';
  sort_order: number;
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  actual_hours: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  progress_percentage: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  sync_version: number;
  last_sync_at?: string;
  is_deleted: boolean;
}

export interface CreateWBSTaskInput {
  project_id: number;
  parent_id?: number;
  name: string;
  description?: string;
  level_type: 'yearly' | 'half_yearly' | 'quarterly' | 'monthly' | 'weekly' | 'daily';
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UpdateWBSTaskInput {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  status?: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  progress_percentage?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// 时间记录相关类型
export interface TimeLog {
  id: number;
  user_id: number;
  task_id: number;
  description?: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  is_manual: boolean;
  log_date: string;
  created_at: string;
  updated_at: string;
  sync_version: number;
  last_sync_at?: string;
  is_deleted: boolean;
}

export interface CreateTimeLogInput {
  task_id: number;
  description?: string;
  start_time: string;
  end_time?: string;
  is_manual?: boolean;
}

export interface UpdateTimeLogInput {
  description?: string;
  start_time?: string;
  end_time?: string;
}

// API响应类型扩展
export type ProjectApiResponse<T = any> = ApiResponse<T>;

// 项目统计相关类型
export interface ProjectStats {
  project_id: number;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  avg_progress: number;
  total_estimated_hours: number;
  total_actual_hours: number;
}

// 任务层级树形结构
export interface WBSTaskTree extends WBSTask {
  children?: WBSTaskTree[];
  full_path?: string;
  depth?: number;
}