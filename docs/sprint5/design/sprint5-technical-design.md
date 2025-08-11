# Sprint 5 技术设计文档
## Nobody Logger - 数据分析与团队协作系统

**版本**: 1.0  
**创建日期**: 2025年8月6日  
**技术负责人**: 多智能体开发团队  
**审核人**: 技术架构师

---

## 1. 技术架构概述

### 1.1 系统架构扩展

```
┌─────────────────────────────────────────────────────────────┐
│                    前端展示层 (Presentation)                  │
├─────────────────────────────────────────────────────────────┤
│  新增组件:                                                   │
│  ├── Analytics Dashboard (数据分析仪表板)                      │
│  ├── Chart Visualization (图表可视化)                        │
│  ├── Report Builder (报告构建器)                             │
│  ├── Team Management (团队管理)                              │
│  └── PWA Shell (PWA外壳)                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────────┐
│                  业务逻辑层 (Business Logic)                 │
├─────────────────────────────────────────────────────────────┤
│  新增服务:                                                   │
│  ├── AnalyticsService (数据分析服务)                         │
│  ├── ReportService (报告生成服务)                           │
│  ├── TeamService (团队协作服务)                             │
│  ├── PermissionService (权限管理服务)                       │
│  └── NotificationService (通知服务)                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────────┐
│                    数据访问层 (Data Access)                  │
├─────────────────────────────────────────────────────────────┤
│  扩展存储:                                                   │
│  ├── Dashboard Configs (仪表板配置)                         │
│  ├── Report Templates (报告模板)                            │
│  ├── Team Members (团队成员)                               │
│  ├── Permissions (权限管理)                                │
│  └── Notifications (通知记录)                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心技术选型

**前端技术栈扩展**:
- **Chart.js/Recharts**: 数据可视化图表库
- **React-Grid-Layout**: 拖拽式布局组件
- **jsPDF**: PDF生成库
- **SheetJS**: Excel导入导出
- **Workbox**: Service Worker和PWA支持

**后端技术栈扩展**:
- **Node-cron**: 定时任务调度
- **Nodemailer**: 邮件发送服务
- **Sharp**: 图像处理和优化
- **Bull**: 任务队列管理
- **Socket.io**: 实时通信支持

---

## 2. 数据库设计

### 2.1 新增数据表结构

#### 2.1.1 仪表板配置表 (dashboard_configs)
```sql
CREATE TABLE dashboard_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSON NOT NULL,                -- 小部件布局配置
    is_default BOOLEAN DEFAULT 0,
    is_shared BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX idx_dashboard_user_id ON dashboard_configs(user_id);
CREATE INDEX idx_dashboard_default ON dashboard_configs(user_id, is_default);
```

#### 2.1.2 报告模板表 (report_templates)
```sql
CREATE TABLE report_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_config JSON NOT NULL,       -- 模板配置
    category VARCHAR(100),               -- 模板分类
    is_system BOOLEAN DEFAULT 0,         -- 系统预设模板
    user_id INTEGER,                     -- 自定义模板的创建者
    usage_count INTEGER DEFAULT 0,      -- 使用次数统计
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_report_template_category ON report_templates(category, is_system);
CREATE INDEX idx_report_template_user ON report_templates(user_id);
```

#### 2.1.3 项目成员表 (project_members)
```sql
CREATE TABLE project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role ENUM('owner', 'editor', 'viewer') DEFAULT 'viewer',
    invited_by INTEGER NOT NULL,
    invitation_token VARCHAR(255),       -- 邀请令牌
    invitation_status ENUM('pending', 'accepted', 'declined', 'expired') DEFAULT 'pending',
    joined_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_invitation ON project_members(invitation_token);
```

#### 2.1.4 权限日志表 (permission_logs)
```sql
CREATE TABLE permission_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    operator_id INTEGER NOT NULL,       -- 操作人
    target_user_id INTEGER NOT NULL,    -- 被操作的用户
    action VARCHAR(50) NOT NULL,        -- 操作类型: invite, role_change, remove
    old_role VARCHAR(20),               -- 原角色
    new_role VARCHAR(20),               -- 新角色
    details JSON,                       -- 详细信息
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_permission_logs_project ON permission_logs(project_id, created_at);
```

#### 2.1.5 通知表 (notifications)
```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,          -- 通知类型
    title VARCHAR(255) NOT NULL,
    content TEXT,
    related_type VARCHAR(50),           -- 关联对象类型 (project, task, etc.)
    related_id INTEGER,                 -- 关联对象ID
    is_read BOOLEAN DEFAULT 0,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,               -- 过期时间
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_notifications_type ON notifications(type, created_at);
```

#### 2.1.6 任务分配扩展 (更新existing wbs_tasks表)
```sql
-- 为现有wbs_tasks表添加字段
ALTER TABLE wbs_tasks 
ADD COLUMN assigned_to INTEGER REFERENCES users(id),
ADD COLUMN participants JSON,              -- 参与者ID数组
ADD COLUMN priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
ADD COLUMN tags JSON;                     -- 任务标签

-- 新增索引
CREATE INDEX idx_wbs_tasks_assigned ON wbs_tasks(assigned_to);
CREATE INDEX idx_wbs_tasks_priority ON wbs_tasks(priority, status);
```

### 2.2 数据关系图

```
users (用户)
  ├── dashboard_configs (仪表板配置) [1:N]
  ├── report_templates (报告模板) [1:N]
  ├── project_members (项目成员) [1:N]
  ├── notifications (通知) [1:N]
  └── wbs_tasks.assigned_to (任务分配) [1:N]

