# Sprint 3 界面设计指南
## Nobody Logger - 时间跟踪系统界面规范

**版本**: 1.0  
**日期**: 2025年8月5日  
**设计师**: Multi-Agent Development Team

---

## 1. 界面设计原则

### 1.1 核心设计原则
- **效率优先**: 最少化用户操作，快速完成时间记录
- **状态清晰**: 计时器状态一目了然，减少用户困惑
- **反馈及时**: 所有操作提供即时的视觉反馈
- **信息层级**: 重要信息突出显示，次要信息适当弱化

### 1.2 用户体验目标
- 新用户5分钟内掌握基本操作
- 开始计时只需2次点击
- 计时器状态随时可见
- 错误状态清晰可恢复

---

## 2. 布局设计规范

### 2.1 整体布局结构
```
页面容器 (max-width: 800px, 居中)
├── 页面标题区域
├── 活跃计时器区域 (条件显示)
├── 项目任务选择区域
├── 快速计时器区域
└── 手动录入区域
```

### 2.2 网格系统
- 基础网格: 12列网格系统
- 间距单位: 4px的倍数 (4, 8, 12, 16, 24, 32...)
- 断点设置:
  - 移动端: < 640px
  - 平板端: 640px - 1024px  
  - 桌面端: > 1024px

---

## 3. 视觉层次设计

### 3.1 信息优先级
**P0 (最高优先级)**:
- 活跃计时器状态和时间显示
- 项目任务选择错误提示

**P1 (高优先级)**:
- 开始/停止计时按钮
- 必填表单字段

**P2 (中等优先级)**:
- 工作描述输入
- 手动录入表单

**P3 (低优先级)**:
- 帮助文本
- 字符计数器

### 3.2 视觉权重分配
```css
/* 活跃计时器 - 最高权重 */
.active-timer {
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--timer-active);
  background: var(--active-timer-bg);
  border: 2px solid var(--timer-active);
}

/* 主要按钮 - 高权重 */
.btn-primary {
  font-size: 1rem;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
}

/* 表单标签 - 中等权重 */
.form-label {
  font-size: 0.875rem;
  font-weight: 500;
}

/* 辅助文本 - 低权重 */
.help-text {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--gray-500);
}
```

---

## 4. 交互状态设计

### 4.1 按钮状态规范
```css
/* 默认状态 */
.btn {
  transition: all 0.2s ease;
}

/* 悬停状态 */
.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 激活状态 */
.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 禁用状态 */
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

### 4.2 表单输入状态
```css
/* 正常状态 */
.form-input {
  border: 1px solid #d1d5db;
}

/* 焦点状态 */
.form-input:focus {
  border-color: var(--timer-active);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* 错误状态 */
.form-input.error {
  border-color: var(--timer-danger);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* 成功状态 */
.form-input.success {
  border-color: var(--timer-active);
}
```

---

## 5. 响应式设计规范

### 5.1 移动端优化 (< 640px)
- 单列布局
- 按钮全宽显示
- 字体大小适当增大
- 触摸目标最小44px

### 5.2 平板端适配 (640px - 1024px)
- 两列布局
- 保持桌面端功能
- 优化触摸交互

### 5.3 桌面端优化 (> 1024px)
- 最大宽度限制避免过度拉伸
- 鼠标悬停效果
- 键盘快捷键支持

---

## 6. 错误处理界面

### 6.1 错误消息设计
- 位置: 表单字段下方或操作按钮上方
- 样式: 红色背景，白色文字，圆角边框
- 内容: 具体可操作的错误描述

### 6.2 成功反馈设计
- 位置: 操作完成后的明显位置
- 样式: 绿色背景，白色文字
- 持续时间: 3-5秒自动消失

---

**文档状态**: 已完成  
**最后更新**: 2025年8月5日