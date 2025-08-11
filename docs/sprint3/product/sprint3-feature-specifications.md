# Sprint 3 功能规格说明书
## Nobody Logger - 时间跟踪系统

**版本**: 1.0  
**日期**: 2025年8月5日  
**产品负责人**: Multi-Agent Development Team  
**开发团队**: Multi-Agent Development Team

---

## 1. 功能概览

### 1.1 系统架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  TimeEntryForm  │    │  Time Logs API  │    │  TimeLogService │
│   (Frontend)    │◄──►│   (REST API)    │◄──►│  (Business)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Middleware    │    │    Database     │
│  Integration    │    │ (Auth/Validation)│    │  (time_logs)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 核心组件
- **TimeEntryForm**: React组件，提供时间跟踪UI
- **Time Logs API**: RESTful API端点
- **TimeLogService**: 业务逻辑服务层
- **Database Schema**: time_logs表和相关索引

---

## 2. 详细功能规格

### 2.1 实时计时器功能

#### 2.1.1 计时器状态管理

**组件**: TimeEntryForm.tsx  
**状态结构**:
```typescript
interface TimerState {
  activeTimer: TimeLog | null;
  elapsedTime: number; // 秒数
  timerInterval: NodeJS.Timeout | null;
  isRunning: boolean;
}
```

**业务逻辑**:
1. **启动计时器**:
   ```typescript
   const startTimer = async (taskId: number, description?: string) => {
     // 1. 验证是否已有活跃计时器
     const existing = await checkActiveTimer(userId);
     if (existing) {
       throw new Error('已有正在运行的计时器');
     }
     
     // 2. 创建新的时间日志记录
     const timeLog = await createTimeLog({
       task_id: taskId,
       description,
       start_time: new Date().toISOString(),
       is_manual: false
     });
     
     // 3. 启动前端计时器
     setActiveTimer(timeLog);
     startTimerInterval();
   };
   ```

2. **停止计时器**:
   ```typescript
   const stopTimer = async (timeLogId: number) => {
     // 1. 停止前端计时器
     clearInterval(timerInterval);
     
     // 2. 更新服务器记录
     const updatedLog = await stopTimeLog(timeLogId);
     
     // 3. 更新UI状态
     setActiveTimer(null);
     setElapsedTime(0);
     
     // 4. 触发回调更新任务工时
     onTimeLogCreated?.(updatedLog);
   };
   ```

#### 2.1.2 API端点规格

**启动计时器端点**:
```
POST /api/time-logs/timer/start
Content-Type: application/json

Request Body:
{
  "task_id": number,
  "description": string (optional)
}

Response (200 OK):
{
  "success": true,
  "data": {
    "timeLog": TimeLog,
    "message": "计时器已启动"
  }
}

Error Responses:
400 Bad Request: 输入验证失败
409 Conflict: 已有活跃计时器
403 Forbidden: 无权限访问任务
```

**停止计时器端点**:
```
POST /api/time-logs/timer/stop
Content-Type: application/json

Request Body:
{
  "time_log_id": number
}

Response (200 OK):
{
  "success": true,
  "data": {
    "timeLog": TimeLog,
    "message": "计时器已停止，工作时间已保存"
  }
}
```

**获取活跃计时器端点**:
```
GET /api/time-logs/timer

Response (200 OK):
{
  "success": true,
  "data": {
    "activeTimer": TimeLog | null
  }
}
```

### 2.2 手动时间录入功能

#### 2.2.1 表单组件规格

**表单字段**:
```typescript
interface ManualEntryForm {
  selectedProject: Project | null;
  selectedTask: WBSTask | null;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format (optional)
  description: string; // max 500 chars
}
```

**表单验证**:
```typescript
const validateManualEntry = (formData: ManualEntryForm) => {
  const errors: string[] = [];
  
  // 必填字段验证
  if (!formData.selectedTask) {
    errors.push('请选择任务');
  }
  
  if (!formData.date) {
    errors.push('请选择日期');
  }
  
  if (!formData.startTime) {
    errors.push('请输入开始时间');
  }
  
  // 时间逻辑验证
  if (formData.endTime && formData.startTime >= formData.endTime) {
    errors.push('结束时间必须晚于开始时间');
  }
  
  // 日期范围验证
  const selectedDate = new Date(formData.date);
  const today = new Date();
  if (selectedDate > today) {
    errors.push('不能选择未来日期');
  }
  
  // 描述长度验证
  if (formData.description.length > 500) {
    errors.push('工作描述不能超过500个字符');
  }
  
  return errors;
};
```

