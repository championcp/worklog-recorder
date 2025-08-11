# Nobody Logger RESTful API 规范

## 1. API 总览

### 1.1 基础信息
- **API版本**: v1
- **基础URL**: `https://api.nobody-logger.com/v1`
- **协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8

### 1.2 版本控制策略
- URL路径版本控制: `/v1`, `/v2`
- 向后兼容性保证
- 废弃版本提前3个月通知

### 1.3 通用HTTP状态码
```
200 OK                  - 请求成功
201 Created             - 资源创建成功
204 No Content          - 成功但无内容返回
400 Bad Request         - 请求参数错误
401 Unauthorized        - 未认证
403 Forbidden           - 权限不足
404 Not Found           - 资源不存在
409 Conflict            - 数据冲突
422 Unprocessable Entity - 验证失败
429 Too Many Requests   - 请求频率超限
500 Internal Server Error - 服务器错误
503 Service Unavailable - 服务不可用
```

### 1.4 通用响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00Z",
  "request_id": "uuid-string"
}
```

错误响应格式:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "验证失败",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "request_id": "uuid-string"
}
```

### 1.5 分页格式
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 100,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

查询参数:
- `page`: 页码 (默认: 1)
- `per_page`: 每页数量 (默认: 20, 最大: 100)
- `sort`: 排序字段 (如: `created_at`, `-updated_at`)
- `filter`: 过滤条件

## 2. 认证与授权

### 2.1 认证机制
使用JWT Bearer Token认证:
```
Authorization: Bearer <jwt_token>
```

### 2.2 JWT Token结构
```json
{
  "user_id": 123,
  "email": "user@example.com",
  "device_id": "device-uuid",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### 2.3 认证相关端点

#### 用户注册
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "用户名",
  "device_id": "device-uuid-string"
}
```

响应:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "email": "user@example.com",
      "username": "用户名",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token_string",
    "expires_at": "2024-01-02T00:00:00Z"
  }
}
```

#### 用户登录
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "device_id": "device-uuid-string"
}
```

#### 刷新Token
```http
POST /auth/refresh
Authorization: Bearer <current_token>
```

#### 注销
```http
POST /auth/logout
Authorization: Bearer <jwt_token>
```

## 3. 用户管理 API

### 3.1 获取用户信息
```http
GET /users/me
Authorization: Bearer <jwt_token>
```

