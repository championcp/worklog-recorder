# Nobody Logger 技术架构文档

## 1. 系统架构概览

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    用户界面层 (UI Layer)                      │
├─────────────────────────────────────────────────────────────┤
│  Mac浏览器        │  iPhone浏览器     │  PWA应用            │
│  (桌面端)         │  (移动端)         │  (离线支持)          │
└─────────────────┬───────────────────┬───────────────────────┘
                  │                   │
┌─────────────────┴───────────────────┴───────────────────────┐
│                 前端应用层 (Frontend)                        │
├─────────────────────────────────────────────────────────────┤
│  Next.js 14 (App Router) + TypeScript + Tailwind CSS      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 组件层      │ │ 状态管理    │ │ 服务层      │           │
│  │ (Components)│ │ (Zustand)   │ │ (API Client)│           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP/WebSocket
┌─────────────────┴───────────────────────────────────────────┐
│                  API网关层 (API Gateway)                     │
├─────────────────────────────────────────────────────────────┤
│  路由管理 │ 认证授权 │ 限流控制 │ 数据验证 │ 错误处理        │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────────┐
│                 业务逻辑层 (Business Layer)                  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │WBS任务管理  │ │时间记录服务 │ │报告生成服务 │ │同步服务 │ │
│ │TaskService  │ │TimeService  │ │ReportService│ │SyncSvc  │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────────┐
│                 数据访问层 (Data Access Layer)               │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │DAO模式      │ │事务管理     │ │缓存层       │ │数据验证 │ │
│ │Repository   │ │Transactions │ │Redis/Memory │ │Validator│ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────────┐
│                    数据存储层 (Storage)                      │
├─────────────────────────────────────────────────────────────┤
│  SQLite (主数据库) │ LocalStorage (缓存) │ IndexedDB (离线)  │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────────┐
│                    基础设施层 (Infrastructure)               │
├─────────────────────────────────────────────────────────────┤
│  文件系统 │ 网络通信 │ 定时任务 │ 日志系统 │ 监控告警        │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选择

**前端技术栈**
- **Next.js 14**: App Router + 服务端渲染 + 静态生成
- **TypeScript**: 类型安全 + 开发效率
- **Tailwind CSS**: 原子化CSS + 响应式设计
- **Zustand**: 轻量级状态管理
- **React Query**: 数据获取 + 缓存管理

**后端技术栈**
- **Next.js API Routes**: 全栈框架 + 统一部署
- **SQLite**: 嵌入式数据库 + 零配置
- **Prisma**: ORM + 数据库迁移
- **NextAuth.js**: 认证授权
- **WebSocket**: 实时数据同步

## 2. 前端架构设计

### 2.1 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证相关页面
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/                # 仪表板
│   ├── projects/                 # 项目管理
│   │   └── [id]/
│   │       ├── wbs/             # WBS层级管理
│   │       ├── time-logs/       # 时间记录
│   │       └── reports/         # 报告管理
│   ├── settings/                # 用户设置
│   ├── api/                     # API路由
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── wbs-tasks/
│   │   ├── time-logs/
│   │   └── sync/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # 可复用组件
│   ├── ui/                      # 基础UI组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts
│   ├── wbs/                     # WBS专用组件
│   │   ├── WBSTree.tsx
│   │   ├── TaskCard.tsx
│   │   ├── LevelNavigator.tsx
│   │   └── TaskEditor.tsx
│   ├── charts/                  # 图表组件
│   │   ├── GanttChart.tsx
│   │   ├── TimeChart.tsx
│   │   └── ProgressChart.tsx
│   └── layout/                  # 布局组件
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── MobileNav.tsx
├── hooks/                       # 自定义Hooks
│   ├── useWBSData.ts
│   ├── useTimeTracker.ts
│   ├── useSync.ts
│   └── useLocalStorage.ts
├── lib/                         # 工具库
│   ├── db/                      # 数据库相关
│   │   ├── schema.ts
│   │   ├── client.ts
│   │   └── migrations/
│   ├── api/                     # API客户端
│   │   ├── client.ts
│   │   ├── types.ts
│   │   └── endpoints/
│   ├── utils/                   # 工具函数
│   │   ├── date.ts
│   │   ├── wbs.ts
│   │   └── validation.ts
│   └── constants/
│       ├── routes.ts
│       └── config.ts
├── stores/                      # Zustand状态管理
│   ├── authStore.ts
│   ├── wbsStore.ts
│   ├── timeLogStore.ts
│   └── syncStore.ts
├── types/                       # TypeScript类型定义
│   ├── auth.ts
│   ├── wbs.ts
│   ├── timeLog.ts
│   └── api.ts
└── middleware.ts                # Next.js中间件
```

### 2.2 组件架构设计

**分层组件设计**
```typescript
// 页面层 (Page Level)
export default function WBSPage({ params }: { params: { id: string } }) {
  return (
    <WBSProvider projectId={params.id}>
      <DashboardLayout>
        <WBSContainer />
      </DashboardLayout>
    </WBSProvider>
  );
}

