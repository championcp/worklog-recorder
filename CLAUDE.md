# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Nobody Logger 是一个现代化的工作日志记录与项目管理系统，基于 Next.js 14、TypeScript 和 SQLite 构建。系统支持分层的WBS（工作分解结构）任务管理，包含6个层级：年度、半年度、季度、月度、周度和日度。

## 开发指导

### 开发流程

- 开始编码前,先编写必要的文档,然后再写代码,代码编写完毕后需要经过测试并编写必要的初始化脚本.
- 所有特性的开发都需要使用pull request模式，开发完成后，需要先提交到本地分支，然后通过pull request的方式提交到主分支(claude-code分支)，由项目维护者进行代码审查和合并。
- 在提交代码之前，需要先提交文档，然后提交代码，最后提交测试用例。

## 常用开发命令

### 开发环境

```bash
npm run dev                 # 启动开发服务器
npm run build              # 构建生产版本
npm run start              # 启动生产服务器
```

### 测试相关

```bash
npm test                   # 运行所有测试
npm run test:watch         # 监听模式运行测试
npm run test:coverage      # 运行测试并生成覆盖率报告
npm run test:ci            # CI模式运行测试
npm run test:client        # 仅运行客户端测试
npm run test:server        # 仅运行服务端测试
```

### 数据库操作

```bash
npm run db:migrate         # 运行数据库迁移
npm run db:seed            # 初始化数据库数据
```

### 测试命令分类

- **单元测试**: `src/` 目录下的组件和服务测试
- **集成测试**: `tests/integration/` 目录下的API和数据库测试
- **端到端测试**: `tests/e2e/` 目录下的完整业务流程测试，端到端测试使用mcp从界面验证

## 技术架构概览

### 技术栈

- **前端**: Next.js 14 (App Router)、TypeScript、Tailwind CSS、Ant Design
- **后端**: Next.js API Routes、SQLite + better-sqlite3
- **认证**: JWT + bcryptjs
- **测试**: Jest、React Testing Library
- **图表**: Recharts、React Calendar Heatmap

### 目录结构

- `src/app/` - Next.js App Router 页面和API路由
- `src/components/` - 可复用React组件
- `src/lib/` - 核心业务逻辑和服务
- `src/types/` - TypeScript类型定义
- `src/hooks/` - 自定义React Hooks
- `data/` - SQLite数据库文件
- `tests/` - 按类型组织的测试文件
- `docs/` - 按Sprint组织的项目文档

### 核心服务类

- **WBSTaskService** (`src/lib/services/WBSTaskService.ts`) - WBS任务CRUD操作
- **AuthService** (`src/lib/auth/AuthService.ts`) - 用户认证逻辑
- **AnalyticsService** (`src/lib/services/AnalyticsService.ts`) - 数据分析和报告
- **Database Client** (`src/lib/db/client.ts`) - SQLite连接管理

### WBS任务层级结构

系统支持6层任务层级：

1. **年度计划** (level 0) - 年度规划
2. **半年目标** (level 1) - 半年度目标
3. **季度任务** (level 2) - 季度目标
4. **月度里程碑** (level 3) - 月度里程碑
5. **周度任务** (level 4) - 周度任务
6. **日常活动** (level 5) - 日常工作

任务使用邻接表模型和WBS编码（1.2.3.4）来表示层级关系。

## 数据库架构

### 核心数据表

- `users` - 用户认证和档案
- `projects` - 顶级项目容器
- `wbs_tasks` - 支持父子关系的分层任务结构
- `time_logs` - 时间跟踪记录
- `categories` - 工作分类系统
- `tags` - 灵活的任务标签

### 关键关系

- 项目属于用户 (1:N)
- WBS任务属于项目并支持自引用层级关系
- 时间日志跟踪特定任务的时间花费
- 任务可以有多个分类和标签 (M:N)

## Sprint开发历程

项目通过5个Sprint使用多代理协作模式开发：

- **Sprint 1**: 认证系统和基础架构
- **Sprint 2**: WBS任务管理系统
- **Sprint 3**: 时间跟踪和日志记录
- **Sprint 4**: 搜索、分类和用户设置
- **Sprint 5**: 分析仪表板和团队协作

## 测试策略

### 测试配置

- Jest配置多项目模式（客户端/服务端）
- 客户端测试使用jsdom环境
- 服务端测试使用Node.js环境
- 系统启动在3000端口
- 代码覆盖率目标：88%+

### 测试文件模式

- `**/__tests__/**/*.test.{js,ts,tsx}` - 单元测试
- `tests/integration/**/*.test.ts` - 集成测试
- `tests/e2e/**/*.spec.ts` - 端到端测试

### Mock配置

- 静态资源通过 `__mocks__/fileMock.js` 模拟
- CSS模块使用 `identity-obj-proxy`
- API端点在测试设置文件中模拟

## 核心功能理解

### WBS任务管理

- 支持无限深度的分层任务结构
- WBS编码自动生成（1, 1.1, 1.1.1等）
- 进度计算向上冒泡到父任务
- 软删除和同步版本控制

### 时间跟踪

- 手动时间录入和自动计时器
- 时间日志关联到具体任务
- 日/周/月度时间聚合
- 效率分析和可视化

### 分析仪表板

- 使用react-grid-layout的可定制化部件系统
- Recharts实现时间分析图表
- 效率可视化和热力图
- 报告生成和导出功能

### 同步系统

- 乐观更新和回滚能力
- 冲突检测和解决
- 所有实体的版本跟踪

## 重要代码模式

### API路由结构

```typescript
// app/api/[resource]/route.ts
export async function GET(request: NextRequest) {
  // 1. 认证检查
  // 2. 输入验证
  // 3. 通过服务类处理业务逻辑
  // 4. 统一JSON响应格式
}
```

### 服务层模式

服务类处理业务逻辑和数据库操作，保持API路由的简洁。

### 错误处理

- 在API路由中使用try-catch块
- 返回一致的错误响应格式
- 记录错误便于调试

### 数据库事务

关键操作使用SQLite事务确保数据一致性，特别是WBS层级操作。

## 开发指南

### 代码风格

- 使用TypeScript严格模式
- 遵循Next.js App Router约定
- 优先使用组合而非继承
- 使用 `@/` 前缀的绝对导入

### 组件结构

- 页面组件放在 `src/app/`
- 可复用组件放在 `src/components/`
- 业务逻辑在服务类中
- 类型定义在 `src/types/`

### 测试要求

- 为新的服务方法编写测试
- 使用集成测试覆盖API端点
- 使用E2E测试覆盖关键用户工作流
- 维持88%+的代码覆盖率

### 数据库操作

- 始终使用预编译语句确保安全性
- 对用户数据实施软删除
- 数据变更时更新sync_version
- 使用适当的索引优化性能