projects (项目)
  ├── project_members (项目成员) [1:N]
  └── permission_logs (权限日志) [1:N]

project_members (项目成员)
  ├── users (用户) [N:1]
  ├── projects (项目) [N:1]
  └── invited_by → users (邀请人) [N:1]
```

---

## 3. API设计规范

### 3.1 RESTful API设计

#### 3.1.1 分析数据API

**GET /api/analytics/dashboard**
```typescript
// 获取仪表板数据
interface DashboardDataRequest {
  timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  projectIds?: number[];
}

interface DashboardDataResponse {
  success: boolean;
  data: {
    overview: {
      totalProjects: number;
      activeProjects: number;
      completedTasks: number;
      totalHours: number;
    };
    projectProgress: ProjectProgressData[];
    timeAnalysis: TimeAnalysisData;
    recentActivity: ActivityData[];
  };
}
```

**GET /api/analytics/time-analysis**
```typescript
// 时间分析数据
interface TimeAnalysisRequest {
  type: 'heatmap' | 'trend' | 'distribution';
  timeRange: string;
  projectId?: number;
  userId?: number;
}

interface TimeAnalysisResponse {
  success: boolean;
  data: {
    heatmapData?: HeatmapPoint[];
    trendData?: TrendPoint[];
    distributionData?: DistributionData;
    insights: {
      peakHours: string[];
      averageDailyHours: number;
      mostProductiveDay: string;
      efficiencyScore: number;
    };
  };
}
```

**GET /api/analytics/project-progress**
```typescript
// 项目进度数据
interface ProjectProgressRequest {
  projectId: number;
  includeGantt?: boolean;
  includeBurndown?: boolean;
}

interface ProjectProgressResponse {
  success: boolean;
  data: {
    projectInfo: ProjectInfo;
    ganttData?: GanttTaskData[];
    burndownData?: BurndownPoint[];
    milestones: MilestoneData[];
    riskAnalysis: RiskData;
  };
}
```

#### 3.1.2 报告生成API

**POST /api/reports/generate**
```typescript
// 生成报告
interface ReportGenerationRequest {
  templateId?: number;
  type: 'pdf' | 'excel' | 'json';
  config: {
    title: string;
    timeRange: DateRange;
    includeCharts: boolean;
    includeTables: boolean;
    projectIds: number[];
    customSections?: ReportSection[];
  };
}

interface ReportGenerationResponse {
  success: boolean;
  data: {
    reportId: string;
    status: 'generating' | 'completed' | 'failed';
    downloadUrl?: string;
    estimatedTime?: number;
  };
}
```

**GET /api/reports/{reportId}/status**
```typescript
// 查询报告生成状态
interface ReportStatusResponse {
  success: boolean;
  data: {
    status: 'generating' | 'completed' | 'failed';
    progress: number;        // 0-100
    downloadUrl?: string;
    errorMessage?: string;
  };
}
```

#### 3.1.3 团队管理API

**POST /api/teams/invite**
```typescript
// 邀请团队成员
interface TeamInviteRequest {
  projectId: number;
  emails: string[];
  role: 'editor' | 'viewer';
  message?: string;
}

interface TeamInviteResponse {
  success: boolean;
  data: {
    invitations: {
      email: string;
      status: 'sent' | 'failed';
      token?: string;
      error?: string;
    }[];
  };
}
```

**GET /api/teams/members**
```typescript
// 获取团队成员列表
interface TeamMembersRequest {
  projectId: number;
  includeInvitations?: boolean;
}

interface TeamMembersResponse {
  success: boolean;
  data: {
    members: TeamMember[];
    invitations?: Invitation[];
    statistics: {
      totalMembers: number;
      ownerCount: number;
      editorCount: number;
      viewerCount: number;
    };
  };
}
```

**PUT /api/teams/members/{memberId}/role**
```typescript
// 更新成员角色
interface UpdateMemberRoleRequest {
  role: 'editor' | 'viewer';
}

interface UpdateMemberRoleResponse {
  success: boolean;
  data: {
    member: TeamMember;
    auditLog: PermissionLog;
  };
}
```

### 3.2 WebSocket事件设计

```typescript
// 实时通信事件定义
namespace SocketEvents {
  // 客户端事件
  export interface ClientEvents {
    'join-project': (projectId: number) => void;
    'leave-project': (projectId: number) => void;
    'task-update': (taskUpdate: TaskUpdateEvent) => void;
  }
  
