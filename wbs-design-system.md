# WBS导航设计系统规范

## 1. 设计令牌 (Design Tokens)

### 1.1 颜色系统

#### 主色调 (Primary Colors)
```css
:root {
  /* 层级标识色 */
  --level-yearly: #1976D2;      /* 年度 - 深蓝 */
  --level-half-yearly: #388E3C;  /* 半年 - 绿色 */
  --level-quarterly: #F57C00;    /* 季度 - 橙色 */
  --level-monthly: #7B1FA2;      /* 月份 - 紫色 */
  --level-weekly: #D32F2F;       /* 周 - 红色 */
  --level-daily: #455A64;        /* 日 - 灰蓝 */
  
  /* 状态指示色 */
  --status-not-started: #9E9E9E; /* 未开始 - 灰色 */
  --status-in-progress: #2196F3; /* 进行中 - 蓝色 */
  --status-completed: #4CAF50;   /* 已完成 - 绿色 */
  --status-paused: #FF9800;      /* 已暂停 - 橙色 */
  --status-cancelled: #F44336;   /* 已取消 - 红色 */
  --status-overdue: #E91E63;     /* 逾期 - 粉红 */
}
```

#### 优先级颜色
```css
:root {
  --priority-low: #81C784;       /* 低优先级 - 浅绿 */
  --priority-medium: #FFB74D;    /* 中优先级 - 浅橙 */
  --priority-high: #F06292;      /* 高优先级 - 粉色 */
  --priority-urgent: #EF5350;    /* 紧急 - 红色 */
}
```

#### 语义色彩
```css
:root {
  /* 成功状态 */
  --success-50: #E8F5E8;
  --success-500: #4CAF50;
  --success-700: #388E3C;
  
  /* 警告状态 */
  --warning-50: #FFF8E1;
  --warning-500: #FF9800;
  --warning-700: #F57C00;
  
  /* 错误状态 */
  --error-50: #FFEBEE;
  --error-500: #F44336;
  --error-700: #D32F2F;
  
  /* 信息状态 */
  --info-50: #E3F2FD;
  --info-500: #2196F3;
  --info-700: #1976D2;
}
```

#### 中性色彩
```css
:root {
  /* 灰度系统 */
  --gray-50: #FAFAFA;
  --gray-100: #F5F5F5;
  --gray-200: #EEEEEE;
  --gray-300: #E0E0E0;
  --gray-400: #BDBDBD;
  --gray-500: #9E9E9E;
  --gray-600: #757575;
  --gray-700: #616161;
  --gray-800: #424242;
  --gray-900: #212121;
  
  /* 文本颜色 */
  --text-primary: #212121;
  --text-secondary: #757575;
  --text-disabled: #BDBDBD;
  --text-hint: #9E9E9E;
  
  /* 背景颜色 */
  --bg-primary: #FFFFFF;
  --bg-secondary: #FAFAFA;
  --bg-tertiary: #F5F5F5;
  --bg-overlay: rgba(0, 0, 0, 0.6);
}
```

### 1.2 字体系统

#### 字体族
```css
:root {
  --font-sans: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 
               'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 
               'Roboto Mono', Consolas, 'Courier New', monospace;
}
```

#### 字体大小 
```css
:root {
  /* 字体大小阶梯 */
  --text-xs: 0.75rem;      /* 12px - 辅助信息 */
  --text-sm: 0.875rem;     /* 14px - 正文 */
  --text-base: 1rem;       /* 16px - 基础文本 */
  --text-lg: 1.125rem;     /* 18px - 副标题 */
  --text-xl: 1.25rem;      /* 20px - 标题 */
  --text-2xl: 1.5rem;      /* 24px - 大标题 */
  --text-3xl: 1.875rem;    /* 30px - 页面标题 */
  --text-4xl: 2.25rem;     /* 36px - 主标题 */
}
```

#### 字重
```css
:root {
  --font-thin: 100;
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  --font-black: 900;
}
```

#### 行高
```css
:root {
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
}
```

### 1.3 间距系统