响应:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "email": "user@example.com",
    "username": "用户名",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login_at": "2024-01-01T12:00:00Z",
    "sync_version": 1
  }
}
```

### 3.2 更新用户信息
```http
PUT /users/me
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "username": "新用户名",
  "password": "new_password" // 可选
}
```

### 3.3 用户设置管理

#### 获取设置
```http
GET /users/me/settings
Authorization: Bearer <jwt_token>
```

#### 更新设置
```http
PUT /users/me/settings
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "theme": "dark",
  "language": "zh-CN",
  "timezone": "Asia/Shanghai",
  "notifications_enabled": true,
  "auto_sync_enabled": true
}
```

## 4. 项目管理 API

### 4.1 项目列表
```http
GET /projects
Authorization: Bearer <jwt_token>
Query Parameters:
- is_active: boolean (过滤活跃项目)
- sort: string (排序字段)
- page: integer
- per_page: integer
```

### 4.2 创建项目
```http
POST /projects
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "项目名称",
  "description": "项目描述",
  "color": "#1976d2"
}
```

### 4.3 获取项目详情
```http
GET /projects/{project_id}
Authorization: Bearer <jwt_token>
```

### 4.4 更新项目
```http
PUT /projects/{project_id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "新项目名称",
  "description": "新描述",
  "color": "#ff5722",
  "is_active": true
}
```

### 4.5 删除项目
```http
DELETE /projects/{project_id}
Authorization: Bearer <jwt_token>
```

### 4.6 项目概览统计
```http
GET /projects/{project_id}/overview
Authorization: Bearer <jwt_token>
```

响应:
```json
{
  "success": true,
  "data": {
    "project_id": 123,
    "project_name": "项目名称",
    "total_tasks": 50,
    "completed_tasks": 20,
    "in_progress_tasks": 15,
    "avg_progress": 65.5,
    "total_estimated_hours": 200.0,
    "total_actual_hours": 120.5
  }
}
```

## 5. WBS任务管理 API

### 5.1 任务层级结构
```http
GET /projects/{project_id}/wbs
Authorization: Bearer <jwt_token>
Query Parameters:
- level: integer (过滤层级)
- level_type: string (yearly, half_yearly, quarterly, monthly, weekly, daily)
- status: string (not_started, in_progress, completed, paused, cancelled)
- include_deleted: boolean (默认: false)
```

响应:
```json
{
  "success": true,
  "data": {
    "hierarchy": [
      {
        "id": 1,
        "project_id": 123,
        "parent_id": null,
        "wbs_code": "1",
        "name": "2024年度目标",
        "level": 0,
        "level_type": "yearly",
        "status": "in_progress",
        "progress_percentage": 65,
        "children": [
          {
            "id": 2,
            "parent_id": 1,
            "wbs_code": "1.1",
            "name": "2024上半年",
            "level": 1,
            "level_type": "half_yearly",
            "children": []
          }
        ]
      }
    ]
  }
}
```

### 5.2 创建任务
```http
POST /projects/{project_id}/wbs
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "parent_id": 1, // 可选，空表示根任务
  "name": "任务名称",
  "description": "任务描述",
  "level_type": "monthly",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "estimated_hours": 40.0,
  "priority": "high",
  "category_ids": [1, 2], // 可选
  "tag_ids": [1, 2, 3] // 可选
}
```

### 5.3 获取任务详情
```http
GET /projects/{project_id}/wbs/{task_id}
Authorization: Bearer <jwt_token>
Query Parameters:
- include_children: boolean (包含子任务)
- include_time_logs: boolean (包含时间记录)
```

### 5.4 更新任务
```http
PUT /projects/{project_id}/wbs/{task_id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "新任务名称",
  "description": "新描述",
  "status": "in_progress",
  "progress_percentage": 50,
  "actual_hours": 20.0,
  "priority": "medium",
  "category_ids": [1, 3],
  "tag_ids": [1, 4, 5]
}
```

### 5.5 移动任务
```http
POST /projects/{project_id}/wbs/{task_id}/move
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "new_parent_id": 5, // null表示移动到根级别
  "position": 2 // 在新父级下的位置
}
```

### 5.6 复制任务
```http
POST /projects/{project_id}/wbs/{task_id}/copy
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "target_parent_id": 3,
  "copy_children": true,
  "copy_time_logs": false,
  "name_suffix": " (副本)"
}
```

### 5.7 批量操作任务
```http
POST /projects/{project_id}/wbs/batch
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "action": "update_status", // update_status, delete, move
  "task_ids": [1, 2, 3],
  "data": {
    "status": "completed"
  }
}
```

## 6. 分类和标签 API

### 6.1 分类管理

#### 获取分类列表
```http
GET /categories
Authorization: Bearer <jwt_token>
Query Parameters:
- parent_id: integer (过滤父分类)
- is_active: boolean
```

#### 创建分类
```http
POST /categories
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "分类名称",
  "description": "分类描述",
  "parent_id": 1, // 可选
  "color": "#666666",
  "icon": "work"
}
```

#### 更新分类
```http
PUT /categories/{category_id}
Authorization: Bearer <jwt_token>
```

#### 删除分类
```http
DELETE /categories/{category_id}
Authorization: Bearer <jwt_token>
```

### 6.2 标签管理

#### 获取标签列表
```http
GET /tags
Authorization: Bearer <jwt_token>
Query Parameters:
- search: string (搜索标签名)
- sort: usage_count,-usage_count,name,-name
```

#### 创建标签
```http
POST /tags
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "标签名称",
  "color": "#999999"
}
```

#### 批量创建标签
```http
POST /tags/batch
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "tags": [
    {"name": "紧急", "color": "#f44336"},
    {"name": "重要", "color": "#ff9800"}
  ]
}
```

## 7. 时间记录 API

### 7.1 时间日志管理

#### 获取时间日志
```http
GET /time-logs
Authorization: Bearer <jwt_token>
Query Parameters:
- task_id: integer
- start_date: date (YYYY-MM-DD)
- end_date: date (YYYY-MM-DD)
- is_manual: boolean
- page: integer
- per_page: integer
```

#### 创建时间记录
```http
POST /time-logs
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "task_id": 123,
  "description": "工作描述",
  "start_time": "2024-01-01T09:00:00Z",
  "end_time": "2024-01-01T10:30:00Z", // 可选，为空表示正在进行
  "is_manual": true
}
```

#### 开始计时
```http
POST /time-logs/start
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "task_id": 123,
  "description": "开始工作"
}
```

#### 停止计时
```http
POST /time-logs/{log_id}/stop
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "end_time": "2024-01-01T10:30:00Z", // 可选，默认当前时间
  "description": "完成工作"
}
```

#### 获取当前计时状态
```http
GET /time-logs/current
Authorization: Bearer <jwt_token>
```

### 7.2 工作日志管理

#### 获取工作日志
```http
GET /work-logs
Authorization: Bearer <jwt_token>
Query Parameters:
- date: date (YYYY-MM-DD)
- start_date: date
- end_date: date
- mood: string
```

#### 创建/更新工作日志
```http
PUT /work-logs/{date}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "content": "今日工作内容",
  "mood": "good",
  "efficiency_rating": 8,
  "notes": "备注信息"
}
```

### 7.3 时间统计 API

#### 时间汇总统计
```http
GET /statistics/time-summary
Authorization: Bearer <jwt_token>
Query Parameters:
- start_date: date
- end_date: date
- group_by: task,category,tag,date,week,month
- project_id: integer
- task_ids: integer[] (逗号分隔)
```

响应:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_hours": 120.5,
      "total_sessions": 45,
      "avg_session_duration": 2.68,
      "most_productive_day": "2024-01-15",
      "most_productive_hour": 10
    },
    "breakdown": [
      {
        "group_key": "task_1",
        "group_label": "任务名称",
        "total_hours": 40.0,
        "percentage": 33.2
      }
    ]
  }
}
```

