# Sprint 5 API 规格文档
## Nobody Logger - 数据分析与团队协作系统 API

**版本**: 1.0  
**创建日期**: 2025年8月6日  
**API基础路径**: `/api/v1`  
**认证方式**: JWT Bearer Token

---

## 1. API 概述

### 1.1 通用响应格式

所有API响应都遵循统一的格式：

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

// 成功响应示例
{
  "success": true,
  "data": { /* 具体数据 */ },
  "message": "操作成功",
  "timestamp": "2025-08-06T10:00:00.000Z",
  "requestId": "req_abc123"
}

// 错误响应示例
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "输入数据验证失败",
  "timestamp": "2025-08-06T10:00:00.000Z",
  "requestId": "req_abc123"
}
```

### 1.2 分页响应格式

```typescript
interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### 1.3 错误代码

| 错误代码 | HTTP状态码 | 说明 |
|----------|------------|------|
| VALIDATION_ERROR | 400 | 输入验证失败 |
| UNAUTHORIZED | 401 | 未认证 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 数据冲突 |
| RATE_LIMITED | 429 | 请求过于频繁 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 2. 数据分析 API

### 2.1 仪表板数据 API

#### GET /api/analytics/dashboard

获取仪表板概览数据

**请求参数:**
```typescript
interface DashboardRequest {
  timeRange?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: string;     // ISO 8601 格式
  endDate?: string;       // ISO 8601 格式
  projectIds?: number[];  // 项目ID数组，空则包含所有项目
  refresh?: boolean;      // 是否强制刷新缓存
}
```

**响应数据:**
```typescript
interface DashboardResponse {
  overview: {
    totalProjects: number;
    activeProjects: number;
    completedTasks: number;
    totalHours: number;
    efficiencyScore: number;  // 0-100
  };
  projectProgress: {
    projectId: number;
    projectName: string;
    progress: number;        // 0-100
    status: 'on_track' | 'at_risk' | 'delayed';
    remainingTasks: number;
    estimatedCompletion: string;
  }[];
  recentActivity: {
    id: number;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    userId: number;
    username: string;
  }[];
  timeDistribution: {
    projectId: number;
    projectName: string;
    hours: number;
    percentage: number;
  }[];
}
```

**示例:**
```bash
GET /api/analytics/dashboard?timeRange=month&projectIds=1,2,3
Authorization: Bearer <token>

# 响应
{
  "success": true,
  "data": {
    "overview": {
      "totalProjects": 3,
      "activeProjects": 2,
      "completedTasks": 47,
      "totalHours": 156.5,
      "efficiencyScore": 85
    },
    "projectProgress": [
      {
        "projectId": 1,
        "projectName": "网站重构",
        "progress": 75,
        "status": "on_track",
        "remainingTasks": 8,
        "estimatedCompletion": "2025-08-20T00:00:00.000Z"
      }
    ]
  }
}
```

#### GET /api/analytics/time-analysis

获取时间分析数据

**请求参数:**
```typescript
interface TimeAnalysisRequest {
  type: 'heatmap' | 'trend' | 'distribution' | 'efficiency';
  timeRange: 'week' | 'month' | 'quarter' | 'custom';
  startDate?: string;
  endDate?: string;
  projectId?: number;
  userId?: number;        // 管理员或项目所有者可查看其他用户
  granularity?: 'hour' | 'day' | 'week';
}
```

**响应数据:**
```typescript
interface TimeAnalysisResponse {
  type: string;
  
  // 热力图数据
  heatmapData?: {
    date: string;
    hour: number;
    value: number;        // 工作时长(分钟)
    taskCount: number;
  }[];
  
  // 趋势数据
  trendData?: {
    date: string;
    hours: number;
    tasks: number;
    efficiency: number;
  }[];
  
  // 分布数据
  distributionData?: {
    category: string;     // 项目名或分类
    hours: number;
    percentage: number;
  }[];
  
  // 分析洞察
  insights: {
    totalHours: number;
    averageDailyHours: number;
    peakHours: string[];        // ["14:00", "15:00"]
    mostProductiveDay: string;  // "Tuesday"
    efficiencyScore: number;
    recommendations: string[];
  };
}
```