#### 基础间距
```css
:root {
  /* 间距阶梯 (基于4px网格) */
  --space-0: 0;
  --space-1: 0.25rem;      /* 4px */
  --space-2: 0.5rem;       /* 8px */
  --space-3: 0.75rem;      /* 12px */
  --space-4: 1rem;         /* 16px */
  --space-5: 1.25rem;      /* 20px */
  --space-6: 1.5rem;       /* 24px */
  --space-8: 2rem;         /* 32px */
  --space-10: 2.5rem;      /* 40px */
  --space-12: 3rem;        /* 48px */
  --space-16: 4rem;        /* 64px */
  --space-20: 5rem;        /* 80px */
  --space-24: 6rem;        /* 96px */
}
```

#### 组件间距
```css
:root {
  /* 组件内边距 */
  --padding-xs: var(--space-2);   /* 按钮、标签 */
  --padding-sm: var(--space-3);   /* 表单元素 */
  --padding-md: var(--space-4);   /* 卡片、面板 */
  --padding-lg: var(--space-6);   /* 容器 */
  --padding-xl: var(--space-8);   /* 页面布局 */
  
  /* 组件外边距 */
  --margin-xs: var(--space-2);
  --margin-sm: var(--space-4);
  --margin-md: var(--space-6);
  --margin-lg: var(--space-8);
  --margin-xl: var(--space-12);
}
```

### 1.4 圆角系统
```css
:root {
  --radius-none: 0;
  --radius-sm: 0.125rem;    /* 2px */
  --radius-md: 0.25rem;     /* 4px */
  --radius-lg: 0.5rem;      /* 8px */
  --radius-xl: 0.75rem;     /* 12px */
  --radius-2xl: 1rem;       /* 16px */
  --radius-full: 9999px;    /* 圆形 */
}
```

### 1.5 阴影系统
```css
:root {
  /* 阴影层级 */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}
```

### 1.6 过渡系统
```css
:root {
  /* 过渡时长 */
  --duration-75: 75ms;
  --duration-100: 100ms;
  --duration-150: 150ms;
  --duration-200: 200ms;
  --duration-300: 300ms;
  --duration-500: 500ms;
  --duration-700: 700ms;
  --duration-1000: 1000ms;
  
  /* 缓动函数 */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## 2. 组件规范

### 2.1 按钮组件 (Button)

#### 按钮变体
```css
/* 主要按钮 */
.btn-primary {
  background: var(--info-500);
  color: white;
  border: none;
  padding: var(--padding-sm) var(--padding-md);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: all var(--duration-150) var(--ease-out);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--info-700);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

/* 次要按钮 */
.btn-secondary {
  background: transparent;
  color: var(--info-500);
  border: 1px solid var(--gray-300);
  padding: var(--padding-sm) var(--padding-md);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: all var(--duration-150) var(--ease-out);
}

.btn-secondary:hover {
  border-color: var(--info-500);
  background: var(--info-50);
}

/* 文字按钮 */
.btn-text {
  background: transparent;
  color: var(--info-500);
  border: none;
  padding: var(--padding-sm);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: all var(--duration-150) var(--ease-out);
}

.btn-text:hover {
  background: var(--info-50);
}
```

#### 按钮尺寸
```css
/* 小尺寸 */
.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  min-height: 32px;
}

/* 中等尺寸 */
.btn-md {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  min-height: 40px;
}

/* 大尺寸 */
.btn-lg {
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-base);
  min-height: 48px;
}
```

#### 按钮状态
```css
/* 禁用状态 */
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* 加载状态 */
.btn-loading {
  position: relative;
  color: transparent;
}

.btn-loading::after {
  content: '';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: inherit;
  border-radius: inherit;
}

.btn-loading::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 2.2 任务卡片组件 (TaskCard)

#### 基础样式
```css
.task-card {
  background: var(--bg-primary);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--padding-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-200) var(--ease-out);
  cursor: pointer;
}

.task-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--gray-300);
}

.task-card.selected {
  border-color: var(--info-500);
  box-shadow: 0 0 0 2px var(--info-500);
}
```

#### 任务卡片布局
```css
.task-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.task-card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  margin-right: var(--space-2);
}

.task-card-actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity var(--duration-200) var(--ease-out);
}

.task-card:hover .task-card-actions {
  opacity: 1;
}

.task-card-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-4);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.task-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
```

