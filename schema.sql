-- Nobody Logger 数据库模式设计
-- SQLite数据库结构定义
-- 支持WBS多层级时间管理和日志记录系统

-- ==========================================
-- 用户管理表
-- ==========================================

-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    -- 同步相关字段
    sync_version INTEGER DEFAULT 1,
    last_sync_at TIMESTAMP,
    device_id VARCHAR(255)
);

-- ==========================================
-- 核心业务表
-- ==========================================

-- 项目表（顶层容器）
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#1976d2', -- 项目主题色
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 同步相关字段
    sync_version INTEGER DEFAULT 1,
    last_sync_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- WBS任务层级表（支持无限层级）
CREATE TABLE wbs_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    parent_id INTEGER, -- 父任务ID，NULL表示根任务
    wbs_code VARCHAR(50), -- WBS编码：1.1.2.3
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- 层级相关
    level INTEGER NOT NULL DEFAULT 0, -- 层级深度：0=年度，1=半年，2=季度，3=月，4=周，5=日
    level_type VARCHAR(20) NOT NULL, -- 'yearly', 'half_yearly', 'quarterly', 'monthly', 'weekly', 'daily'
    sort_order INTEGER DEFAULT 0,
    
    -- 时间相关
    start_date DATE,
    end_date DATE,
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2) DEFAULT 0,
    
    -- 状态相关
    status VARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'paused', 'cancelled'
    progress_percentage INTEGER DEFAULT 0, -- 0-100
    priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- 同步相关字段
    sync_version INTEGER DEFAULT 1,
    last_sync_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT 0,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES wbs_tasks(id) ON DELETE CASCADE
);

-- ==========================================
-- 分类和标签系统
-- ==========================================

-- 工作分类表
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    parent_id INTEGER, -- 支持分类层级
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#666666',
    icon VARCHAR(50), -- 图标名称
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 同步相关字段
    sync_version INTEGER DEFAULT 1,
    last_sync_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 标签表
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#999999',
    usage_count INTEGER DEFAULT 0, -- 使用次数统计
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 同步相关字段
    sync_version INTEGER DEFAULT 1,
    last_sync_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

-- 任务分类关联表
CREATE TABLE task_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES wbs_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(task_id, category_id)
);

-- 任务标签关联表
CREATE TABLE task_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES wbs_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(task_id, tag_id)
);

-- ==========================================
-- 时间记录系统
-- ==========================================

-- 时间日志表
CREATE TABLE time_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_seconds INTEGER, -- 持续时间（秒）
    is_manual BOOLEAN DEFAULT 1, -- 是否手动记录
    log_date DATE NOT NULL, -- 日志日期
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 同步相关字段
    sync_version INTEGER DEFAULT 1,
    last_sync_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES wbs_tasks(id) ON DELETE CASCADE
);

-- 工作日志表（每日工作记录）
CREATE TABLE work_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    log_date DATE NOT NULL,
    content TEXT, -- 日志内容
    mood VARCHAR(20), -- 工作心情：'excellent', 'good', 'normal', 'bad', 'terrible'
    efficiency_rating INTEGER, -- 效率评分 1-10
    total_work_hours DECIMAL(5,2) DEFAULT 0, -- 当日总工作时间
    notes TEXT, -- 备注
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 同步相关字段
    sync_version INTEGER DEFAULT 1,
    last_sync_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, log_date)
);

-- ==========================================
-- 模板系统
-- ==========================================

-- 计划模板表
CREATE TABLE plan_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(20) NOT NULL, -- 'yearly', 'quarterly', 'monthly', 'weekly', 'daily'
    template_data TEXT, -- JSON格式存储模板结构
    usage_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT 0, -- 是否为公共模板
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 同步相关字段
    sync_version INTEGER DEFAULT 1,
    last_sync_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 提醒系统
-- ==========================================