  // 服务端事件  
  export interface ServerEvents {
    'project-activity': (activity: ActivityEvent) => void;
    'member-joined': (member: TeamMember) => void;
    'member-left': (memberId: number) => void;
    'task-assigned': (assignment: TaskAssignmentEvent) => void;
    'dashboard-refresh': (data: DashboardUpdate) => void;
  }
}
```

---

## 4. 前端组件架构

### 4.1 组件层次结构

```
src/components/
├── analytics/
│   ├── Dashboard/
│   │   ├── DashboardBuilder.tsx          -- 仪表板构建器
│   │   ├── DashboardGrid.tsx            -- 网格布局管理
│   │   ├── WidgetLibrary.tsx            -- 小部件库
│   │   └── widgets/
│   │       ├── ProjectProgressWidget.tsx
│   │       ├── TimeAnalysisWidget.tsx
│   │       ├── TaskSummaryWidget.tsx
│   │       └── ActivityFeedWidget.tsx
│   ├── Charts/
│   │   ├── TimeHeatmap.tsx              -- 时间热力图
│   │   ├── GanttChart.tsx               -- 甘特图
│   │   ├── BurndownChart.tsx            -- 燃尽图
│   │   ├── TrendChart.tsx               -- 趋势图
│   │   └── DistributionChart.tsx        -- 分布图
│   └── Reports/
│       ├── ReportBuilder.tsx            -- 报告构建器
│       ├── TemplateSelector.tsx         -- 模板选择器
│       ├── ReportPreview.tsx            -- 报告预览
│       └── ExportModal.tsx              -- 导出对话框
├── team/
│   ├── MemberManagement.tsx            -- 成员管理
│   ├── InviteModal.tsx                 -- 邀请对话框
│   ├── RoleSelector.tsx                -- 角色选择器
│   ├── PermissionMatrix.tsx            -- 权限矩阵
│   └── ActivityFeed.tsx                -- 活动流
├── ui/
│   ├── LoadingSpinner.tsx              -- 加载动画
│   ├── EmptyState.tsx                  -- 空状态
│   ├── ErrorBoundary.tsx               -- 错误边界
│   └── ProgressBar.tsx                 -- 进度条
└── pwa/
    ├── InstallPrompt.tsx               -- 安装提示
    ├── OfflineIndicator.tsx            -- 离线指示器
    └── UpdateNotification.tsx          -- 更新通知
```

### 4.2 核心组件设计

#### 4.2.1 DashboardBuilder组件

```typescript
interface DashboardBuilderProps {
  userId: number;
  initialLayout?: DashboardLayout;
  onSave: (layout: DashboardLayout) => void;
  onPreview: (layout: DashboardLayout) => void;
}