// 容器层 (Container Level)
function WBSContainer() {
  const { wbsData, loading } = useWBSData();
  
  return (
    <div className="wbs-container">
      <WBSHeader />
      <WBSNavigation />
      <WBSContent data={wbsData} loading={loading} />
    </div>
  );
}

// 业务组件层 (Business Component Level)
function WBSContent({ data, loading }: WBSContentProps) {
  if (loading) return <WBSSkeletonLoader />;
  
  return (
    <div className="wbs-content">
      <WBSTree data={data.tree} />
      <TaskDetailPanel />
    </div>
  );
}

// UI组件层 (UI Component Level)
function WBSTree({ data }: WBSTreeProps) {
  return (
    <div className="wbs-tree">
      {data.map(node => (
        <WBSNode key={node.id} node={node} />
      ))}
    </div>
  );
}
```

### 2.3 状态管理设计

**Zustand状态结构**
```typescript
// stores/wbsStore.ts
interface WBSState {
  // 数据状态
  projects: Project[];
  currentProject: Project | null;
  wbsTree: WBSNode[];
  selectedTask: WBSTask | null;
  
  // UI状态
  expandedNodes: Set<string>;
  selectedLevel: WBSLevel;
  viewMode: 'tree' | 'list' | 'gantt';
  
  // 加载状态
  loading: {
    projects: boolean;
    wbsTree: boolean;
    taskDetail: boolean;
  };
  
  // 操作方法
  setCurrentProject: (project: Project) => void;
  loadWBSTree: (projectId: string) => Promise<void>;
  createTask: (task: CreateTaskInput) => Promise<WBSTask>;
  updateTask: (id: string, updates: Partial<WBSTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, newParentId: string) => Promise<void>;
  
  // 导航方法
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  selectTask: (task: WBSTask) => void;
  navigateToLevel: (level: WBSLevel) => void;
}
```

### 2.4 路由设计

**App Router结构**
```typescript
// app/layout.tsx - 根布局
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <SyncProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </SyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

// 受保护的路由中间件
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

## 3. 后端架构设计

### 3.1 API层设计

**Next.js API Routes结构**
```typescript
// app/api/projects/[id]/wbs-tasks/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const projectId = params.id;
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const parentId = searchParams.get('parentId');
    
    const tasks = await wbsTaskService.findByProject(projectId, {
      level: level as WBSLevel,
      parentId,
      userId: session.user.id
    });
    
    return NextResponse.json({
      success: true,
      data: tasks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### 3.2 业务逻辑层设计

**服务层架构**
```typescript
// lib/services/wbsTaskService.ts
export class WBSTaskService {
  constructor(private db: DatabaseClient) {}
  
