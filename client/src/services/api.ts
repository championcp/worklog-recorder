import axios from 'axios';
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  Task, 
  Category, 
  Tag, 
  HierarchicalPlan,
  TimeLog,
  Reminder,
  Template,
  Statistics,
  ApiResponse,
  PaginatedResponse 
} from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并重定向到登录页
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证API
const authApi = {
  login: (data: LoginRequest) => 
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),
  
  register: (data: RegisterRequest) => 
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),
  
  getCurrentUser: () => 
    api.get<ApiResponse<User>>('/auth/me'),
  
  refreshToken: () => 
    api.post<ApiResponse<{ token: string }>>('/auth/refresh'),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post<ApiResponse>('/auth/change-password', data).then(res => res.data),
};

// 任务API
const taskApi = {
  getTasks: (params?: any) => 
    api.get<ApiResponse<PaginatedResponse<Task>>>('/tasks', { params }),
  
  getTask: (id: string) => 
    api.get<ApiResponse<Task>>(`/tasks/${id}`),
  
  getTasksByCategory: (categoryId: string) => 
    api.get<ApiResponse<Task[]>>(`/tasks/category/${categoryId}`),
  
  createTask: (data: Partial<Task>) => 
    api.post<ApiResponse<Task>>('/tasks', data),
  
  updateTask: (id: string, data: Partial<Task>) => 
    api.put<ApiResponse<Task>>(`/tasks/${id}`, data),
  
  deleteTask: (id: string) => 
    api.delete<ApiResponse>(`/tasks/${id}`),
};

// 分类API
const categoryApi = {
  getCategories: () => 
    api.get<ApiResponse<Category[]>>('/categories'),
  
  getCategory: (id: string) => 
    api.get<ApiResponse<Category>>(`/categories/${id}`),
  
  createCategory: (data: Partial<Category>) => 
    api.post<ApiResponse<Category>>('/categories', data),
  
  updateCategory: (id: string, data: Partial<Category>) => 
    api.put<ApiResponse<Category>>(`/categories/${id}`, data),
  
  deleteCategory: (id: string) => 
    api.delete<ApiResponse>(`/categories/${id}`),
  
  getCategoryStats: () => 
    api.get<ApiResponse<Record<string, number>>>('/categories/stats'),
};

// 标签API
const tagApi = {
  getTags: () => 
    api.get<ApiResponse<Tag[]>>('/tags'),
  
  getTag: (id: string) => 
    api.get<ApiResponse<Tag>>(`/tags/${id}`),
  
  createTag: (data: Partial<Tag>) => 
    api.post<ApiResponse<Tag>>('/tags', data),
  
  updateTag: (id: string, data: Partial<Tag>) => 
    api.put<ApiResponse<Tag>>(`/tags/${id}`, data),
  
  deleteTag: (id: string) => 
    api.delete<ApiResponse>(`/tags/${id}`),
};

// 计划API
const planApi = {
  getPlans: (params?: any) => 
    api.get<ApiResponse<HierarchicalPlan[]>>('/plans', { params }),
  
  getPlan: (id: string) => 
    api.get<ApiResponse<HierarchicalPlan>>(`/plans/${id}`),
  
  createPlan: (data: Partial<HierarchicalPlan>) => 
    api.post<ApiResponse<HierarchicalPlan>>('/plans', data),
  
  updatePlan: (id: string, data: Partial<HierarchicalPlan>) => 
    api.put<ApiResponse<HierarchicalPlan>>(`/plans/${id}`, data),
  
  deletePlan: (id: string) => 
    api.delete<ApiResponse>(`/plans/${id}`),
  
  addTaskToPlan: (planId: string, taskId: string) => 
    api.post<ApiResponse>(`/plans/${planId}/tasks/${taskId}`),
  
  removeTaskFromPlan: (planId: string, taskId: string) => 
    api.delete<ApiResponse>(`/plans/${planId}/tasks/${taskId}`),
};

// 时间记录API
const timeLogApi = {
  getTimeLogs: (params?: any) => 
    api.get<ApiResponse<TimeLog[]>>('/time-logs', { params }),
  
  getTimeLog: (id: string) => 
    api.get<ApiResponse<TimeLog>>(`/time-logs/${id}`),
  
  createTimeLog: (data: Partial<TimeLog>) => 
    api.post<ApiResponse<TimeLog>>('/time-logs', data),
  
  updateTimeLog: (id: string, data: Partial<TimeLog>) => 
    api.put<ApiResponse<TimeLog>>(`/time-logs/${id}`, data),
  
  deleteTimeLog: (id: string) => 
    api.delete<ApiResponse>(`/time-logs/${id}`),
  
  startTimer: (taskId: string, description?: string) => 
    api.post<ApiResponse<TimeLog>>('/time-logs/start', { taskId, description }),
  
  stopTimer: (id: string) => 
    api.post<ApiResponse<TimeLog>>(`/time-logs/${id}/stop`),
  
  getRunningTimeLogs: () => 
    api.get<ApiResponse<TimeLog | null>>('/time-logs/running/current'),
  
  getTimeStatistics: (params?: any) => 
    api.get<ApiResponse<any>>('/time-logs/statistics', { params }),
};