interface DashboardBuilderState {
  layout: GridLayout[];
  availableWidgets: WidgetDefinition[];
  selectedWidget: string | null;
  isEditMode: boolean;
  isDragging: boolean;
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  userId,
  initialLayout,
  onSave,
  onPreview
}) => {
  // 状态管理
  const [layout, setLayout] = useState<GridLayout[]>(initialLayout?.items || []);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 拖拽处理
  const handleLayoutChange = useCallback((newLayout: GridLayout[]) => {
    setLayout(newLayout);
    // 自动保存防抖
    debouncedSave(newLayout);
  }, []);
  
  // 小部件操作
  const addWidget = useCallback((widgetType: string) => {
    const newWidget = createWidgetConfig(widgetType);
    setLayout(prev => [...prev, newWidget]);
  }, []);
  
  const removeWidget = useCallback((widgetId: string) => {
    setLayout(prev => prev.filter(item => item.i !== widgetId));
  }, []);
  
  return (
    <div className="dashboard-builder">
      <DashboardToolbar
        isEditMode={isEditMode}
        onToggleEditMode={setIsEditMode}
        onSave={() => onSave({ items: layout })}
        onPreview={() => onPreview({ items: layout })}
      />
      
      {isEditMode && (
        <WidgetLibrary onAddWidget={addWidget} />
      )}
      
      <ResponsiveGridLayout
        className="dashboard-grid"
        layouts={{ lg: layout }}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        rowHeight={60}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
      >
        {layout.map(item => (
          <div key={item.i} className="dashboard-widget">
            <WidgetRenderer
              widgetId={item.i}
              config={item.config}
              isEditMode={isEditMode}
              onRemove={() => removeWidget(item.i)}
            />
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};
```

#### 4.2.2 TimeHeatmap组件

```typescript
interface TimeHeatmapProps {
  data: HeatmapPoint[];
  timeRange: 'week' | 'month';
  onCellClick: (date: Date, hour: number) => void;
  colorScheme?: 'blue' | 'green' | 'purple';
}

interface HeatmapPoint {
  date: string;
  hour: number;
  value: number;      // 工作时长（分钟）
  taskCount: number;  // 任务数量
}

export const TimeHeatmap: React.FC<TimeHeatmapProps> = ({
  data,
  timeRange,
  onCellClick,
  colorScheme = 'blue'
}) => {
  // 数据处理
  const heatmapMatrix = useMemo(() => {
    return processHeatmapData(data, timeRange);
  }, [data, timeRange]);
  
  // 颜色映射
  const getColorIntensity = useCallback((value: number) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const intensity = maxValue > 0 ? value / maxValue : 0;
    return `var(--color-${colorScheme}-${Math.round(intensity * 9) + 1})`;
  }, [data, colorScheme]);
  
  return (
    <div className="time-heatmap">
      <div className="heatmap-legend">
        <span>少</span>
        <div className="legend-scale">
          {[1, 2, 3, 4, 5].map(level => (
            <div
              key={level}
              className={`legend-cell color-${colorScheme}-${level * 2}`}
            />
          ))}
        </div>
        <span>多</span>
      </div>
      
      <div className="heatmap-grid">
        <div className="time-labels">
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="time-label">
              {hour}:00
            </div>
          ))}
        </div>
        
        <div className="date-grid">
          {heatmapMatrix.map((dayData, dayIndex) => (
            <div key={dayIndex} className="day-column">
              <div className="date-label">
                {formatDate(dayData.date)}
              </div>
              {dayData.hours.map((hourData, hourIndex) => (
                <div
                  key={hourIndex}
                  className="heatmap-cell"
                  style={{ backgroundColor: getColorIntensity(hourData.value) }}
                  onClick={() => onCellClick(dayData.date, hourIndex)}
                  title={`${dayData.date} ${hourIndex}:00 - ${formatDuration(hourData.value)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

#### 4.2.3 TeamInviteModal组件

```typescript
interface TeamInviteModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  onInviteSuccess: (invitations: InvitationResult[]) => void;
}

export const TeamInviteModal: React.FC<TeamInviteModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onInviteSuccess
}) => {
  // 状态管理
  const [emails, setEmails] = useState<string[]>(['']);
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('viewer');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<number, string>>({});
  
  // 表单验证
  const validateEmails = useCallback(() => {
    const newErrors: Record<number, string> = {};
    emails.forEach((email, index) => {
      if (email && !isValidEmail(email)) {
        newErrors[index] = '请输入有效的邮箱地址';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [emails]);
  
  // 发送邀请
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmails()) return;
    
    setIsSubmitting(true);
    try {
      const validEmails = emails.filter(email => email.trim());
      const result = await teamAPI.inviteMembers({
        projectId,
        emails: validEmails,
        role: selectedRole,
        message: message.trim()
      });
      
      onInviteSuccess(result.data.invitations);
      onClose();
      toast.success(`成功发送 ${result.data.invitations.length} 个邀请`);
      
    } catch (error) {
      toast.error('发送邀请失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 邮箱输入管理
  const addEmailInput = () => {
    setEmails(prev => [...prev, '']);
  };
  
  const removeEmailInput = (index: number) => {
    setEmails(prev => prev.filter((_, i) => i !== index));
  };
  
  const updateEmail = (index: number, value: string) => {
    setEmails(prev => prev.map((email, i) => i === index ? value : email));
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="邀请团队成员">
      <form onSubmit={handleSubmit} className="invite-form">
        <div className="form-section">
          <label className="form-label">邮箱地址</label>
          {emails.map((email, index) => (
            <div key={index} className="email-input-row">
              <Input
                type="email"
                value={email}
                onChange={(e) => updateEmail(index, e.target.value)}
                placeholder="输入邮箱地址"
                error={errors[index]}
                className="flex-1"
              />
              {emails.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEmailInput(index)}
                >
                  删除
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEmailInput}
            className="add-email-btn"
          >
            + 添加更多邮箱
          </Button>
        </div>
        
        <div className="form-section">
          <label className="form-label">角色权限</label>
          <RadioGroup
            value={selectedRole}
            onChange={setSelectedRole}
            options={[
              { value: 'editor', label: '编辑者', description: '可以创建和编辑任务' },
              { value: 'viewer', label: '查看者', description: '只能查看项目内容' }
            ]}
          />
        </div>
        
        <div className="form-section">
          <label className="form-label">邀请消息 (可选)</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="添加个人消息..."
            rows={3}
            maxLength={500}
          />
        </div>
        
        <div className="modal-actions">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            loading={isSubmitting}
            disabled={emails.every(email => !email.trim())}
          >
            发送邀请
          </Button>
        </div>
      </form>
    </Modal>
  );
};
```

---

## 5. 状态管理设计

### 5.1 Zustand Store扩展

```typescript
// stores/analyticsStore.ts
interface AnalyticsState {
  // 数据状态
  dashboardData: DashboardData | null;
  timeAnalysisData: TimeAnalysisData | null;
  projectProgressData: ProjectProgressData | null;
  
  // UI状态
  selectedTimeRange: TimeRange;
  selectedProjects: number[];
  loadingStates: {
    dashboard: boolean;
    timeAnalysis: boolean;
    projectProgress: boolean;
    reportGeneration: boolean;
  };
  
  // 错误状态
  errors: {
    dashboard?: string;
    timeAnalysis?: string;
    projectProgress?: string;
  };
  
  // Actions
  setTimeRange: (range: TimeRange) => void;
  setSelectedProjects: (projectIds: number[]) => void;
  loadDashboardData: () => Promise<void>;
  loadTimeAnalysisData: (type: 'heatmap' | 'trend' | 'distribution') => Promise<void>;
  loadProjectProgressData: (projectId: number) => Promise<void>;
  clearErrors: () => void;
  resetAnalytics: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  // 初始状态
  dashboardData: null,
  timeAnalysisData: null,
  projectProgressData: null,
  selectedTimeRange: { type: 'month', startDate: null, endDate: null },
  selectedProjects: [],
  loadingStates: {
    dashboard: false,
    timeAnalysis: false,
    projectProgress: false,
    reportGeneration: false
  },
  errors: {},
  
  // Actions实现
  setTimeRange: (range) => set({ selectedTimeRange: range }),
  
  setSelectedProjects: (projectIds) => set({ selectedProjects: projectIds }),
  
  loadDashboardData: async () => {
    set(state => ({
      loadingStates: { ...state.loadingStates, dashboard: true },
      errors: { ...state.errors, dashboard: undefined }
    }));
    
    try {
      const { selectedTimeRange, selectedProjects } = get();
      const data = await analyticsAPI.getDashboardData({
        timeRange: selectedTimeRange,
        projectIds: selectedProjects
      });
      
      set({ dashboardData: data.data });
    } catch (error) {
      set(state => ({
        errors: { ...state.errors, dashboard: error.message }
      }));
    } finally {
      set(state => ({
        loadingStates: { ...state.loadingStates, dashboard: false }
      }));
    }
  },
  
  // ... 其他actions
}));

// stores/teamStore.ts  
interface TeamState {
  // 数据状态
  teamMembers: TeamMember[];
  invitations: Invitation[];
  currentProject: number | null;
  
  // UI状态
  isInviteModalOpen: boolean;
  selectedMembers: number[];
  loadingStates: {
    members: boolean;
    inviting: boolean;
    roleUpdating: boolean;
  };
  
  // Actions
  setCurrentProject: (projectId: number) => void;
  loadTeamMembers: () => Promise<void>;
  inviteMembers: (request: TeamInviteRequest) => Promise<void>;
  updateMemberRole: (memberId: number, role: string) => Promise<void>;
  removeMember: (memberId: number) => Promise<void>;
  openInviteModal: () => void;
  closeInviteModal: () => void;
}
```

### 5.2 React Query集成

```typescript
// hooks/useAnalyticsQuery.ts
export const useAnalyticsQuery = {
  // 仪表板数据查询
  useDashboard: (params: DashboardQueryParams) => {
    return useQuery({
      queryKey: ['analytics', 'dashboard', params],
      queryFn: () => analyticsAPI.getDashboardData(params),
      staleTime: 5 * 60 * 1000,    // 5分钟缓存
      cacheTime: 10 * 60 * 1000,   // 10分钟
      refetchOnWindowFocus: false,
      enabled: !!params.projectIds.length
    });
  },
  
  // 时间分析数据查询
  useTimeAnalysis: (params: TimeAnalysisQueryParams) => {
    return useQuery({
      queryKey: ['analytics', 'time-analysis', params],
      queryFn: () => analyticsAPI.getTimeAnalysisData(params),
      staleTime: 10 * 60 * 1000,   // 10分钟缓存
      enabled: !!params.type
    });
  },
  
  // 项目进度数据查询
  useProjectProgress: (projectId: number) => {
    return useQuery({
      queryKey: ['analytics', 'project-progress', projectId],
      queryFn: () => analyticsAPI.getProjectProgressData(projectId),
      staleTime: 2 * 60 * 1000,    // 2分钟缓存
      enabled: !!projectId
    });
  }
};

// hooks/useTeamMutation.ts
export const useTeamMutation = {
  // 邀请成员
  useInviteMembers: () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: teamAPI.inviteMembers,
      onSuccess: (data, variables) => {
        // 更新团队成员缓存
        queryClient.invalidateQueries(['team', 'members', variables.projectId]);
        
        // 乐观更新
        queryClient.setQueryData(
          ['team', 'members', variables.projectId],
          (oldData: TeamMembersResponse) => ({
            ...oldData,
            invitations: [...oldData.invitations, ...data.data.invitations]
          })
        );
      },
      onError: (error) => {
        toast.error('邀请失败: ' + error.message);
      }
    });
  },
  
  // 更新角色
  useUpdateRole: () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ memberId, role }: UpdateRoleParams) => 
        teamAPI.updateMemberRole(memberId, role),
      onSuccess: (data, variables) => {
        // 更新缓存中的成员信息
        queryClient.setQueryData(
          ['team', 'members'],
          (oldData: TeamMembersResponse) => ({
            ...oldData,
            members: oldData.members.map(member => 
              member.id === variables.memberId 
                ? { ...member, role: variables.role }
                : member
            )
          })
        );
      }
    });
  }
};
```

---

## 6. 性能优化策略

### 6.1 前端性能优化

#### 6.1.1 代码分割和懒加载

```typescript
// 路由级别的代码分割
const AnalyticsPage = lazy(() => import('../pages/Analytics'));
const TeamManagementPage = lazy(() => import('../pages/TeamManagement'));
const ReportsPage = lazy(() => import('../pages/Reports'));

// 组件级别的懒加载
const GanttChart = lazy(() => import('../components/charts/GanttChart'));
const BurndownChart = lazy(() => import('../components/charts/BurndownChart'));

// 动态导入图表库
const loadChartLibrary = async () => {
  const { Chart } = await import('chart.js');
  return Chart;
};
```

#### 6.1.2 虚拟滚动优化

```typescript
// 大列表虚拟滚动
import { FixedSizeList as List } from 'react-window';

const VirtualizedMemberList: React.FC<{ members: TeamMember[] }> = ({ members }) => {
  const MemberRow = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <MemberCard member={members[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={members.length}
      itemSize={80}
      width="100%"
    >
      {MemberRow}
    </List>
  );
};
```

#### 6.1.3 图表性能优化

```typescript
// Chart.js配置优化
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 0  // 禁用动画以提升性能
  },
  elements: {
    point: {
      radius: 0  // 大数据集时隐藏点
    }
  },
  scales: {
    x: {
      type: 'time',
      time: {
        parser: false,  // 禁用时间解析以提升性能
      }
    }
  },
  plugins: {
    decimation: {
      enabled: true,
      algorithm: 'lttb',  // 使用LTTB算法减少数据点
      samples: 500
    }
  }
};

// Canvas渲染优化
const optimizeCanvasRendering = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 启用硬件加速
    ctx.imageSmoothingEnabled = false;
    // 设置合适的像素比
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * pixelRatio;
    canvas.height = canvas.offsetHeight * pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);
  }
};
```

### 6.2 后端性能优化

#### 6.2.1 数据库查询优化

```sql
-- 分析查询的索引优化
-- 时间分析查询索引
CREATE INDEX idx_time_logs_analysis ON time_logs(user_id, log_date, created_at) 
WHERE is_deleted = 0;