  async findByProject(projectId: string, filters: WBSTaskFilters): Promise<WBSTask[]> {
    const query = this.db.wbsTasks.findMany({
      where: {
        projectId,
        ...this.buildWhereClause(filters),
        isDeleted: false
      },
      include: {
        children: true,
        parent: true,
        categories: true,
        tags: true,
        timeLogs: {
          where: { isDeleted: false }
        }
      },
      orderBy: [
        { level: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
    return this.transformToWBSTree(await query);
  }
  
  async create(input: CreateWBSTaskInput): Promise<WBSTask> {
    return this.db.$transaction(async (tx) => {
      // 1. 生成WBS编码
      const wbsCode = await this.generateWBSCode(input.parentId, tx);
      
      // 2. 创建任务
      const task = await tx.wbsTasks.create({
        data: {
          ...input,
          wbsCode,
          syncVersion: 1,
          lastSyncAt: new Date()
        }
      });
      
      // 3. 更新父任务进度
      if (input.parentId) {
        await this.updateParentProgress(input.parentId, tx);
      }
      
      return task;
    });
  }
  
  private async generateWBSCode(parentId: string | null, tx: DatabaseTransaction): Promise<string> {
    if (!parentId) {
      // 根任务
      const maxCode = await tx.wbsTasks.findFirst({
        where: { parentId: null },
        orderBy: { wbsCode: 'desc' }
      });
      const nextNumber = maxCode ? parseInt(maxCode.wbsCode) + 1 : 1;
      return nextNumber.toString();
    }
    
    // 子任务
    const parent = await tx.wbsTasks.findUnique({
      where: { id: parentId }
    });
    
    const siblingMaxCode = await tx.wbsTasks.findFirst({
      where: { parentId },
      orderBy: { wbsCode: 'desc' }
    });
    
    const parentCode = parent!.wbsCode;
    const nextSubNumber = siblingMaxCode 
      ? parseInt(siblingMaxCode.wbsCode.split('.').pop()!) + 1 
      : 1;
      
    return `${parentCode}.${nextSubNumber}`;
  }
}
```

### 3.3 数据访问层设计

**Repository模式**
```typescript
// lib/repositories/baseRepository.ts
export abstract class BaseRepository<T extends { id: string }> {
  constructor(protected db: DatabaseClient) {}
  
  async findById(id: string): Promise<T | null> {
    return this.db[this.tableName].findUnique({
      where: { id, isDeleted: false }
    });
  }
  
  async findMany(filters: Record<string, any>): Promise<T[]> {
    return this.db[this.tableName].findMany({
      where: { ...filters, isDeleted: false }
    });
  }
  
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    return this.db[this.tableName].create({
      data: {
        ...data,
        syncVersion: 1,
        lastSyncAt: new Date()
      }
    });
  }
  
  async update(id: string, data: Partial<T>): Promise<T> {
    return this.db[this.tableName].update({
      where: { id },
      data: {
        ...data,
        syncVersion: { increment: 1 },
        lastSyncAt: new Date()
      }
    });
  }
  
  async softDelete(id: string): Promise<void> {
    await this.db[this.tableName].update({
      where: { id },
      data: {
        isDeleted: true,
        syncVersion: { increment: 1 },
        lastSyncAt: new Date()
      }
    });
  }
  
  protected abstract get tableName(): string;
}
```

## 4. 数据流设计

### 4.1 用户操作数据流

```
用户操作 → UI组件事件 → Zustand Action → API调用 → 业务服务 → 数据库 → 返回结果 → 更新状态 → UI重新渲染
```

**具体示例：创建任务**
```typescript
// 1. 用户点击创建任务按钮
const handleCreateTask = async (taskData: CreateTaskInput) => {
  // 2. UI显示加载状态
  setLoading(true);
  
  try {
    // 3. 调用Zustand action
    const newTask = await wbsStore.createTask(taskData);
    
    // 4. 成功后更新UI
    toast.success('任务创建成功');
    setSelectedTask(newTask);
  } catch (error) {
    // 5. 错误处理
    toast.error('任务创建失败');
    console.error(error);
  } finally {
    setLoading(false);
  }
};

// Zustand store中的createTask action
const createTask = async (taskData: CreateTaskInput) => {
  // 乐观更新：先更新UI状态
  const optimisticTask = { ...taskData, id: 'temp-' + Date.now() };
  set(state => ({
    wbsTree: addTaskToTree(state.wbsTree, optimisticTask)
  }));
  
  try {
    // API调用
    const response = await apiClient.post('/api/wbs-tasks', taskData);
    const newTask = response.data;
    
    // 用真实数据替换乐观更新的数据
    set(state => ({
      wbsTree: replaceTaskInTree(state.wbsTree, optimisticTask.id, newTask)
    }));
    
    return newTask;
  } catch (error) {
    // 回滚乐观更新
    set(state => ({
      wbsTree: removeTaskFromTree(state.wbsTree, optimisticTask.id)
    }));
    throw error;
  }
};
```

### 4.2 数据同步流程

```
本地操作 → 标记为待同步 → 后台同步服务 → 检查冲突 → 解决冲突 → 更新本地状态 → 通知UI
```

## 5. 关键技术决策

### 5.1 WBS层级数据处理

**决策：使用邻接表模型 + 路径枚举**

```typescript
// 邻接表模型：每个节点存储父节点ID
interface WBSTask {
  id: string;
  parentId: string | null;  // 邻接表关系
  wbsCode: string;          // 路径枚举：1.2.3.4
  level: number;            // 层级深度
  levelType: WBSLevel;      // 层级类型
}

// 树形数据转换
function buildWBSTree(flatTasks: WBSTask[]): WBSTreeNode[] {
  const taskMap = new Map<string, WBSTreeNode>();
  const rootNodes: WBSTreeNode[] = [];
  
  // 第一遍：创建所有节点
  flatTasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [] });
  });
  
  // 第二遍：建立父子关系
  flatTasks.forEach(task => {
    const node = taskMap.get(task.id)!;
    
    if (task.parentId) {
      const parent = taskMap.get(task.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  });
  
  return rootNodes;
}
```

**优势**：
- 查询效率高（单表查询）
- 支持无限层级
- WBS编码便于排序和展示
- 便于数据同步

### 5.2 状态管理策略

**决策：Zustand + React Query组合**

```typescript
// Zustand负责本地UI状态
const useWBSStore = create<WBSState>((set, get) => ({
  // UI状态
  expandedNodes: new Set(),
  selectedTask: null,
  viewMode: 'tree',
  
  // 操作方法
  expandNode: (nodeId) => set(state => ({
    expandedNodes: new Set([...state.expandedNodes, nodeId])
  })),
}));

// React Query负责服务端状态
function useWBSTasks(projectId: string) {
  return useQuery({
    queryKey: ['wbs-tasks', projectId],
    queryFn: () => apiClient.getWBSTasks(projectId),
    staleTime: 5 * 60 * 1000, // 5分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
  });
}
```

### 5.3 跨设备同步策略

**决策：增量同步 + 冲突解决**

```typescript
interface SyncRecord {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, any>;
  version: number;
  timestamp: string;
  deviceId: string;
}

class SyncService {
  async sync(): Promise<SyncResult> {
    // 1. 获取本地待同步记录
    const localChanges = await this.getLocalChanges();
    
    // 2. 推送到服务端
    const pushResult = await this.pushChanges(localChanges);
    
    // 3. 拉取服务端变更
    const pullResult = await this.pullChanges();
    
    // 4. 解决冲突
    const conflicts = this.detectConflicts(pullResult);
    if (conflicts.length > 0) {
      await this.resolveConflicts(conflicts);
    }
    
    // 5. 应用变更到本地
    await this.applyChanges(pullResult);
    
    return { success: true, conflicts: conflicts.length };
  }
  
  private detectConflicts(remoteChanges: SyncRecord[]): Conflict[] {
    const conflicts: Conflict[] = [];
    
    remoteChanges.forEach(remote => {
      const local = this.getLocalRecord(remote.id);
      
      if (local && local.version !== remote.version - 1) {
        conflicts.push({
          recordId: remote.id,
          localVersion: local.version,
          remoteVersion: remote.version,
          localData: local.data,
          remoteData: remote.data
        });
      }
    });
    
    return conflicts;
  }
}
```

## 6. 性能优化策略

### 6.1 前端性能优化

**虚拟滚动**
```typescript
// 大量WBS节点的虚拟滚动
import { FixedSizeList as List } from 'react-window';

function VirtualWBSTree({ items }: { items: WBSTask[] }) {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <WBSTaskRow task={items[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={60}
      itemData={items}
    >
      {Row}
    </List>
  );
}
```

**懒加载和代码分割**
```typescript
// 路由级别的代码分割
const WBSPage = lazy(() => import('./WBSPage'));
const ReportsPage = lazy(() => import('./ReportsPage'));

// 组件级别的懒加载
function WBSTree({ rootNodes }: { rootNodes: WBSNode[] }) {
  const [loadedNodes, setLoadedNodes] = useState(new Set<string>());
  
  const loadChildren = async (nodeId: string) => {
    if (!loadedNodes.has(nodeId)) {
      const children = await apiClient.getWBSChildren(nodeId);
      // 更新状态...
      setLoadedNodes(prev => new Set([...prev, nodeId]));
    }
  };
  
  return (
    <div>
      {rootNodes.map(node => (
        <LazyWBSNode
          key={node.id}
          node={node}
          onExpand={() => loadChildren(node.id)}
        />
      ))}
    </div>
  );
}
```

### 6.2 数据库性能优化

**索引策略**
```sql
-- WBS查询优化索引
CREATE INDEX idx_wbs_tasks_project_level ON wbs_tasks(project_id, level, level_type);
CREATE INDEX idx_wbs_tasks_parent_sort ON wbs_tasks(parent_id, sort_order);
CREATE INDEX idx_wbs_tasks_wbs_code ON wbs_tasks(wbs_code);

-- 时间统计查询优化
CREATE INDEX idx_time_logs_task_date ON time_logs(task_id, log_date);
CREATE INDEX idx_time_logs_user_date_range ON time_logs(user_id, start_time, end_time);
```

**查询优化**
```typescript
// 批量加载避免N+1问题
async function loadWBSTreeWithStats(projectId: string): Promise<WBSTreeWithStats[]> {
  // 一次查询获取所有数据
  const [tasks, timeLogs, categories] = await Promise.all([
    db.wbsTasks.findMany({
      where: { projectId, isDeleted: false },
      orderBy: { wbsCode: 'asc' }
    }),
    db.timeLogs.findMany({
      where: { 
        task: { projectId },
        isDeleted: false 
      },
      select: {
        taskId: true,
        durationSeconds: true
      }
    }),
    db.taskCategories.findMany({
      where: { task: { projectId } },
      include: { category: true }
    })
  ]);
  
  // 内存中组装数据
  return buildTreeWithStats(tasks, timeLogs, categories);
}
```

## 7. 安全性设计

### 7.1 认证授权

```typescript
// JWT + Session双重认证
export async function authenticate(token: string): Promise<User | null> {
  try {
    // 验证JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // 检查Session
    const session = await db.sessions.findUnique({
      where: { 
        id: payload.sessionId,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });
    
    if (!session) {
      return null;
    }
    
    // 更新最后活动时间
    await db.sessions.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() }
    });
    
    return session.user;
  } catch (error) {
    return null;
  }
}

