# Nobody Logger API 设计总结

## 设计概述

基于数据库schema，我设计了一套完整的RESTful API规范，重点解决WBS多层级任务管理、时间记录统计、跨设备数据同步等核心业务需求。

## 关键设计决策

### 1. WBS层级数据的高效API设计

#### 层级结构查询优化
```http
GET /projects/{projectId}/wbs?level=0&level_type=yearly
```

**设计亮点:**
- 支持按层级(`level`)和类型(`level_type`)过滤，减少数据传输
- 使用递归CTE视图(`v_wbs_hierarchy`)提供完整路径信息
- 响应包含嵌套的`children`结构，便于前端树形展示

#### 任务移动和复制API
```http
POST /projects/{projectId}/wbs/{taskId}/move
POST /projects/{projectId}/wbs/{taskId}/copy
```

**设计考虑:**
- 单独的移动/复制端点，避免复杂的PATCH操作
- 支持批量操作，提高效率
- 自动重新计算WBS编码和层级关系

### 2. 时间统计相关的复杂查询API

#### 统计汇总接口
```http
GET /statistics/time-summary?group_by=task,category&start_date=2024-01-01&end_date=2024-01-31
```

**功能特点:**
- 灵活的分组维度：任务、分类、标签、日期、周、月
- 支持多种时间范围过滤
- 返回汇总数据和明细分解
- 包含效率分析和趋势数据

#### 实时计时API
```http
POST /time-logs/start    # 开始计时
POST /time-logs/{id}/stop # 停止计时
GET /time-logs/current   # 获取当前状态
```

**设计优势:**
- 简化的计时操作，减少客户端复杂度
- 自动计算持续时间
- 支持断点续传和异常恢复

### 3. 数据同步冲突处理API

#### 三阶段同步机制
```http
GET /sync/status         # 检查同步状态
POST /sync/push          # 推送本地更改
GET /sync/pull           # 拉取远程更改
POST /sync/resolve-conflicts # 解决冲突
```

**冲突处理策略:**
- 版本号机制(`sync_version`)检测冲突
- 提供三种解决方案：`use_local`、`use_remote`、`merge`
- 详细的冲突信息，帮助用户做决策
- 支持批量冲突解决

#### 离线数据包
```http
GET /sync/offline-data?tables=wbs_tasks,time_logs&start_date=2024-01-01
```

**设计目标:**
- 支持完全离线工作
- 按需下载数据，节省存储空间
- 增量同步，减少网络传输

### 4. 移动端友好的API设计

#### 分页和性能优化
- 统一的分页格式，包含`has_next`、`has_prev`便于移动端UI
- 默认20条/页，最大100条限制
- 支持客户端缓存的ETag机制

#### 批量操作支持
```http
POST /projects/{projectId}/wbs/batch
POST /tags/batch
POST /sync/resolve-conflicts
```

**移动端考虑:**
- 减少网络请求次数
- 支持离线批量操作队列
- 智能重试机制

### 5. 认证和授权机制

#### JWT Token设计
```json
{
  "user_id": 123,
  "email": "user@example.com",
  "device_id": "device-uuid",
  "iat": 1640995200,
  "exp": 1641081600
}
```

**安全特性:**
- 包含设备ID，支持多设备管理
- 支持Token刷新，避免频繁登录
- 设备绑定机制，防止Token盗用

### 6. API版本控制策略

#### URL路径版本控制
- 使用`/v1`、`/v2`路径前缀
- 向后兼容性保证
- 废弃版本提前3个月通知
- 支持多版本并存的平滑迁移

### 7. 错误处理和响应格式

#### 统一的响应结构
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00Z",
  "request_id": "uuid-string"
}
```

#### 详细的错误信息
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
  }
}
```

**错误处理优势:**
- 结构化错误代码，便于客户端处理
- 详细的字段级验证错误
- 包含request_id，便于问题追踪

## 性能优化考虑

### 1. 数据库查询优化
- 使用数据库视图简化复杂查询
- 合理的索引设计支持常用查询模式
- 分页查询避免大数据量问题

### 2. 缓存策略
- API响应缓存，减少数据库压力
- 用户设置等静态数据的客户端缓存
- 统计数据的定期预计算

### 3. 并发控制
- 乐观锁机制防止数据冲突
- 版本号递增确保数据一致性
- 批量操作的事务保护

### 4. 网络优化
- 响应数据压缩
- 支持条件请求(ETag/Last-Modified)
- 合理的超时和重试机制

## 扩展性设计

### 1. 微服务友好
- 按业务领域划分API端点
- 独立的认证服务
- 无状态设计，便于水平扩展

### 2. 第三方集成
- Webhook机制支持事件通知
- 标准的OAuth2.0认证接口
- 开放的数据导入导出API

### 3. 插件系统
- 模板系统支持自定义扩展
- 提醒规则的灵活配置
- 报告模板的可定制化

## 总结

这套API设计充分考虑了Nobody Logger系统的复杂业务需求，特别是：

1. **WBS层级管理** - 通过递归查询和层级过滤，高效处理多层级任务结构
2. **时间统计分析** - 提供灵活的分组和聚合查询，支持复杂的统计需求
3. **数据同步机制** - 完整的冲突检测和解决方案，保证多设备数据一致性
4. **移动端适配** - 考虑网络状况和用户体验，提供离线支持和批量操作
5. **系统可扩展性** - 模块化设计，支持未来功能扩展和第三方集成

API规范遵循RESTful设计原则，提供一致的接口风格和错误处理机制，便于前端开发和第三方集成。