-- 项目进度查询索引
CREATE INDEX idx_wbs_tasks_progress ON wbs_tasks(project_id, status, start_date, end_date)
WHERE is_deleted = 0;

-- 团队成员查询索引
CREATE INDEX idx_project_members_active ON project_members(project_id, invitation_status)
WHERE invitation_status = 'accepted';

-- 分区表优化(如果数据量大)
-- 按月分区时间记录表
CREATE TABLE time_logs_2025_01 PARTITION OF time_logs
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

#### 6.2.2 缓存策略

```typescript
// Redis缓存配置
class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  // 仪表板数据缓存
  async cacheAnalyticsData(key: string, data: any, ttl = 300) {
    await this.redis.setex(`analytics:${key}`, ttl, JSON.stringify(data));
  }
  
  async getAnalyticsData(key: string) {
    const cached = await this.redis.get(`analytics:${key}`);
    return cached ? JSON.parse(cached) : null;
  }
  
  // 查询结果缓存
  async cacheQueryResult(query: string, params: any[], result: any) {
    const cacheKey = generateCacheKey(query, params);
    await this.redis.setex(`query:${cacheKey}`, 300, JSON.stringify(result));
  }
  
  // 用户权限缓存
  async cacheUserPermissions(userId: number, projectId: number, permissions: any) {
    const key = `permissions:${userId}:${projectId}`;
    await this.redis.setex(key, 1800, JSON.stringify(permissions));
  }
}

// 应用级缓存中间件
export const cacheMiddleware = (duration: number) => {
  const cache = new Map();
  
  return (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
    const key = `${req.method}:${req.url}:${JSON.stringify(req.query)}`;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data);
    }
    
    const originalSend = res.json;
    res.json = function(data) {
      cache.set(key, { data, timestamp: Date.now() });
      return originalSend.call(this, data);
    };
    
    next();
  };
};
```

