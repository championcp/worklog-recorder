-- Sprint 5 数据库迁移脚本
-- Nobody Logger - 数据分析与团队协作系统

-- ============================================================================
-- 迁移版本: sprint5_001
-- 描述: 创建仪表板配置系统相关表
-- 创建日期: 2025年8月6日
-- ============================================================================

-- 创建仪表板配置表
CREATE TABLE dashboard_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSON NOT NULL,                -- 小部件布局配置，格式: {items: [...]}
    is_default BOOLEAN DEFAULT 0,        -- 是否为默认仪表板
    is_shared BOOLEAN DEFAULT 0,         -- 是否共享给团队
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引优化查询性能
CREATE INDEX idx_dashboard_user_id ON dashboard_configs(user_id);
CREATE INDEX idx_dashboard_default ON dashboard_configs(user_id, is_default);
CREATE INDEX idx_dashboard_shared ON dashboard_configs(is_shared, created_at);

-- 为每个现有用户创建默认仪表板配置
INSERT INTO dashboard_configs (user_id, name, description, layout, is_default)
SELECT 
    id,
    '我的仪表板',
    '默认仪表板配置',
    json('{"items":[{"i":"overview","x":0,"y":0,"w":12,"h":3,"config":{"type":"overview","title":"概览","refresh":300}},{"i":"projects","x":0,"y":3,"w":6,"h":4,"config":{"type":"project_progress","title":"项目进度","refresh":600}},{"i":"time","x":6,"y":3,"w":6,"h":4,"config":{"type":"time_analysis","title":"时间分析","refresh":600}}]}'),
    1
FROM users;

-- ============================================================================
-- 迁移版本: sprint5_002
-- 描述: 创建报告模板系统
-- 创建日期: 2025年8月6日
-- ============================================================================

-- 创建报告模板表
CREATE TABLE report_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_config JSON NOT NULL,       -- 模板配置，包含图表类型、数据源等
    category VARCHAR(100),               -- 模板分类: project, time, team, custom
    is_system BOOLEAN DEFAULT 0,         -- 是否为系统预设模板
    user_id INTEGER,                     -- 自定义模板的创建者
    usage_count INTEGER DEFAULT 0,       -- 使用次数统计
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX idx_report_template_category ON report_templates(category, is_system);
CREATE INDEX idx_report_template_user ON report_templates(user_id);
CREATE INDEX idx_report_template_usage ON report_templates(usage_count DESC, created_at DESC);

-- 插入系统预设报告模板
INSERT INTO report_templates (name, description, template_config, category, is_system) VALUES 
(
    '项目进度报告',
    '包含甘特图、里程碑和任务完成情况的项目进度综合报告',
    json('{"sections":[{"type":"overview","title":"项目概览","config":{"showMetrics":true,"showProgress":true}},{"type":"gantt","title":"项目时间线","config":{"showDependencies":true,"showMilestones":true}},{"type":"tasks","title":"任务详情","config":{"groupBy":"status","showAssignee":true}}],"format":"pdf","pageSize":"A4","orientation":"landscape"}'),
    'project',
    1
),
(
    '时间分析报告',
    '个人或团队的时间使用分析，包含热力图和效率统计',
    json('{"sections":[{"type":"time_summary","title":"时间统计","config":{"showDaily":true,"showWeekly":true}},{"type":"heatmap","title":"工作时间热力图","config":{"timeRange":"month","granularity":"hour"}},{"type":"efficiency","title":"效率分析","config":{"showTrends":true,"showComparison":true}}],"format":"pdf","pageSize":"A4","orientation":"portrait"}'),
    'time',
    1
),
(
    '团队协作报告',
    '团队成员贡献度、任务分配和协作效率分析报告',
    json('{"sections":[{"type":"team_overview","title":"团队概览","config":{"showMembers":true,"showRoles":true}},{"type":"contribution","title":"成员贡献","config":{"showTasks":true,"showHours":true}},{"type":"workload","title":"工作负载","config":{"showDistribution":true,"showBalance":true}}],"format":"pdf","pageSize":"A4","orientation":"portrait"}'),
    'team',
    1
),
(
    '周报模板',
    '简洁的周度工作总结报告模板',
    json('{"sections":[{"type":"week_summary","title":"本周总结","config":{"showTasks":true,"showHours":true}},{"type":"achievements","title":"主要成果","config":{"showCompleted":true}},{"type":"next_week","title":"下周计划","config":{"showUpcoming":true}}],"format":"pdf","pageSize":"A4","orientation":"portrait"}'),
    'time',
    1
),
(
    '月度报告',
    '月度工作总结和项目进展报告',
    json('{"sections":[{"type":"month_overview","title":"月度概览","config":{"showMetrics":true,"showTrends":true}},{"type":"project_status","title":"项目状态","config":{"showAll":true,"showRisks":true}},{"type":"performance","title":"绩效分析","config":{"showEfficiency":true,"showGoals":true}}],"format":"pdf","pageSize":"A4","orientation":"portrait"}'),
    'project',
    1
);