#### 进度条样式
```css
.task-progress {
  background: var(--gray-200);
  border-radius: var(--radius-full);
  height: 6px;
  overflow: hidden;
  flex: 1;
}

.task-progress-bar {
  height: 100%;
  border-radius: inherit;
  transition: width var(--duration-500) var(--ease-out);
  position: relative;
  overflow: hidden;
}

.task-progress-bar.status-not-started {
  background: var(--status-not-started);
}

.task-progress-bar.status-in-progress {
  background: linear-gradient(90deg, var(--status-in-progress) 0%, #64B5F6 100%);
}

.task-progress-bar.status-completed {
  background: var(--status-completed);
}

.task-progress-bar.status-overdue {
  background: var(--status-overdue);
}

/* 进度条动画 */
.task-progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

### 2.3 导航组件 (Navigation)

#### 面包屑导航
```css
.breadcrumb {
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  padding: var(--padding-sm) var(--padding-md);
  border-bottom: 1px solid var(--gray-200);
  font-size: var(--text-sm);
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.breadcrumb-link {
  color: var(--text-secondary);
  text-decoration: none;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--duration-150) var(--ease-out);
}

.breadcrumb-link:hover {
  color: var(--info-500);
  background: var(--info-50);
}

.breadcrumb-item:last-child .breadcrumb-link {
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.breadcrumb-separator {
  color: var(--text-hint);
  margin: 0 var(--space-1);
}

.breadcrumb-actions {
  display: flex;
  gap: var(--space-2);
}
```

#### 侧边导航
```css
.sidebar {
  width: 280px;
  background: var(--bg-primary);
  border-right: 1px solid var(--gray-200);
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sidebar-section {
  padding: var(--padding-md);
  border-bottom: 1px solid var(--gray-100);
}

.sidebar-section-title {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-hint);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3) 0;
}

.sidebar-nav {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar-nav-item {
  margin-bottom: var(--space-1);
}

.sidebar-nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  transition: all var(--duration-150) var(--ease-out);
}

.sidebar-nav-link:hover {
  background: var(--gray-50);
  color: var(--text-primary);
}

.sidebar-nav-link.active {
  background: var(--info-50);
  color: var(--info-700);
  font-weight: var(--font-medium);
}

.sidebar-nav-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.sidebar-nav-text {
  flex: 1;
}

.sidebar-nav-badge {
  background: var(--gray-500);
  color: white;
  font-size: var(--text-xs);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
}
```

### 2.4 表单组件 (Form)

#### 输入框
```css
.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.form-label.required::after {
  content: ' *';
  color: var(--error-500);
}

.form-input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: var(--bg-primary);
  transition: all var(--duration-150) var(--ease-out);
}

.form-input:focus {
  outline: none;
  border-color: var(--info-500);
  box-shadow: 0 0 0 2px var(--info-500);
}

.form-input:disabled {
  background: var(--gray-50);
  color: var(--text-disabled);
  cursor: not-allowed;
}

.form-input.error {
  border-color: var(--error-500);
}

.form-input.error:focus {
  box-shadow: 0 0 0 2px var(--error-500);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-help {
  font-size: var(--text-xs);
  color: var(--text-hint);
  margin-top: var(--space-1);
}

.form-error {
  font-size: var(--text-xs);
  color: var(--error-500);
  margin-top: var(--space-1);
}
```

#### 选择器
```css
.form-select {
  position: relative;
}

.form-select-trigger {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  transition: all var(--duration-150) var(--ease-out);
}

.form-select-trigger:hover {
  border-color: var(--gray-400);
}

.form-select-trigger.open {
  border-color: var(--info-500);
  box-shadow: 0 0 0 2px var(--info-500);
}

.form-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 50;
  max-height: 200px;
  overflow-y: auto;
  margin-top: var(--space-1);
}

.form-select-option {
  padding: var(--space-3);
  cursor: pointer;
  font-size: var(--text-sm);
  transition: background var(--duration-150) var(--ease-out);
}

.form-select-option:hover {
  background: var(--gray-50);
}

.form-select-option.selected {
  background: var(--info-50);
  color: var(--info-700);
  font-weight: var(--font-medium);
}
```

### 2.5 标签组件 (Tag)

#### 基础标签
```css
.tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: 1;
  border: 1px solid transparent;
  transition: all var(--duration-150) var(--ease-out);
}