#### 6.2.3 任务队列优化

```typescript
// 报告生成任务队列
import Bull from 'bull';

interface ReportGenerationJob {
  reportId: string;
  userId: number;
  config: ReportConfig;
}

const reportQueue = new Bull<ReportGenerationJob>('report generation', {
  redis: { host: 'localhost', port: 6379 }
});

// 报告生成处理器
reportQueue.process(async (job) => {
  const { reportId, userId, config } = job.data;
  
  try {
    // 更新进度
    job.progress(10);
    
    // 获取数据
    const data = await fetchReportData(config);
    job.progress(50);
    
    // 生成报告
    const reportBuffer = await generateReport(data, config);
    job.progress(80);
    
    // 上传到云存储
    const downloadUrl = await uploadReport(reportId, reportBuffer);
    job.progress(100);
    
    // 通知用户
    await notifyUser(userId, 'report_ready', { reportId, downloadUrl });
    
    return { downloadUrl };
  } catch (error) {
    throw new Error(`报告生成失败: ${error.message}`);
  }
});

// 邮件发送任务队列
const emailQueue = new Bull('email sending');

emailQueue.process(async (job) => {
  const { type, recipients, data } = job.data;
  
  switch (type) {
    case 'team_invitation':
      return await sendInvitationEmails(recipients, data);
    case 'report_notification':
      return await sendReportNotification(recipients, data);
    default:
      throw new Error(`未知邮件类型: ${type}`);
  }
});
```

---

## 7. 安全性设计

### 7.1 权限验证中间件

```typescript
// 权限验证中间件
export const requirePermission = (permission: Permission) => {
  return async (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
    try {
      const user = req.user;
      const projectId = req.query.projectId as string;
      
      if (!user) {
        return res.status(401).json({ error: '未认证用户' });
      }
      
      // 检查项目权限
      const hasPermission = await permissionService.checkPermission(
        user.id, 
        parseInt(projectId), 
        permission
      );
      
      if (!hasPermission) {
        return res.status(403).json({ error: '权限不足' });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ error: '权限验证失败' });
    }
  };
};

// 使用示例
export default requirePermission('PROJECT_EDIT')(async (req, res) => {
  // 需要项目编辑权限的API逻辑
});
```

### 7.2 数据验证

```typescript
// 输入验证schema
const inviteMemberSchema = z.object({
  projectId: z.number().positive(),
  emails: z.array(z.string().email()).min(1).max(10),
  role: z.enum(['editor', 'viewer']),
  message: z.string().optional().nullable()
});

const updateDashboardSchema = z.object({
  name: z.string().min(1).max(255),
  layout: z.object({
    items: z.array(z.object({
      i: z.string(),
      x: z.number().min(0),
      y: z.number().min(0),
      w: z.number().min(1),
      h: z.number().min(1)
    }))
  })
});

// 验证中间件
export const validateInput = <T>(schema: z.ZodSchema<T>) => {
  return (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: '输入验证失败',
          details: error.errors
        });
      }
      next(error);
    }
  };
};
```

### 7.3 API限流