#### GET /api/analytics/project-progress/{projectId}

获取项目进度详细数据

**路径参数:**
- `projectId`: 项目ID

**请求参数:**
```typescript
interface ProjectProgressRequest {
  includeGantt?: boolean;
  includeBurndown?: boolean;
  includeRiskAnalysis?: boolean;
}
```

**响应数据:**
```typescript
interface ProjectProgressResponse {
  projectInfo: {
    id: number;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: string;
    progress: number;
  };
  
  // 甘特图数据
  ganttData?: {
    taskId: number;
    taskName: string;
    startDate: string;
    endDate: string;
    progress: number;
    dependencies: number[];
    assignee: {
      id: number;
      name: string;
      avatar: string;
    };
    isMilestone: boolean;
    isOnCriticalPath: boolean;
  }[];
  
  // 燃尽图数据
  burndownData?: {
    date: string;
    ideal: number;
    actual: number;
    remaining: number;
  }[];
  
  // 里程碑数据
  milestones: {
    id: number;
    name: string;
    date: string;
    status: 'completed' | 'pending' | 'overdue';
    completionDate?: string;
  }[];
  
  // 风险分析
  riskAnalysis?: {
    overdueTasks: number;
    riskyTasks: number;
    resourceConflicts: number;
    estimatedDelay: number;  // 天数
    recommendations: string[];
  };
}
```

### 2.2 仪表板配置 API

#### GET /api/dashboards

获取用户仪表板列表

**请求参数:**
```typescript
interface DashboardListRequest {
  includeShared?: boolean;
  page?: number;
  limit?: number;
}
```

**响应数据:**
```typescript
interface DashboardListResponse {
  dashboards: {
    id: number;
    name: string;
    description: string;
    isDefault: boolean;
    isShared: boolean;
    createdAt: string;
    updatedAt: string;
    widgetCount: number;
  }[];
}
```

#### GET /api/dashboards/{id}

获取仪表板详细配置

**响应数据:**
```typescript
interface DashboardConfigResponse {
  id: number;
  name: string;
  description: string;
  layout: {
    items: {
      i: string;          // 小部件ID
      x: number;
      y: number;
      w: number;
      h: number;
      config: {
        type: string;
        title: string;
        refresh: number;   // 刷新间隔(秒)
        filters: Record<string, any>;
      };
    }[];
  };
  isDefault: boolean;
  isShared: boolean;
}
```

#### POST /api/dashboards

创建新的仪表板

**请求体:**
```typescript
interface CreateDashboardRequest {
  name: string;
  description?: string;
  layout: {
    items: DashboardItem[];
  };
  isDefault?: boolean;
}
```

#### PUT /api/dashboards/{id}

更新仪表板配置

**请求体:**
```typescript
interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  layout?: {
    items: DashboardItem[];
  };
  isDefault?: boolean;
}
```

#### DELETE /api/dashboards/{id}

删除仪表板

**响应:** 204 No Content

---

## 3. 报告生成 API

### 3.1 报告模板 API

#### GET /api/report-templates

获取报告模板列表

**请求参数:**
```typescript
interface TemplateListRequest {
  category?: string;      // project, time, team, custom
  isSystem?: boolean;     // 是否包含系统模板
  search?: string;        // 搜索关键词
}
```

**响应数据:**
```typescript
interface TemplateListResponse {
  templates: {
    id: number;
    name: string;
    description: string;
    category: string;
    isSystem: boolean;
    usageCount: number;
    createdAt: string;
  }[];
}
```

#### GET /api/report-templates/{id}

获取报告模板详细配置

**响应数据:**
```typescript
interface TemplateDetailResponse {
  id: number;
  name: string;
  description: string;
  templateConfig: {
    sections: {
      type: string;
      title: string;
      config: Record<string, any>;
    }[];
    format: 'pdf' | 'excel' | 'html';
    pageSize: 'A4' | 'A3' | 'Letter';
    orientation: 'portrait' | 'landscape';
  };
  category: string;
  isSystem: boolean;
  usageCount: number;
}
```

