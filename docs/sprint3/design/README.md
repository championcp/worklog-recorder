# Sprint 3 设计系统文档
## Nobody Logger - 时间跟踪系统设计规范

**版本**: 1.0  
**日期**: 2025年8月5日  
**设计师**: Multi-Agent Development Team  
**开发团队**: Multi-Agent Development Team

---

## 1. 设计系统概览

### 1.1 设计原则
- **一致性**: 与现有Nobody Logger设计语言保持一致
- **易用性**: 时间跟踪操作简单直观，减少用户认知负担
- **效率**: 快速记录时间，最少化操作步骤
- **可访问性**: 支持键盘导航和屏幕阅读器
- **响应式**: 适配桌面和移动设备

### 1.2 设计目标
- 无缝集成到现有Dashboard界面
- 提供清晰的时间跟踪状态反馈
- 支持快速启动和停止计时器
- 简化手动时间录入流程

---

## 2. 视觉设计规范

### 2.1 颜色系统

#### 2.1.1 时间跟踪专用色彩
```css
/* 计时器相关颜色 */
--timer-active: #10b981;      /* 绿色 - 活跃计时器 */
--timer-inactive: #6b7280;    /* 灰色 - 非活跃状态 */
--timer-warning: #f59e0b;     /* 黄色 - 警告状态 */
--timer-danger: #ef4444;      /* 红色 - 错误状态 */

/* 时间记录类型颜色 */
--manual-entry: #3b82f6;      /* 蓝色 - 手动录入 */
--timer-entry: #10b981;       /* 绿色 - 计时器记录 */

/* 背景色 */
--time-card-bg: #ffffff;      /* 时间卡片背景 */
--active-timer-bg: #f0fdf4;   /* 活跃计时器背景 */
--form-section-bg: #f9fafb;   /* 表单区域背景 */
```

