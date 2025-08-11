const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../data/nobody-logger.db');
const SCHEMA_PATH = path.join(__dirname, '../schema.sql');

function initDatabase() {
  try {
    // 确保data目录存在
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ Created data directory');
    }

    // 读取schema文件
    if (!fs.existsSync(SCHEMA_PATH)) {
      console.error('❌ Schema file not found:', SCHEMA_PATH);
      process.exit(1);
    }

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    console.log('✅ Schema file loaded');

    // 创建数据库连接
    const db = new Database(DB_PATH);
    console.log('✅ Database connected');

    // 执行schema脚本 - 直接执行整个脚本而不是分割
    try {
      db.exec(schema);
    } catch (error) {
      console.error('❌ Error executing schema:', error.message);
      throw error;
    }

    console.log('✅ Database schema initialized successfully');

    // 验证表是否创建成功
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('📊 Created tables:', tables.map(t => t.name).join(', '));

    db.close();
    console.log('✅ Database connection closed');
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  console.log('🚀 Starting database initialization...');
  const success = initDatabase();
  process.exit(success ? 0 : 1);
}

module.exports = { initDatabase };