### 3.2 报告生成 API

#### POST /api/reports/generate

生成报告

**请求体:**
```typescript
interface GenerateReportRequest {
  templateId?: number;    // 使用的模板ID，可选
  type: 'pdf' | 'excel' | 'html';
  config: {
    title: string;
    timeRange: {
      start: string;
      end: string;
    };
    projectIds: number[];
    sections: string[];   // 要包含的章节
    customSections?: {
      type: string;
      title: string;
      config: Record<string, any>;
    }[];
  };
  deliveryMethod?: 'download' | 'email';
  emailRecipients?: string[];
}
```

**响应数据:**
```typescript
interface GenerateReportResponse {
  taskId: string;         // 任务ID
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimatedTime?: number; // 预计完成时间(秒)
}
```

#### GET /api/reports/tasks/{taskId}

查询报告生成状态

**响应数据:**
```typescript
interface ReportTaskResponse {
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;       // 0-100
  downloadUrl?: string;   // 完成后的下载链接
  fileSize?: number;      // 文件大小(字节)
  errorMessage?: string;  // 错误信息
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;     // 下载链接过期时间
}
```

#### GET /api/reports/history

获取报告生成历史

**请求参数:**
```typescript
interface ReportHistoryRequest {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}
```

**响应数据:**
```typescript
interface ReportHistoryResponse {
  reports: {
    taskId: string;
    title: string;
    type: string;
    status: string;
    fileSize?: number;
    downloadUrl?: string;
    downloadCount: number;
    createdAt: string;
    expiresAt?: string;
  }[];
  pagination: PaginationInfo;
}
```

---

## 4. 团队协作 API

### 4.1 团队成员管理 API

#### GET /api/projects/{projectId}/members

获取项目团队成员

**请求参数:**
```typescript
interface MembersListRequest {
  includeInvitations?: boolean;
  role?: 'owner' | 'editor' | 'viewer';
  status?: 'active' | 'pending' | 'all';
}
```

**响应数据:**
```typescript
interface MembersListResponse {
  members: {
    id: number;
    userId: number;
    username: string;
    email: string;
    avatar?: string;
    role: 'owner' | 'editor' | 'viewer';
    joinedAt: string;
    lastActiveAt?: string;
    isOnline: boolean;
  }[];
  
  invitations?: {
    id: number;
    email: string;
    role: string;
    status: 'pending' | 'expired';
    invitedBy: string;
    createdAt: string;
    expiresAt: string;
  }[];
  
  statistics: {
    totalMembers: number;
    ownerCount: number;
    editorCount: number;
    viewerCount: number;
    pendingInvitations: number;
  };
}
```

#### POST /api/projects/{projectId}/members/invite

邀请团队成员

**请求体:**
```typescript
interface InviteMembersRequest {
  emails: string[];       // 最多10个邮箱
  role: 'editor' | 'viewer';
  message?: string;       // 自定义邀请消息
  expiresIn?: number;     // 邀请过期时间(小时)，默认168(7天)
}
```

**响应数据:**
```typescript
interface InviteMembersResponse {
  invitations: {
    email: string;
    status: 'sent' | 'failed' | 'already_member';
    invitationId?: number;
    token?: string;
    error?: string;
  }[];
  summary: {
    total: number;
    sent: number;
    failed: number;
    alreadyMembers: number;
  };
}
```

#### PUT /api/projects/{projectId}/members/{memberId}/role

更新成员角色

**请求体:**
```typescript
interface UpdateRoleRequest {
  role: 'editor' | 'viewer';
  reason?: string;        // 变更原因
}
```

**响应数据:**
```typescript
interface UpdateRoleResponse {
  member: {
    id: number;
    userId: number;
    username: string;
    role: string;
    updatedAt: string;
  };
  auditLog: {
    id: number;
    action: 'role_change';
    oldRole: string;
    newRole: string;
    operatorName: string;
    timestamp: string;
  };
}
```

