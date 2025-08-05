# Sprint 3 组件规格文档
## TimeEntryForm 组件详细规格

**版本**: 1.0  
**日期**: 2025年8月5日  
**开发团队**: Multi-Agent Development Team

---

## 1. 组件概览

### 1.1 组件职责
TimeEntryForm是Sprint 3时间跟踪系统的核心React组件，负责：
- 提供实时计时器功能
- 支持手动时间记录输入
- 集成项目和任务选择
- 管理时间记录的创建和更新

### 1.2 组件层级结构
```
TimeEntryForm (主组件)
├── ActiveTimerDisplay (活跃计时器显示)
├── ProjectTaskSelector (项目任务选择器)
├── QuickTimerSection (快速计时器区域)
├── ManualEntrySection (手动录入区域)
└── TimeLogsList (时间记录列表，可选)
```

---

## 2. 接口规格

### 2.1 Props接口定义

```typescript
interface TimeEntryFormProps {
  /** 当前用户ID */
  userId: number;
  
  /** 用户可访问的项目列表 */
  projects: Project[];
  
  /** 时间记录创建成功回调 */
  onTimeLogCreated?: (timeLog: TimeLog) => void;
  
  /** 时间记录更新成功回调 */
  onTimeLogUpdated?: (timeLog: TimeLog) => void;
  
  /** 组件初始状态配置 */
  initialState?: {
    selectedProjectId?: number;
    selectedTaskId?: number;
    showManualEntry?: boolean;
  };
  
  /** 样式定制选项 */
  className?: string;
  
  /** 是否显示时间统计信息 */
  showStats?: boolean;
  
  /** 是否启用移动端优化模式 */
  mobileOptimized?: boolean;
}
```

### 2.2 状态管理接口

```typescript
interface TimeEntryFormState {
  // 项目任务选择
  selectedProject: Project | null;
  availableTasks: WBSTask[];
  selectedTask: WBSTask | null;
  
  // 计时器状态
  activeTimer: TimeLog | null;
  elapsedTime: number; // 秒数
  timerInterval: NodeJS.Timeout | null;
  isTimerRunning: boolean;
  
  // 手动录入表单
  manualEntry: {
    description: string;
    startTime: string; // HH:MM格式
    endTime: string;   // HH:MM格式
    date: string;      // YYYY-MM-DD格式
  };
  
  // UI状态
  loading: boolean;
  error: string | null;
  success: string | null;
  showManualEntry: boolean;
  
  // 快速计时器
  timerDescription: string;
}
```

### 2.3 方法接口

```typescript
interface TimeEntryFormMethods {
  // 计时器控制
  startTimer: (taskId: number, description?: string) => Promise<void>;
  stopTimer: (timeLogId: number) => Promise<void>;
  pauseTimer: () => void; // 预留接口
  resumeTimer: () => void; // 预留接口
  
  // 手动录入
  submitManualEntry: (data: ManualEntryData) => Promise<void>;
  resetManualEntry: () => void;
  
  // 项目任务管理
  loadProjectTasks: (projectId: number) => Promise<void>;
  selectProject: (project: Project) => void;
  selectTask: (task: WBSTask) => void;
  
  // 数据刷新
  refreshActiveTimer: () => Promise<void>;
  refreshTaskList: () => Promise<void>;
  
  // UI控制
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  clearMessages: () => void;
}
```

---

## 3. 子组件规格

### 3.1 ActiveTimerDisplay 组件

#### 3.1.1 组件props
```typescript
interface ActiveTimerDisplayProps {
  timer: TimeLog;
  elapsedTime: number;
  onStop: (timeLogId: number) => void;
  onPause?: () => void; // 预留
  className?: string;
}
```