#### 效率分析
```http
GET /statistics/efficiency
Authorization: Bearer <jwt_token>
Query Parameters:
- period: week,month,quarter,year
- include_mood: boolean
```

## 8. 模板系统 API

### 8.1 模板管理

#### 获取模板列表
```http
GET /templates
Authorization: Bearer <jwt_token>
Query Parameters:
- template_type: yearly,quarterly,monthly,weekly,daily
- is_public: boolean
```

#### 创建模板
```http
POST /templates
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "模板名称",
  "description": "模板描述",
  "template_type": "monthly",
  "template_data": {
    "tasks": [
      {
        "name": "月度目标1",
        "level_type": "monthly",
        "estimated_hours": 40,
        "children": []
      }
    ]
  },
  "is_public": false
}
```

#### 应用模板
```http
POST /templates/{template_id}/apply
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "project_id": 123,
  "parent_task_id": 456, // 可选
  "start_date": "2024-01-01",
  "customizations": {
    "task_name_prefix": "2024年1月-"
  }
}
```

### 8.2 公共模板

#### 获取公共模板
```http
GET /templates/public
Query Parameters:
- template_type: string
- search: string
```

#### 收藏模板
```http
POST /templates/{template_id}/favorite
Authorization: Bearer <jwt_token>
```

## 9. 提醒系统 API

### 9.1 提醒规则管理

#### 获取提醒规则
```http
GET /reminders
Authorization: Bearer <jwt_token>
Query Parameters:
- task_id: integer
- rule_type: deadline,advance,recurring
- is_active: boolean
```

#### 创建提醒规则
```http
POST /reminders
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "task_id": 123, // 可选，为空表示通用提醒
  "rule_type": "advance",
  "trigger_time": "2024-01-01T09:00:00Z", // deadline类型使用
  "advance_minutes": 60, // advance类型使用
  "recurrence_pattern": "daily", // recurring类型使用
  "recurrence_config": {
    "days_of_week": [1, 2, 3, 4, 5], // 周一到周五
    "time": "09:00"
  },
  "message": "提醒消息内容"
}
```

#### 触发提醒检查
```http
POST /reminders/check
Authorization: Bearer <jwt_token>
```

#### 标记提醒已读
```http
POST /reminders/{reminder_id}/mark-read
Authorization: Bearer <jwt_token>
```

### 9.2 提醒通知

#### 获取未读提醒
```http
GET /reminders/notifications
Authorization: Bearer <jwt_token>
```

## 10. 报告系统 API

### 10.1 报告管理

#### 获取报告列表
```http
GET /reports
Authorization: Bearer <jwt_token>
Query Parameters:
- report_type: daily,weekly,monthly,quarterly,half_yearly,yearly
- report_period: string (2024-01, 2024-W15, 2024-Q1)
- is_auto_generated: boolean
- is_published: boolean
```