#### 2.2.2 手动录入API规格

**创建时间记录端点**:
```
POST /api/time-logs
Content-Type: application/json

Request Body:
{
  "task_id": number,
  "description": string (optional),
  "start_time": string, // ISO 8601 format
  "end_time": string (optional), // ISO 8601 format
  "is_manual": boolean // default: true
}

Response (201 Created):
{
  "success": true,
  "data": {
    "timeLog": TimeLog,
    "message": "时间记录已保存"
  }
}

Business Logic:
1. 验证用户对任务的访问权限
2. 验证时间逻辑（end_time > start_time）
3. 计算duration_seconds
4. 创建时间记录
5. 更新任务actual_hours
6. 返回创建的记录
```

### 2.3 时间记录管理功能

#### 2.3.1 查询时间记录端点

**获取时间记录列表**:
```
GET /api/time-logs
Query Parameters:
- task_id: number (optional) - 按任务筛选
- project_id: number (optional) - 按项目筛选  
- start_date: string (optional) - 开始日期 YYYY-MM-DD
- end_date: string (optional) - 结束日期 YYYY-MM-DD
- limit: number (optional, default: 50) - 每页记录数
- offset: number (optional, default: 0) - 分页偏移
- stats: boolean (optional) - 是否返回统计信息

Response (200 OK):
{
  "success": true,
  "data": {
    "timeLogs": TimeLog[],
    "stats": {
      "total_entries": number,
      "total_hours": number,
      "total_seconds": number,
      "avg_session_hours": number,
      "days_with_entries": number
    },
    "activeTimer": TimeLog | null,
    "dailyStats": DailyStats[]
  }
}
```

#### 2.3.2 编辑时间记录端点

**更新时间记录**:
```
PUT /api/time-logs/[id]
Content-Type: application/json

Request Body:
{
  "description": string (optional),
  "start_time": string (optional), // ISO 8601 format
  "end_time": string (optional) // ISO 8601 format
}

Response (200 OK):
{
  "success": true,
  "data": {
    "timeLog": TimeLog,
    "message": "时间记录已更新"
  }
}

Business Logic:
1. 验证记录所有权
2. 验证时间逻辑
3. 重新计算duration_seconds
4. 更新记录
5. 重新计算任务actual_hours
6. 返回更新后的记录
```

#### 2.3.3 删除时间记录端点

**软删除时间记录**:
```
DELETE /api/time-logs/[id]

Response (200 OK):
{
  "success": true,
  "data": {
    "message": "时间记录已删除"
  }
}

Business Logic:
1. 验证记录所有权
2. 软删除记录 (is_deleted = true)
3. 重新计算任务actual_hours
4. 返回成功消息
```

### 2.4 数据服务层规格

#### 2.4.1 TimeLogService类规格