#### 3.1.2 组件结构
```jsx
const ActiveTimerDisplay: React.FC<ActiveTimerDisplayProps> = ({
  timer,
  elapsedTime,
  onStop,
  className
}) => {
  return (
    <div className={`active-timer-display ${className || ''}`}>
      {/* 状态指示器 */}
      <div className="timer-status">
        <span className="timer-status-dot active" />
        <span className="timer-status-text">正在计时</span>
      </div>
      
      {/* 任务信息 */}
      <div className="timer-context">
        <h3 className="timer-project-name">{timer.project_name}</h3>
        <p className="timer-task-name">{timer.task_name}</p>
        {timer.description && (
          <p className="timer-description">{timer.description}</p>
        )}
      </div>
      
      {/* 时间显示 */}
      <div className="timer-main-display">
        {formatElapsedTime(elapsedTime)}
      </div>
      
      {/* 控制按钮 */}
      <div className="timer-controls">
        <button 
          className="btn-stop-timer"
          onClick={() => onStop(timer.id)}
        >
          <span className="btn-icon">⏹️</span>
          停止计时
        </button>
      </div>
    </div>
  );
};
```

### 3.2 ProjectTaskSelector 组件

#### 3.2.1 组件props
```typescript
interface ProjectTaskSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  onProjectChange: (project: Project | null) => void;
  availableTasks: WBSTask[];
  selectedTask: WBSTask | null;
  onTaskChange: (task: WBSTask | null) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}
```

#### 3.2.2 组件实现
```jsx
const ProjectTaskSelector: React.FC<ProjectTaskSelectorProps> = ({
  projects,
  selectedProject,
  onProjectChange,
  availableTasks,
  selectedTask,
  onTaskChange,
  loading = false,
  disabled = false,
  className
}) => {
  return (
    <div className={`project-task-selector ${className || ''}`}>
      {/* 项目选择 */}
      <div className="form-field">
        <label htmlFor="project-select" className="time-form-label required">
          项目
        </label>
        <select
          id="project-select"
          value={selectedProject?.id || ''}
          onChange={(e) => {
            const projectId = parseInt(e.target.value);
            const project = projects.find(p => p.id === projectId) || null;
            onProjectChange(project);
          }}
          disabled={disabled || loading}
          className="time-form-input"
          required
        >
          <option value="">请选择项目</option>
          {projects.filter(p => p.is_active).map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* 任务选择 */}
      <div className="form-field">
        <label htmlFor="task-select" className="time-form-label required">
          任务
        </label>
        <select
          id="task-select"
          value={selectedTask?.id || ''}
          onChange={(e) => {
            const taskId = parseInt(e.target.value);
            const task = availableTasks.find(t => t.id === taskId) || null;
            onTaskChange(task);
          }}
          disabled={disabled || loading || !selectedProject}
          className="time-form-input"
          required
        >
          <option value="">请选择任务</option>
          {availableTasks.filter(t => !t.is_deleted).map(task => (
            <option key={task.id} value={task.id}>
              <TaskSelectOption task={task} />
            </option>
          ))}
        </select>
        {!selectedProject && (
          <div className="time-help-text">请先选择项目</div>
        )}
      </div>
    </div>
  );
};

// 任务选项组件
const TaskSelectOption: React.FC<{ task: WBSTask }> = ({ task }) => (
  <>
    {task.wbs_code && (
      <span className="task-wbs-code">{task.wbs_code}</span>
    )}
    <span className="task-name">{task.name}</span>
  </>
);
```

### 3.3 QuickTimerSection 组件

#### 3.3.1 组件props
```typescript
interface QuickTimerSectionProps {
  selectedTask: WBSTask | null;
  activeTimer: TimeLog | null;
  onStart: (description?: string) => void;
  loading?: boolean;
  className?: string;
}
```