-- 提醒规则表
CREATE TABLE reminder_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_id INTEGER,
    rule_type VARCHAR(20) NOT NULL, -- 'deadline', 'advance', 'recurring'
    trigger_time TIMESTAMP, -- 具体触发时间
    advance_minutes INTEGER, -- 提前提醒分钟数
    recurrence_pattern VARCHAR(50), -- 重复模式：'daily', 'weekly', 'monthly', 'custom'
    recurrence_config TEXT, -- JSON格式的重复配置
    message TEXT, -- 提醒消息
    is_active BOOLEAN DEFAULT 1,
    last_triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 同步相关字段
    sync_version INTEGER DEFAULT 1,
    last_sync_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES wbs_tasks(id) ON DELETE CASCADE
);

-- ==========================================
-- 报告系统
-- ==========================================

-- 报告表
CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    report_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly'
    report_period VARCHAR(50) NOT NULL, -- 报告周期：'2024-01', '2024-W15', '2024-Q1' 等
    title VARCHAR(255) NOT NULL,
    content TEXT, -- 报告内容（HTML或Markdown）
    summary_data TEXT, -- JSON格式的汇总数据
    is_auto_generated BOOLEAN DEFAULT 1, -- 是否自动生成
    is_published BOOLEAN DEFAULT 0,
    generated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 同步相关字段
    sync_version INTEGER DEFAULT 1,
    last_sync_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 系统配置表
-- ==========================================

-- 用户设置表
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, setting_key)
);

-- 数据同步日志表
CREATE TABLE sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    record_id INTEGER,
    sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'conflict'
    conflict_data TEXT, -- JSON格式的冲突数据
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 索引设计
-- ==========================================

-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_device_id ON users(device_id);

-- 项目表索引
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_active ON projects(user_id, is_active);

-- WBS任务表索引
CREATE INDEX idx_wbs_tasks_project_id ON wbs_tasks(project_id);
CREATE INDEX idx_wbs_tasks_parent_id ON wbs_tasks(parent_id);
CREATE INDEX idx_wbs_tasks_level ON wbs_tasks(level, level_type);
CREATE INDEX idx_wbs_tasks_status ON wbs_tasks(status);
CREATE INDEX idx_wbs_tasks_dates ON wbs_tasks(start_date, end_date);
CREATE INDEX idx_wbs_tasks_wbs_code ON wbs_tasks(wbs_code);

-- 分类和标签索引
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_task_categories_task_id ON task_categories(task_id);
CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);

-- 时间记录索引
CREATE INDEX idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX idx_time_logs_date ON time_logs(log_date);
CREATE INDEX idx_time_logs_time_range ON time_logs(start_time, end_time);
CREATE INDEX idx_work_logs_user_date ON work_logs(user_id, log_date);

-- 模板系统索引
CREATE INDEX idx_plan_templates_user_id ON plan_templates(user_id);
CREATE INDEX idx_plan_templates_type ON plan_templates(template_type);

-- 提醒系统索引
CREATE INDEX idx_reminder_rules_user_id ON reminder_rules(user_id);
CREATE INDEX idx_reminder_rules_task_id ON reminder_rules(task_id);
CREATE INDEX idx_reminder_rules_trigger ON reminder_rules(trigger_time, is_active);

-- 报告系统索引
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_type_period ON reports(report_type, report_period);