// 提醒API
const reminderApi = {
  getReminders: (params?: any) => 
    api.get<ApiResponse<Reminder[]>>('/reminders', { params }),
  
  getReminder: (id: string) => 
    api.get<ApiResponse<Reminder>>(`/reminders/${id}`),
  
  createReminder: (data: Partial<Reminder>) => 
    api.post<ApiResponse<Reminder>>('/reminders', data),
  
  updateReminder: (id: string, data: Partial<Reminder>) => 
    api.put<ApiResponse<Reminder>>(`/reminders/${id}`, data),
  
  deleteReminder: (id: string) => 
    api.delete<ApiResponse>(`/reminders/${id}`),
  
  markAsSent: (id: string) => 
    api.post<ApiResponse>(`/reminders/${id}/sent`),
  
  snoozeReminder: (id: string, minutes: number) => 
    api.post<ApiResponse>(`/reminders/${id}/snooze`, { minutes }),
};

// 模板API
const templateApi = {
  getTemplates: (params?: any) => 
    api.get<ApiResponse<Template[]>>('/templates', { params }),
  
  getTemplate: (id: string) => 
    api.get<ApiResponse<Template>>(`/templates/${id}`),
  
  createTemplate: (data: Partial<Template>) => 
    api.post<ApiResponse<Template>>('/templates', data),
  
  updateTemplate: (id: string, data: Partial<Template>) => 
    api.put<ApiResponse<Template>>(`/templates/${id}`, data),
  
  deleteTemplate: (id: string) => 
    api.delete<ApiResponse>(`/templates/${id}`),
  
  copyTemplate: (id: string) => 
    api.post<ApiResponse<Template>>(`/templates/${id}/copy`),
  
  createFromTemplate: (id: string, data: any) => 
    api.post<ApiResponse>(`/templates/${id}/create`, data),
};

// 统计API
const statisticsApi = {
  getTaskStatistics: (params?: any) => 
    api.get<ApiResponse<any>>('/statistics/tasks', { params }),
  
  getTimeStatistics: (params?: any) => 
    api.get<ApiResponse<any>>('/statistics/time', { params }),
  
  getEfficiencyStatistics: (params?: any) => 
    api.get<ApiResponse<any>>('/statistics/efficiency', { params }),
  
  getTrendStatistics: (params?: any) => 
    api.get<ApiResponse<any>>('/statistics/trends', { params }),
  
  getDashboardData: (params?: any) => 
    api.get<ApiResponse<any>>('/statistics/dashboard', { params }),
};