#### 3.3.2 组件实现
```jsx
const QuickTimerSection: React.FC<QuickTimerSectionProps> = ({
  selectedTask,
  activeTimer,
  onStart,
  loading = false,
  className
}) => {
  const [description, setDescription] = useState('');
  
  const handleStart = () => {
    onStart(description);
    setDescription(''); // 清空描述
  };
  
  const canStart = selectedTask && !activeTimer && !loading;
  
  return (
    <div className={`quick-timer-section ${className || ''}`}>
      <h3 className="time-section-title">快速计时</h3>
      
      <div className="form-field">
        <label htmlFor="timer-description" className="time-form-label">
          工作描述（可选）
        </label>
        <input
          id="timer-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述您要进行的工作..."
          className="time-form-input"
          maxLength={500}
          disabled={!canStart}
        />
        <div className="time-help-text">
          {description.length}/500 字符
        </div>
      </div>
      
      <div className="time-form-actions">
        <button
          className="btn-start-timer"
          onClick={handleStart}
          disabled={!canStart}
        >
          <span className="btn-icon">▶️</span>
          {loading ? '启动中...' : '开始计时'}
        </button>
        
        {description && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setDescription('')}
            disabled={loading}
          >
            清空描述
          </button>
        )}
      </div>
      
      {!selectedTask && (
        <div className="time-help-text">
          请先选择项目和任务后开始计时
        </div>
      )}
      
      {activeTimer && (
        <div className="time-help-text">
          已有活跃计时器，请先停止当前计时器
        </div>
      )}
    </div>
  );
};
```

### 3.4 ManualEntrySection 组件

#### 3.4.1 组件props
```typescript
interface ManualEntrySectionProps {
  selectedTask: WBSTask | null;
  formData: ManualEntryFormData;
  onFormChange: (data: ManualEntryFormData) => void;
  onSubmit: (data: ManualEntryFormData) => void;
  loading?: boolean;
  className?: string;
}

interface ManualEntryFormData {
  description: string;
  startTime: string;
  endTime: string;
  date: string;
}
```

#### 3.4.2 组件实现
```jsx
const ManualEntrySection: React.FC<ManualEntrySectionProps> = ({
  selectedTask,
  formData,
  onFormChange,
  onSubmit,
  loading = false,
  className
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = (data: ManualEntryFormData) => {
    const newErrors: Record<string, string> = {};
    
    if (!data.date) {
      newErrors.date = '请选择日期';
    }
    
    if (!data.startTime) {
      newErrors.startTime = '请输入开始时间';
    }
    
    if (data.endTime && data.startTime >= data.endTime) {
      newErrors.endTime = '结束时间必须晚于开始时间';
    }
    
    if (data.description.length > 500) {
      newErrors.description = '描述不能超过500个字符';
    }
    
    // 日期不能是未来
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 设置到今天结束
    
    if (selectedDate > today) {
      newErrors.date = '不能选择未来日期';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }
    
    onSubmit(formData);
  };
  
  const handleInputChange = (field: keyof ManualEntryFormData, value: string) => {
    const newData = { ...formData, [field]: value };
    onFormChange(newData);
    
    // 清除相关字段的错误
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };
  
  return (
    <div className={`manual-entry-section ${className || ''}`}>
      <h3 className="time-section-title">手动时间录入</h3>
      
      <form onSubmit={handleSubmit}>
        {/* 时间输入行 */}
        <div className="time-input-row">
          <div className="form-field">
            <label htmlFor="entry-date" className="time-form-label required">
              日期
            </label>
            <input
              id="entry-date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={`time-form-input date-input ${
                errors.date ? 'error' : ''
              }`}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            {errors.date && (
              <div className="time-error-text">{errors.date}</div>
            )}
          </div>
          
          <div className="form-field">
            <label htmlFor="start-time" className="time-form-label required">
              开始时间
            </label>
            <input
              id="start-time"
              type="time"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              className={`time-form-input time-input ${
                errors.startTime ? 'error' : ''
              }`}
              required
            />
            {errors.startTime && (
              <div className="time-error-text">{errors.startTime}</div>
            )}
          </div>
          
          <div className="form-field">
            <label htmlFor="end-time" className="time-form-label">
              结束时间（可选）
            </label>
            <input
              id="end-time"
              type="time"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              className={`time-form-input time-input ${
                errors.endTime ? 'error' : ''
              }`}
            />
            {errors.endTime && (
              <div className="time-error-text">{errors.endTime}</div>
            )}
            <div className="time-help-text">
              留空则只记录开始时间
            </div>
          </div>
        </div>
        
        {/* 描述输入 */}
        <div className="form-field">
          <label htmlFor="entry-description" className="time-form-label">
            工作描述
          </label>
          <textarea
            id="entry-description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="详细描述您的工作内容..."
            className={`time-form-input ${errors.description ? 'error' : ''}`}
            rows={3}
            maxLength={500}
          />
          <div className="time-help-text">
            {formData.description.length}/500 字符
          </div>
          {errors.description && (
            <div className="time-error-text">{errors.description}</div>
          )}
        </div>
        
        {/* 操作按钮 */}
        <div className="time-form-actions">
          <button
            type="submit"
            className="btn-save-manual"
            disabled={!selectedTask || loading}
          >
            <span className="btn-icon">💾</span>
            {loading ? '保存中...' : '保存记录'}
          </button>
          
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              onFormChange({
                description: '',
                startTime: '',
                endTime: '',
                date: new Date().toISOString().split('T')[0]
              });
              setErrors({});
            }}
            disabled={loading}
          >
            <span className="btn-icon">🔄</span>
            重置
          </button>
        </div>
        
        {!selectedTask && (
          <div className="time-help-text">
            请先选择项目和任务后录入时间
          </div>
        )}
      </form>
    </div>
  );
};
```