```typescript
export class TimeLogService {
  private db: Database;
  
  constructor() {
    this.db = getDatabase();
  }
  
  // 创建时间记录
  async createTimeLog(userId: number, input: CreateTimeLogInput): Promise<TimeLog> {
    // 1. 验证任务权限
    const task = await this.validateTaskAccess(userId, input.task_id);
    
    // 2. 计算持续时间
    const durationSeconds = input.end_time 
      ? this.calculateDuration(input.start_time, input.end_time)
      : null;
    
    // 3. 创建记录
    const timeLog = await this.insertTimeLog({
      ...input,
      user_id: userId,
      duration_seconds: durationSeconds,
      log_date: input.start_time.split('T')[0]
    });
    
    // 4. 更新任务工时
    if (durationSeconds) {
      await this.updateTaskActualHours(input.task_id);
    }
    
    return timeLog;
  }
  
  // 启动计时器
  async startTimer(userId: number, taskId: number, description?: string): Promise<TimeLog> {
    // 1. 检查活跃计时器
    const activeTimer = await this.getActiveTimer(userId);
    if (activeTimer) {
      throw new Error('已有正在进行的计时');
    }
    
    // 2. 创建计时器记录
    return this.createTimeLog(userId, {
      task_id: taskId,
      description,
      start_time: new Date().toISOString(),
      is_manual: false
    });
  }
  
  // 停止计时器
  async stopTimer(userId: number, timeLogId: number): Promise<TimeLog> {
    // 1. 验证计时器所有权
    const timeLog = await this.findTimeLogById(timeLogId);
    if (!timeLog || timeLog.user_id !== userId) {
      throw new Error('计时器不存在或没有权限');
    }
    
    // 2. 更新结束时间
    const endTime = new Date().toISOString();
    const durationSeconds = this.calculateDuration(timeLog.start_time, endTime);
    
    // 3. 更新记录
    const updatedLog = await this.updateTimeLog(timeLogId, {
      end_time: endTime,
      duration_seconds: durationSeconds
    });
    
    // 4. 更新任务工时
    await this.updateTaskActualHours(timeLog.task_id);
    
    return updatedLog;
  }
  
  // 获取活跃计时器
  getActiveTimer(userId: number): TimeLog | null {
    const stmt = this.db.prepare(`
      SELECT tl.*, t.name as task_name, p.name as project_name, p.color as project_color
      FROM time_logs tl
      JOIN wbs_tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE tl.user_id = ? AND tl.end_time IS NULL AND tl.is_deleted = 0
    `);
    
    return stmt.get(userId) || null;
  }
  
  // 获取时间统计
  getTimeStats(userId: number, options: FilterOptions): TimeStats {
    let whereClause = 'WHERE tl.user_id = ? AND tl.is_deleted = 0';
    const params = [userId];
    
    if (options.task_id) {
      whereClause += ' AND tl.task_id = ?';
      params.push(options.task_id);
    }
    
    if (options.start_date) {
      whereClause += ' AND tl.log_date >= ?';
      params.push(options.start_date);
    }
    
    if (options.end_date) {
      whereClause += ' AND tl.log_date <= ?';
      params.push(options.end_date);
    }
    
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_entries,
        COALESCE(SUM(duration_seconds), 0) as total_seconds,
        COALESCE(AVG(duration_seconds), 0) as avg_session_seconds,
        COUNT(DISTINCT log_date) as days_with_entries
      FROM time_logs tl
      ${whereClause}
      AND duration_seconds IS NOT NULL
    `);
    
    const result = stmt.get(...params);
    
    return {
      total_entries: result.total_entries,
      total_hours: Number((result.total_seconds / 3600).toFixed(2)),
      total_seconds: result.total_seconds,
      avg_session_hours: Number((result.avg_session_seconds / 3600).toFixed(2)),
      days_with_entries: result.days_with_entries
    };
  }
  
  // 私有辅助方法
  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  }
  
  private async updateTaskActualHours(taskId: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE wbs_tasks 
      SET actual_hours = (
        SELECT COALESCE(SUM(duration_seconds), 0) / 3600.0
        FROM time_logs 
        WHERE task_id = ? AND is_deleted = 0 AND duration_seconds IS NOT NULL
      ),
      updated_at = CURRENT_TIMESTAMP,
      sync_version = sync_version + 1
      WHERE id = ?
    `);
    
    stmt.run(taskId, taskId);
  }
  
  private async validateTaskAccess(userId: number, taskId: number): Promise<WBSTask> {
    const stmt = this.db.prepare(`
      SELECT t.* 
      FROM wbs_tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ? AND p.user_id = ? AND t.is_deleted = 0 AND p.is_deleted = 0
    `);
    
    const task = stmt.get(taskId, userId);
    if (!task) {
      throw new Error('任务不存在或没有权限');
    }
    
    return task;
  }
}
```

### 2.5 前端组件规格

#### 2.5.1 TimeEntryForm组件完整规格

```typescript
interface TimeEntryFormProps {
  userId: number;
  projects: Project[];
  onTimeLogCreated?: (timeLog: TimeLog) => void;
  onTimeLogUpdated?: (timeLog: TimeLog) => void;
}

export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  userId,
  projects,
  onTimeLogCreated,
  onTimeLogUpdated
}) => {
  // 状态管理
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [availableTasks, setAvailableTasks] = useState<WBSTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<WBSTask | null>(null);
  const [activeTimer, setActiveTimer] = useState<TimeLog | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
  // 手动录入表单状态
  const [manualEntry, setManualEntry] = useState({
    description: '',
    start_time: '',
    end_time: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  // 组件生命周期
  useEffect(() => {
    loadActiveTimer();
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, []);
  
  // 项目选择处理
  useEffect(() => {
    if (selectedProject) {
      loadProjectTasks(selectedProject.id);
    } else {
      setAvailableTasks([]);
      setSelectedTask(null);
    }
  }, [selectedProject]);
  
  // 计时器相关方法
  const startTimer = async () => {
    if (!selectedTask) {
      showError('请先选择任务');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/time-logs/timer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: selectedTask.id,
          description: timerDescription
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      const result = await response.json();
      setActiveTimer(result.data.timeLog);
      startTimerInterval();
      showSuccess('计时器已启动');
      
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const stopTimer = async () => {
    if (!activeTimer) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/time-logs/timer/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time_log_id: activeTimer.id
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      const result = await response.json();
      setActiveTimer(null);
      setElapsedTime(0);
      clearInterval(timerInterval);
      
      onTimeLogCreated?.(result.data.timeLog);
      showSuccess('计时器已停止，工作时间已保存');
      
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 渲染方法
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">时间记录</h2>
      
      {/* 活跃计时器显示 */}
      {activeTimer && (
        <ActiveTimerDisplay 
          timer={activeTimer}
          elapsedTime={elapsedTime}
          onStop={stopTimer}
        />
      )}
      
      {/* 项目任务选择 */}
      <ProjectTaskSelector
        projects={projects}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
        availableTasks={availableTasks}
        selectedTask={selectedTask}
        onTaskChange={setSelectedTask}
      />
      
      {/* 快速计时器 */}
      <QuickTimerSection
        selectedTask={selectedTask}
        activeTimer={activeTimer}
        onStart={startTimer}
        loading={loading}
      />
      
      {/* 手动时间录入 */}
      <ManualEntrySection
        selectedTask={selectedTask}
        formData={manualEntry}
        onFormChange={setManualEntry}
        onSubmit={submitManualEntry}
        loading={loading}
      />
    </div>
  );
};
```

### 2.6 错误处理规格

#### 2.6.1 API错误响应格式

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// 标准错误代码
enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}
```

#### 2.6.2 前端错误处理

```typescript
const handleApiError = (error: ApiErrorResponse) => {
  switch (error.error.code) {
    case ErrorCodes.VALIDATION_ERROR:
      showFieldErrors(error.error.details);
      break;
    case ErrorCodes.PERMISSION_DENIED:
      showError('您没有权限执行此操作');
      break;
    case ErrorCodes.BUSINESS_RULE_VIOLATION:
      showError(error.error.message);
      break;
    default:
      showError('操作失败，请稍后重试');
  }
};
```

---

## 3. 数据库规格

### 3.1 表结构

```sql
-- 时间日志表
CREATE TABLE time_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    is_manual BOOLEAN DEFAULT 1,
    log_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_version INTEGER DEFAULT 1,
    last_sync_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES wbs_tasks(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX idx_time_logs_date ON time_logs(log_date);
CREATE INDEX idx_time_logs_time_range ON time_logs(start_time, end_time);

-- 触发器：自动更新 updated_at
CREATE TRIGGER update_time_logs_timestamp 
    AFTER UPDATE ON time_logs
BEGIN
    UPDATE time_logs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

### 3.2 数据迁移脚本

```sql
-- 确保现有任务表有 actual_hours 字段
ALTER TABLE wbs_tasks ADD COLUMN actual_hours DECIMAL(8,2) DEFAULT 0;

-- 更新现有任务的 actual_hours（如果有历史时间数据）
UPDATE wbs_tasks 
SET actual_hours = (
    SELECT COALESCE(SUM(duration_seconds), 0) / 3600.0
    FROM time_logs 
    WHERE task_id = wbs_tasks.id 
      AND is_deleted = 0 
      AND duration_seconds IS NOT NULL
)
WHERE id IN (
    SELECT DISTINCT task_id FROM time_logs WHERE is_deleted = 0
);
```

---

## 4. 测试规格

### 4.1 单元测试覆盖范围

- **TimeLogService**: 85%+ 代码覆盖率
- **API路由处理**: 90%+ 覆盖率
- **前端组件**: 80%+ 覆盖率
- **业务规则验证**: 100%覆盖率

### 4.2 集成测试场景

1. **完整工作流程测试**
2. **权限验证测试**
3. **数据一致性测试**
4. **并发操作测试**

### 4.3 性能测试要求

- API响应时间 < 200ms
- 支持100并发用户
- 内存使用稳定
- 数据库查询优化

---

**文档状态**: 已完成  
**最后更新**: 2025年8月5日  
**相关文档**: 
- [Sprint 3 PRD](./sprint3-prd.md)
- [Sprint 3 用户故事](./sprint3-user-stories.md)
- [Sprint 3 业务规则](./sprint3-business-rules.md)