#### DELETE /api/projects/{projectId}/members/{memberId}

移除团队成员

**请求参数:**
```typescript
interface RemoveMemberRequest {
  reason?: string;        // 移除原因
  transferTasks?: boolean; // 是否需要转移任务
  newAssignee?: number;    // 任务新负责人ID
}
```

**响应数据:**
```typescript
interface RemoveMemberResponse {
  removedMember: {
    userId: number;
    username: string;
    tasksTransferred: number;
  };
  auditLog: {
    id: number;
    action: 'remove_member';
    reason?: string;
    timestamp: string;
  };
}
```

### 4.2 邀请处理 API

#### GET /api/invitations/{token}

验证邀请令牌并获取邀请信息

**响应数据:**
```typescript
interface InvitationDetailResponse {
  invitation: {
    id: number;
    projectName: string;
    projectDescription: string;
    inviterName: string;
    role: string;
    message?: string;
    createdAt: string;
    expiresAt: string;
    isExpired: boolean;
  };
  requiresRegistration: boolean;
}
```

#### POST /api/invitations/{token}/accept

接受邀请

**请求体:**
```typescript
interface AcceptInvitationRequest {
  // 如果需要注册新用户
  registration?: {
    username: string;
    password: string;
    fullName?: string;
  };
}
```

**响应数据:**
```typescript
interface AcceptInvitationResponse {
  success: boolean;
  project: {
    id: number;
    name: string;
    role: string;
  };
  user?: {
    id: number;
    username: string;
    isNewUser: boolean;
  };
  redirectUrl: string;    // 加入后的跳转链接
}
```

#### POST /api/invitations/{token}/decline

拒绝邀请

**请求体:**
```typescript
interface DeclineInvitationRequest {
  reason?: string;
}
```

### 4.3 任务分配 API

#### PUT /api/tasks/{taskId}/assign

分配任务

**请求体:**
```typescript
interface AssignTaskRequest {
  assignedTo?: number;    // 负责人ID，null表示取消分配
  participants?: number[]; // 参与者ID数组
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;       // 截止日期
  estimatedHours?: number;
  notes?: string;         // 分配备注
}
```

**响应数据:**
```typescript
interface AssignTaskResponse {
  task: {
    id: number;
    name: string;
    assignedTo?: {
      id: number;
      username: string;
      avatar?: string;
    };
    participants: {
      id: number;
      username: string;
      avatar?: string;
    }[];
    priority: string;
    dueDate?: string;
  };
  notifications: {
    userId: number;
    type: string;
    sent: boolean;
  }[];
}
```

#### GET /api/tasks/assignments

获取任务分配列表