---

## 4. Hooks和工具函数

### 4.1 自定义Hooks

#### 4.1.1 useTimer Hook
```typescript
interface UseTimerReturn {
  elapsedTime: number;
  isRunning: boolean;
  start: (startTime: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

const useTimer = (): UseTimerReturn => {
  const [startTime, setStartTime] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const updateElapsedTime = useCallback(() => {
    if (startTime) {
      const now = new Date();
      const start = new Date(startTime);
      const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
      setElapsedTime(elapsed);
    }
  }, [startTime]);
  
  const start = useCallback((startTimeString: string) => {
    setStartTime(startTimeString);
    setIsRunning(true);
    
    intervalRef.current = setInterval(updateElapsedTime, 1000);
  }, [updateElapsedTime]);
  
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);
  
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);
  
  const resume = useCallback(() => {
    if (startTime && !isRunning) {
      setIsRunning(true);
      intervalRef.current = setInterval(updateElapsedTime, 1000);
    }
  }, [startTime, isRunning, updateElapsedTime]);
  
  const reset = useCallback(() => {
    stop();
    setStartTime(null);
    setElapsedTime(0);
  }, [stop]);
  
  // 清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // 初始化时更新一次时间
  useEffect(() => {
    if (startTime && isRunning) {
      updateElapsedTime();
    }
  }, [startTime, isRunning, updateElapsedTime]);
  
  return {
    elapsedTime,
    isRunning,
    start,
    stop,
    pause,
    resume,
    reset
  };
};
```

#### 4.1.2 useTimeLogApi Hook
```typescript
interface UseTimeLogApiReturn {
  createTimeLog: (data: CreateTimeLogInput) => Promise<TimeLog>;
  updateTimeLog: (id: number, data: UpdateTimeLogInput) => Promise<TimeLog>;
  deleteTimeLog: (id: number) => Promise<void>;
  startTimer: (taskId: number, description?: string) => Promise<TimeLog>;
  stopTimer: (timeLogId: number) => Promise<TimeLog>;
  getActiveTimer: () => Promise<TimeLog | null>;
  getTimeLogs: (filters?: TimeLogFilters) => Promise<TimeLogResponse>;
  loading: boolean;
  error: string | null;
}

const useTimeLogApi = (): UseTimeLogApiReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiCall = async <T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API请求失败');
      }
      
      const data = await response.json();
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const createTimeLog = useCallback(async (data: CreateTimeLogInput) => {
    return apiCall<TimeLog>('/api/time-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, []);
  
  const startTimer = useCallback(async (taskId: number, description?: string) => {
    return apiCall<TimeLog>('/api/time-logs/timer/start', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId, description }),
    });
  }, []);
  
  const stopTimer = useCallback(async (timeLogId: number) => {
    return apiCall<TimeLog>('/api/time-logs/timer/stop', {
      method: 'POST',
      body: JSON.stringify({ time_log_id: timeLogId }),
    });
  }, []);
  
  const getActiveTimer = useCallback(async () => {
    return apiCall<TimeLog | null>('/api/time-logs/timer');
  }, []);
  
  // ... 其他API方法
  
  return {
    createTimeLog,
    updateTimeLog,
    deleteTimeLog,
    startTimer,
    stopTimer,
    getActiveTimer,
    getTimeLogs,
    loading,
    error
  };
};
```