/* 标签变体 */
.tag-default {
  background: var(--gray-100);
  color: var(--gray-700);
}

.tag-primary {
  background: var(--info-50);
  color: var(--info-700);
  border-color: var(--info-200);
}

.tag-success {
  background: var(--success-50);
  color: var(--success-700);
  border-color: var(--success-200);
}

.tag-warning {
  background: var(--warning-50);
  color: var(--warning-700);
  border-color: var(--warning-200);
}

.tag-error {
  background: var(--error-50);
  color: var(--error-700);
  border-color: var(--error-200);
}

/* 可关闭标签 */
.tag-closable {
  padding-right: var(--space-1);
}

.tag-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  transition: all var(--duration-150) var(--ease-out);
}

.tag-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}
```

### 2.6 模态框组件 (Modal)

#### 模态框容器
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--padding-md);
}

.modal-container {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalEnter var(--duration-300) var(--ease-out);
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: var(--padding-lg);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--duration-150) var(--ease-out);
}

.modal-close:hover {
  background: var(--gray-100);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--padding-lg);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: var(--padding-lg);
  border-top: 1px solid var(--gray-200);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
```

## 3. 响应式设计规范

### 3.1 断点系统
```css
:root {
  --breakpoint-sm: 640px;   /* 小屏设备 */
  --breakpoint-md: 768px;   /* 平板 */
  --breakpoint-lg: 1024px;  /* 小型桌面 */
  --breakpoint-xl: 1280px;  /* 桌面 */
  --breakpoint-2xl: 1536px; /* 大屏桌面 */
}

/* 媒体查询混合 */
@custom-media --sm (min-width: 640px);
@custom-media --md (min-width: 768px);
@custom-media --lg (min-width: 1024px);
@custom-media --xl (min-width: 1280px);
@custom-media --2xl (min-width: 1536px);
```

### 3.2 网格系统
```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--padding-md);
}

@media (--sm) {
  .container { max-width: 640px; }
}

@media (--md) {
  .container { max-width: 768px; }
}

@media (--lg) {
  .container { max-width: 1024px; }
}

@media (--xl) {
  .container { max-width: 1280px; }
}

@media (--2xl) {
  .container { max-width: 1536px; }
}

.grid {
  display: grid;
  gap: var(--space-4);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

@media (--md) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (--lg) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}
```

## 4. 动画规范

### 4.1 动画类型定义

#### 页面过渡动画
```css
/* 淡入淡出 */
.fade-enter {
  opacity: 0;
}
.fade-enter-active {
  opacity: 1;
  transition: opacity var(--duration-300) var(--ease-out);
}
.fade-exit {
  opacity: 1;
}
.fade-exit-active {
  opacity: 0;
  transition: opacity var(--duration-200) var(--ease-in);
}

/* 滑动动画 */
.slide-right-enter {
  transform: translateX(-100%);
}
.slide-right-enter-active {
  transform: translateX(0);
  transition: transform var(--duration-300) var(--ease-out);
}
.slide-right-exit {
  transform: translateX(0);
}
.slide-right-exit-active {
  transform: translateX(100%);
  transition: transform var(--duration-200) var(--ease-in);
}

/* 缩放动画 */
.scale-enter {
  transform: scale(0.9);
  opacity: 0;
}
.scale-enter-active {
  transform: scale(1);
  opacity: 1;
  transition: all var(--duration-200) var(--ease-out);
}
```

#### 微动画
```css
/* 弹跳效果 */
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: translate3d(0, 0, 0); }
  40%, 43% { transform: translate3d(0, -8px, 0); }
  70% { transform: translate3d(0, -4px, 0); }
  90% { transform: translate3d(0, -2px, 0); }
}

.bounce {
  animation: bounce var(--duration-1000) var(--ease-out);
}

/* 脉冲效果 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.pulse {
  animation: pulse var(--duration-1000) infinite;
}

/* 摇摆效果 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.shake {
  animation: shake var(--duration-500) var(--ease-out);
}
```