// 统一的API对象
const unifiedApi = {
  // 认证相关
  login: authApi.login,
  register: authApi.register,
  getCurrentUser: authApi.getCurrentUser,
  refreshToken: authApi.refreshToken,
  changePassword: authApi.changePassword,
  
  // 任务相关
  getTasks: (params?: any) => taskApi.getTasks(params).then(res => res.data.data?.data || []),
  getTask: (id: string) => taskApi.getTask(id).then(res => res.data.data),
  getTasksByCategory: (categoryId: string) => taskApi.getTasksByCategory(categoryId).then(res => res.data.data),
  createTask: (data: Partial<Task>) => taskApi.createTask(data).then(res => res.data.data),
  updateTask: (id: string, data: Partial<Task>) => taskApi.updateTask(id, data).then(res => res.data.data),
  deleteTask: (id: string | number) => taskApi.deleteTask(String(id)),
  
  // 分类相关
  getCategories: () => categoryApi.getCategories().then(res => res.data.data || []),
  getCategory: (id: string) => categoryApi.getCategory(id).then(res => res.data.data),
  createCategory: (data: Partial<Category>) => categoryApi.createCategory(data).then(res => res.data.data),
  updateCategory: (id: string, data: Partial<Category>) => categoryApi.updateCategory(id, data).then(res => res.data.data),
  deleteCategory: (id: string) => categoryApi.deleteCategory(id),
  getCategoryStats: () => categoryApi.getCategoryStats().then(res => res.data.data || {}),
  
  // 标签相关
  getTags: () => tagApi.getTags().then(res => res.data.data || []),
  getTag: (id: string) => tagApi.getTag(id).then(res => res.data.data),
  createTag: (data: Partial<Tag>) => tagApi.createTag(data).then(res => res.data.data),
  updateTag: (id: string, data: Partial<Tag>) => tagApi.updateTag(id, data).then(res => res.data.data),
  deleteTag: (id: string) => tagApi.deleteTag(id),
  
  // 计划相关
  getPlans: (params?: any) => planApi.getPlans(params).then(res => res.data.data || []),
  getPlan: (id: string) => planApi.getPlan(id).then(res => res.data.data),
  createPlan: (data: Partial<HierarchicalPlan>) => planApi.createPlan(data).then(res => res.data.data),
  updatePlan: (id: string, data: Partial<HierarchicalPlan>) => planApi.updatePlan(id, data).then(res => res.data.data),
  deletePlan: (id: string) => planApi.deletePlan(id),
  addTaskToPlan: (planId: string, taskId: string) => planApi.addTaskToPlan(planId, taskId),
  removeTaskFromPlan: (planId: string, taskId: string) => planApi.removeTaskFromPlan(planId, taskId),
  
  // 时间记录相关
  getTimeLogs: (params?: any) => timeLogApi.getTimeLogs(params).then(res => res.data.data || []),
  getTimeLog: (id: string) => timeLogApi.getTimeLog(id).then(res => res.data.data),
  createTimeLog: (data: Partial<TimeLog>) => timeLogApi.createTimeLog(data).then(res => res.data.data),
  updateTimeLog: (id: string, data: Partial<TimeLog>) => timeLogApi.updateTimeLog(id, data).then(res => res.data.data),
  deleteTimeLog: (id: string) => timeLogApi.deleteTimeLog(id),
  startTimer: (taskId: string, description?: string) => timeLogApi.startTimer(taskId, description).then(res => res.data.data),
  stopTimer: (id: string) => timeLogApi.stopTimer(id).then(res => res.data.data),
  getRunningTimeLogs: () => timeLogApi.getRunningTimeLogs().then(res => {
    // 服务器返回单个对象或null，我们需要转换为数组格式以保持兼容性
    const data = res.data.data;
    return data ? [data] : [];
  }),
  getTimeLogStatistics: (params?: any) => timeLogApi.getTimeStatistics(params).then(res => res.data.data),
  
  // 提醒相关
  getReminders: (params?: any) => reminderApi.getReminders(params).then(res => res.data.data || []),
  getReminder: (id: string) => reminderApi.getReminder(id).then(res => res.data.data),
  createReminder: (data: Partial<Reminder>) => reminderApi.createReminder(data).then(res => res.data.data),
  updateReminder: (id: string, data: Partial<Reminder>) => reminderApi.updateReminder(id, data).then(res => res.data.data),
  deleteReminder: (id: string) => reminderApi.deleteReminder(id),
  markReminderAsSent: (id: string) => reminderApi.markAsSent(id),
  snoozeReminder: (id: string, minutes: number) => reminderApi.snoozeReminder(id, minutes),
  
  // 模板相关
  getTemplates: (params?: any) => templateApi.getTemplates(params).then(res => res.data.data || []),
  getTemplate: (id: string) => templateApi.getTemplate(id).then(res => res.data.data),
  createTemplate: (data: Partial<Template>) => templateApi.createTemplate(data).then(res => res.data.data),
  updateTemplate: (id: string, data: Partial<Template>) => templateApi.updateTemplate(id, data).then(res => res.data.data),
  deleteTemplate: (id: string) => templateApi.deleteTemplate(id),
  copyTemplate: (id: string) => templateApi.copyTemplate(id).then(res => res.data.data),
  createFromTemplate: (id: string, data: any) => templateApi.createFromTemplate(id, data).then(res => res.data.data),
  
  // 统计相关
  getTaskStatistics: (params?: any) => statisticsApi.getTaskStatistics(params).then(res => res.data.data),
  getTimeStatistics: (params?: any) => statisticsApi.getTimeStatistics(params).then(res => res.data.data),
  getEfficiencyStatistics: (params?: any) => statisticsApi.getEfficiencyStatistics(params).then(res => res.data.data),
  getTrendStatistics: (params?: any) => statisticsApi.getTrendStatistics(params).then(res => res.data.data),
  getDashboardData: (params?: any) => statisticsApi.getDashboardData(params).then(res => res.data.data),
};

export default unifiedApi;
export { unifiedApi as api, authApi, taskApi, categoryApi, tagApi, reminderApi };