### 4.2 工具函数

#### 4.2.1 时间格式化函数
```typescript
/**
 * 格式化秒数为 HH:MM:SS 格式
 */
export const formatElapsedTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return [hours, minutes, remainingSeconds]
    .map(unit => unit.toString().padStart(2, '0'))
    .join(':');
};

/**
 * 格式化持续时间为人类可读格式
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 
      ? `${minutes}分${remainingSeconds}秒`
      : `${minutes}分钟`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  let result = `${hours}小时`;
  if (remainingMinutes > 0) {
    result += `${remainingMinutes}分钟`;
  }
  if (remainingSeconds > 0) {
    result += `${remainingSeconds}秒`;
  }
  
  return result;
};

/**
 * 将时间字符串转换为秒数
 */
export const timeStringToSeconds = (timeStr: string): number => {
  const [hours, minutes, seconds = 0] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * 计算两个时间字符串之间的秒数差
 */
export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);
  
  // 处理跨日情况
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  return Math.floor((end.getTime() - start.getTime()) / 1000);
};
```

#### 4.2.2 表单验证函数
```typescript
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * 验证手动时间录入表单
 */
export const validateManualEntry = (data: ManualEntryFormData): ValidationResult => {
  const errors: Record<string, string> = {};
  
  // 日期验证
  if (!data.date) {
    errors.date = '请选择日期';
  } else {
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      errors.date = '不能选择未来日期';
    }
    
    // 检查日期是否过早（可配置）
    const earliestDate = new Date();
    earliestDate.setFullYear(earliestDate.getFullYear() - 1);
    
    if (selectedDate < earliestDate) {
      errors.date = '日期不能早于一年前';
    }
  }
  
  // 开始时间验证
  if (!data.startTime) {
    errors.startTime = '请输入开始时间';
  }
  
  // 结束时间验证
  if (data.endTime && data.startTime) {
    if (data.startTime >= data.endTime) {
      errors.endTime = '结束时间必须晚于开始时间';
    }
    
    // 检查工作时长是否过长（超过24小时）
    const duration = calculateDuration(data.startTime, data.endTime);
    if (duration > 24 * 3600) {
      errors.endTime = '单次工作时间不能超过24小时';
    }
  }
  
  // 描述验证
  if (data.description.length > 500) {
    errors.description = '描述不能超过500个字符';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * 验证计时器描述
 */
export const validateTimerDescription = (description: string): ValidationResult => {
  const errors: Record<string, string> = {};
  
  if (description.length > 500) {
    errors.description = '描述不能超过500个字符';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

---

## 5. 测试规格

### 5.1 单元测试规格

```typescript
// TimeEntryForm.test.tsx
describe('TimeEntryForm', () => {
  const mockProps: TimeEntryFormProps = {
    userId: 1,
    projects: mockProjects,
    onTimeLogCreated: jest.fn(),
    onTimeLogUpdated: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('项目任务选择', () => {
    it('应该正确显示项目列表', () => {
      render(<TimeEntryForm {...mockProps} />);
      
      const projectSelect = screen.getByLabelText('项目');
      expect(projectSelect).toBeInTheDocument();
      
      // 验证项目选项
      mockProps.projects.forEach(project => {
        expect(screen.getByText(project.name)).toBeInTheDocument();
      });
    });
    
    it('选择项目后应该加载对应任务', async () => {
      const mockLoadTasks = jest.fn();
      render(<TimeEntryForm {...mockProps} />);
      
      const projectSelect = screen.getByLabelText('项目');
      fireEvent.change(projectSelect, { target: { value: '1' } });
      
      await waitFor(() => {
        expect(screen.getByLabelText('任务')).toBeEnabled();
      });
    });
  });
  
  describe('计时器功能', () => {
    it('应该能够启动计时器', async () => {
      // Mock API
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { timeLog: mockTimeLog }
        })
      });
      
      render(<TimeEntryForm {...mockProps} />);
      
      // 选择项目和任务
      selectProjectAndTask();
      
      // 启动计时器
      const startButton = screen.getByText('开始计时');
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByText('正在计时')).toBeInTheDocument();
      });
    });
    
    it('应该能够停止计时器', async () => {
      // 设置有活跃计时器的状态
      const mockActiveTimer = { ...mockTimeLog, end_time: null };
      
      render(<TimeEntryForm {...mockProps} />);
      
      // Mock 停止计时器 API
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { timeLog: { ...mockActiveTimer, end_time: new Date().toISOString() } }
        })
      });
      
      const stopButton = screen.getByText('停止计时');
      fireEvent.click(stopButton);
      
      await waitFor(() => {
        expect(mockProps.onTimeLogCreated).toHaveBeenCalled();
      });
    });
  });
  
  describe('手动录入功能', () => {
    it('应该能够提交有效的手动录入', async () => {
      render(<TimeEntryForm {...mockProps} />);
      
      // 选择项目和任务
      selectProjectAndTask();
      
      // 填写手动录入表单
      fireEvent.change(screen.getByLabelText('日期'), {
        target: { value: '2025-08-05' }
      });
      fireEvent.change(screen.getByLabelText('开始时间'), {
        target: { value: '09:00' }
      });
      fireEvent.change(screen.getByLabelText('结束时间（可选）'), {
        target: { value: '11:30' }
      });
      fireEvent.change(screen.getByLabelText('工作描述'), {
        target: { value: '测试工作描述' }
      });
      
      // 提交表单
      const saveButton = screen.getByText('保存记录');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockProps.onTimeLogCreated).toHaveBeenCalled();
      });
    });
    
    it('应该验证表单输入', () => {
      render(<TimeEntryForm {...mockProps} />);
      
      // 不选择任务直接提交
      const saveButton = screen.getByText('保存记录');
      fireEvent.click(saveButton);
      
      // 应该显示验证错误
      expect(screen.getByText('请先选择项目和任务后录入时间')).toBeInTheDocument();
    });
  });
});
```

### 5.2 集成测试规格

```typescript
// TimeEntryForm.integration.test.tsx
describe('TimeEntryForm Integration Tests', () => {
  beforeEach(() => {
    // 设置测试数据库
    setupTestDatabase();
    
    // Mock API responses
    setupApiMocks();
  });
  
  it('应该完成完整的计时器工作流程', async () => {
    render(<TimeEntryForm {...mockProps} />);
    
    // 1. 选择项目和任务
    await selectProjectAndTask();
    
    // 2. 启动计时器
    const startButton = screen.getByText('开始计时');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('正在计时')).toBeInTheDocument();
    });
    
    // 3. 等待一段时间（模拟）
    act(() => {
      jest.advanceTimersByTime(5000); // 5秒
    });
    
    // 4. 停止计时器
    const stopButton = screen.getByText('停止计时');
    fireEvent.click(stopButton);
    
    // 5. 验证时间记录已保存
    await waitFor(() => {
      expect(mockProps.onTimeLogCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          duration_seconds: expect.any(Number)
        })
      );
    });
  });
  
  it('应该处理API错误', async () => {
    // Mock API error
    global.fetch = jest.fn().mockRejectedValue(new Error('网络错误'));
    
    render(<TimeEntryForm {...mockProps} />);
    
    await selectProjectAndTask();
    
    const startButton = screen.getByText('开始计时');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/网络错误/)).toBeInTheDocument();
    });
  });
});
```

---

**文档状态**: 已完成  
**最后更新**: 2025年8月5日  
**相关文档**: 
- [设计系统文档](./README.md)
- [界面设计指南](./interface-design-guidelines.md)
- [UX流程文档](./ux-flow-documentation.md)