```typescript
// API限流配置
import rateLimit from 'express-rate-limit';

export const analyticsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: '分析API请求过于频繁，请稍后重试'
});

export const inviteRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 每小时最多10个邀请请求
  keyGenerator: (req) => req.user?.id || req.ip,
  message: '邀请请求过于频繁，请稍后重试'
});

export const reportGenerationLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10分钟
  max: 5, // 每10分钟最多生成5个报告
  keyGenerator: (req) => req.user?.id,
  message: '报告生成请求过于频繁'
});
```

---

## 8. 测试策略

### 8.1 单元测试

```typescript
// Analytics组件测试
describe('DashboardBuilder', () => {
  const mockProps = {
    userId: 1,
    initialLayout: { items: [] },
    onSave: jest.fn(),
    onPreview: jest.fn()
  };
  
  it('should render dashboard builder correctly', () => {
    render(<DashboardBuilder {...mockProps} />);
    expect(screen.getByText('仪表板编辑器')).toBeInTheDocument();
  });
  
  it('should enter edit mode when edit button clicked', () => {
    render(<DashboardBuilder {...mockProps} />);
    fireEvent.click(screen.getByText('编辑'));
    expect(screen.getByText('小部件库')).toBeInTheDocument();
  });
  
  it('should add widget when dragged from library', async () => {
    render(<DashboardBuilder {...mockProps} />);
    
    // 进入编辑模式
    fireEvent.click(screen.getByText('编辑'));
    
    // 拖拽添加小部件
    const widget = screen.getByText('项目进度');
    fireEvent.dragStart(widget);
    fireEvent.drop(screen.getByTestId('dashboard-grid'));
    
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalled();
    });
  });
});

// API服务测试
describe('AnalyticsService', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });
  
  it('should fetch dashboard data successfully', async () => {
    const mockData = { overview: { totalProjects: 5 } };
    fetchMock.mockResponseOnce(JSON.stringify({ success: true, data: mockData }));
    
    const result = await analyticsAPI.getDashboardData({
      timeRange: 'month',
      projectIds: [1, 2]
    });
    
    expect(result.data).toEqual(mockData);
    expect(fetchMock).toHaveBeenCalledWith('/api/analytics/dashboard', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
  });
  
  it('should handle API errors gracefully', async () => {
    fetchMock.mockRejectOnce(new Error('网络错误'));
    
    await expect(analyticsAPI.getDashboardData({ timeRange: 'month' }))
      .rejects.toThrow('网络错误');
  });
});
```

### 8.2 集成测试

```typescript
// 端到端测试
describe('Analytics Dashboard E2E', () => {
  it('should load and display dashboard data', async () => {
    // 访问分析页面
    await page.goto('/dashboard/analytics');
    
    // 等待数据加载
    await page.waitForSelector('[data-testid="dashboard-overview"]');
    
    // 验证关键指标显示
    await expect(page.locator('[data-testid="total-projects"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-projects"]')).toBeVisible();
    
    // 验证图表渲染
    await expect(page.locator('canvas')).toBeVisible();
  });
  
  it('should customize dashboard layout', async () => {
    await page.goto('/dashboard/analytics');
    
    // 进入编辑模式
    await page.click('[data-testid="edit-dashboard"]');
    
    // 添加新小部件
    await page.dragAndDrop(
      '[data-testid="widget-time-analysis"]',
      '[data-testid="dashboard-grid"]'
    );
    
    // 保存配置
    await page.click('[data-testid="save-dashboard"]');
    
    // 验证保存成功
    await expect(page.locator('.toast-success')).toBeVisible();
  });
  
  it('should generate and download PDF report', async () => {
    await page.goto('/dashboard/reports');
    
    // 选择报告模板
    await page.selectOption('[data-testid="template-selector"]', 'project-progress');
    
    // 设置时间范围
    await page.fill('[data-testid="start-date"]', '2025-01-01');
    await page.fill('[data-testid="end-date"]', '2025-01-31');
    
    // 生成报告
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="generate-pdf"]');
    
    // 验证下载
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
```

### 8.3 性能测试

```typescript
// 性能基准测试
describe('Performance Tests', () => {
  it('should load dashboard within 2 seconds', async () => {
    const startTime = performance.now();
    
    render(<AnalyticsDashboard userId={1} />);
    
    // 等待所有数据加载完成
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });
  
  it('should handle large dataset efficiently', async () => {
    // 模拟10000个数据点的时间分析
    const largeDataset = generateMockTimeData(10000);
    
    const startTime = performance.now();
    render(<TimeHeatmap data={largeDataset} />);
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(1000); // 1秒内完成渲染
  });
  
  it('should maintain 60fps during chart interactions', async () => {
    render(<InteractiveChart data={mockChartData} />);
    
    const chart = screen.getByTestId('interactive-chart');
    const fps = await measureFPS(() => {
      // 模拟鼠标悬停和平移操作
      fireEvent.mouseMove(chart, { clientX: 100, clientY: 100 });
      fireEvent.wheel(chart, { deltaX: 50, deltaY: 0 });
    });
    
    expect(fps).toBeGreaterThan(55);
  });
});
```

---

## 9. 部署和监控

### 9.1 Docker容器化

```dockerfile
# Dockerfile
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app

# 添加监控工具
RUN apk add --no-cache curl

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 复制应用文件
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

USER nextjs

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
```

### 9.2 监控配置