**请求参数:**
```typescript
interface TaskAssignmentsRequest {
  assignedTo?: number;    // 负责人ID，'me' 表示当前用户
  projectId?: number;
  status?: string[];
  priority?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'dueDate' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**响应数据:**
```typescript
interface TaskAssignmentsResponse {
  tasks: {
    id: number;
    name: string;
    wbsCode: string;
    status: string;
    priority: string;
    dueDate?: string;
    projectName: string;
    assignedTo?: {
      id: number;
      username: string;
    };
    estimatedHours?: number;
    actualHours: number;
    progress: number;
  }[];
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    highPriority: number;
  };
  pagination: PaginationInfo;
}
```

### 4.4 活动流 API

#### GET /api/projects/{projectId}/activities

获取项目活动流

**请求参数:**
```typescript
interface ActivitiesRequest {
  type?: string[];        // 活动类型筛选
  userId?: number;        // 用户筛选
  startDate?: string;     // 时间范围筛选
  endDate?: string;
  limit?: number;         // 默认20，最大100
  cursor?: string;        // 分页游标
}
```

**响应数据:**
```typescript
interface ActivitiesResponse {
  activities: {
    id: number;
    type: string;
    title: string;
    description: string;
    user: {
      id: number;
      username: string;
      avatar?: string;
    };
    relatedType?: string;   // task, project, member
    relatedId?: number;
    metadata?: Record<string, any>;
    createdAt: string;
  }[];
  nextCursor?: string;
  hasMore: boolean;
}
```

#### GET /api/activities/my

获取用户相关活动

**请求参数:**
```typescript
interface MyActivitiesRequest {
  includeProjectActivities?: boolean;
  includeTaskAssignments?: boolean;
  includeComments?: boolean;
  limit?: number;
  cursor?: string;
}
```

---

## 5. 通知系统 API

### 5.1 通知管理 API

#### GET /api/notifications

获取用户通知列表

**请求参数:**
```typescript
interface NotificationsRequest {
  type?: string[];
  isRead?: boolean;
  page?: number;
  limit?: number;
}
```

**响应数据:**
```typescript
interface NotificationsResponse {
  notifications: {
    id: number;
    type: string;
    title: string;
    content: string;
    actionUrl?: string;
    isRead: boolean;
    createdAt: string;
    expiresAt?: string;
  }[];
  unreadCount: number;
  pagination: PaginationInfo;
}
```

#### PUT /api/notifications/{id}/read

标记通知为已读

**响应数据:**
```typescript
interface MarkReadResponse {
  notification: {
    id: number;
    isRead: boolean;
    readAt: string;
  };
}
```

#### PUT /api/notifications/read-all

标记所有通知为已读

**响应数据:**
```typescript
interface MarkAllReadResponse {
  updatedCount: number;
  timestamp: string;
}
```

#### DELETE /api/notifications/{id}

删除通知

**响应:** 204 No Content

### 5.2 通知设置 API

#### GET /api/notifications/settings

获取用户通知设置

**响应数据:**
```typescript
interface NotificationSettingsResponse {
  emailNotifications: {
    taskAssigned: boolean;
    reportReady: boolean;
    teamUpdates: boolean;
    projectDeadlines: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    taskReminders: boolean;
    mentions: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;      // "22:00"
    end: string;        // "08:00"
    timezone: string;
  };
}
```

#### PUT /api/notifications/settings

更新通知设置

**请求体:**
```typescript
interface UpdateNotificationSettingsRequest {
  emailNotifications?: {
    taskAssigned?: boolean;
    reportReady?: boolean;
    teamUpdates?: boolean;
    projectDeadlines?: boolean;
  };
  pushNotifications?: {
    enabled?: boolean;
    taskReminders?: boolean;
    mentions?: boolean;
  };
  quietHours?: {
    enabled?: boolean;
    start?: string;
    end?: string;
    timezone?: string;
  };
}
```

---

## 6. 用户设置 API

### 6.1 用户偏好设置 API

#### GET /api/user/settings

获取用户设置

**响应数据:**
```typescript
interface UserSettingsResponse {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  defaultTaskView: 'list' | 'kanban' | 'timeline';
  workHours: {
    start: string;      // "09:00"
    end: string;        // "18:00"
    workDays: string[]; // ["monday", "tuesday", ...]
  };
  dashboardSettings: {
    defaultDashboardId?: number;
    refreshInterval: number;
  };
}
```

#### PUT /api/user/settings

更新用户设置

**请求体:**
```typescript
interface UpdateUserSettingsRequest {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'zh-CN' | 'en-US';
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  defaultTaskView?: 'list' | 'kanban' | 'timeline';
  workHours?: {
    start?: string;
    end?: string;
    workDays?: string[];
  };
  dashboardSettings?: {
    defaultDashboardId?: number;
    refreshInterval?: number;
  };
}
```

---

## 7. WebSocket 实时通信

### 7.1 连接和认证

```typescript
// 连接WebSocket
const socket = io('/ws', {
  auth: {
    token: localStorage.getItem('authToken')
  }
});

// 加入项目频道
socket.emit('join-project', { projectId: 123 });
```

### 7.2 事件类型

#### 客户端发送事件

```typescript
// 加入项目频道
socket.emit('join-project', { projectId: number });