// 权限中间件
export function requireAuth(handler: NextApiHandler): NextApiHandler {
  return async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }
    
    const user = await authenticate(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    return handler(req, res);
  };
}
```

### 7.2 数据验证

```typescript
// 输入验证中间件
import { z } from 'zod';

const CreateTaskSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  level: z.enum(['yearly', 'half_yearly', 'quarterly', 'monthly', 'weekly', 'daily']),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  estimatedHours: z.number().min(0).optional()
});

export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (handler: (req: NextApiRequest & { body: T }, res: NextApiResponse) => Promise<void>) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        const validatedData = schema.parse(req.body);
        req.body = validatedData;
        return handler(req as any, res);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(422).json({
            error: 'Validation failed',
            details: error.errors
          });
        }
        throw error;
      }
    };
  };
}
```

## 8. 部署架构

### 8.1 部署策略

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/nobody-logger.db
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### 8.2 环境配置

```typescript
// lib/config.ts
interface Config {
  database: {
    url: string;
    maxConnections: number;
  };
  auth: {
    jwtSecret: string;
    sessionExpiry: number;
  };
  sync: {
    interval: number;
    batchSize: number;
  };
  upload: {
    maxSize: number;
    allowedTypes: string[];
  };
}

export const config: Config = {
  database: {
    url: process.env.DATABASE_URL || 'file:./data/dev.db',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10')
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    sessionExpiry: parseInt(process.env.SESSION_EXPIRY || '86400000') // 24小时
  },
  sync: {
    interval: parseInt(process.env.SYNC_INTERVAL || '30000'), // 30秒
    batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '100')
  },
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/*,application/pdf').split(',')
  }
};
```

## 9. 扩展性考虑

### 9.1 微服务演进路径

```
当前: 单体应用 (Next.js Full-Stack)
    ↓
阶段1: 模块化分离
    ├── 认证服务 (Auth Service)
    ├── WBS服务 (WBS Service)  
    ├── 时间记录服务 (Time Service)
    └── 报告服务 (Report Service)
    ↓
阶段2: 独立部署
    ├── API网关 (Gateway)
    ├── 各微服务独立部署
    └── 消息队列 (Event Bus)
    ↓
阶段3: 云原生
    ├── Kubernetes编排
    ├── 服务网格 (Service Mesh)
    └── 分布式存储
```

### 9.2 数据扩展策略

```typescript
// 支持插件化扩展
interface WBSPlugin {
  name: string;
  version: string;
  hooks: {
    beforeTaskCreate?: (task: CreateTaskInput) => CreateTaskInput;
    afterTaskCreate?: (task: WBSTask) => void;
    beforeTaskUpdate?: (id: string, updates: Partial<WBSTask>) => Partial<WBSTask>;
    afterTaskUpdate?: (task: WBSTask) => void;
  };
  components?: {
    TaskEditor?: React.ComponentType<TaskEditorProps>;
    TaskCard?: React.ComponentType<TaskCardProps>;
  };
}

// 插件注册系统
class PluginManager {
  private plugins: Map<string, WBSPlugin> = new Map();
  
  register(plugin: WBSPlugin) {
    this.plugins.set(plugin.name, plugin);
  }
  
  async executeHook<T>(hookName: keyof WBSPlugin['hooks'], ...args: any[]): Promise<T> {
    let result = args[0];
    
    for (const plugin of this.plugins.values()) {
      const hook = plugin.hooks[hookName];
      if (hook) {
        result = await hook(result);
      }
    }
    
    return result;
  }
}
```

## 10. 开发规范

### 10.1 代码规范

```typescript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    // 强制使用TypeScript
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    
    // React规范
    'react-hooks/exhaustive-deps': 'error',
    'react/prop-types': 'off',
    
    // 导入规范
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always'
    }]
  }
};

// 命名规范
// 文件命名：kebab-case (wbs-tree.tsx)
// 组件命名：PascalCase (WBSTree)
// 函数命名：camelCase (createTask)
// 常量命名：UPPER_SNAKE_CASE (WBS_LEVELS)
// 类型命名：PascalCase (WBSTask)
```

### 10.2 Git工作流

```bash
# 分支命name规范
feature/wbs-navigation-ui
bugfix/sync-conflict-resolution
hotfix/security-patch
release/v1.2.0

# 提交信息规范
feat: add WBS tree navigation component
fix: resolve sync conflict when updating tasks
docs: update API documentation
style: format code with prettier
refactor: extract WBS service logic
test: add unit tests for time calculation
chore: update dependencies
```

### 10.3 测试策略

```typescript
// 单元测试 (Jest + Testing Library)
// __tests__/utils/wbs.test.ts
describe('WBS Utils', () => {
  describe('buildWBSTree', () => {
    it('should build correct tree structure', () => {
      const flatTasks = [
        { id: '1', parentId: null, wbsCode: '1', name: 'Root' },
        { id: '2', parentId: '1', wbsCode: '1.1', name: 'Child 1' },
        { id: '3', parentId: '1', wbsCode: '1.2', name: 'Child 2' }
      ];
      
      const tree = buildWBSTree(flatTasks);
      
      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].name).toBe('Child 1');
    });
  });
});

// 集成测试 (Playwright)
// e2e/wbs-navigation.spec.ts
test('should navigate WBS levels correctly', async ({ page }) => {
  await page.goto('/dashboard/projects/1/wbs');
  
  // 展开年度计划
  await page.click('[data-testid="wbs-node-1"] [data-testid="expand-button"]');
  
  // 验证子任务显示
  await expect(page.locator('[data-testid="wbs-node-1-1"]')).toBeVisible();
  
  // 点击进入季度层级
  await page.click('[data-testid="level-nav-quarterly"]');
  
  // 验证URL变化
  await expect(page).toHaveURL(/.*level=quarterly/);
});
```

这份技术架构文档涵盖了Nobody Logger项目的完整技术实现方案，为开发团队提供了详细的指导和规范。