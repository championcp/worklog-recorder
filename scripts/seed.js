const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/nobody-logger.db');

function seedDatabase() {
  try {
    const db = new Database(DB_PATH);
    console.log('🌱 Starting database seeding...');

    // 清理现有数据（开发环境）
    console.log('🧹 Cleaning existing data...');
    const tables = [
      'sync_logs', 'user_settings', 'reports', 'reminder_rules', 
      'plan_templates', 'work_logs', 'time_logs', 'task_tags', 
      'task_categories', 'tags', 'categories', 'wbs_tasks', 'projects', 'users'
    ];
    
    tables.forEach(table => {
      try {
        db.exec(`DELETE FROM ${table}`);
      } catch (error) {
        // 表可能不存在，忽略错误
      }
    });

    // 重置自增ID
    db.exec("DELETE FROM sqlite_sequence");
    
    console.log('✅ Data cleaned');

    // 1. 创建测试用户
    console.log('👤 Creating test users...');
    const hashedPassword = bcrypt.hashSync('123456', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, username, device_id)
      VALUES (?, ?, ?, ?)
    `);

    const userId = insertUser.run(
      'test@nobody-logger.com',
      hashedPassword,
      'Test User',
      'dev-device-001'
    ).lastInsertRowid;

    console.log('✅ Test user created with ID:', userId);

    // 2. 创建测试项目
    console.log('📂 Creating test project...');
    const insertProject = db.prepare(`
      INSERT INTO projects (user_id, name, description, color)
      VALUES (?, ?, ?, ?)
    `);

    const projectId = insertProject.run(
      userId,
      '2024年个人发展计划',
      '2024年度个人职业发展和技能提升计划',
      '#3b82f6'
    ).lastInsertRowid;

    console.log('✅ Test project created with ID:', projectId);

    // 3. 创建WBS任务层级结构
    console.log('🌳 Creating WBS task hierarchy...');
    const insertTask = db.prepare(`
      INSERT INTO wbs_tasks (
        project_id, parent_id, wbs_code, name, description, level, level_type,
        start_date, end_date, estimated_hours, status, progress_percentage, priority
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 年度任务
    const yearlyTaskId = insertTask.run(
      projectId, null, '1', '2024年度发展目标',
      '全年度的个人发展主要目标和里程碑',
      0, 'yearly', '2024-01-01', '2024-12-31', 2080, 'in_progress', 35, 'high'
    ).lastInsertRowid;

    // 半年度任务
    const h1TaskId = insertTask.run(
      projectId, yearlyTaskId, '1.1', '2024年上半年目标',
      '上半年重点发展领域',
      1, 'half_yearly', '2024-01-01', '2024-06-30', 1040, 'completed', 85, 'high'
    ).lastInsertRowid;

    const h2TaskId = insertTask.run(
      projectId, yearlyTaskId, '1.2', '2024年下半年目标',
      '下半年重点发展领域',
      1, 'half_yearly', '2024-07-01', '2024-12-31', 1040, 'in_progress', 25, 'high'
    ).lastInsertRowid;

    // 季度任务 (Q3)
    const q3TaskId = insertTask.run(
      projectId, h2TaskId, '1.2.1', '2024年第三季度目标',
      '第三季度具体执行计划',
      2, 'quarterly', '2024-07-01', '2024-09-30', 520, 'completed', 90, 'medium'
    ).lastInsertRowid;

    const q4TaskId = insertTask.run(
      projectId, h2TaskId, '1.2.2', '2024年第四季度目标',
      '第四季度具体执行计划',
      2, 'quarterly', '2024-10-01', '2024-12-31', 520, 'in_progress', 15, 'medium'
    ).lastInsertRowid;

    // 月度任务 (11月)
    const nov2024TaskId = insertTask.run(
      projectId, q4TaskId, '1.2.2.1', '2024年11月计划',
      '11月份具体工作安排',
      3, 'monthly', '2024-11-01', '2024-11-30', 173, 'in_progress', 60, 'medium'
    ).lastInsertRowid;

    // 周任务 (当前周)
    const week1TaskId = insertTask.run(
      projectId, nov2024TaskId, '1.2.2.1.1', '11月第1周计划',
      '本周重点工作事项',
      4, 'weekly', '2024-11-01', '2024-11-07', 40, 'completed', 100, 'medium'
    ).lastInsertRowid;

    const week2TaskId = insertTask.run(
      projectId, nov2024TaskId, '1.2.2.1.2', '11月第2周计划',
      '本周重点工作事项',
      4, 'weekly', '2024-11-08', '2024-11-14', 40, 'in_progress', 70, 'medium'
    ).lastInsertRowid;

    // 日任务
    const dailyTasks = [
      { date: '2024-11-08', name: '完成技术方案设计', desc: '完成新项目的技术架构设计文档', hours: 8, status: 'completed', progress: 100 },
      { date: '2024-11-09', name: '代码审查和重构', desc: '审查现有代码并进行必要的重构', hours: 6, status: 'completed', progress: 100 },
      { date: '2024-11-10', name: '团队会议和项目讨论', desc: '参加项目进度会议，讨论下阶段计划', hours: 4, status: 'completed', progress: 100 },
      { date: '2024-11-11', name: '学习新技术栈', desc: '学习React 18新特性和Next.js 14', hours: 8, status: 'in_progress', progress: 60 },
      { date: '2024-11-12', name: '文档编写', desc: '编写项目API文档和用户手册', hours: 6, status: 'not_started', progress: 0 },
    ];

    dailyTasks.forEach((task, index) => {
      insertTask.run(
        projectId, week2TaskId, `1.2.2.1.2.${index + 1}`, task.name, task.desc,
        5, 'daily', task.date, task.date, task.hours, task.status, task.progress, 'medium'
      );
    });

    console.log('✅ WBS task hierarchy created');

    // 4. 创建分类
    console.log('🏷️ Creating categories...');
    const insertCategory = db.prepare(`
      INSERT INTO categories (user_id, name, description, color, icon)
      VALUES (?, ?, ?, ?, ?)
    `);

    const categories = [
      { name: '技术开发', desc: '编程、架构设计、技术研究等', color: '#3b82f6', icon: 'code' },
      { name: '学习成长', desc: '学习新技术、阅读、培训等', color: '#10b981', icon: 'book' },
      { name: '项目管理', desc: '项目规划、团队协调、进度跟踪等', color: '#f59e0b', icon: 'project' },
      { name: '沟通协作', desc: '会议、讨论、邮件沟通等', color: '#8b5cf6', icon: 'users' },
      { name: '文档编写', desc: '技术文档、方案设计、总结报告等', color: '#ef4444', icon: 'document' },
    ];

    const categoryIds = categories.map(cat => 
      insertCategory.run(userId, cat.name, cat.desc, cat.color, cat.icon).lastInsertRowid
    );

    console.log('✅ Categories created');

    // 5. 创建标签
    console.log('🏷️ Creating tags...');
    const insertTag = db.prepare(`
      INSERT INTO tags (user_id, name, color)
      VALUES (?, ?, ?)
    `);

    const tags = [
      { name: 'React', color: '#61dafb' },
      { name: 'Next.js', color: '#000000' },
      { name: 'TypeScript', color: '#3178c6' },
      { name: '架构设计', color: '#ff6b6b' },
      { name: '性能优化', color: '#4ecdc4' },
      { name: '用户体验', color: '#45b7d1' },
      { name: '团队协作', color: '#96ceb4' },
      { name: '技术分享', color: '#feca57' },
    ];

    const tagIds = tags.map(tag => 
      insertTag.run(userId, tag.name, tag.color).lastInsertRowid
    );

    console.log('✅ Tags created');

    // 6. 创建时间日志
    console.log('⏰ Creating time logs...');
    const insertTimeLog = db.prepare(`
      INSERT INTO time_logs (
        user_id, task_id, description, start_time, end_time, 
        duration_seconds, log_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // 获取一些任务ID用于创建时间日志
    const tasks = db.prepare(`
      SELECT id, name FROM wbs_tasks 
      WHERE level_type IN ('daily', 'weekly') 
      ORDER BY id DESC LIMIT 10
    `).all();

    const timeLogs = [
      { taskId: tasks[0]?.id, desc: '完成技术方案设计', start: '09:00', end: '17:00', date: '2024-11-08' },
      { taskId: tasks[1]?.id, desc: '代码审查和重构', start: '09:30', end: '15:30', date: '2024-11-09' },
      { taskId: tasks[2]?.id, desc: '参加项目会议', start: '14:00', end: '18:00', date: '2024-11-10' },
      { taskId: tasks[3]?.id, desc: '学习React 18新特性', start: '09:00', end: '13:00', date: '2024-11-11' },
    ];

    timeLogs.forEach(log => {
      if (log.taskId) {
        const startTime = `${log.date} ${log.start}:00`;
        const endTime = `${log.date} ${log.end}:00`;
        const duration = (new Date(endTime) - new Date(startTime)) / 1000;
        
        insertTimeLog.run(
          userId, log.taskId, log.desc, startTime, endTime, duration, log.date
        );
      }
    });

    console.log('✅ Time logs created');

    // 7. 创建工作日志
    console.log('📝 Creating work logs...');
    const insertWorkLog = db.prepare(`
      INSERT INTO work_logs (user_id, log_date, content, mood, efficiency_rating, total_work_hours)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const workLogs = [
      {
        date: '2024-11-08',
        content: '今天完成了新项目的技术架构设计，包括数据库设计、API规范和前端架构。整体进展顺利，团队反馈积极。',
        mood: 'excellent',
        efficiency: 9,
        hours: 8.0
      },
      {
        date: '2024-11-09', 
        content: '重构了部分核心代码，提高了系统性能。代码审查过程中发现了几个潜在问题，已经修复。',
        mood: 'good',
        efficiency: 8,
        hours: 6.0
      },
      {
        date: '2024-11-10',
        content: '参加了项目进度会议，讨论了下阶段的开发计划。与产品经理对接了新需求，需要调整部分技术方案。',
        mood: 'normal',
        efficiency: 7,
        hours: 4.0
      }
    ];

    workLogs.forEach(log => {
      insertWorkLog.run(userId, log.date, log.content, log.mood, log.efficiency, log.hours);
    });

    console.log('✅ Work logs created');

    // 8. 创建用户设置
    console.log('⚙️ Creating user settings...');
    const insertSetting = db.prepare(`
      INSERT INTO user_settings (user_id, setting_key, setting_value, setting_type)
      VALUES (?, ?, ?, ?)
    `);

    const settings = [
      { key: 'theme', value: 'light', type: 'string' },
      { key: 'timezone', value: 'Asia/Shanghai', type: 'string' },
      { key: 'work_hours_per_day', value: '8', type: 'number' },
      { key: 'work_days_per_week', value: '5', type: 'number' },
      { key: 'notification_enabled', value: 'true', type: 'boolean' },
      { key: 'auto_sync_interval', value: '30', type: 'number' },
    ];

    settings.forEach(setting => {
      insertSetting.run(userId, setting.key, setting.value, setting.type);
    });

    console.log('✅ User settings created');

    // 验证数据
    console.log('📊 Data summary:');
    const summary = [
      { table: 'users', count: db.prepare('SELECT COUNT(*) as count FROM users').get().count },
      { table: 'projects', count: db.prepare('SELECT COUNT(*) as count FROM projects').get().count },
      { table: 'wbs_tasks', count: db.prepare('SELECT COUNT(*) as count FROM wbs_tasks').get().count },
      { table: 'categories', count: db.prepare('SELECT COUNT(*) as count FROM categories').get().count },
      { table: 'tags', count: db.prepare('SELECT COUNT(*) as count FROM tags').get().count },
      { table: 'time_logs', count: db.prepare('SELECT COUNT(*) as count FROM time_logs').get().count },
      { table: 'work_logs', count: db.prepare('SELECT COUNT(*) as count FROM work_logs').get().count },
      { table: 'user_settings', count: db.prepare('SELECT COUNT(*) as count FROM user_settings').get().count },
    ];

    summary.forEach(item => {
      console.log(`  ${item.table}: ${item.count} records`);
    });

    db.close();
    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('📋 Test Account Information:');
    console.log('  Email: test@nobody-logger.com');
    console.log('  Password: 123456');
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    return false;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  console.log('🌱 Starting database seeding...');
  const success = seedDatabase();
  process.exit(success ? 0 : 1);
}

module.exports = { seedDatabase };