#### 2.1.2 状态颜色映射
- **成功状态**: `--timer-active` (#10b981)
- **进行中状态**: `--timer-active` (#10b981) 
- **警告状态**: `--timer-warning` (#f59e0b)
- **错误状态**: `--timer-danger` (#ef4444)
- **中性状态**: `--timer-inactive` (#6b7280)

### 2.2 字体系统

#### 2.2.1 字体层级
```css
/* 时间显示字体 */
.timer-display {
  font-family: 'SF Mono', 'Monaco', monospace;
  font-size: 2.5rem;        /* 40px */
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.05em;
}

/* 小型时间显示 */
.timer-display-small {
  font-family: 'SF Mono', 'Monaco', monospace;
  font-size: 1.25rem;       /* 20px */
  font-weight: 500;
  line-height: 1.4;
}

/* 标题字体 */
.time-section-title {
  font-size: 1.5rem;        /* 24px */
  font-weight: 700;
  line-height: 1.3;
  color: var(--gray-800);
}

/* 表单标签 */
.time-form-label {
  font-size: 0.875rem;      /* 14px */
  font-weight: 500;
  line-height: 1.4;
  color: var(--gray-700);
}

/* 辅助文本 */
.time-helper-text {
  font-size: 0.75rem;       /* 12px */
  font-weight: 400;
  line-height: 1.4;
  color: var(--gray-500);
}
```

### 2.3 间距系统

#### 2.3.1 时间跟踪专用间距
```css
/* 时间跟踪组件间距 */
--time-component-gap: 1.5rem;      /* 24px - 组件间距 */
--time-section-gap: 2rem;          /* 32px - 区域间距 */
--time-card-padding: 1.5rem;       /* 24px - 卡片内边距 */
--time-form-gap: 1rem;             /* 16px - 表单元素间距 */
--time-button-gap: 0.75rem;        /* 12px - 按钮间距 */
```

---

## 3. 组件设计规范

### 3.1 TimeEntryForm 主组件

#### 3.1.1 整体布局
```
┌─────────────────────────────────────────────────────────────┐
│                        时间记录                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─ 活跃计时器区域（如果有活跃计时器） ─────────────────────┐  │
│  │  🟢 正在计时: 前端开发 - React组件开发                  │  │
│  │  ⏱️  02:15:30                                          │  │
│  │  📝 描述: 开发TimeEntryForm组件                        │  │
│  │  [停止计时]                                             │  │
│  └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─ 项目任务选择区域 ─────────────────────────────────────┐  │
│  │  项目: [下拉选择: Nobody Logger ▼]                     │  │
│  │  任务: [下拉选择: 时间跟踪功能开发 ▼]                   │  │
│  └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─ 快速计时器区域 ──────────────────────────────────────┐  │
│  │  工作描述: [___________________________]               │  │
│  │  [开始计时] [取消]                                      │  │
│  └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─ 手动时间录入区域 ────────────────────────────────────┐  │
│  │  日期: [2025-08-05 ▼]  开始: [09:00] 结束: [11:30]    │  │
│  │  描述: [_________________________________]             │  │
│  │       [_________________________________]             │  │
│  │  [保存记录] [重置]                                      │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### 3.1.2 组件尺寸规范
```css
.time-entry-form {
  max-width: 800px;
  margin: 0 auto;
  background: var(--time-card-bg);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: var(--time-card-padding);
}

.time-section {
  margin-bottom: var(--time-section-gap);
  padding: 1rem;
  background: var(--form-section-bg);
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.time-section:last-child {
  margin-bottom: 0;
}
```

### 3.2 活跃计时器组件

#### 3.2.1 设计规格
```css
.active-timer-display {
  background: var(--active-timer-bg);
  border: 2px solid var(--timer-active);
  border-radius: 0.5rem;
  padding: 1.5rem;
  position: relative;
}

.active-timer-display::before {
  content: '';
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 8px;
  height: 8px;
  background: var(--timer-active);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.timer-main-display {
  font-family: 'SF Mono', monospace;
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--timer-active);
  text-align: center;
  margin: 1rem 0;
}

.timer-context-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.timer-project-name {
  font-weight: 600;
  color: var(--gray-800);
}

.timer-task-name {
  color: var(--gray-600);
}

.timer-description {
  font-size: 0.875rem;
  color: var(--gray-600);
  font-style: italic;
  margin-bottom: 1rem;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

#### 3.2.2 状态指示器
```css
/* 计时器状态点 */
.timer-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 0.5rem;
}

.timer-status-dot.active {
  background: var(--timer-active);
  animation: pulse 2s infinite;
}

.timer-status-dot.paused {
  background: var(--timer-warning);
}

.timer-status-dot.stopped {
  background: var(--timer-inactive);
}
```

### 3.3 项目任务选择器

#### 3.3.1 下拉选择器设计
```css
.project-task-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: var(--time-form-gap);
}

@media (max-width: 640px) {
  .project-task-selector {
    grid-template-columns: 1fr;
  }
}

.task-select-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  color: var(--gray-700);
}

.task-wbs-code {
  font-family: monospace;
  font-size: 0.75rem;
  background: var(--gray-100);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  color: var(--gray-600);
}

.task-name {
  flex: 1;
  font-weight: 500;
}
```

### 3.4 按钮设计规范

#### 3.4.1 主要按钮样式
```css
/* 开始计时按钮 */
.btn-start-timer {
  background: var(--timer-active);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-start-timer:hover {
  background: #059669; /* darker green */
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.btn-start-timer:disabled {
  background: var(--timer-inactive);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 停止计时按钮 */
.btn-stop-timer {
  background: var(--timer-danger);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-stop-timer:hover {
  background: #dc2626; /* darker red */
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

/* 保存记录按钮 */
.btn-save-manual {
  background: var(--manual-entry);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save-manual:hover {
  background: #2563eb; /* darker blue */
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}
```

#### 3.4.2 按钮图标规范
```css
.btn-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* 图标映射 */
.btn-start-timer .btn-icon::before { content: '▶️'; }
.btn-stop-timer .btn-icon::before { content: '⏹️'; }
.btn-save-manual .btn-icon::before { content: '💾'; }
.btn-reset .btn-icon::before { content: '🔄'; }
```

### 3.5 表单输入组件

#### 3.5.1 输入框设计
```css
.time-form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;
}

.time-form-input:focus {
  outline: none;
  border-color: var(--timer-active);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.time-form-input:invalid {
  border-color: var(--timer-danger);
}

.time-form-input:invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* 时间输入框 */
.time-input {
  font-family: 'SF Mono', monospace;
  font-size: 1rem;
  text-align: center;
  width: 120px;
}

/* 日期输入框 */
.date-input {
  width: 140px;
}
```

#### 3.5.2 标签和帮助文本
```css
.time-form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-700);
}

.time-form-label.required::after {
  content: ' *';
  color: var(--timer-danger);
}

.time-help-text {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
}

.time-error-text {
  font-size: 0.75rem;
  color: var(--timer-danger);
  margin-top: 0.25rem;
}
```

---

## 4. 交互设计规范

### 4.1 微交互设计

#### 4.1.1 计时器动画
```css
/* 计时器启动动画 */
@keyframes timerStart {
  0% {
    transform: scale(1);
    background: var(--form-section-bg);
  }
  50% {
    transform: scale(1.02);
    background: var(--active-timer-bg);
  }
  100% {
    transform: scale(1);
    background: var(--active-timer-bg);
  }
}

.timer-starting {
  animation: timerStart 0.6s ease-out;
}

/* 计时器停止动画 */
@keyframes timerStop {
  0% {
    background: var(--active-timer-bg);
    border-color: var(--timer-active);
  }
  100% {
    background: var(--form-section-bg);
    border-color: #e5e7eb;
  }
}

.timer-stopping {
  animation: timerStop 0.4s ease-out;
}
```

#### 4.1.2 按钮反馈动画
```css
/* 按钮点击反馈 */
@keyframes buttonPress {
  0% { transform: translateY(0); }
  50% { transform: translateY(2px); }
  100% { transform: translateY(0); }
}

.btn-pressed {
  animation: buttonPress 0.15s ease;
}

/* 成功保存动画 */
@keyframes saveSuccess {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.save-success {
  animation: saveSuccess 0.3s ease;
}
```

### 4.2 状态转换设计

#### 4.2.1 计时器状态转换
```
非活跃状态 ──[开始计时]──> 活跃状态 ──[停止计时]──> 保存状态 ──> 非活跃状态
     │                        │
     │                        │
     └──[选择任务]──> 准备状态 ──┘
```

#### 4.2.2 表单状态管理
```css
/* 表单状态样式 */
.form-loading {
  opacity: 0.6;
  pointer-events: none;
  position: relative;
}

.form-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid var(--timer-active);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 4.3 响应式设计

#### 4.3.1 移动端适配
```css
/* 移动端样式 */
@media (max-width: 640px) {
  .time-entry-form {
    margin: 0;
    border-radius: 0;
    padding: 1rem;
  }
  
  .timer-main-display {
    font-size: 2rem;
  }
  
  .project-task-selector {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .time-form-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .time-form-actions button {
    width: 100%;
  }
}

/* 平板端样式 */
@media (min-width: 641px) and (max-width: 1024px) {
  .time-entry-form {
    max-width: 90%;
  }
  
  .project-task-selector {
    grid-template-columns: 1fr 1fr;
  }
}
```

#### 4.3.2 触摸设备优化
```css
/* 触摸目标尺寸 */
@media (hover: none) and (pointer: coarse) {
  .btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0.875rem 1.5rem;
  }
  
  .time-form-input {
    min-height: 44px;
    padding: 0.875rem;
    font-size: 1rem;
  }
  
  select.time-form-input {
    min-height: 48px;
  }
}
```

---

## 5. 可访问性设计

### 5.1 ARIA标签规范

```html
<!-- 活跃计时器区域 -->
<div 
  class="active-timer-display" 
  role="timer" 
  aria-label="活跃计时器"
  aria-live="polite"
>
  <div aria-label="计时时间">02:15:30</div>
  <button 
    class="btn-stop-timer"
    aria-label="停止当前计时器"
  >
    停止计时
  </button>
</div>

<!-- 表单区域 -->
<form role="form" aria-label="时间记录表单">
  <div class="form-group">
    <label for="project-select" class="time-form-label">
      项目 <span aria-label="必填" class="required">*</span>
    </label>
    <select 
      id="project-select"
      aria-describedby="project-help"
      required
    >
      <option value="">请选择项目</option>
    </select>
    <div id="project-help" class="time-help-text">
      选择要记录时间的项目
    </div>
  </div>
</form>
```

### 5.2 键盘导航

```css
/* 焦点样式 */
.time-form-input:focus,
.btn:focus {
  outline: 2px solid var(--timer-active);
  outline-offset: 2px;
}

/* 跳过链接 */
.skip-to-timer {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--timer-active);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-to-timer:focus {
  top: 6px;
}
```

### 5.3 屏幕阅读器支持

```html
<!-- 实时更新通知 -->
<div 
  id="timer-announcements" 
  aria-live="polite" 
  aria-atomic="true"
  class="sr-only"
>
  <!-- 动态内容，如"计时器已启动"、"时间记录已保存" -->
</div>

<!-- 视觉隐藏的辅助文本 -->
<span class="sr-only">
  当前计时时间为2小时15分30秒，正在为前端开发任务计时
</span>
```

---

## 6. 动画和过渡效果

### 6.1 页面过渡动画

```css
/* 组件进入动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.time-section {
  animation: slideIn 0.3s ease-out;
}

/* 组件退出动画 */
@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.time-section.exiting {
  animation: slideOut 0.3s ease-out;
}
```

### 6.2 数据加载动画

```css
/* 加载骨架屏 */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-timer {
  height: 3rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.skeleton-input {
  height: 2.5rem;
  border-radius: 0.375rem;
  margin: 0.5rem 0;
}
```

---

## 7. 错误状态设计

### 7.1 错误消息样式

```css
.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message::before {
  content: '⚠️';
  flex-shrink: 0;
}

.success-message {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.success-message::before {
  content: '✅';
  flex-shrink: 0;
}
```

### 7.2 表单验证视觉反馈

```css
.form-field.error .time-form-input {
  border-color: var(--timer-danger);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-field.success .time-form-input {
  border-color: var(--timer-active);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.form-field.error .time-form-label {
  color: var(--timer-danger);
}
```

---

## 8. 设计规范检查表

### 8.1 视觉设计检查项
- [ ] 颜色对比度符合WCAG 2.1 AA标准
- [ ] 字体大小在移动设备上不小于16px
- [ ] 触摸目标不小于44px × 44px
- [ ] 重要信息不仅依赖颜色传达
- [ ] 所有交互元素有明确的悬停和焦点状态

### 8.2 交互设计检查项
- [ ] 计时器状态变化有清晰的视觉反馈
- [ ] 表单提交有加载状态指示
- [ ] 错误消息具体且可操作
- [ ] 成功操作有确认反馈
- [ ] 键盘用户可以完成所有操作

### 8.3 响应式设计检查项
- [ ] 320px宽度下界面可用
- [ ] 平板设备布局合理
- [ ] 大屏幕设备内容不过度拉伸
- [ ] 图片和图标在高DPI设备上清晰
- [ ] 触摸和鼠标交互都支持

---

## 9. 设计资源和工具

### 9.1 设计文件
- Figma设计稿: [时间跟踪系统设计]
- 图标库: Heroicons, Lucide React
- 字体: Inter (UI), SF Mono (代码/时间显示)

### 9.2 代码实现工具
- CSS框架: Tailwind CSS
- 组件库: Headless UI
- 动画库: Framer Motion (可选)
- 表单库: React Hook Form

### 9.3 测试工具
- 可访问性测试: axe DevTools
- 响应式测试: Chrome DevTools
- 性能测试: Lighthouse
- 跨浏览器测试: BrowserStack

---

**文档状态**: 已完成  
**最后更新**: 2025年8月5日  
**相关文档**: 
- [组件规格文档](./component-specifications.md)
- [界面设计指南](./interface-design-guidelines.md)
- [UX流程文档](./ux-flow-documentation.md)