### 4.2 加载动画
```css
/* 旋转加载器 */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-200);
  border-top: 2px solid var(--info-500);
  border-radius: 50%;
  animation: spin var(--duration-1000) linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 点状加载器 */
.dots-loader {
  display: inline-flex;
  gap: var(--space-1);
}

.dots-loader > div {
  width: 6px;
  height: 6px;
  background: var(--info-500);
  border-radius: 50%;
  animation: dotPulse 1.4s infinite ease-in-out both;
}

.dots-loader > div:nth-child(1) { animation-delay: -0.32s; }
.dots-loader > div:nth-child(2) { animation-delay: -0.16s; }

@keyframes dotPulse {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* 进度条加载器 */
.progress-loader {
  width: 100%;
  height: 4px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-loader::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    var(--info-500),
    transparent
  );
  animation: progressSlide 1.5s infinite;
}

@keyframes progressSlide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

## 5. 无障碍访问规范

### 5.1 焦点管理
```css
/* 焦点样式 */
*:focus {
  outline: 2px solid var(--info-500);
  outline-offset: 2px;
}

/* 跳过链接 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--bg-primary);
  color: var(--info-500);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  text-decoration: none;
  z-index: 1000;
  transition: top var(--duration-200) var(--ease-out);
}

.skip-link:focus {
  top: 6px;
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  :root {
    --gray-300: #000000;
    --gray-600: #000000;
    --text-secondary: #000000;
  }
  
  .task-card {
    border-width: 2px;
  }
  
  .btn-secondary {
    border-width: 2px;
  }
}
```

### 5.2 屏幕阅读器支持
```css
/* 仅供屏幕阅读器使用的文本 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 可聚焦的屏幕阅读器文本 */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### 5.3 减少动画设置
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .bounce,
  .pulse,
  .shake {
    animation: none;
  }
}
```

## 6. 暗黑模式支持

### 6.1 暗黑模式颜色变量
```css
@media (prefers-color-scheme: dark) {
  :root {
    /* 背景颜色 */
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --bg-tertiary: #3d3d3d;
    --bg-overlay: rgba(0, 0, 0, 0.8);
    
    /* 文本颜色 */
    --text-primary: #ffffff;
    --text-secondary: #b3b3b3;
    --text-disabled: #666666;
    --text-hint: #808080;
    
    /* 边框颜色 */
    --gray-200: #404040;
    --gray-300: #525252;
    --gray-400: #737373;
    
    /* 阴影 */
    --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
  }
}

/* 手动切换暗黑模式 */
[data-theme="dark"] {
  /* 同上暗黑模式变量 */
}
```

### 6.2 组件暗黑模式适配
```css
/* 任务卡片暗黑模式 */
@media (prefers-color-scheme: dark) {
  .task-card {
    background: var(--bg-secondary);
    border-color: var(--gray-300);
  }
  
  .task-card:hover {
    background: var(--bg-tertiary);
  }
}

/* 按钮暗黑模式 */
@media (prefers-color-scheme: dark) {
  .btn-secondary {
    border-color: var(--gray-400);
    color: var(--text-primary);
  }
  
  .btn-secondary:hover {
    background: var(--gray-200);
  }
}
```

## 7. 使用指南

### 7.1 设计令牌使用
```css
/* ✅ 推荐：使用设计令牌 */
.my-component {
  padding: var(--padding-md);
  color: var(--text-primary);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
}

/* ❌ 不推荐：硬编码值 */
.my-component {
  padding: 16px;
  color: #212121;
  background: #ffffff;
  border-radius: 8px;
}
```

### 7.2 响应式设计最佳实践
```css
/* ✅ 推荐：移动优先 */
.task-grid {
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (--md) {
  .task-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (--lg) {
  .task-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ❌ 不推荐：桌面优先 */
.task-grid {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 1024px) {
  .task-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### 7.3 动画使用指南
```css
/* ✅ 推荐：尊重用户偏好 */
.animated-element {
  transition: transform var(--duration-300) var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .animated-element {
    transition: none;
  }
}

/* ✅ 推荐：性能友好的动画属性 */
.slide-animation {
  transform: translateX(100%);
  transition: transform var(--duration-300) var(--ease-out);
}

/* ❌ 不推荐：影响性能的动画属性 */
.bad-animation {
  left: 100px;
  transition: left var(--duration-300) var(--ease-out);
}
```

---

这份设计系统规范提供了完整的视觉和交互设计标准，确保WBS导航界面在不同设备和使用场景下都能提供一致、高质量的用户体验。开发团队可以基于这些规范实现设计与开发的无缝协作。