// 离开项目频道
socket.emit('leave-project', { projectId: number });

// 发送任务更新
socket.emit('task-update', {
  taskId: number;
  updates: Record<string, any>;
});
```

#### 服务端推送事件

```typescript
// 项目活动更新
socket.on('project-activity', (data: {
  projectId: number;
  activity: ActivityEvent;
}) => {
  // 处理活动更新
});

// 新成员加入
socket.on('member-joined', (data: {
  projectId: number;
  member: TeamMember;
}) => {
  // 处理新成员
});

// 任务分配通知
socket.on('task-assigned', (data: {
  taskId: number;
  assignedTo: number;
  assignedBy: string;
}) => {
  // 处理任务分配
});

// 仪表板数据更新
socket.on('dashboard-refresh', (data: {
  userId: number;
  dashboardId: number;
  data: Partial<DashboardData>;
}) => {
  // 刷新仪表板
});
```

---

## 8. 批量操作 API

### 8.1 批量任务操作

#### PUT /api/tasks/batch

批量更新任务

**请求体:**
```typescript
interface BatchTaskUpdateRequest {
  taskIds: number[];
  updates: {
    status?: string;
    priority?: string;
    assignedTo?: number;
    tags?: string[];
    dueDate?: string;
  };
}
```

**响应数据:**
```typescript
interface BatchTaskUpdateResponse {
  updated: number;
  failed: number;
  results: {
    taskId: number;
    status: 'success' | 'failed';
    error?: string;
  }[];
}
```

### 8.2 批量数据导出

#### POST /api/export/batch

批量导出数据

**请求体:**
```typescript
interface BatchExportRequest {
  exports: {
    type: 'tasks' | 'time-logs' | 'reports';
    format: 'csv' | 'excel' | 'json';
    filters: Record<string, any>;
    filename?: string;
  }[];
  zipOutput: boolean;     // 是否打包成ZIP
}
```

**响应数据:**
```typescript
interface BatchExportResponse {
  taskId: string;
  files: {
    type: string;
    filename: string;
    estimatedSize: number;
  }[];
  totalEstimatedSize: number;
}
```

---

## 9. API 限流和配额

### 9.1 限流规则

| API 类别 | 限流规则 | 说明 |
|----------|----------|------|
| 分析数据 | 100次/15分钟 | 仪表板和分析相关API |
| 报告生成 | 5次/10分钟 | 报告生成API |
| 团队邀请 | 10次/小时 | 邀请成员API |
| 实时数据 | 1000次/小时 | WebSocket连接和实时更新 |
| 一般操作 | 1000次/小时 | 其他CRUD操作 |

### 9.2 响应头

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
Retry-After: 3600
```

---

## 10. API 版本控制

### 10.1 版本策略

- 使用URL路径进行版本控制: `/api/v1/`, `/api/v2/`
- 向后兼容性: 同一主版本内保持向后兼容
- 废弃通知: 通过响应头通知API废弃 `X-API-Deprecated: true`

### 10.2 版本迁移

```http
# 获取API版本信息
GET /api/version

# 响应
{
  "current": "1.0",
  "supported": ["1.0"],
  "deprecated": [],
  "sunset": {}
}
```

---

## 11. 错误处理和调试

### 11.1 详细错误响应

```typescript
interface DetailedErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: {
    field: string;
    code: string;
    message: string;
  }[];
  timestamp: string;
  requestId: string;
  documentation?: string;
}
```

### 11.2 调试头

开发环境下提供调试信息：

```http
X-Debug-SQL-Queries: 3
X-Debug-Execution-Time: 245ms
X-Debug-Memory-Usage: 15.2MB
X-Debug-Cache-Hits: 12
```

---

这份API规格文档为Sprint 5的功能提供了完整的接口定义，开发团队可以基于这个规范进行前后端开发。

**文档状态**: ✅ 已完成  
**创建人**: 多智能体开发团队  
**最后更新**: 2025年8月6日