-- ============================================================================
-- 迁移版本: sprint5_003
-- 描述: 创建团队协作系统
-- 创建日期: 2025年8月6日
-- ============================================================================

-- 创建项目成员表
CREATE TABLE project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',  -- owner, editor, viewer
    invited_by INTEGER NOT NULL,
    invitation_token VARCHAR(255),       -- 邀请令牌，用于邀请链接
    invitation_status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, declined, expired
    joined_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE(project_id, user_id)
);

-- 创建索引
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_invitation ON project_members(invitation_token);
CREATE INDEX idx_project_members_status ON project_members(invitation_status, created_at);

-- 为现有项目创建所有者记录
INSERT INTO project_members (project_id, user_id, role, invited_by, invitation_status, joined_at)
SELECT 
    id as project_id,
    user_id,
    'owner' as role,
    user_id as invited_by,
    'accepted' as invitation_status,
    created_at as joined_at
FROM projects;

-- 创建权限操作日志表
CREATE TABLE permission_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    operator_id INTEGER NOT NULL,       -- 操作人
    target_user_id INTEGER NOT NULL,    -- 被操作的用户
    action VARCHAR(50) NOT NULL,        -- 操作类型: invite, role_change, remove, accept_invite
    old_role VARCHAR(20),               -- 原角色
    new_role VARCHAR(20),               -- 新角色
    details JSON,                       -- 详细信息，如邀请邮件、操作原因等
    ip_address VARCHAR(45),             -- 操作者IP地址
    user_agent TEXT,                    -- 用户代理
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_permission_logs_project ON permission_logs(project_id, created_at DESC);
CREATE INDEX idx_permission_logs_operator ON permission_logs(operator_id, created_at DESC);
CREATE INDEX idx_permission_logs_target ON permission_logs(target_user_id, created_at DESC);
CREATE INDEX idx_permission_logs_action ON permission_logs(action, created_at DESC);

-- ============================================================================
-- 迁移版本: sprint5_004
-- 描述: 创建通知系统
-- 创建日期: 2025年8月6日
-- ============================================================================

-- 创建通知表
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,          -- 通知类型: invite, task_assigned, report_ready, etc.
    title VARCHAR(255) NOT NULL,        -- 通知标题
    content TEXT,                       -- 通知内容
    related_type VARCHAR(50),           -- 关联对象类型: project, task, report, user
    related_id INTEGER,                 -- 关联对象ID
    action_url TEXT,                    -- 操作链接
    metadata JSON,                      -- 额外元数据
    is_read BOOLEAN DEFAULT 0,          -- 是否已读
    read_at TIMESTAMP NULL,             -- 阅读时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,               -- 过期时间
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type, created_at DESC);
CREATE INDEX idx_notifications_related ON notifications(related_type, related_id);
CREATE INDEX idx_notifications_expires ON notifications(expires_at);

-- ============================================================================
-- 迁移版本: sprint5_005
-- 描述: 扩展任务表以支持团队协作
-- 创建日期: 2025年8月6日
-- ============================================================================

-- 为wbs_tasks表添加新字段
ALTER TABLE wbs_tasks 
ADD COLUMN assigned_to INTEGER REFERENCES users(id);  -- 任务负责人

ALTER TABLE wbs_tasks 
ADD COLUMN participants JSON;                          -- 参与者ID数组 [1,2,3]

ALTER TABLE wbs_tasks 
ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';     -- low, medium, high, urgent

ALTER TABLE wbs_tasks 
ADD COLUMN tags JSON;                                  -- 任务标签数组 ["前端","紧急"]

-- 创建新增字段的索引
CREATE INDEX idx_wbs_tasks_assigned ON wbs_tasks(assigned_to);
CREATE INDEX idx_wbs_tasks_priority ON wbs_tasks(priority, status);

-- ============================================================================
-- 迁移版本: sprint5_006
-- 描述: 创建任务评论系统
-- 创建日期: 2025年8月6日
-- ============================================================================

-- 创建任务评论表
CREATE TABLE task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    parent_id INTEGER,                   -- 回复评论的ID，用于嵌套评论
    mentions JSON,                       -- 提及的用户ID数组
    attachments JSON,                    -- 附件信息
    is_deleted BOOLEAN DEFAULT 0,       -- 软删除标记
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (task_id) REFERENCES wbs_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES task_comments(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_task_comments_task ON task_comments(task_id, created_at DESC);
CREATE INDEX idx_task_comments_user ON task_comments(user_id, created_at DESC);
CREATE INDEX idx_task_comments_parent ON task_comments(parent_id, created_at ASC);

-- ============================================================================
-- 迁生版本: sprint5_007
-- 描述: 创建项目活动流表
-- 创建日期: 2025年8月6日
-- ============================================================================

-- 创建项目活动表
CREATE TABLE project_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    activity_type VARCHAR(50) NOT NULL,  -- task_created, task_updated, time_logged, etc.
    title VARCHAR(255) NOT NULL,         -- 活动标题
    description TEXT,                    -- 活动描述
    related_type VARCHAR(50),            -- 关联对象类型
    related_id INTEGER,                  -- 关联对象ID
    old_values JSON,                     -- 变更前的值
    new_values JSON,                     -- 变更后的值
    metadata JSON,                       -- 额外的元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_project_activities_project ON project_activities(project_id, created_at DESC);
CREATE INDEX idx_project_activities_user ON project_activities(user_id, created_at DESC);
CREATE INDEX idx_project_activities_type ON project_activities(activity_type, created_at DESC);

-- ============================================================================
-- 迁移版本: sprint5_008
-- 描述: 创建报告生成任务表
-- 创建日期: 2025年8月6日
-- ============================================================================

-- 创建报告生成任务表
CREATE TABLE report_generation_tasks (
    id VARCHAR(255) PRIMARY KEY,        -- UUID格式的任务ID
    user_id INTEGER NOT NULL,
    template_id INTEGER,
    project_ids JSON NOT NULL,          -- 包含的项目ID数组
    config JSON NOT NULL,               -- 报告配置
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    progress INTEGER DEFAULT 0,         -- 进度百分比 0-100
    file_path TEXT,                     -- 生成的文件路径
    file_size INTEGER,                  -- 文件大小(字节)
    download_url TEXT,                  -- 下载链接
    error_message TEXT,                 -- 错误信息
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    expires_at TIMESTAMP,               -- 文件过期时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX idx_report_tasks_user ON report_generation_tasks(user_id, created_at DESC);
CREATE INDEX idx_report_tasks_status ON report_generation_tasks(status, created_at);
CREATE INDEX idx_report_tasks_expires ON report_generation_tasks(expires_at);

-- ============================================================================
-- 迁移版本: sprint5_009
-- 描述: 创建用户设置扩展表
-- 创建日期: 2025年8月6日
-- ============================================================================

-- 创建用户设置表（扩展现有用户表的设置功能）
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    
    -- 仪表板设置
    default_dashboard_id INTEGER,
    dashboard_refresh_interval INTEGER DEFAULT 300,  -- 秒
    
    -- 通知设置
    email_notifications JSON DEFAULT '{"task_assigned":true,"report_ready":true,"team_updates":true}',
    push_notifications JSON DEFAULT '{"enabled":false,"task_reminders":true}',
    notification_quiet_hours JSON DEFAULT '{"enabled":false,"start":"22:00","end":"08:00"}',
    
    -- 界面设置
    theme VARCHAR(20) DEFAULT 'light',     -- light, dark, auto
    language VARCHAR(10) DEFAULT 'zh-CN',  -- zh-CN, en-US
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(10) DEFAULT '24h',  -- 12h, 24h
    
    -- 工作偏好设置
    work_hours_start TIME DEFAULT '09:00',
    work_hours_end TIME DEFAULT '18:00',
    work_days JSON DEFAULT '["monday","tuesday","wednesday","thursday","friday"]',
    default_task_view VARCHAR(20) DEFAULT 'list',  -- list, kanban, timeline
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (default_dashboard_id) REFERENCES dashboard_configs(id) ON DELETE SET NULL
);

-- 为现有用户创建默认设置
INSERT INTO user_settings (user_id)
SELECT id FROM users;

-- 创建索引
CREATE INDEX idx_user_settings_user ON user_settings(user_id);

-- ============================================================================
-- 迁移版本: sprint5_010
-- 描述: 创建数据导出历史表
-- 创建日期: 2025年8月6日
-- ============================================================================

-- 创建数据导出历史表
CREATE TABLE export_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    export_type VARCHAR(50) NOT NULL,    -- dashboard, report, data, backup
    format VARCHAR(10) NOT NULL,         -- pdf, excel, csv, json
    config JSON NOT NULL,                -- 导出配置
    file_path TEXT,                      -- 文件路径
    file_size INTEGER,                   -- 文件大小
    download_url TEXT,                   -- 下载链接
    download_count INTEGER DEFAULT 0,    -- 下载次数
    status VARCHAR(20) DEFAULT 'completed',  -- completed, expired, deleted
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_export_history_user ON export_history(user_id, created_at DESC);
CREATE INDEX idx_export_history_type ON export_history(export_type, status);
CREATE INDEX idx_export_history_expires ON export_history(expires_at);

-- ============================================================================
-- 创建触发器用于自动更新时间戳
-- ============================================================================

-- dashboard_configs 更新触发器
CREATE TRIGGER update_dashboard_configs_updated_at
    AFTER UPDATE ON dashboard_configs
    FOR EACH ROW
BEGIN
    UPDATE dashboard_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- project_members 更新触发器
CREATE TRIGGER update_project_members_updated_at
    AFTER UPDATE ON project_members
    FOR EACH ROW
BEGIN
    UPDATE project_members SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- report_generation_tasks 更新触发器
CREATE TRIGGER update_report_tasks_updated_at
    AFTER UPDATE ON report_generation_tasks
    FOR EACH ROW
BEGIN
    UPDATE report_generation_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- user_settings 更新触发器
CREATE TRIGGER update_user_settings_updated_at
    AFTER UPDATE ON user_settings
    FOR EACH ROW
BEGIN
    UPDATE user_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- task_comments 更新触发器
CREATE TRIGGER update_task_comments_updated_at
    AFTER UPDATE ON task_comments
    FOR EACH ROW
BEGIN
    UPDATE task_comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- 创建视图以简化常用查询
-- ============================================================================

-- 项目成员详情视图
CREATE VIEW v_project_members AS
SELECT 
    pm.id,
    pm.project_id,
    pm.user_id,
    pm.role,
    pm.invitation_status,
    pm.joined_at,
    u.username,
    u.email,
    u.avatar_url,
    p.name as project_name,
    invited_by_user.username as invited_by_username
FROM project_members pm
JOIN users u ON pm.user_id = u.id
JOIN projects p ON pm.project_id = p.id
JOIN users invited_by_user ON pm.invited_by = invited_by_user.id;

-- 任务分配详情视图
CREATE VIEW v_task_assignments AS
SELECT 
    t.id as task_id,
    t.name as task_name,
    t.wbs_code,
    t.status,
    t.priority,
    t.assigned_to,
    assigned_user.username as assigned_username,
    assigned_user.email as assigned_email,
    t.project_id,
    p.name as project_name
FROM wbs_tasks t
LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
JOIN projects p ON t.project_id = p.id
WHERE t.is_deleted = 0;

-- 活跃仪表板视图
CREATE VIEW v_active_dashboards AS
SELECT 
    dc.*,
    u.username,
    u.email
FROM dashboard_configs dc
JOIN users u ON dc.user_id = u.id
ORDER BY dc.updated_at DESC;

-- ============================================================================
-- 数据完整性检查
-- ============================================================================

-- 检查外键约束
PRAGMA foreign_keys = ON;

-- 验证数据完整性
-- 1. 检查每个用户都有默认仪表板
SELECT 
    u.id, 
    u.username,
    COUNT(dc.id) as dashboard_count
FROM users u
LEFT JOIN dashboard_configs dc ON u.id = dc.user_id AND dc.is_default = 1
GROUP BY u.id, u.username
HAVING dashboard_count = 0;

-- 2. 检查每个项目都有所有者
SELECT 
    p.id,
    p.name,
    COUNT(pm.id) as owner_count
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.role = 'owner'
GROUP BY p.id, p.name
HAVING owner_count = 0;

-- 3. 检查每个用户都有设置记录
SELECT 
    u.id,
    u.username,
    COUNT(us.id) as settings_count
FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id
GROUP BY u.id, u.username
HAVING settings_count = 0;

-- ============================================================================
-- 迁移完成标记
-- ============================================================================

-- 确保 schema_migrations 表存在
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 记录所有已应用的迁移
INSERT OR IGNORE INTO schema_migrations (version) VALUES 
('sprint5_001'),
('sprint5_002'),
('sprint5_003'),
('sprint5_004'),
('sprint5_005'),
('sprint5_006'),
('sprint5_007'),
('sprint5_008'),
('sprint5_009'),
('sprint5_010');

-- ============================================================================
-- 迁移脚本完成
-- 
-- 总结:
-- - 创建了 10 个新表支持数据分析和团队协作功能
-- - 扩展了现有表结构以支持新功能
-- - 创建了必要的索引以优化查询性能
-- - 设置了触发器自动维护时间戳
-- - 创建了视图简化常用查询
-- - 为现有用户和项目初始化了必要的默认数据
-- - 添加了数据完整性检查
-- ============================================================================