#### 生成报告
```http
POST /reports/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "report_type": "monthly",
  "report_period": "2024-01",
  "include_sections": ["summary", "tasks", "time_analysis", "efficiency"],
  "auto_publish": false
}
```

#### 获取报告详情
```http
GET /reports/{report_id}
Authorization: Bearer <jwt_token>
```

#### 发布报告
```http
POST /reports/{report_id}/publish
Authorization: Bearer <jwt_token>
```

### 10.2 报告数据导出

#### 导出报告
```http
GET /reports/{report_id}/export
Authorization: Bearer <jwt_token>
Query Parameters:
- format: pdf,html,markdown,json
```

## 11. 数据同步 API

### 11.1 同步状态

#### 获取同步状态
```http
GET /sync/status
Authorization: Bearer <jwt_token>
```

响应:
```json
{
  "success": true,
  "data": {
    "last_sync_at": "2024-01-01T12:00:00Z",
    "sync_version": 123,
    "pending_changes": 5,
    "conflicts": 0,
    "device_id": "device-uuid"
  }
}
```

### 11.2 数据同步

#### 推送本地更改
```http
POST /sync/push
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "device_id": "device-uuid",
  "changes": [
    {
      "table": "wbs_tasks",
      "operation": "update",
      "record_id": 123,
      "data": {},
      "local_timestamp": "2024-01-01T12:00:00Z",
      "sync_version": 124
    }
  ]
}
```

#### 拉取远程更改
```http
GET /sync/pull
Authorization: Bearer <jwt_token>
Query Parameters:
- since_version: integer
- tables: string[] (逗号分隔)
```

#### 解决冲突
```http
POST /sync/resolve-conflicts
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "resolutions": [
    {
      "conflict_id": 123,
      "resolution": "use_remote", // use_local, use_remote, merge
      "merged_data": {} // 当resolution为merge时提供
    }
  ]
}
```

### 11.3 离线数据管理

#### 获取离线数据包
```http
GET /sync/offline-data
Authorization: Bearer <jwt_token>
Query Parameters:
- tables: string[]
- start_date: date
- end_date: date
```

## 12. 搜索 API

### 12.1 全局搜索
```http
GET /search
Authorization: Bearer <jwt_token>
Query Parameters:
- q: string (搜索关键词)
- types: string[] (tasks,categories,tags,time_logs)
- project_id: integer
- limit: integer
```

### 12.2 任务搜索
```http
GET /search/tasks
Authorization: Bearer <jwt_token>
Query Parameters:
- q: string
- status: string[]
- level_type: string[]
- date_range: string (last_week,last_month,last_quarter)
```

## 13. 文件上传 API

### 13.1 上传附件
```http
POST /upload/attachments
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

file: binary
task_id: integer (可选)
description: string (可选)
```

### 13.2 获取文件
```http
GET /files/{file_id}
Authorization: Bearer <jwt_token>
```

## 14. Webhook API

### 14.1 注册Webhook
```http
POST /webhooks
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["task.created", "task.completed", "reminder.triggered"],
  "secret": "webhook-secret"
}
```

### 14.2 Webhook事件格式
```json
{
  "event": "task.completed",
  "data": {
    "task_id": 123,
    "project_id": 456,
    "completed_at": "2024-01-01T12:00:00Z"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "signature": "sha256=..."
}
```

## 15. 速率限制

### 15.1 限制规则
- 认证端点: 5次/分钟
- 常规API: 100次/分钟
- 批量操作: 10次/分钟
- 同步API: 30次/分钟

### 15.2 限制响应头
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 16. 错误代码参考

### 16.1 业务错误代码
```
AUTH_001: 邮箱已存在
AUTH_002: 密码错误
AUTH_003: 账户已被禁用
TASK_001: 任务不存在
TASK_002: 无法删除有子任务的任务
TASK_003: 循环依赖错误
SYNC_001: 数据版本冲突
SYNC_002: 设备未授权
```

## 17. 开发调试

### 17.1 调试端点
```http
GET /debug/health
GET /debug/metrics
```

### 17.2 测试数据
开发环境提供测试数据初始化:
```http
POST /debug/seed-data
Authorization: Bearer <jwt_token>
```

---

此API规范涵盖了Nobody Logger系统的完整功能，支持：
- WBS多层级任务管理
- 实时时间记录和统计
- 跨设备数据同步
- 智能提醒系统
- 自动报告生成
- 移动端友好设计

所有API都遵循RESTful设计原则，提供一致的数据格式和错误处理机制。