-- 系统表索引
CREATE INDEX idx_user_settings_user_key ON user_settings(user_id, setting_key);
CREATE INDEX idx_sync_logs_user_device ON sync_logs(user_id, device_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(sync_status, created_at);

-- ==========================================
-- 触发器（自动更新时间戳）
-- ==========================================

-- 更新 users 表的 updated_at 字段
CREATE TRIGGER update_users_timestamp 
    AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 更新 projects 表的 updated_at 字段
CREATE TRIGGER update_projects_timestamp 
    AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 更新 wbs_tasks 表的 updated_at 字段
CREATE TRIGGER update_wbs_tasks_timestamp 
    AFTER UPDATE ON wbs_tasks
BEGIN
    UPDATE wbs_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 更新 categories 表的 updated_at 字段
CREATE TRIGGER update_categories_timestamp 
    AFTER UPDATE ON categories
BEGIN
    UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 更新 tags 表的 updated_at 字段
CREATE TRIGGER update_tags_timestamp 
    AFTER UPDATE ON tags
BEGIN
    UPDATE tags SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 更新 time_logs 表的 updated_at 字段
CREATE TRIGGER update_time_logs_timestamp 
    AFTER UPDATE ON time_logs
BEGIN
    UPDATE time_logs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 更新 work_logs 表的 updated_at 字段
CREATE TRIGGER update_work_logs_timestamp 
    AFTER UPDATE ON work_logs
BEGIN
    UPDATE work_logs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 自动计算任务完成进度的触发器
CREATE TRIGGER update_parent_task_progress 
    AFTER UPDATE OF progress_percentage ON wbs_tasks
    WHEN NEW.progress_percentage != OLD.progress_percentage
BEGIN
    UPDATE wbs_tasks 
    SET progress_percentage = (
        SELECT ROUND(AVG(progress_percentage))
        FROM wbs_tasks 
        WHERE parent_id = NEW.parent_id AND is_deleted = 0
    )
    WHERE id = NEW.parent_id AND NEW.parent_id IS NOT NULL;
END;

-- 自动更新标签使用计数
CREATE TRIGGER update_tag_usage_count_insert
    AFTER INSERT ON task_tags
BEGIN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
END;

CREATE TRIGGER update_tag_usage_count_delete
    AFTER DELETE ON task_tags
BEGIN
    UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
END;

-- ==========================================
-- 视图定义
-- ==========================================

-- WBS任务层级视图（包含完整路径）
CREATE VIEW v_wbs_hierarchy AS
WITH RECURSIVE wbs_path AS (
    -- 根节点
    SELECT 
        id, project_id, parent_id, wbs_code, name, level, level_type,
        name as full_path,
        0 as depth
    FROM wbs_tasks 
    WHERE parent_id IS NULL AND is_deleted = 0
    
    UNION ALL
    
    -- 递归查找子节点
    SELECT 
        t.id, t.project_id, t.parent_id, t.wbs_code, t.name, t.level, t.level_type,
        p.full_path || ' > ' || t.name as full_path,
        p.depth + 1 as depth
    FROM wbs_tasks t
    INNER JOIN wbs_path p ON t.parent_id = p.id
    WHERE t.is_deleted = 0
)
SELECT * FROM wbs_path;

-- 时间统计视图
CREATE VIEW v_time_statistics AS
SELECT 
    tl.user_id,
    tl.task_id,
    wt.name as task_name,
    wt.level_type,
    DATE(tl.start_time) as log_date,
    SUM(tl.duration_seconds) as total_seconds,
    SUM(tl.duration_seconds) / 3600.0 as total_hours,
    COUNT(*) as log_count
FROM time_logs tl
INNER JOIN wbs_tasks wt ON tl.task_id = wt.id
WHERE tl.is_deleted = 0 AND wt.is_deleted = 0
GROUP BY tl.user_id, tl.task_id, DATE(tl.start_time);

-- 项目进度概览视图
CREATE VIEW v_project_overview AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.user_id,
    COUNT(DISTINCT wt.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN wt.status = 'completed' THEN wt.id END) as completed_tasks,
    COUNT(DISTINCT CASE WHEN wt.status = 'in_progress' THEN wt.id END) as in_progress_tasks,
    ROUND(AVG(wt.progress_percentage), 2) as avg_progress,
    SUM(COALESCE(wt.estimated_hours, 0)) as total_estimated_hours,
    SUM(COALESCE(wt.actual_hours, 0)) as total_actual_hours
FROM projects p
LEFT JOIN wbs_tasks wt ON p.id = wt.project_id AND wt.is_deleted = 0
WHERE p.is_deleted = 0
GROUP BY p.id, p.name, p.user_id;