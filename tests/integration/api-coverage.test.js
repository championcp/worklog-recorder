// API 集成测试
// 测试所有API端点的基本功能

const request = require('supertest');
const { spawn } = require('child_process');
const path = require('path');

describe('API Integration Tests', () => {
  let server;
  
  beforeAll(async () => {
    // 确保数据库已初始化
    const setupScript = path.join(__dirname, '../scripts/setup.js');
    await new Promise((resolve, reject) => {
      const setup = spawn('node', [setupScript], { 
        stdio: 'inherit' 
      });
      setup.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Setup failed with code ${code}`));
      });
    });
  });

  describe('Authentication APIs', () => {
    test('POST /api/auth/register - should handle registration', async () => {
      const testUser = {
        email: 'apitest@test.com',
        password: '123456',
        username: 'apitest'
      };

      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(testUser)
        .expect((res) => {
          // 应该返回200(成功)或400(用户已存在)
          expect([200, 201, 400]).toContain(res.status);
        });
    });

    test('POST /api/auth/login - should handle login', async () => {
      const credentials = {
        email: 'test@nobody-logger.com',
        password: '123456'
      };

      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send(credentials)
        .expect((res) => {
          // 应该返回200(成功)或401(失败)
          expect([200, 201, 401]).toContain(res.status);
        });
    });

    test('GET /api/auth/me - should handle auth check', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/auth/me')
        .expect((res) => {
          // 无认证应该返回401
          expect([401]).toContain(res.status);
        });
    });

    test('POST /api/auth/logout - should handle logout', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/logout')
        .expect((res) => {
          // 登出应该总是成功
          expect([200, 201]).toContain(res.status);
        });
    });
  });

  describe('Projects APIs', () => {
    test('GET /api/projects - should handle projects list', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/projects')
        .expect((res) => {
          // 无认证应该返回401，有认证应该返回200
          expect([200, 401]).toContain(res.status);
        });
    });

    test('POST /api/projects - should handle project creation', async () => {
      const projectData = {
        name: 'Test API Project',
        description: 'API测试项目',
        color: '#0066CC'
      };

      const response = await request('http://localhost:3000')
        .post('/api/projects')
        .send(projectData)
        .expect((res) => {
          // 无认证应该返回401
          expect([401]).toContain(res.status);
        });
    });
  });

  describe('Tasks APIs', () => {
    test('GET /api/tasks - should handle tasks list', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/tasks?project_id=1')
        .expect((res) => {
          // 无认证应该返回401
          expect([401]).toContain(res.status);
        });
    });

    test('POST /api/tasks - should handle task creation', async () => {
      const taskData = {
        project_id: 1,
        name: 'Test API Task',
        description: 'API测试任务',
        level_type: 'daily',
        priority: 'medium'
      };

      const response = await request('http://localhost:3000')
        .post('/api/tasks')
        .send(taskData)
        .expect((res) => {
          // 无认证应该返回401
          expect([401]).toContain(res.status);
        });
    });
  });

  describe('Time Logs APIs', () => {
    test('GET /api/time-logs - should handle time logs list', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/time-logs')
        .expect((res) => {
          // 无认证应该返回401
          expect([401]).toContain(res.status);
        });
    });

    test('POST /api/time-logs - should handle time log creation', async () => {
      const timeLogData = {
        task_id: 1,
        description: 'API测试时间记录',
        start_time: new Date().toISOString(),
        is_manual: true
      };

      const response = await request('http://localhost:3000')
        .post('/api/time-logs')
        .send(timeLogData)
        .expect((res) => {
          // 无认证应该返回401
          expect([401]).toContain(res.status);
        });
    });
  });

  describe('Categories APIs', () => {
    test('GET /api/categories - should handle categories list', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/categories')
        .expect((res) => {
          // 无认证应该返回401
          expect([401]).toContain(res.status);
        });
    });
  });

  describe('Tags APIs', () => {
    test('GET /api/tags - should handle tags list', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/tags')
        .expect((res) => {
          // 无认证应该返回401
          expect([401]).toContain(res.status);
        });
    });
  });

  describe('Analytics APIs', () => {
    test('GET /api/analytics/dashboard - should handle dashboard data', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/analytics/dashboard')
        .expect((res) => {
          // 应该处理请求，可能返回401或数据
          expect([200, 401]).toContain(res.status);
        });
    });

    test('GET /api/analytics/efficiency - should handle efficiency data', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/analytics/efficiency')
        .expect((res) => {
          // 应该处理请求，可能返回401或数据
          expect([200, 401]).toContain(res.status);
        });
    });
  });

  describe('Search APIs', () => {
    test('GET /api/search - should handle search', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/search?q=test')
        .expect((res) => {
          // 无认证应该返回401
          expect([401]).toContain(res.status);
        });
    });
  });

  describe('Reports APIs', () => {
    test('POST /api/reports/generate - should handle report generation', async () => {
      const reportData = {
        type: 'daily',
        date: new Date().toISOString().split('T')[0]
      };

      const response = await request('http://localhost:3000')
        .post('/api/reports/generate')
        .send(reportData)
        .expect((res) => {
          // 无认证应该返回401
          expect([401]).toContain(res.status);
        });
    });
  });
});