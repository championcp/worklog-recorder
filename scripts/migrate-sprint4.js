// Sprint 4 Database Migration Script
// Enhances existing schema for categories, search, and user settings

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'nobody-logger.db');

function runMigration() {
  const db = new Database(dbPath);

  console.log('Starting Sprint 4 database migration...');

  // Migration queries
  const migrations = [
    // Add missing fields to categories table for Sprint 4 requirements
    `ALTER TABLE categories ADD COLUMN level INTEGER DEFAULT 0`,
    `ALTER TABLE categories ADD COLUMN task_count INTEGER DEFAULT 0`,

    // Add icon field to tags table if not exists
    `ALTER TABLE tags ADD COLUMN icon VARCHAR(50)`,
    `ALTER TABLE tags ADD COLUMN description TEXT`,
    `ALTER TABLE tags ADD COLUMN last_used_at TIMESTAMP`,

    // Create full-text search indexes for better search performance
    `CREATE INDEX IF NOT EXISTS idx_wbs_tasks_search ON wbs_tasks(name, description)`,
    `CREATE INDEX IF NOT EXISTS idx_projects_search ON projects(name, description)`,
    `CREATE INDEX IF NOT EXISTS idx_categories_search ON categories(name, description)`,
    `CREATE INDEX IF NOT EXISTS idx_tags_search ON tags(name, description)`,

    // Create user notification settings table
    `CREATE TABLE IF NOT EXISTS user_notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      channel_type VARCHAR(20) NOT NULL, -- 'in_app', 'email', 'browser', 'mobile'
      category VARCHAR(20) NOT NULL, -- 'tasks', 'projects', 'team', 'system'
      enabled BOOLEAN DEFAULT 1,
      frequency VARCHAR(20) DEFAULT 'immediate', -- 'immediate', 'digest', 'batch'
      work_hours_start VARCHAR(5) DEFAULT '09:00',
      work_hours_end VARCHAR(5) DEFAULT '18:00',
      quiet_hours_start VARCHAR(5) DEFAULT '22:00',
      quiet_hours_end VARCHAR(5) DEFAULT '08:00',
      weekend_mode BOOLEAN DEFAULT 0,
      holiday_mode BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, channel_type, category)
    )`,

    // Create search history table
    `CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      query TEXT NOT NULL,
      search_type VARCHAR(20) DEFAULT 'global', -- 'global', 'advanced'
      filters TEXT, -- JSON format for advanced search filters
      result_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // Create saved search filters table
    `CREATE TABLE IF NOT EXISTS saved_search_filters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      criteria TEXT NOT NULL, -- JSON format search criteria
      is_shared BOOLEAN DEFAULT 0,
      category VARCHAR(50),
      usage_count INTEGER DEFAULT 0,
      last_used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // Create batch operations log table
    `CREATE TABLE IF NOT EXISTS batch_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_id VARCHAR(36) NOT NULL,
      user_id INTEGER NOT NULL,
      operation_type VARCHAR(50) NOT NULL, -- 'ADD_CATEGORY', 'REMOVE_TAG', etc.
      target_ids TEXT NOT NULL, -- JSON array of affected task IDs
      operation_data TEXT, -- JSON format operation parameters
      total_count INTEGER NOT NULL,
      success_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
      can_undo BOOLEAN DEFAULT 1,
      undo_expires_at TIMESTAMP,
      errors TEXT, -- JSON format error details
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // Add indexes for new tables
    `CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_saved_search_filters_user_id ON saved_search_filters(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_batch_operations_user_id ON batch_operations(user_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_batch_operations_status ON batch_operations(status, can_undo, undo_expires_at)`,

    // Update tags usage_count trigger to handle last_used_at
    `DROP TRIGGER IF EXISTS update_tag_usage_count_insert`,
    `CREATE TRIGGER update_tag_usage_count_insert
      AFTER INSERT ON task_tags
    BEGIN
      UPDATE tags SET 
        usage_count = usage_count + 1,
        last_used_at = CURRENT_TIMESTAMP 
      WHERE id = NEW.tag_id;
    END`,

    // Insert default user settings for existing users
    `INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value, setting_type)
     SELECT id, 'theme_mode', 'light', 'string' FROM users WHERE is_active = 1`,
    
    `INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value, setting_type)
     SELECT id, 'language', 'zh-CN', 'string' FROM users WHERE is_active = 1`,
    
    `INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value, setting_type)
     SELECT id, 'timezone', 'Asia/Shanghai', 'string' FROM users WHERE is_active = 1`,
    
    `INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value, setting_type)
     SELECT id, 'default_view', 'dashboard', 'string' FROM users WHERE is_active = 1`,
    
    `INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value, setting_type)
     SELECT id, 'page_size', '20', 'number' FROM users WHERE is_active = 1`
  ];

  // Execute migrations sequentially
  let completed = 0;
  const total = migrations.length;

  for (let i = 0; i < migrations.length; i++) {
    const query = migrations[i];
    try {
      db.exec(query);
      console.log(`✅ Step ${i + 1}/${total} completed`);
      completed++;
    } catch (err) {
      // Some ALTER TABLE commands might fail if column already exists - that's OK
      if (err.message.includes('duplicate column name') || 
          err.message.includes('already exists')) {
        console.log(`⚠️  Step ${i + 1}/${total}: ${err.message} (skipped)`);
        completed++;
      } else {
        console.error(`❌ Step ${i + 1}/${total} failed:`, err.message);
        console.error('Query:', query);
        db.close();
        process.exit(1);
      }
    }
  }

  console.log(`✅ Sprint 4 migration completed successfully! (${completed}/${total} steps)`);
  db.close();
}

// Check if this script is being run directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };