# Sprint 5 UI/UX 设计规范
*Nobody Logger - 数据分析与团队协作系统设计规范*

## 文档概览

**版本**: 1.0  
**创建日期**: 2025年8月6日  
**设计师**: UI/UX设计团队  
**审核**: 产品负责人  

本文档为Sprint 5的六大核心功能模块提供完整的UI/UX设计规范，包括交互式仪表板系统、时间分析可视化、项目进度报告、报告导出系统、团队协作基础和移动端优化。

---

## 目录

1. [设计系统扩展](#设计系统扩展)
2. [交互式仪表板系统](#交互式仪表板系统)
3. [时间分析可视化](#时间分析可视化)
4. [项目进度报告](#项目进度报告)
5. [报告导出系统](#报告导出系统)
6. [团队协作基础功能](#团队协作基础功能)
7. [移动端优化](#移动端优化)
8. [用户流程设计](#用户流程设计)
9. [数据可视化设计标准](#数据可视化设计标准)
10. [实现指导](#实现指导)

---

## 设计系统扩展

### 新增色彩系统

基于现有Tailwind配置，扩展专门的数据可视化色板：

```css
/* 数据可视化色板 */
:root {
  /* 图表主色调 - 基于现有primary色彩 */
  --chart-primary: #3b82f6;      /* 蓝色 - 主要数据 */
  --chart-secondary: #10b981;    /* 绿色 - 完成状态 */
  --chart-tertiary: #f59e0b;     /* 橙色 - 警告状态 */
  --chart-quaternary: #8b5cf6;   /* 紫色 - 次要数据 */
  
  /* 仪表板背景渐变 */
  --dashboard-bg: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  --widget-bg: rgba(255, 255, 255, 0.8);
  --widget-border: rgba(226, 232, 240, 0.6);
  
  /* 热力图色阶 */
  --heatmap-0: #f8fafc;  /* 无活动 */
  --heatmap-1: #e2e8f0;  /* 轻度活动 */
  --heatmap-2: #cbd5e1;  /* 中等活动 */
  --heatmap-3: #94a3b8;  /* 高度活动 */
  --heatmap-4: #64748b;  /* 极高活动 */
  
  /* 进度指示器 */
  --progress-track: #e2e8f0;
  --progress-ahead: #22c55e;     /* 超前进度 - 绿色 */
  --progress-ontime: #3b82f6;    /* 按时进度 - 蓝色 */
  --progress-behind: #f59e0b;    /* 滞后进度 - 橙色 */
  --progress-critical: #ef4444;  /* 严重滞后 - 红色 */
}

/* 深色模式适配 */
.dark {
  --dashboard-bg: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  --widget-bg: rgba(30, 41, 59, 0.8);
  --widget-border: rgba(51, 65, 85, 0.6);
  --heatmap-0: #1e293b;
  --heatmap-4: #e2e8f0;
}
```

### 新增图标集

为数据分析功能定义专用图标：

```typescript
// 仪表板图标集
export const DashboardIcons = {
  // 小部件类型
  chart: 'TrendingUp',
  table: 'Table',
  metric: 'Activity',
  progress: 'BarChart3',
  calendar: 'Calendar',
  team: 'Users',
  
  // 操作图标
  customize: 'Settings',
  fullscreen: 'Maximize2',
  export: 'Download',
  refresh: 'RefreshCw',
  filter: 'Filter',
  sort: 'ArrowUpDown',
  
  // 状态图标
  loading: 'Loader2',
  error: 'AlertTriangle',
  empty: 'Inbox',
  success: 'CheckCircle2'
};
```

### 组件样式扩展

扩展现有组件样式以支持新功能：

```css
@layer components {
  /* 仪表板容器 */
  .dashboard-container {
    @apply min-h-screen bg-gradient-to-br from-slate-50 to-slate-100;
    @apply dark:from-slate-900 dark:to-slate-800;
  }
  
  /* 小部件卡片 */
  .widget-card {
    @apply bg-white/80 backdrop-blur-sm border border-slate-200/60;
    @apply rounded-xl shadow-soft hover:shadow-medium transition-all duration-200;
    @apply dark:bg-slate-800/80 dark:border-slate-700/60;
  }
  
  /* 拖拽状态 */
  .widget-dragging {
    @apply shadow-strong rotate-2 scale-105 z-50;
  }
  
  .widget-drop-zone {
    @apply border-2 border-dashed border-blue-300 bg-blue-50/50;
    @apply dark:border-blue-600 dark:bg-blue-900/20;
  }
  
  /* 图表容器 */
  .chart-container {
    @apply relative w-full h-64 p-4;
  }
  
  .chart-loading {
    @apply flex items-center justify-center h-full text-slate-400;
  }
  
  /* 热力图样式 */
  .heatmap-grid {
    @apply grid gap-1;
    grid-template-columns: repeat(24, minmax(0, 1fr));
    grid-template-rows: repeat(7, minmax(0, 1fr));
  }
  
  .heatmap-cell {
    @apply aspect-square rounded-sm cursor-pointer;
    @apply hover:ring-2 hover:ring-blue-300 transition-all duration-150;
  }
  
  /* 甘特图样式 */
  .gantt-container {
    @apply overflow-x-auto custom-scrollbar;
  }
  
  .gantt-timeline {
    @apply flex items-center space-x-2 text-xs text-slate-600 mb-2;
  }
  
  .gantt-bar {
    @apply h-6 rounded-md transition-all duration-200;
    @apply hover:opacity-80 cursor-pointer;
  }
  
  .gantt-dependency {
    @apply stroke-slate-400 stroke-2 fill-none;
  }
  
  /* 团队协作组件 */
  .member-avatar {
    @apply w-8 h-8 rounded-full border-2 border-white shadow-sm;
    @apply hover:scale-110 transition-transform duration-200;
  }
  
  .role-badge {
    @apply px-2 py-1 text-xs font-medium rounded-full;
  }
  
  .role-owner { @apply bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300; }
  .role-editor { @apply bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300; }
  .role-viewer { @apply bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300; }
}
```

---

## 交互式仪表板系统

### 布局架构

#### 主布局结构
```
┌─────────────────────────────────────────────────┐
│ 顶部导航栏 (Header Navigation)                      │
├─────────────────────────────────────────────────┤
│ 工具栏 (Toolbar)                                  │
│ [自定义] [刷新] [导出] [全屏]                      │  
├─────────────────────────────────────────────────┤
│                                                 │
│ 小部件网格区域 (Widget Grid Area)                │
│                                                 │
│ ┌────────┐ ┌────────┐ ┌────────────┐           │
│ │Widget 1│ │Widget 2│ │  Widget 3  │           │
│ │        │ │        │ │            │           │
│ └────────┘ └────────┘ └────────────┘           │
│                                                 │
│ ┌──────────────┐ ┌────────┐                    │
│ │   Widget 4   │ │Widget 5│                    │
│ │              │ │        │                    │
│ └──────────────┘ └────────┘                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 响应式网格系统
```css
.dashboard-grid {
  @apply grid gap-6 p-6;
  
  /* 移动端: 单列 */
  grid-template-columns: 1fr;
  
  /* 平板: 双列 */
  @screen md {
    grid-template-columns: repeat(2, 1fr);
  }
  
  /* 桌面端: 三列 */
  @screen lg {
    grid-template-columns: repeat(3, 1fr);
  }
  
  /* 大屏: 四列 */
  @screen xl {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 小部件大小规格 */
.widget-small { grid-column: span 1; grid-row: span 1; }  /* 1x1 */
.widget-medium { grid-column: span 2; grid-row: span 1; } /* 2x1 */
.widget-large { grid-column: span 2; grid-row: span 2; }  /* 2x2 */
.widget-wide { grid-column: span 3; grid-row: span 1; }   /* 3x1 */
.widget-full { grid-column: span 4; grid-row: span 1; }   /* 4x1 */
```

### 小部件组件规范

#### 1. 基础小部件结构
```typescript
interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'progress' | 'calendar';
  title: string;
  size: 'small' | 'medium' | 'large' | 'wide' | 'full';
  position: { x: number; y: number };
  config: WidgetConfig;
  data: WidgetData;
}
```

#### 2. 小部件头部设计
```html
<div class="widget-header flex items-center justify-between p-4 border-b border-slate-200/60">
  <div class="flex items-center space-x-2">
    <Icon name="chart" class="w-4 h-4 text-slate-500" />
    <h3 class="font-medium text-slate-900">项目进度概览</h3>
  </div>
  <div class="flex items-center space-x-1">
    <button class="widget-action-btn">
      <Icon name="refresh" class="w-4 h-4" />
    </button>
    <button class="widget-action-btn">
      <Icon name="settings" class="w-4 h-4" />
    </button>
    <button class="widget-action-btn">
      <Icon name="maximize2" class="w-4 h-4" />
    </button>
  </div>
</div>
```

#### 3. 小部件内容区域
```css
.widget-content {
  @apply p-4 h-full flex flex-col justify-between;
}

.widget-metric {
  @apply text-center;
}

.widget-metric-value {
  @apply text-3xl font-bold text-slate-900 mb-2;
}

.widget-metric-label {
  @apply text-sm text-slate-600;
}

.widget-metric-change {
  @apply flex items-center justify-center space-x-1 text-xs mt-2;
}

.metric-increase { @apply text-green-600; }
.metric-decrease { @apply text-red-600; }
.metric-neutral { @apply text-slate-600; }
```

### 拖拽交互设计

#### 拖拽状态视觉反馈
```css
/* 拖拽开始时的视觉效果 */
.widget-dragging {
  @apply transform rotate-2 scale-105 shadow-strong z-50;
  @apply transition-all duration-200 ease-out;
}

/* 可放置区域高亮 */
.drop-zone-active {
  @apply border-2 border-dashed border-blue-400 bg-blue-50/50;
  @apply dark:border-blue-500 dark:bg-blue-900/20;
}

/* 拖拽占位符 */
.widget-placeholder {
  @apply border-2 border-dashed border-slate-300 bg-slate-50;
  @apply dark:border-slate-600 dark:bg-slate-800/50;
}
```

#### 拖拽交互状态
1. **准备拖拽**: 鼠标悬停时显示拖拽手柄
2. **开始拖拽**: 小部件变为半透明，显示占位符
3. **拖拽过程**: 实时显示可放置区域
4. **完成拖拽**: 小部件动画到新位置

### 自定义模式界面

#### 自定义工具栏
```html
<div class="customize-toolbar bg-white border-b border-slate-200 p-4">
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <h2 class="font-semibold text-slate-900">自定义仪表板</h2>
      <span class="text-sm text-slate-600">拖拽小部件调整布局</span>
    </div>
    <div class="flex items-center space-x-2">
      <button class="btn-secondary">重置布局</button>
      <button class="btn-secondary">保存模板</button>
      <button class="btn-primary">完成自定义</button>
    </div>
  </div>
</div>
```

#### 小部件选择面板
```html
<div class="widget-selector bg-slate-50 border-r border-slate-200 w-64 p-4">
  <h3 class="font-medium text-slate-900 mb-4">可用小部件</h3>
  <div class="space-y-2">
    <div class="widget-option" draggable="true">
      <Icon name="trending-up" class="w-5 h-5" />
      <span>项目进度</span>
    </div>
    <div class="widget-option" draggable="true">
      <Icon name="clock" class="w-5 h-5" />
      <span>时间统计</span>
    </div>
    <!-- 更多小部件选项... -->
  </div>
</div>
```

### 预设布局模板

#### 模板选择界面
```typescript
interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  widgets: WidgetLayout[];
  category: 'project-manager' | 'developer' | 'analyst' | 'executive';
}

const layoutTemplates: LayoutTemplate[] = [
  {
    id: 'project-manager',
    name: '项目经理视图',
    description: '关注项目进度、团队效率和资源分配',
    widgets: [
      { type: 'progress', size: 'large', position: { x: 0, y: 0 } },
      { type: 'metric', size: 'small', position: { x: 2, y: 0 } },
      { type: 'chart', size: 'medium', position: { x: 0, y: 1 } }
    ]
  },
  // 更多模板...
];
```

---

## 时间分析可视化

### 热力图组件设计

#### 热力图布局结构
```
时间热力图 (7天 × 24小时)
┌───┬─0─┬─1─┬─2─┬─...─┬─23─┐
│ 一│ ▯ │ ▯ │ ▯ │ ... │ ▯ │
├───┼───┼───┼───┼─────┼───┤
│ 二│ ▯ │ ▯ │ ▯ │ ... │ ▯ │
├───┼───┼───┼───┼─────┼───┤
│ 三│ ▯ │ ▯ │ ▯ │ ... │ ▯ │
├───┼───┼───┼───┼─────┼───┤
│ 四│ ▯ │ ▯ │ ▯ │ ... │ ▯ │
├───┼───┼───┼───┼─────┼───┤
│ 五│ ▯ │ ▯ │ ▯ │ ... │ ▯ │
├───┼───┼───┼───┼─────┼───┤
│ 六│ ▯ │ ▯ │ ▯ │ ... │ ▯ │
├───┼───┼───┼───┼─────┼───┤
│ 日│ ▯ │ ▯ │ ▯ │ ... │ ▯ │
└───┴───┴───┴───┴─────┴───┘
```

#### 热力图样式实现
```css
.heatmap-container {
  @apply bg-white rounded-lg border border-slate-200 p-6;
}

.heatmap-grid {
  @apply grid gap-1;
  grid-template-columns: auto repeat(24, 1fr);
  grid-template-rows: repeat(8, 1fr);
}

/* 星期标签 */
.heatmap-day-label {
  @apply text-xs text-slate-600 font-medium py-1 pr-2;
  @apply flex items-center justify-end;
}

/* 小时标签 */
.heatmap-hour-label {
  @apply text-xs text-slate-600 text-center pb-1;
}

/* 热力图单元格 */
.heatmap-cell {
  @apply aspect-square rounded-sm cursor-pointer relative;
  @apply hover:ring-2 hover:ring-blue-300 transition-all duration-150;
}

/* 热力图强度级别 */
.heatmap-level-0 { @apply bg-slate-100; }
.heatmap-level-1 { @apply bg-blue-100; }
.heatmap-level-2 { @apply bg-blue-200; }
.heatmap-level-3 { @apply bg-blue-400; }
.heatmap-level-4 { @apply bg-blue-600; }

/* 深色模式适配 */
.dark .heatmap-level-0 { @apply bg-slate-700; }
.dark .heatmap-level-1 { @apply bg-blue-900; }
.dark .heatmap-level-2 { @apply bg-blue-700; }
.dark .heatmap-level-3 { @apply bg-blue-500; }
.dark .heatmap-level-4 { @apply bg-blue-400; }
```

#### 热力图交互提示
```typescript
interface HeatmapTooltip {
  time: string;          // "2025-08-06 14:00"
  duration: number;      // 工作时长(分钟)
  tasks: TaskSummary[];  // 该时段的任务列表
  productivity: number;  // 生产力评分 0-10
}

// 提示框组件
const HeatmapTooltip = ({ data, position }: HeatmapTooltipProps) => (
  <div className="absolute z-10 bg-slate-900 text-white text-xs rounded-md p-3 shadow-lg max-w-xs">
    <div className="font-medium mb-1">{data.time}</div>
    <div className="text-slate-300 mb-2">
      工作时长: {Math.floor(data.duration / 60)}小时 {data.duration % 60}分钟
    </div>
    {data.tasks.length > 0 && (
      <div>
        <div className="text-slate-300 mb-1">主要任务:</div>
        {data.tasks.slice(0, 3).map(task => (
          <div key={task.id} className="text-xs text-slate-200">
            • {task.name} ({task.duration}分钟)
          </div>
        ))}
      </div>
    )}
    <div className="mt-2 pt-2 border-t border-slate-700">
      <span className="text-slate-300">生产力评分: </span>
      <span className={`font-medium ${
        data.productivity >= 8 ? 'text-green-400' : 
        data.productivity >= 6 ? 'text-yellow-400' : 'text-red-400'
      }`}>
        {data.productivity}/10
      </span>
    </div>
  </div>
);
```

### 生产力趋势图

#### 趋势图设计规范
```css
.productivity-chart {
  @apply bg-white rounded-lg border border-slate-200 p-6;
  height: 300px;
}

.chart-header {
  @apply flex items-center justify-between mb-4;
}

.chart-title {
  @apply font-semibold text-slate-900;
}

.chart-controls {
  @apply flex items-center space-x-2;
}

.time-range-selector {
  @apply text-sm border border-slate-300 rounded-md px-3 py-1;
  @apply hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500;
}
```

#### 多维度数据展示
```typescript
interface ProductivityData {
  date: string;
  taskCompletion: number;    // 任务完成率 0-100
  avgTaskTime: number;       // 平均任务时长(分钟)
  efficiency: number;        // 效率评分 0-10
  activeTime: number;        // 活跃时间(分钟)
}

// 图表配置
const chartConfig = {
  colors: {
    taskCompletion: '#3b82f6',  // 蓝色
    efficiency: '#22c55e',      // 绿色
    activeTime: '#f59e0b',      // 橙色
    avgTaskTime: '#8b5cf6'      // 紫色
  },
  yAxis: {
    left: '任务完成率 (%)',
    right: '效率评分'
  }
};
```

### 时间分布饼图

#### 饼图样式规范
```css
.time-distribution-chart {
  @apply relative;
}

.chart-legend {
  @apply mt-4 grid grid-cols-2 gap-2;
}

.legend-item {
  @apply flex items-center space-x-2 text-sm;
}

.legend-color {
  @apply w-3 h-3 rounded-full flex-shrink-0;
}

.legend-label {
  @apply text-slate-700 flex-1;
}

.legend-value {
  @apply font-medium text-slate-900;
}
```

#### 交互式图表功能
```typescript
interface TimeDistributionSlice {
  category: string;    // 项目分类
  time: number;       // 时间(分钟)
  percentage: number; // 占比
  color: string;      // 颜色
  tasks: number;      // 任务数量
}

// 悬停效果
const handleSliceHover = (slice: TimeDistributionSlice) => {
  // 高亮当前扇区
  // 显示详细信息
  // 更新图例显示
};
```

---

## 项目进度报告

### 甘特图组件设计

#### 甘特图布局架构
```
┌─任务列表─┬────────────── 时间轴 ──────────────┐
│         │ 8/1  8/2  8/3  8/4  8/5  8/6  8/7 │
├─────────┼─────────────────────────────────────┤
│任务 A    │ ████████                         │ 
│  子任务1  │   ████                           │
│  子任务2  │     ████████                     │
│任务 B    │           ████████████           │
│任务 C    │                     ████████████ │
└─────────┴─────────────────────────────────────┘
```

#### 甘特图样式实现
```css
.gantt-container {
  @apply bg-white rounded-lg border border-slate-200 overflow-hidden;
}

.gantt-header {
  @apply bg-slate-50 border-b border-slate-200 p-4;
}

.gantt-content {
  @apply flex;
}

/* 任务列表区域 */
.gantt-task-list {
  @apply w-80 border-r border-slate-200 bg-slate-50/50;
}

.gantt-task-item {
  @apply flex items-center px-4 py-3 border-b border-slate-100;
  @apply hover:bg-white transition-colors duration-150;
}

.task-indent {
  /* 根据层级添加缩进 */
}

.task-indent-1 { @apply pl-4; }
.task-indent-2 { @apply pl-8; }
.task-indent-3 { @apply pl-12; }

/* 时间轴区域 */
.gantt-timeline {
  @apply flex-1 overflow-x-auto custom-scrollbar;
}

.timeline-header {
  @apply flex bg-slate-100 border-b border-slate-200 sticky top-0 z-10;
}

.timeline-day {
  @apply flex-shrink-0 w-16 p-2 text-center text-xs font-medium;
  @apply text-slate-600 border-r border-slate-200;
}

.timeline-content {
  @apply relative;
}

/* 甘特条形图 */
.gantt-bar {
  @apply absolute h-6 rounded-md shadow-sm cursor-pointer;
  @apply transition-all duration-200 hover:shadow-md;
  top: 50%;
  transform: translateY(-50%);
}

.gantt-bar-normal { @apply bg-blue-500 hover:bg-blue-600; }
.gantt-bar-completed { @apply bg-green-500 hover:bg-green-600; }
.gantt-bar-overdue { @apply bg-red-500 hover:bg-red-600; }
.gantt-bar-milestone { @apply bg-purple-500 hover:bg-purple-600; }

/* 进度填充 */
.gantt-progress {
  @apply absolute top-0 left-0 h-full rounded-md;
  @apply bg-white bg-opacity-30;
}

/* 依赖关系连线 */
.gantt-dependency {
  @apply absolute pointer-events-none;
}

.dependency-line {
  @apply stroke-slate-400 stroke-2 fill-none;
}

.dependency-arrow {
  @apply fill-slate-400;
}
```

#### 甘特图交互功能
```typescript
interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;      // 0-100
  status: TaskStatus;
  dependencies: string[]; // 依赖任务ID数组
  level: number;         // 层级深度
  assignee?: User;
}

// 交互功能
const GanttChart = () => {
  const handleTaskClick = (task: GanttTask) => {
    // 显示任务详情
  };

  const handleBarDrag = (taskId: string, newDates: { start: Date; end: Date }) => {
    // 拖拽调整任务时间
  };

  const handleProgressUpdate = (taskId: string, progress: number) => {
    // 更新任务进度
  };
};
```

### 燃尽图设计

#### 燃尽图布局
```css
.burndown-chart {
  @apply bg-white rounded-lg border border-slate-200 p-6;
  height: 400px;
}

.burndown-header {
  @apply flex items-center justify-between mb-6;
}

.chart-metrics {
  @apply grid grid-cols-4 gap-4 mb-6;
}

.metric-card {
  @apply text-center p-3 bg-slate-50 rounded-md;
}

.metric-value {
  @apply text-2xl font-bold text-slate-900;
}

.metric-label {
  @apply text-sm text-slate-600 mt-1;
}
```

#### 燃尽图数据可视化
```typescript
interface BurndownData {
  date: string;
  idealRemaining: number;    // 理想剩余工作量
  actualRemaining: number;   // 实际剩余工作量
  dailyCompletion: number;   // 当日完成工作量
}

// 图表配置
const burndownConfig = {
  lines: {
    ideal: {
      color: '#94a3b8',      // 灰色虚线
      strokeDasharray: '5,5',
      label: '理想进度'
    },
    actual: {
      color: '#3b82f6',      // 蓝色实线
      strokeWidth: 3,
      label: '实际进度'
    }
  },
  areas: {
    ahead: '#22c55e20',      // 超前区域 - 浅绿色
    behind: '#ef444420'      // 滞后区域 - 浅红色
  }
};
```

### 里程碑视图

#### 里程碑时间轴设计
```css
.milestone-timeline {
  @apply relative bg-white rounded-lg border border-slate-200 p-6;
}

.timeline-line {
  @apply absolute left-8 top-0 bottom-0 w-0.5 bg-slate-300;
}

.milestone-item {
  @apply relative flex items-center mb-6;
}

.milestone-dot {
  @apply w-4 h-4 rounded-full border-2 bg-white z-10 mr-4;
}

.milestone-completed { @apply border-green-500 bg-green-500; }
.milestone-current { @apply border-blue-500 bg-blue-500 ring-4 ring-blue-200; }
.milestone-pending { @apply border-slate-300; }

.milestone-content {
  @apply flex-1 bg-slate-50 rounded-md p-4;
}

.milestone-title {
  @apply font-medium text-slate-900 mb-1;
}

.milestone-date {
  @apply text-sm text-slate-600;
}

.milestone-status {
  @apply text-xs font-medium px-2 py-1 rounded-full;
}
```

---

## 报告导出系统

### 导出界面设计

#### 导出向导布局
```
┌─────────────────────────────────────────────────┐
│ 报告导出向导                                        │
├─────────────────────────────────────────────────┤
│ 步骤指示器: ① 选择模板 → ② 配置内容 → ③ 预览 → ④ 导出  │
├─────────────────────────────────────────────────┤
│                                                 │
│ [当前步骤内容]                                      │
│                                                 │
│ ┌─────────────┐  ┌─────────────┐                │
│ │   模板 1    │  │   模板 2    │                │
│ │  项目进度   │  │  时间分析   │                │
│ │    报告     │  │    报告     │                │
│ └─────────────┘  └─────────────┘                │
│                                                 │
├─────────────────────────────────────────────────┤
│ [取消]                              [上一步] [下一步] │
└─────────────────────────────────────────────────┘
```

#### 向导样式实现
```css
.export-wizard {
  @apply max-w-4xl mx-auto bg-white rounded-lg border border-slate-200 overflow-hidden;
}

.wizard-header {
  @apply bg-slate-50 border-b border-slate-200 p-6;
}

.wizard-title {
  @apply text-xl font-semibold text-slate-900 mb-4;
}

/* 步骤指示器 */
.wizard-steps {
  @apply flex items-center justify-center space-x-2;
}

.wizard-step {
  @apply flex items-center space-x-2;
}

.step-number {
  @apply w-8 h-8 rounded-full border-2 flex items-center justify-center;
  @apply text-sm font-medium transition-colors duration-200;
}

.step-active { 
  @apply border-blue-500 bg-blue-500 text-white;
}

.step-completed { 
  @apply border-green-500 bg-green-500 text-white;
}

.step-inactive { 
  @apply border-slate-300 bg-white text-slate-500;
}

.step-connector {
  @apply w-12 h-0.5 bg-slate-300;
}

.step-connector-active {
  @apply bg-blue-500;
}

/* 向导内容 */
.wizard-content {
  @apply p-6 min-h-96;
}

.wizard-footer {
  @apply bg-slate-50 border-t border-slate-200 px-6 py-4;
  @apply flex items-center justify-between;
}
```

### 模板选择界面

#### 模板卡片设计
```typescript
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'progress' | 'analytics' | 'team' | 'custom';
  preview: string;     // 预览图片URL
  features: string[];  // 包含的功能模块
  sampleData?: any;    // 示例数据
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'project-progress',
    name: '项目进度报告',
    description: '全面展示项目进度、任务完成情况和里程碑状态',
    category: 'progress',
    features: ['甘特图', '进度统计', '里程碑跟踪', '风险评估']
  },
  {
    id: 'time-analysis',
    name: '时间分析报告',
    description: '深入分析时间分配、工作效率和生产力趋势',
    category: 'analytics',
    features: ['热力图', '效率统计', '时间分布', '趋势分析']
  },
  // 更多模板...
];
```

#### 模板卡片样式
```css
.template-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.template-card {
  @apply bg-white border border-slate-200 rounded-lg overflow-hidden;
  @apply hover:border-blue-300 hover:shadow-md transition-all duration-200;
  @apply cursor-pointer relative;
}

.template-card-selected {
  @apply border-blue-500 ring-2 ring-blue-200;
}

.template-preview {
  @apply w-full h-32 bg-slate-100 flex items-center justify-center;
}

.template-content {
  @apply p-4;
}

.template-title {
  @apply font-medium text-slate-900 mb-2;
}

.template-description {
  @apply text-sm text-slate-600 mb-3;
}

.template-features {
  @apply flex flex-wrap gap-1;
}

.feature-tag {
  @apply text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full;
}

.template-selected-badge {
  @apply absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white;
  @apply rounded-full flex items-center justify-center;
}
```

### 内容配置界面

#### 配置面板设计
```html
<div class="export-config-panel grid grid-cols-1 lg:grid-cols-3 gap-6">
  <!-- 内容选择 -->
  <div class="config-section col-span-2">
    <h3 class="section-title">选择报告内容</h3>
    <div class="config-options">
      <div class="option-group">
        <h4 class="option-title">图表类型</h4>
        <div class="option-list">
          <label class="option-item">
            <input type="checkbox" checked />
            <span>项目进度甘特图</span>
          </label>
          <label class="option-item">
            <input type="checkbox" checked />
            <span>燃尽图</span>
          </label>
          <label class="option-item">
            <input type="checkbox" />
            <span>时间热力图</span>
          </label>
        </div>
      </div>
      
      <div class="option-group">
        <h4 class="option-title">数据表格</h4>
        <div class="option-list">
          <label class="option-item">
            <input type="checkbox" checked />
            <span>任务清单</span>
          </label>
          <label class="option-item">
            <input type="checkbox" />
            <span>时间记录</span>
          </label>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 设置面板 -->
  <div class="config-sidebar">
    <h3 class="section-title">报告设置</h3>
    <div class="settings-form">
      <div class="form-group">
        <label>时间范围</label>
        <select class="form-select">
          <option>最近一周</option>
          <option>最近一月</option>
          <option>自定义</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>导出格式</label>
        <div class="radio-group">
          <label class="radio-item">
            <input type="radio" name="format" value="pdf" checked />
            <span>PDF</span>
          </label>
          <label class="radio-item">
            <input type="radio" name="format" value="excel" />
            <span>Excel</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### 配置面板样式
```css
.export-config-panel {
  @apply min-h-96;
}

.config-section {
  @apply bg-slate-50 rounded-lg p-6;
}

.section-title {
  @apply font-semibold text-slate-900 mb-4;
}

.option-group {
  @apply mb-6;
}

.option-title {
  @apply font-medium text-slate-700 mb-2;
}

.option-list {
  @apply space-y-2;
}

.option-item {
  @apply flex items-center space-x-2 text-sm text-slate-700;
  @apply cursor-pointer hover:text-slate-900;
}

.config-sidebar {
  @apply bg-white border border-slate-200 rounded-lg p-6;
}

.settings-form {
  @apply space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-group label {
  @apply block text-sm font-medium text-slate-700;
}

.form-select {
  @apply w-full border border-slate-300 rounded-md px-3 py-2;
  @apply focus:border-blue-500 focus:ring-1 focus:ring-blue-500;
}

.radio-group {
  @apply space-y-2;
}

.radio-item {
  @apply flex items-center space-x-2 text-sm;
  @apply cursor-pointer hover:text-slate-900;
}
```

### 预览界面设计

#### 预览窗口布局
```css
.report-preview {
  @apply bg-white border border-slate-200 rounded-lg overflow-hidden;
}

.preview-toolbar {
  @apply bg-slate-50 border-b border-slate-200 p-4;
  @apply flex items-center justify-between;
}

.preview-controls {
  @apply flex items-center space-x-2;
}

.zoom-control {
  @apply flex items-center space-x-1;
}

.zoom-button {
  @apply w-8 h-8 border border-slate-300 rounded flex items-center justify-center;
  @apply hover:bg-slate-100 transition-colors duration-150;
}

.zoom-level {
  @apply text-sm font-mono text-slate-600 px-2;
}

.preview-content {
  @apply p-6 overflow-auto custom-scrollbar;
  @apply bg-white;
  height: 600px;
}

/* PDF预览样式 */
.pdf-preview {
  @apply mx-auto shadow-lg;
  width: 210mm; /* A4宽度 */
  min-height: 297mm; /* A4高度 */
  transform-origin: top center;
}

.pdf-page {
  @apply bg-white p-8 border border-slate-200 mb-4;
}

.pdf-header {
  @apply border-b border-slate-200 pb-4 mb-6;
}

.pdf-title {
  @apply text-2xl font-bold text-slate-900 mb-2;
}

.pdf-meta {
  @apply text-sm text-slate-600 flex justify-between;
}

.pdf-content {
  @apply space-y-6;
}
```

### 导出进度界面

#### 进度指示器设计
```css
.export-progress-modal {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.progress-content {
  @apply bg-white rounded-lg p-8 max-w-md w-full mx-4;
}

.progress-header {
  @apply text-center mb-6;
}

.progress-title {
  @apply text-lg font-semibold text-slate-900 mb-2;
}

.progress-subtitle {
  @apply text-sm text-slate-600;
}

.progress-bar-container {
  @apply w-full bg-slate-200 rounded-full h-2 mb-4;
}

.progress-bar {
  @apply bg-blue-500 h-2 rounded-full transition-all duration-300;
}

.progress-percentage {
  @apply text-center text-sm font-medium text-slate-700 mb-4;
}

.progress-steps {
  @apply space-y-2 text-sm;
}

.progress-step {
  @apply flex items-center space-x-2;
}

.step-icon {
  @apply w-4 h-4 flex-shrink-0;
}

.step-loading { @apply text-blue-500 animate-spin; }
.step-completed { @apply text-green-500; }
.step-pending { @apply text-slate-400; }

.step-text {
  @apply text-slate-700;
}
```

#### 进度状态管理
```typescript
interface ExportProgress {
  step: number;
  total: number;
  percentage: number;
  currentTask: string;
  status: 'preparing' | 'generating' | 'processing' | 'finalizing' | 'completed' | 'error';
  error?: string;
}

const exportSteps = [
  { id: 1, name: '准备数据', task: '正在收集报告数据...' },
  { id: 2, name: '生成图表', task: '正在渲染图表和图形...' },
  { id: 3, name: '格式化内容', task: '正在格式化报告内容...' },
  { id: 4, name: '创建文件', task: '正在生成最终文件...' },
  { id: 5, name: '完成导出', task: '导出完成！' }
];
```

### 导出成功界面

#### 成功页面设计
```css
.export-success {
  @apply text-center py-8;
}

.success-icon {
  @apply w-16 h-16 mx-auto mb-4 text-green-500;
}

.success-title {
  @apply text-xl font-semibold text-slate-900 mb-2;
}

.success-message {
  @apply text-slate-600 mb-6;
}

.success-actions {
  @apply flex flex-col sm:flex-row gap-4 justify-center;
}

.download-button {
  @apply btn-primary flex items-center space-x-2;
}

.share-button {
  @apply btn-secondary flex items-center space-x-2;
}

.file-info {
  @apply bg-slate-50 rounded-lg p-4 mt-6 text-left;
}

.file-details {
  @apply text-sm space-y-1;
}

.file-name {
  @apply font-medium text-slate-900;
}

.file-size {
  @apply text-slate-600;
}

.file-format {
  @apply text-slate-600;
}
```

---

## 团队协作基础功能

### 用户邀请系统

#### 邀请界面设计
```html
<div class="invite-panel bg-white rounded-lg border border-slate-200 p-6">
  <div class="invite-header mb-6">
    <h2 class="text-lg font-semibold text-slate-900 mb-2">邀请团队成员</h2>
    <p class="text-sm text-slate-600">通过邮箱邀请新成员加入项目团队</p>
  </div>
  
  <div class="invite-form space-y-4">
    <div class="email-input-section">
      <label class="block text-sm font-medium text-slate-700 mb-2">邮箱地址</label>
      <div class="flex space-x-2">
        <input 
          type="email" 
          placeholder="请输入邮箱地址" 
          class="flex-1 border border-slate-300 rounded-md px-3 py-2"
        />
        <button class="btn-secondary">添加</button>
      </div>
      <p class="text-xs text-slate-500 mt-1">一次最多可邀请10个成员</p>
    </div>
    
    <div class="email-list">
      <div class="email-chip">
        <span>user@example.com</span>
        <button class="remove-email">×</button>
      </div>
    </div>
    
    <div class="role-selection">
      <label class="block text-sm font-medium text-slate-700 mb-2">默认角色</label>
      <select class="w-full border border-slate-300 rounded-md px-3 py-2">
        <option value="viewer">查看者</option>
        <option value="editor">编辑者</option>
      </select>
    </div>
    
    <div class="message-section">
      <label class="block text-sm font-medium text-slate-700 mb-2">邀请消息（可选）</label>
      <textarea 
        rows="3" 
        placeholder="添加个人化的邀请消息..."
        class="w-full border border-slate-300 rounded-md px-3 py-2"
      ></textarea>
    </div>
    
    <div class="invite-actions">
      <button class="btn-primary">发送邀请</button>
      <button class="btn-secondary ml-2">取消</button>
    </div>
  </div>
</div>
```

#### 邀请样式实现
```css
.invite-panel {
  @apply max-w-2xl mx-auto;
}

.email-input-section {
  @apply relative;
}

.email-list {
  @apply flex flex-wrap gap-2 min-h-10;
}

.email-chip {
  @apply inline-flex items-center space-x-2 bg-blue-100 text-blue-700;
  @apply px-3 py-1 rounded-full text-sm;
}

.remove-email {
  @apply hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center;
  @apply text-blue-500 hover:text-blue-700 text-xs;
}

.invite-actions {
  @apply flex items-center pt-4 border-t border-slate-200;
}

/* 邀请状态显示 */
.invite-status-list {
  @apply mt-6 space-y-3;
}

.invite-status-item {
  @apply flex items-center justify-between p-3;
  @apply bg-slate-50 rounded-md;
}

.invite-user-info {
  @apply flex items-center space-x-3;
}

.invite-status-badge {
  @apply text-xs font-medium px-2 py-1 rounded-full;
}

.status-pending { @apply bg-yellow-100 text-yellow-700; }
.status-accepted { @apply bg-green-100 text-green-700; }
.status-expired { @apply bg-red-100 text-red-700; }
```

### 角色权限管理

#### 权限矩阵界面
```typescript
interface Permission {
  resource: string;
  actions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}

const rolePermissions = {
  owner: {
    name: '项目所有者',
    description: '拥有项目的完全控制权',
    permissions: ['all']
  },
  editor: {
    name: '编辑者',
    description: '可以创建和修改项目内容',
    permissions: ['view', 'create', 'edit']
  },
  viewer: {
    name: '查看者',
    description: '只能查看项目内容',
    permissions: ['view']
  }
};
```

#### 权限管理界面
```html
<div class="permission-manager">
  <div class="permission-header mb-6">
    <h2 class="text-lg font-semibold text-slate-900">角色权限管理</h2>
    <p class="text-sm text-slate-600">管理不同角色在项目中的访问权限</p>
  </div>
  
  <div class="permission-matrix">
    <table class="w-full border border-slate-200 rounded-lg overflow-hidden">
      <thead class="bg-slate-50">
        <tr>
          <th class="text-left p-4 border-r border-slate-200">功能模块</th>
          <th class="text-center p-4 border-r border-slate-200">查看者</th>
          <th class="text-center p-4 border-r border-slate-200">编辑者</th>
          <th class="text-center p-4">所有者</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-t border-slate-200">
          <td class="p-4 font-medium border-r border-slate-200">项目信息</td>
          <td class="text-center p-4 border-r border-slate-200">
            <Icon name="eye" class="w-4 h-4 text-green-500 mx-auto" />
          </td>
          <td class="text-center p-4 border-r border-slate-200">
            <Icon name="edit" class="w-4 h-4 text-green-500 mx-auto" />
          </td>
          <td class="text-center p-4">
            <Icon name="shield" class="w-4 h-4 text-blue-500 mx-auto" />
          </td>
        </tr>
        <!-- 更多权限行... -->
      </tbody>
    </table>
  </div>
</div>
```

### 成员管理界面

#### 成员列表设计
```html
<div class="member-management">
  <div class="member-header flex items-center justify-between mb-6">
    <div>
      <h2 class="text-lg font-semibold text-slate-900">团队成员</h2>
      <p class="text-sm text-slate-600">管理项目团队成员和角色权限</p>
    </div>
    <button class="btn-primary">邀请成员</button>
  </div>
  
  <div class="member-filters mb-4">
    <div class="flex items-center space-x-4">
      <select class="border border-slate-300 rounded-md px-3 py-2 text-sm">
        <option>所有角色</option>
        <option>项目所有者</option>
        <option>编辑者</option>
        <option>查看者</option>
      </select>
      <select class="border border-slate-300 rounded-md px-3 py-2 text-sm">
        <option>所有状态</option>
        <option>活跃成员</option>
        <option>待邀请</option>
      </select>
    </div>
  </div>
  
  <div class="member-list">
    <div class="member-card">
      <div class="member-info">
        <img src="/avatar.jpg" class="member-avatar" />
        <div class="member-details">
          <h3 class="member-name">张三</h3>
          <p class="member-email">zhangsan@example.com</p>
          <p class="member-joined">加入时间: 2025年8月1日</p>
        </div>
      </div>
      <div class="member-role">
        <span class="role-badge role-editor">编辑者</span>
      </div>
      <div class="member-status">
        <span class="status-active">活跃</span>
        <span class="last-active">2小时前</span>
      </div>
      <div class="member-actions">
        <button class="action-btn">编辑</button>
        <button class="action-btn text-red-600">移除</button>
      </div>
    </div>
    <!-- 更多成员卡片... -->
  </div>
</div>
```

#### 成员管理样式
```css
.member-management {
  @apply max-w-6xl mx-auto;
}

.member-filters {
  @apply flex items-center justify-between;
}

.member-list {
  @apply space-y-4;
}

.member-card {
  @apply bg-white border border-slate-200 rounded-lg p-4;
  @apply flex items-center justify-between hover:shadow-sm;
  @apply transition-shadow duration-200;
}

.member-info {
  @apply flex items-center space-x-4 flex-1;
}

.member-avatar {
  @apply w-10 h-10 rounded-full border-2 border-slate-200;
}

.member-details {
  @apply flex-1;
}

.member-name {
  @apply font-medium text-slate-900;
}

.member-email {
  @apply text-sm text-slate-600;
}

.member-joined {
  @apply text-xs text-slate-500;
}

.member-role {
  @apply mx-4;
}

.member-status {
  @apply text-center mx-4;
}

.status-active {
  @apply text-sm font-medium text-green-600;
}

.last-active {
  @apply text-xs text-slate-500 block;
}

.member-actions {
  @apply flex items-center space-x-2;
}

.action-btn {
  @apply text-sm px-3 py-1 rounded border;
  @apply hover:bg-slate-50 transition-colors duration-150;
}
```

### 任务分配系统

#### 分配界面设计
```html
<div class="task-assignment">
  <div class="assignment-header mb-4">
    <h3 class="font-medium text-slate-900">任务分配</h3>
  </div>
  
  <div class="assignment-form space-y-4">
    <div class="assignee-section">
      <label class="block text-sm font-medium text-slate-700 mb-2">负责人</label>
      <div class="assignee-selector">
        <button class="assignee-button">
          <img src="/avatar.jpg" class="w-6 h-6 rounded-full" />
          <span>选择负责人</span>
          <Icon name="chevron-down" class="w-4 h-4" />
        </button>
        <div class="assignee-dropdown">
          <div class="dropdown-item">
            <img src="/avatar1.jpg" class="w-6 h-6 rounded-full" />
            <span>张三</span>
            <span class="text-xs text-slate-500">编辑者</span>
          </div>
          <!-- 更多成员选项... -->
        </div>
      </div>
    </div>
    
    <div class="participants-section">
      <label class="block text-sm font-medium text-slate-700 mb-2">参与者</label>
      <div class="participants-list">
        <div class="participant-chip">
          <img src="/avatar2.jpg" class="w-5 h-5 rounded-full" />
          <span>李四</span>
          <button class="remove-participant">×</button>
        </div>
        <button class="add-participant">+ 添加参与者</button>
      </div>
    </div>
    
    <div class="workload-display">
      <h4 class="text-sm font-medium text-slate-700 mb-2">团队工作负载</h4>
      <div class="workload-bars">
        <div class="workload-item">
          <span class="member-name">张三</span>
          <div class="workload-bar">
            <div class="workload-fill" style="width: 75%"></div>
          </div>
          <span class="workload-text">12/16 任务</span>
        </div>
        <!-- 更多工作负载条... -->
      </div>
    </div>
  </div>
</div>
```

#### 任务分配样式
```css
.task-assignment {
  @apply bg-slate-50 rounded-lg p-4;
}

.assignee-selector {
  @apply relative;
}

.assignee-button {
  @apply flex items-center space-x-2 w-full p-2 border;
  @apply border-slate-300 rounded-md bg-white hover:border-slate-400;
}

.assignee-dropdown {
  @apply absolute top-full left-0 right-0 mt-1 bg-white;
  @apply border border-slate-300 rounded-md shadow-lg z-10;
  @apply max-h-48 overflow-y-auto;
}

.dropdown-item {
  @apply flex items-center space-x-2 p-2 hover:bg-slate-50;
  @apply cursor-pointer;
}

.participants-list {
  @apply flex flex-wrap gap-2;
}

.participant-chip {
  @apply flex items-center space-x-1 bg-blue-100 text-blue-700;
  @apply px-2 py-1 rounded-full text-sm;
}

.add-participant {
  @apply text-blue-600 hover:text-blue-700 text-sm;
  @apply border border-dashed border-blue-300 rounded-full px-3 py-1;
}

.workload-bars {
  @apply space-y-2;
}

.workload-item {
  @apply flex items-center space-x-3 text-sm;
}

.member-name {
  @apply w-16 text-slate-600;
}

.workload-bar {
  @apply flex-1 bg-slate-200 rounded-full h-2;
}

.workload-fill {
  @apply h-full rounded-full bg-blue-500;
}

.workload-text {
  @apply text-xs text-slate-500;
}
```

### 项目活动流

#### 活动流布局
```html
<div class="activity-feed">
  <div class="feed-header mb-4">
    <h3 class="font-medium text-slate-900">项目动态</h3>
    <div class="feed-filters">
      <button class="filter-btn active">全部</button>
      <button class="filter-btn">任务</button>
      <button class="filter-btn">成员</button>
      <button class="filter-btn">时间</button>
    </div>
  </div>
  
  <div class="activity-timeline">
    <div class="activity-item">
      <div class="activity-avatar">
        <img src="/avatar.jpg" class="w-8 h-8 rounded-full" />
      </div>
      <div class="activity-content">
        <div class="activity-header">
          <span class="user-name">张三</span>
          <span class="activity-action">完成了任务</span>
          <span class="task-link">「用户界面设计」</span>
        </div>
        <div class="activity-time">2小时前</div>
        <div class="activity-details">
          耗时: 3小时25分钟
        </div>
      </div>
    </div>
    
    <div class="activity-item">
      <div class="activity-avatar">
        <div class="system-avatar">
          <Icon name="users" class="w-4 h-4" />
        </div>
      </div>
      <div class="activity-content">
        <div class="activity-header">
          <span class="activity-action">李四加入了项目</span>
        </div>
        <div class="activity-time">4小时前</div>
      </div>
    </div>
    
    <!-- 更多活动项... -->
  </div>
</div>
```

#### 活动流样式
```css
.activity-feed {
  @apply bg-white rounded-lg border border-slate-200 p-4;
}

.feed-header {
  @apply flex items-center justify-between;
}

.feed-filters {
  @apply flex space-x-2;
}

.filter-btn {
  @apply text-sm px-3 py-1 rounded-full border border-slate-300;
  @apply hover:border-slate-400 transition-colors duration-150;
}

.filter-btn.active {
  @apply bg-blue-500 text-white border-blue-500;
}

.activity-timeline {
  @apply space-y-4;
}

.activity-item {
  @apply flex space-x-3 p-3 rounded-md hover:bg-slate-50;
}

.activity-avatar {
  @apply flex-shrink-0;
}

.system-avatar {
  @apply w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center;
}

.activity-content {
  @apply flex-1 min-w-0;
}

.activity-header {
  @apply flex items-center space-x-1 text-sm;
}

.user-name {
  @apply font-medium text-slate-900;
}

.activity-action {
  @apply text-slate-700;
}

.task-link {
  @apply text-blue-600 hover:text-blue-700 cursor-pointer;
}

.activity-time {
  @apply text-xs text-slate-500 mt-1;
}

.activity-details {
  @apply text-xs text-slate-600 mt-1;
}
```

---

## 移动端优化

### PWA实现规范

#### Manifest配置
```json
{
  "name": "Nobody Logger - 项目时间管理",
  "short_name": "Nobody Logger",
  "description": "专业的项目时间管理和团队协作工具",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1e293b",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-dashboard.png",
      "type": "image/png",
      "sizes": "390x844",
      "form_factor": "narrow"
    }
  ],
  "categories": ["productivity", "business"],
  "lang": "zh-CN"
}
```

#### PWA安装提示
```css
.pwa-install-prompt {
  @apply fixed bottom-4 left-4 right-4 bg-blue-600 text-white;
  @apply rounded-lg p-4 shadow-lg z-50;
  @apply transform transition-all duration-300;
}

.pwa-install-hidden {
  @apply translate-y-full opacity-0;
}

.pwa-install-content {
  @apply flex items-center justify-between;
}

.pwa-install-text {
  @apply flex-1 mr-4;
}

.pwa-install-title {
  @apply font-medium mb-1;
}

.pwa-install-description {
  @apply text-sm text-blue-100;
}

.pwa-install-actions {
  @apply flex items-center space-x-2;
}

.pwa-install-btn {
  @apply px-4 py-2 bg-white text-blue-600 rounded-md;
  @apply font-medium text-sm hover:bg-blue-50;
}

.pwa-dismiss-btn {
  @apply p-2 hover:bg-blue-700 rounded-md;
}
```

### 移动端导航设计

#### 底部导航栏
```html
<div class="mobile-nav">
  <nav class="mobile-nav-bar">
    <button class="nav-item active">
      <Icon name="home" class="nav-icon" />
      <span class="nav-label">仪表板</span>
    </button>
    <button class="nav-item">
      <Icon name="clock" class="nav-icon" />
      <span class="nav-label">时间记录</span>
    </button>
    <button class="nav-item">
      <Icon name="folder" class="nav-icon" />
      <span class="nav-label">项目</span>
    </button>
    <button class="nav-item">
      <Icon name="users" class="nav-icon" />
      <span class="nav-label">团队</span>
    </button>
    <button class="nav-item">
      <Icon name="user" class="nav-icon" />
      <span class="nav-label">我的</span>
    </button>
  </nav>
</div>
```

#### 移动端导航样式
```css
.mobile-nav {
  @apply fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40;
  @apply safe-bottom; /* iOS安全区域适配 */
}

.mobile-nav-bar {
  @apply flex items-center justify-around px-2 py-1;
}

.nav-item {
  @apply flex flex-col items-center justify-center;
  @apply py-2 px-3 rounded-lg transition-colors duration-150;
  @apply min-w-16 text-center;
}

.nav-item.active {
  @apply text-blue-600 bg-blue-50;
}

.nav-item:not(.active) {
  @apply text-slate-600 hover:text-slate-900 hover:bg-slate-50;
}

.nav-icon {
  @apply w-6 h-6 mb-1;
}

.nav-label {
  @apply text-xs font-medium;
}

/* 深色模式适配 */
.dark .mobile-nav {
  @apply bg-slate-900 border-slate-700;
}

.dark .nav-item.active {
  @apply text-blue-400 bg-blue-900/30;
}

.dark .nav-item:not(.active) {
  @apply text-slate-400 hover:text-slate-200 hover:bg-slate-800;
}
```

### 移动端仪表板布局

#### 移动端小部件适配
```css
/* 移动端仪表板网格 */
@media (max-width: 767px) {
  .dashboard-grid {
    @apply grid-cols-1 gap-4 p-4 pb-20; /* 底部导航留空 */
  }
  
  /* 小部件移动端适配 */
  .widget-card {
    @apply rounded-lg shadow-sm;
  }
  
  .widget-header {
    @apply p-3 text-sm;
  }
  
  .widget-content {
    @apply p-3;
  }
  
  /* 图表容器移动端优化 */
  .chart-container {
    @apply h-48; /* 降低图表高度 */
  }
  
  /* 热力图移动端适配 */
  .heatmap-grid {
    @apply text-xs;
  }
  
  .heatmap-cell {
    @apply min-h-6 min-w-6;
  }
  
  .heatmap-day-label,
  .heatmap-hour-label {
    @apply text-xs;
  }
}
```

### 触摸友好的交互设计

#### 按钮和触摸目标
```css
/* 移动端按钮最小尺寸 44px */
@media (max-width: 767px) {
  .btn-primary,
  .btn-secondary {
    @apply min-h-11 px-4 text-base; /* 44px最小高度 */
  }
  
  .btn-sm {
    @apply min-h-9 px-3 text-sm; /* 小按钮36px */
  }
  
  /* 图标按钮 */
  .icon-button {
    @apply min-w-11 min-h-11 flex items-center justify-center;
    @apply rounded-lg hover:bg-slate-100 active:bg-slate-200;
  }
  
  /* 列表项点击区域 */
  .list-item {
    @apply min-h-14 px-4 flex items-center; /* 56px推荐高度 */
  }
  
  /* 表格行移动端适配 */
  .table-row {
    @apply min-h-12 px-4; /* 48px行高 */
  }
}
```

#### 滑动手势支持
```css
/* 滑动删除效果 */
.swipe-item {
  @apply relative overflow-hidden;
}

.swipe-content {
  @apply transition-transform duration-200 ease-out;
}

.swipe-actions {
  @apply absolute top-0 right-0 bottom-0 flex;
}

.swipe-action {
  @apply w-20 flex items-center justify-center text-white;
}

.swipe-delete {
  @apply bg-red-500;
}

.swipe-edit {
  @apply bg-blue-500;
}

/* 下拉刷新 */
.pull-refresh {
  @apply relative;
}

.pull-refresh-indicator {
  @apply absolute top-0 left-1/2 transform -translate-x-1/2;
  @apply w-8 h-8 text-blue-500;
  @apply transition-all duration-300;
}

.pull-refresh-pulling {
  @apply scale-110;
}

.pull-refresh-loading {
  @apply animate-spin;
}
```

### 移动端表单优化

#### 表单输入适配
```css
@media (max-width: 767px) {
  /* 输入框移动端优化 */
  .form-input {
    @apply text-base; /* 防止iOS缩放 */
    @apply min-h-12 px-4; /* 增加内边距便于触摸 */
  }
  
  .form-textarea {
    @apply text-base min-h-24 p-4;
  }
  
  .form-select {
    @apply text-base min-h-12 px-4;
  }
  
  /* 表单标签 */
  .form-label {
    @apply text-base font-medium mb-2;
  }
  
  /* 表单组间距 */
  .form-group {
    @apply mb-6;
  }
  
  /* 表单按钮组 */
  .form-actions {
    @apply flex flex-col space-y-3 mt-8;
  }
  
  .form-actions .btn {
    @apply w-full justify-center;
  }
}
```

#### 键盘适配
```css
/* 键盘弹出时的适配 */
.keyboard-open {
  @apply pb-0; /* 移除底部内边距 */
}

.keyboard-open .mobile-nav {
  @apply hidden; /* 隐藏底部导航 */
}

/* 输入框聚焦时的处理 */
.form-input:focus {
  @apply ring-2 ring-blue-500 border-blue-500;
  /* 自动滚动到视图中心 */
  scroll-margin-top: 120px;
}
```

### 移动端数据表格

#### 响应式表格设计
```css
@media (max-width: 767px) {
  /* 表格堆叠布局 */
  .responsive-table {
    @apply block;
  }
  
  .table-header {
    @apply hidden;
  }
  
  .table-row {
    @apply block border border-slate-200 rounded-lg mb-4 p-4;
  }
  
  .table-cell {
    @apply block py-2 border-b border-slate-100 last:border-b-0;
  }
  
  .table-cell::before {
    content: attr(data-label) ": ";
    @apply font-medium text-slate-600 inline-block w-24;
  }
  
  /* 卡片式表格 */
  .card-table .table-row {
    @apply bg-white shadow-sm hover:shadow-md;
    @apply transition-shadow duration-200;
  }
}
```

### 移动端模态框

#### 全屏模态框设计
```css
@media (max-width: 767px) {
  .modal-container {
    @apply w-full h-full max-w-none max-h-none;
    @apply rounded-none border-0;
  }
  
  .modal-header {
    @apply flex items-center justify-between p-4;
    @apply border-b border-slate-200 sticky top-0 bg-white z-10;
  }
  
  .modal-title {
    @apply text-lg font-semibold;
  }
  
  .modal-close {
    @apply p-2 -mr-2 text-slate-500 hover:text-slate-700;
  }
  
  .modal-body {
    @apply p-4 flex-1 overflow-y-auto;
  }
  
  .modal-footer {
    @apply p-4 border-t border-slate-200 sticky bottom-0 bg-white;
  }
  
  .modal-actions {
    @apply flex flex-col space-y-3;
  }
  
  .modal-actions .btn {
    @apply w-full justify-center;
  }
}
```

### 移动端性能优化

#### 懒加载和虚拟滚动
```css
/* 图片懒加载占位符 */
.image-placeholder {
  @apply bg-slate-200 animate-pulse rounded;
}

.image-loading {
  @apply relative overflow-hidden;
}

.image-loading::after {
  content: '';
  @apply absolute inset-0 bg-gradient-to-r from-transparent;
  @apply via-white to-transparent animate-shimmer;
}

/* 虚拟滚动容器 */
.virtual-scroll-container {
  @apply overflow-auto;
  -webkit-overflow-scrolling: touch; /* iOS平滑滚动 */
}

.virtual-scroll-item {
  @apply transform-gpu; /* 启用硬件加速 */
}

/* 减少重绘的优化 */
.optimized-animations {
  @apply will-change-transform;
  backface-visibility: hidden;
}
```

#### 离线状态指示
```css
.offline-indicator {
  @apply fixed top-0 left-0 right-0 bg-amber-500 text-white;
  @apply text-center py-2 text-sm font-medium z-50;
  @apply transform transition-transform duration-300;
}

.offline-indicator.hidden {
  @apply -translate-y-full;
}

.offline-content {
  @apply bg-slate-100 border-2 border-dashed border-slate-300;
  @apply rounded-lg p-8 text-center;
}

.offline-icon {
  @apply w-12 h-12 text-slate-400 mx-auto mb-4;
}

.offline-message {
  @apply text-slate-600 mb-4;
}

.retry-button {
  @apply btn-primary;
}
```

---

## 用户流程设计

### 关键用户旅程

#### 1. 仪表板自定义流程
```
用户进入仪表板 → 点击"自定义"按钮 → 进入自定义模式
       ↓
显示可用小部件面板 ← 用户拖拽小部件到仪表板
       ↓
调整小部件大小和位置 → 实时预览效果
       ↓
点击"保存"确认 → 退出自定义模式 → 显示个性化仪表板
```

#### 2. 报告导出流程
```
选择要导出的数据 → 点击"导出报告"按钮
       ↓
步骤1: 选择报告模板 → 预览模板效果
       ↓
步骤2: 配置导出内容 → 选择图表和数据表格
       ↓
步骤3: 预览报告 → 检查内容和格式
       ↓
步骤4: 确认导出 → 显示生成进度 → 下载完成
```

#### 3. 团队协作邀请流程
```
项目所有者点击"邀请成员" → 输入邮箱地址
       ↓
选择默认角色 → 填写邀请消息（可选）
       ↓
发送邀请 → 邮件通知被邀请者
       ↓
被邀请者点击邮件链接 → 注册/登录 → 加入项目团队
       ↓
邀请者收到加入通知 → 更新团队成员列表
```

### 错误状态和边界情况

#### 网络错误处理
```css
.error-state {
  @apply text-center py-8;
}

.error-icon {
  @apply w-12 h-12 text-red-500 mx-auto mb-4;
}

.error-title {
  @apply text-lg font-semibold text-slate-900 mb-2;
}

.error-message {
  @apply text-slate-600 mb-4 max-w-md mx-auto;
}

.error-actions {
  @apply flex flex-col sm:flex-row gap-3 justify-center;
}

.retry-btn {
  @apply btn-primary;
}

.contact-support-btn {
  @apply btn-secondary;
}
```

#### 加载状态设计
```css
.loading-state {
  @apply flex flex-col items-center justify-center py-8;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-blue-200 border-t-blue-600;
  @apply rounded-full animate-spin mb-4;
}

.loading-text {
  @apply text-slate-600 text-sm;
}

/* 骨架屏加载 */
.skeleton-loader {
  @apply animate-pulse;
}

.skeleton-text {
  @apply bg-slate-200 rounded h-4 mb-2;
}

.skeleton-text-short {
  @apply w-3/4;
}

.skeleton-text-long {
  @apply w-full;
}

.skeleton-avatar {
  @apply bg-slate-200 rounded-full w-10 h-10;
}

.skeleton-button {
  @apply bg-slate-200 rounded h-9 w-24;
}
```

#### 空状态设计
```css
.empty-state {
  @apply text-center py-12;
}

.empty-icon {
  @apply w-16 h-16 text-slate-400 mx-auto mb-4;
}

.empty-title {
  @apply text-lg font-medium text-slate-900 mb-2;
}

.empty-description {
  @apply text-slate-600 mb-6 max-w-sm mx-auto;
}

.empty-action {
  @apply btn-primary;
}

/* 特定场景的空状态 */
.empty-dashboard {
  @apply bg-gradient-to-br from-blue-50 to-indigo-100;
  @apply rounded-lg p-8 text-center;
}

.empty-tasks {
  @apply border-2 border-dashed border-slate-300 rounded-lg;
  @apply p-8 text-center;
}

.empty-team {
  @apply bg-slate-50 rounded-lg p-8 text-center;
}
```

---

## 数据可视化设计标准

### 图表色彩规范

#### 主题色板
```css
/* 数据可视化专用色板 */
:root {
  /* 分类色板 - 用于区分不同类别 */
  --viz-cat-1: #3b82f6;   /* 蓝色 - 主要数据 */
  --viz-cat-2: #10b981;   /* 绿色 - 成功/完成 */
  --viz-cat-3: #f59e0b;   /* 橙色 - 警告/进行中 */
  --viz-cat-4: #ef4444;   /* 红色 - 错误/延期 */
  --viz-cat-5: #8b5cf6;   /* 紫色 - 特殊状态 */
  --viz-cat-6: #06b6d4;   /* 青色 - 辅助数据 */
  --viz-cat-7: #84cc16;   /* 绿青 - 增长数据 */
  --viz-cat-8: #f97316;   /* 橙红 - 下降数据 */
  
  /* 序列色板 - 用于表示数值大小 */
  --viz-seq-1: #eff6ff;   /* 最浅 */
  --viz-seq-2: #dbeafe;
  --viz-seq-3: #bfdbfe;
  --viz-seq-4: #93c5fd;
  --viz-seq-5: #60a5fa;
  --viz-seq-6: #3b82f6;
  --viz-seq-7: #2563eb;
  --viz-seq-8: #1d4ed8;   /* 最深 */
  
  /* 发散色板 - 用于表示正负值 */
  --viz-div-neg: #dc2626;  /* 负值 - 红色 */
  --viz-div-neu: #f3f4f6;  /* 中性 - 灰色 */
  --viz-div-pos: #059669;  /* 正值 - 绿色 */
}
```

#### 图表通用样式
```css
.chart-container {
  @apply bg-white rounded-lg border border-slate-200 p-4;
}

.chart-title {
  @apply text-lg font-semibold text-slate-900 mb-4;
}

.chart-subtitle {
  @apply text-sm text-slate-600 mb-4;
}

.chart-legend {
  @apply flex flex-wrap gap-4 justify-center mt-4;
}

.legend-item {
  @apply flex items-center space-x-2 text-sm;
}

.legend-color {
  @apply w-3 h-3 rounded-sm flex-shrink-0;
}

.legend-label {
  @apply text-slate-700;
}

/* 图表工具提示 */
.chart-tooltip {
  @apply bg-slate-900 text-white text-xs rounded-md p-3 shadow-lg;
  @apply max-w-xs z-50 pointer-events-none;
}

.tooltip-title {
  @apply font-medium mb-1;
}

.tooltip-content {
  @apply space-y-1;
}

.tooltip-item {
  @apply flex items-center justify-between space-x-2;
}

.tooltip-color {
  @apply w-2 h-2 rounded-full flex-shrink-0;
}
```

### 响应式图表设计

#### 断点适配规则
```css
/* 桌面端: 完整图表 */
@media (min-width: 1024px) {
  .chart-responsive {
    @apply h-80; /* 320px高度 */
  }
  
  .chart-legend {
    @apply flex-row justify-center;
  }
}

/* 平板端: 中等图表 */
@media (min-width: 768px) and (max-width: 1023px) {
  .chart-responsive {
    @apply h-64; /* 256px高度 */
  }
  
  .chart-legend {
    @apply flex-row justify-center;
  }
}

/* 移动端: 紧凑图表 */
@media (max-width: 767px) {
  .chart-responsive {
    @apply h-48; /* 192px高度 */
  }
  
  .chart-legend {
    @apply flex-col items-start;
  }
  
  .chart-tooltip {
    @apply text-xs p-2;
  }
}
```

### 可访问性标准

#### 色盲友好设计
```css
/* 确保图表可访问性 */
.chart-accessible {
  /* 使用形状和纹理辅助颜色 */
}

.chart-pattern-dots {
  fill: url(#dots-pattern);
}

.chart-pattern-lines {
  fill: url(#lines-pattern);
}

.chart-pattern-crosses {
  fill: url(#crosses-pattern);
}

/* 高对比度支持 */
@media (prefers-contrast: high) {
  .chart-container {
    @apply border-2 border-black;
  }
  
  .chart-text {
    @apply text-black font-bold;
  }
}

/* 减少动画支持 */
@media (prefers-reduced-motion: reduce) {
  .chart-animation {
    @apply transition-none;
  }
  
  .chart-hover-effect {
    @apply transform-none;
  }
}
```

---

## 实现指导

### 技术栈建议

#### 前端框架和库
```json
{
  "dashboard": {
    "grid": "react-grid-layout",
    "dragDrop": "@dnd-kit/core",
    "charts": "recharts / chart.js",
    "animations": "framer-motion"
  },
  "visualization": {
    "charts": "d3.js / recharts",
    "maps": "leaflet",
    "calendar": "react-calendar",
    "heatmap": "react-calendar-heatmap"
  },
  "export": {
    "pdf": "jspdf / puppeteer",
    "excel": "xlsx / exceljs",
    "charts": "html2canvas"
  },
  "mobile": {
    "pwa": "workbox",
    "gestures": "react-use-gesture",
    "virtualScroll": "react-window"
  }
}
```

#### 状态管理架构
```typescript
// 使用 Zustand 进行轻量级状态管理
interface DashboardStore {
  widgets: Widget[];
  layout: Layout[];
  isCustomizing: boolean;
  
  // Actions
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
  updateLayout: (layout: Layout[]) => void;
  toggleCustomizing: () => void;
}

// 使用 TanStack Query 管理服务器状态
const useProjectData = (projectId: string) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectData(projectId),
    staleTime: 5 * 60 * 1000 // 5分钟缓存
  });
};
```

### 性能优化策略

#### 代码分割和懒加载
```typescript
// 路由级别的代码分割
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reports = lazy(() => import('./pages/Reports'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));

// 组件级别的懒加载
const HeavyChart = lazy(() => import('./components/HeavyChart'));

// 图表数据的虚拟化
const VirtualizedChart = memo(({ data }: { data: ChartData[] }) => {
  const visibleData = useMemo(() => {
    // 只渲染可见区域的数据点
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  return <Chart data={visibleData} />;
});
```

#### 缓存策略
```typescript
// Service Worker 缓存策略
const cacheStrategy = {
  // 应用外壳缓存
  shell: 'cache-first',
  // API数据缓存
  api: 'network-first',
  // 静态资源缓存
  static: 'cache-first',
  // 图片缓存
  images: 'cache-first'
};

// 内存缓存优化
const useChartDataCache = () => {
  const cache = useRef(new Map());
  
  const getCachedData = useCallback((key: string) => {
    if (cache.current.has(key)) {
      return cache.current.get(key);
    }
    return null;
  }, []);
  
  const setCachedData = useCallback((key: string, data: any) => {
    if (cache.current.size >= 50) {
      // LRU清理策略
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }
    cache.current.set(key, data);
  }, []);
  
  return { getCachedData, setCachedData };
};
```

### 测试策略

#### 组件测试
```typescript
// 小部件组件测试
describe('Widget Component', () => {
  test('renders widget with correct data', () => {
    const mockData = { title: 'Test Widget', value: 100 };
    render(<Widget data={mockData} />);
    
    expect(screen.getByText('Test Widget')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
  
  test('handles drag and drop correctly', async () => {
    const onDrag = jest.fn();
    render(<Widget onDrag={onDrag} />);
    
    const widget = screen.getByRole('button');
    
    // 模拟拖拽操作
    fireEvent.dragStart(widget);
    fireEvent.dragEnd(widget);
    
    expect(onDrag).toHaveBeenCalled();
  });
});

// 可视化测试
describe('Chart Visualization', () => {
  test('chart renders with accessibility attributes', () => {
    render(<Chart data={mockChartData} />);
    
    const chart = screen.getByRole('img', { name: /chart/i });
    expect(chart).toHaveAttribute('aria-label');
  });
});
```

#### E2E测试场景
```typescript
// Playwright 端到端测试
test('dashboard customization flow', async ({ page }) => {
  await page.goto('/dashboard');
  
  // 进入自定义模式
  await page.click('[data-testid="customize-button"]');
  
  // 拖拽小部件
  await page.dragAndDrop(
    '[data-testid="widget-chart"]',
    '[data-testid="drop-zone"]'
  );
  
  // 保存自定义
  await page.click('[data-testid="save-customization"]');
  
  // 验证保存成功
  await expect(page.locator('[data-testid="dashboard-grid"]')).toContainText('Chart Widget');
});

test('report export flow', async ({ page }) => {
  await page.goto('/reports');
  
  // 选择报告模板
  await page.click('[data-testid="template-project-progress"]');
  await page.click('[data-testid="next-step"]');
  
  // 配置报告内容
  await page.check('[data-testid="include-gantt-chart"]');
  await page.click('[data-testid="next-step"]');
  
  // 预览和导出
  await page.click('[data-testid="next-step"]');
  
  // 等待下载
  const downloadPromise = page.waitForEvent('download');
  await page.click('[data-testid="export-pdf"]');
  const download = await downloadPromise;
  
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});
```

### 部署和监控

#### PWA部署清单
```yaml
# .github/workflows/deploy.yml
name: Deploy PWA
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build PWA
        run: npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.API_URL }}
      
      - name: Generate PWA assets
        run: npm run pwa:generate
      
      - name: Deploy to CDN
        run: npm run deploy
```

#### 性能监控
```typescript
// 关键性能指标监控
const reportWebVitals = (metric: Metric) => {
  switch (metric.name) {
    case 'CLS':
      // 累积布局偏移监控
      analytics.track('Core Web Vital', {
        metric: 'CLS',
        value: metric.value,
        rating: metric.rating
      });
      break;
      
    case 'FCP':
      // 首次内容绘制监控
      analytics.track('Core Web Vital', {
        metric: 'FCP',
        value: metric.value,
        rating: metric.rating
      });
      break;
      
    case 'LCP':
      // 最大内容绘制监控
      analytics.track('Core Web Vital', {
        metric: 'LCP',
        value: metric.value,
        rating: metric.rating
      });
      break;
  }
};

// 用户体验监控
const trackUserInteraction = (action: string, target: string) => {
  analytics.track('User Interaction', {
    action,
    target,
    timestamp: Date.now(),
    sessionId: getSessionId()
  });
};
```

---

## 总结

本设计规范文档为Sprint 5的六大核心功能模块提供了全面的UI/UX设计指导：

### 核心设计原则
1. **用户为中心** - 所有设计决策基于用户需求和使用场景
2. **一致性优先** - 确保界面元素和交互模式的统一性
3. **可访问性** - 支持不同能力用户的无障碍访问
4. **性能导向** - 优化加载速度和交互响应性
5. **移动优先** - 响应式设计适配多种设备

### 实现优先级
**Week 1 (高优先级):**
- 交互式仪表板系统
- 项目进度甘特图
- PDF报告导出

**Week 2 (中高优先级):**
- 时间分析热力图
- 用户邀请和权限管理
- 移动端PWA基础实现

**后续迭代:**
- 团队协作完整功能
- 高级数据分析
- 移动端完整优化

### 技术建议
- 使用现有的Tailwind CSS设计系统作为基础
- 采用组件化开发模式确保可维护性
- 实施渐进式PWA策略提升用户体验
- 建立完整的测试覆盖确保质量

本规范将指导开发团队创建一个现代、高效、用户友好的项目管理和团队协作平台。

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\u5206\u6790\u73b0\u6709\u8bbe\u8ba1\u7cfb\u7edf\u548c\u7528\u6237\u6545\u4e8b", "id": "1", "priority": "high", "status": "completed"}, {"content": "\u8bbe\u8ba1Sprint 5\u6838\u5fc3UI/UX\u89c4\u8303 - \u4ea4\u4e92\u5f0f\u4eea\u8868\u677f\u7cfb\u7edf", "id": "2", "priority": "high", "status": "completed"}, {"content": "\u8bbe\u8ba1\u65f6\u95f4\u5206\u6790\u53ef\u89c6\u5316\u7ec4\u4ef6\u89c4\u8303", "id": "3", "priority": "high", "status": "in_progress"}, {"content": "\u8bbe\u8ba1\u9879\u76ee\u8fdb\u5ea6\u62a5\u544a\u754c\u9762\u89c4\u8303", "id": "4", "priority": "high", "status": "pending"}, {"content": "\u8bbe\u8ba1\u62a5\u544a\u5bfc\u51fa\u7cfb\u7edfUI\u89c4\u8303", "id": "5", "priority": "high", "status": "pending"}, {"content": "\u8bbe\u8ba1\u56e2\u961f\u534f\u4f5c\u57fa\u7840\u529f\u80fd\u754c\u9762", "id": "6", "priority": "medium", "status": "pending"}, {"content": "\u8bbe\u8ba1\u79fb\u52a8\u7aef\u4f18\u5316\u754c\u9762\u89c4\u8303", "id": "7", "priority": "medium", "status": "pending"}, {"content": "\u6574\u5408\u6240\u6709\u8bbe\u8ba1\u89c4\u8303\u5e76\u751f\u6210\u5b8c\u6574\u6587\u6863", "id": "8", "priority": "high", "status": "pending"}]