const { initDatabase } = require('./migrate');
const { seedDatabase } = require('./seed');

async function setupDatabase() {
  console.log('🚀 Setting up Nobody Logger database...');
  console.log('================================');
  
  try {
    // 1. 初始化数据库结构
    console.log('1️⃣ Initializing database schema...');
    const initSuccess = initDatabase();
    
    if (!initSuccess) {
      console.error('❌ Failed to initialize database schema');
      process.exit(1);
    }
    
    console.log('✅ Database schema initialized successfully\n');

    // 2. 填充测试数据
    console.log('2️⃣ Seeding test data...');
    const seedSuccess = seedDatabase();
    
    if (!seedSuccess) {
      console.error('❌ Failed to seed test data');
      process.exit(1);
    }
    
    console.log('✅ Test data seeded successfully\n');
    
    console.log('🎉 Database setup completed!');
    console.log('================================');
    console.log('💡 You can now start the development server with: npm run dev');
    console.log('🔑 Login with: test@nobody-logger.com / 123456');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };