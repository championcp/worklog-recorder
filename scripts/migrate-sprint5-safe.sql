-- Sprint 5 增量数据库迁移脚本（安全版本）
-- Nobody Logger - 数据分析与团队协作系统

-- 检查并创建 dashboard_configs 表
CREATE TABLE IF NOT EXISTS dashboard_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSON NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    is_shared BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 检查并创建索引
CREATE INDEX IF NOT EXISTS idx_dashboard_user_id ON dashboard_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_default ON dashboard_configs(user_id, is_default);

-- 检查并创建 report_templates 表
CREATE TABLE IF NOT EXISTS report_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_config JSON NOT NULL,
    category VARCHAR(100),
    is_system BOOLEAN DEFAULT 0,
    user_id INTEGER,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_report_template_category ON report_templates(category, is_system);
CREATE INDEX IF NOT EXISTS idx_report_template_user ON report_templates(user_id);

-- 检查并创建 project_members 表
CREATE TABLE IF NOT EXISTS project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    invited_by INTEGER NOT NULL,
    invitation_token VARCHAR(255),
    invitation_status VARCHAR(20) DEFAULT 'pending',
    joined_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- 检查并创建 notifications 表
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    related_type VARCHAR(50),
    related_id INTEGER,
    action_url TEXT,
    metadata JSON,
    is_read BOOLEAN DEFAULT 0,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- 为现有用户创建默认仪表板（如果不存在）
INSERT OR IGNORE INTO dashboard_configs (user_id, name, description, layout, is_default)
SELECT 
    id,
    '我的仪表板',
    '默认仪表板配置',
    '{"items":[{"i":"overview","x":0,"y":0,"w":12,"h":3,"config":{"type":"overview","title":"概览","refresh":300}},{"i":"projects","x":0,"y":3,"w":6,"h":4,"config":{"type":"project_progress","title":"项目进度","refresh":600}},{"i":"time","x":6,"y":3,"w":6,"h":4,"config":{"type":"time_analysis","title":"时间分析","refresh":600}}]}',
    1
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM dashboard_configs WHERE user_id = users.id AND is_default = 1
);

-- 为现有项目创建所有者记录（如果不存在）
INSERT OR IGNORE INTO project_members (project_id, user_id, role, invited_by, invitation_status, joined_at)
SELECT 
    id as project_id,
    user_id,
    'owner' as role,
    user_id as invited_by,
    'accepted' as invitation_status,
    created_at as joined_at
FROM projects
WHERE NOT EXISTS (
    SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = projects.user_id
);

-- 插入系统预设报告模板（如果不存在）
INSERT OR IGNORE INTO report_templates (name, description, template_config, category, is_system) VALUES 
(
    '项目进度报告',
    '包含甘特图、里程碑和任务完成情况的项目进度综合报告',
    '{"sections":[{"type":"overview","title":"项目概览","config":{"showMetrics":true,"showProgress":true}},{"type":"gantt","title":"项目时间线","config":{"showDependencies":true,"showMilestones":true}},{"type":"tasks","title":"任务详情","config":{"groupBy":"status","showAssignee":true}}],"format":"pdf","pageSize":"A4","orientation":"landscape"}',
    'project',
    1
);

-- 记录迁移版本
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO schema_migrations (version) VALUES 
('sprint5_dashboard_system'),
('sprint5_team_collaboration'),
('sprint5_notifications'),
('sprint5_report_templates');