```typescript
// 应用性能监控
import { collectDefaultMetrics, register, Counter, Histogram } from 'prom-client';

// 收集默认指标
collectDefaultMetrics();

// 自定义指标
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const analyticsQueryDuration = new Histogram({
  name: 'analytics_query_duration_seconds',
  help: 'Duration of analytics queries',
  labelNames: ['query_type']
});

export const reportGenerationCounter = new Counter({
  name: 'report_generation_total',
  help: 'Total number of reports generated',
  labelNames: ['format', 'status']
});

// 监控中间件
export const metricsMiddleware = (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.url,
      status_code: res.statusCode
    });
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.url,
        status_code: res.statusCode
      },
      duration
    );
  });
  
  next();
};

// 指标导出端点
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end('Method Not Allowed');
  }
}
```

### 9.3 错误追踪

```typescript
// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 发送错误到监控服务
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
    
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>出现了一些问题</h2>
          <p>我们已经记录了这个错误，请刷新页面重试。</p>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// 全局错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(event.reason);
  }
});
```

---

## 10. 迁移和部署计划

### 10.1 数据迁移脚本

```typescript
// 数据库迁移脚本
export const migrationScripts = {
  // Sprint 5 数据库结构迁移
  'sprint5_001': {
    up: async (db: Database) => {
      // 创建仪表板配置表
      await db.exec(`
        CREATE TABLE dashboard_configs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          layout JSON NOT NULL,
          is_default BOOLEAN DEFAULT 0,
          is_shared BOOLEAN DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      
      // 创建索引
      await db.exec(`
        CREATE INDEX idx_dashboard_user_id ON dashboard_configs(user_id);
        CREATE INDEX idx_dashboard_default ON dashboard_configs(user_id, is_default);
      `);
    },
    
    down: async (db: Database) => {
      await db.exec('DROP TABLE IF EXISTS dashboard_configs');
    }
  },
  
  // 项目成员迁移
  'sprint5_002': {
    up: async (db: Database) => {
      await db.exec(`
        CREATE TABLE project_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          role ENUM('owner', 'editor', 'viewer') DEFAULT 'viewer',
          invited_by INTEGER NOT NULL,
          invitation_token VARCHAR(255),
          invitation_status ENUM('pending', 'accepted', 'declined', 'expired') DEFAULT 'pending',
          joined_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE RESTRICT,
          UNIQUE(project_id, user_id)
        );
      `);
      
      // 为现有项目创建所有者记录
      await db.exec(`
        INSERT INTO project_members (project_id, user_id, role, invited_by, invitation_status, joined_at)
        SELECT id, user_id, 'owner', user_id, 'accepted', created_at
        FROM projects;
      `);
    },
    
    down: async (db: Database) => {
      await db.exec('DROP TABLE IF EXISTS project_members');
    }
  }
};

// 迁移执行器
export class MigrationRunner {
  constructor(private db: Database) {}
  
  async runMigrations(targetVersion?: string) {
    const appliedMigrations = await this.getAppliedMigrations();
    const availableMigrations = Object.keys(migrationScripts);
    
    for (const migrationKey of availableMigrations) {
      if (appliedMigrations.includes(migrationKey)) {
        console.log(`Migration ${migrationKey} already applied, skipping`);
        continue;
      }
      
      if (targetVersion && migrationKey > targetVersion) {
        break;
      }
      
      console.log(`Running migration ${migrationKey}...`);
      
      try {
        await this.db.transaction(async (tx) => {
          await migrationScripts[migrationKey].up(tx);
          await tx.exec(`
            INSERT INTO schema_migrations (version, applied_at) 
            VALUES (?, ?)
          `, [migrationKey, new Date().toISOString()]);
        });
        
        console.log(`Migration ${migrationKey} completed successfully`);
      } catch (error) {
        console.error(`Migration ${migrationKey} failed:`, error);
        throw error;
      }
    }
  }
  
  private async getAppliedMigrations(): Promise<string[]> {
    const result = await this.db.all('SELECT version FROM schema_migrations ORDER BY version');
    return result.map(row => row.version);
  }
}
```

### 10.2 部署清单

```yaml
# 部署前检查清单
deployment_checklist:
  pre_deployment:
    - name: "数据库备份"
      command: "npm run backup:db"
      required: true
    
    - name: "运行测试套件"
      command: "npm run test:all"
      required: true
    
    - name: "构建生产版本"
      command: "npm run build"
      required: true
    
    - name: "安全扫描"
      command: "npm audit --production"
      required: true
  
  deployment:
    - name: "停止现有服务"
      command: "docker-compose down"
    
    - name: "拉取最新镜像"
      command: "docker-compose pull"
    
    - name: "运行数据库迁移"
      command: "npm run migrate"
    
    - name: "启动新服务"
      command: "docker-compose up -d"
  
  post_deployment:
    - name: "健康检查"
      command: "curl -f http://localhost:3000/api/health"
      timeout: 30
    
    - name: "功能验证"
      command: "npm run test:e2e:production"
    
    - name: "性能监控检查"
      url: "http://localhost:9090/metrics"
    
    - name: "清理旧镜像"
      command: "docker image prune -f"
```

---

这份技术设计文档提供了Sprint 5功能的完整技术实现方案，涵盖了数据库设计、API规范、前端架构、性能优化、安全性和部署策略等各个方面。开发团队可以基于这份文档进行具体的功能开发。

**文档状态**: ✅ 已完成  
**创建人**: 多智能体开发团队  
**审核人**: 技术架构师  
**最后更新**: 2025年8月6日