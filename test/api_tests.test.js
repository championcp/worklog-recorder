// 日志记录软件 API 自动化测试脚本
// 使用 Jest 和 Supertest 进行接口测试

const request = require('supertest');
// 使用编译后的服务器文件
const app = require('../server/dist/index');

describe('日志记录软件 API 测试', () => {
  let authToken;
  let userId;
  let planId;
  let taskId;
  let timeLogId;

  // 测试前准备
  beforeAll(async () => {
    // 创建测试用户并获取认证令牌
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123456!'
      });
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123456!'
      });
    
    authToken = loginResponse.body.token;
    userId = loginResponse.body.user.id;
  });

  // 用户认证测试
  describe('🔐 用户认证 API', () => {
    test('TC001: 正确凭据登录', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123456!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    test('TC002: 错误密码登录', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('密码错误');
    });

    test('TC003: 无效邮箱格式', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Test123456!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('TC004: 令牌验证', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
    });

    test('TC005: 无效令牌访问', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  // 计划管理测试
  describe('📋 计划管理 API', () => {
    test('TC015: 创建年度计划', async () => {
      const planData = {
        title: '2024年度工作计划',
        description: '个人年度发展计划',
        type: 'yearly',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        goals: ['技能提升', '项目完成', '健康管理']
      };

      const response = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${authToken}`)
        .send(planData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(planData.title);
      expect(response.body.type).toBe('yearly');
      
      planId = response.body.id;
    });

    test('TC016: 获取计划列表', async () => {
      const response = await request(app)
        .get('/api/plans')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'yearly' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('TC017: 获取单个计划详情', async () => {
      const response = await request(app)
        .get(`/api/plans/${planId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(planId);
      expect(response.body.title).toBe('2024年度工作计划');
    });

    test('TC021: 计划分解为半年度计划', async () => {
      const subPlanData = {
        parentId: planId,
        title: '2024年上半年计划',
        type: 'half-yearly',
        startDate: '2024-01-01',
        endDate: '2024-06-30'
      };

      const response = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subPlanData);

      expect(response.status).toBe(201);
      expect(response.body.parentId).toBe(planId);
      expect(response.body.type).toBe('half-yearly');
    });

    test('TC025: 更新计划进度', async () => {
      const response = await request(app)
        .patch(`/api/plans/${planId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ progress: 25 });

      expect(response.status).toBe(200);
      expect(response.body.progress).toBe(25);
    });
  });

  // 任务管理测试
  describe('✅ 任务管理 API', () => {
    test('TC041: 创建任务', async () => {
      const taskData = {
        title: '完成项目文档',
        description: '编写项目技术文档和用户手册',
        priority: 'high',
        category: '文档工作',
        tags: ['文档', '项目'],
        dueDate: '2024-12-31',
        planId: planId
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(taskData.title);
      expect(response.body.priority).toBe('high');
      expect(response.body.tags).toEqual(['文档', '项目']);
      
      taskId = response.body.id;
    });

    test('TC042: 获取任务列表', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          category: '文档工作',
          status: 'pending'
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('TC048: 更新任务状态', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in-progress' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('in-progress');
    });

    test('TC050: 为任务添加标签', async () => {
      const response = await request(app)
        .post(`/api/tasks/${taskId}/tags`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tags: ['重要', '紧急'] });

      expect(response.status).toBe(200);
      expect(response.body.tags).toContain('重要');
      expect(response.body.tags).toContain('紧急');
    });
  });

  // 时间记录测试
  describe('⏱️ 时间记录 API', () => {
    test('TC060: 开始计时', async () => {
      const response = await request(app)
        .post('/api/time-logs/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          taskId: taskId,
          description: '开始编写文档'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.taskId).toBe(taskId);
      expect(response.body.isRunning).toBe(true);
      
      timeLogId = response.body.id;
    });

    test('TC061: 获取当前运行的计时', async () => {
      const response = await request(app)
        .get('/api/time-logs/running/current')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(timeLogId);
      expect(response.body.isRunning).toBe(true);
    });

    test('TC062: 停止计时', async () => {
      // 等待1秒确保有时间记录
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .patch(`/api/time-logs/${timeLogId}/stop`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.isRunning).toBe(false);
      expect(response.body.duration).toBeGreaterThan(0);
    });

    test('TC071: 按天统计时间', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await request(app)
        .get('/api/time-logs/stats/daily')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date: today });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalDuration');
      expect(response.body).toHaveProperty('taskBreakdown');
    });

    test('TC072: 按周统计时间', async () => {
      const response = await request(app)
        .get('/api/time-logs/stats/weekly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          year: 2024,
          week: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('weeklyTotal');
      expect(response.body).toHaveProperty('dailyBreakdown');
    });
  });

  // 提醒功能测试
  describe('🔔 提醒功能 API', () => {
    test('TC078: 设置到期提醒', async () => {
      const reminderData = {
        taskId: taskId,
        type: 'due',
        reminderTime: '2024-12-31T09:00:00Z',
        message: '任务即将到期，请及时完成'
      };

      const response = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reminderData);

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('due');
      expect(response.body.taskId).toBe(taskId);
    });

    test('TC081: 设置提前提醒', async () => {
      const reminderData = {
        taskId: taskId,
        type: 'advance',
        reminderTime: '2024-12-30T09:00:00Z',
        advanceDays: 1,
        message: '任务将在1天后到期'
      };

      const response = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reminderData);

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('advance');
      expect(response.body.advanceDays).toBe(1);
    });

    test('TC085: 设置周期性提醒', async () => {
      const reminderData = {
        taskId: taskId,
        type: 'recurring',
        recurringPattern: 'weekly',
        recurringDays: [1, 3, 5], // 周一、三、五
        reminderTime: '09:00:00'
      };

      const response = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reminderData);

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('recurring');
      expect(response.body.recurringPattern).toBe('weekly');
    });
  });

  // 工作日志测试
  describe('📝 工作日志 API', () => {
    test('TC088: 创建每日工作日志', async () => {
      const logData = {
        date: '2024-01-15',
        plannedTasks: [
          {
            taskId: taskId,
            plannedDuration: 240, // 4小时
            actualDuration: 180,  // 3小时
            completionRate: 75,
            notes: '完成了大部分文档编写工作'
          }
        ],
        unplannedTasks: [
          {
            title: '紧急会议',
            duration: 60,
            category: '会议',
            notes: '讨论项目进度'
          }
        ],
        summary: '今日主要完成文档编写，参加了一个紧急会议',
        mood: 'productive'
      };

      const response = await request(app)
        .post('/api/work-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(logData);

      expect(response.status).toBe(201);
      expect(response.body.date).toBe('2024-01-15');
      expect(response.body.plannedTasks).toHaveLength(1);
      expect(response.body.unplannedTasks).toHaveLength(1);
    });

    test('TC093: 生成周报', async () => {
      const response = await request(app)
        .post('/api/reports/weekly')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          year: 2024,
          week: 3,
          autoGenerate: true
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('weeklyReport');
      expect(response.body.weeklyReport).toHaveProperty('summary');
      expect(response.body.weeklyReport).toHaveProperty('achievements');
      expect(response.body.weeklyReport).toHaveProperty('challenges');
    });

    test('TC094: 编辑周报', async () => {
      const reportId = 1; // 假设已有报告ID
      const updateData = {
        summary: '本周主要完成了项目文档编写工作，进度良好',
        achievements: ['完成技术文档', '参与团队会议'],
        challenges: ['时间管理需要改进'],
        nextWeekPlans: ['继续完善文档', '开始代码审查']
      };

      const response = await request(app)
        .patch(`/api/reports/weekly/${reportId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.summary).toBe(updateData.summary);
    });
  });

  // 数据可视化测试
  describe('📊 数据可视化 API', () => {
    test('TC103: 获取时间线数据', async () => {
      const response = await request(app)
        .get('/api/visualization/timeline')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          granularity: 'month'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('timelineData');
      expect(Array.isArray(response.body.timelineData)).toBe(true);
    });

    test('TC107: 获取时间分布统计', async () => {
      const response = await request(app)
        .get('/api/visualization/time-distribution')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          period: 'month',
          year: 2024,
          month: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
      expect(response.body).toHaveProperty('timeSpent');
    });

    test('TC110: 获取完成情况统计', async () => {
      const response = await request(app)
        .get('/api/visualization/completion-stats')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          period: 'quarter',
          year: 2024,
          quarter: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('completionRate');
      expect(response.body).toHaveProperty('taskStats');
    });
  });

  // 性能测试
  describe('⚡ 性能测试', () => {
    test('TC123: API响应时间测试', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 100 });

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // 响应时间小于500ms
    });

    test('TC124: 大数据量查询性能', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/time-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          limit: 1000
        });

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // 大数据量查询小于2秒
    });

    test('TC125: 并发请求测试', async () => {
      const promises = [];
      const concurrentRequests = 10;

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  // 安全性测试
  describe('🔒 安全性测试', () => {
    test('TC136: SQL注入防护', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: maliciousInput });

      expect(response.status).toBe(200);
      // 确保没有发生SQL注入，正常返回结果
    });

    test('TC137: XSS防护', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: xssPayload,
          description: 'Test task'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('无效字符');
    });

    test('TC138: 权限控制测试', async () => {
      // 尝试访问其他用户的数据
      const response = await request(app)
        .get('/api/tasks/999999') // 不存在或不属于当前用户的任务
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    test('TC139: 敏感信息泄露检查', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });
  });

  // 测试后清理
  afterAll(async () => {
    // 清理测试数据
    if (timeLogId) {
      await request(app)
        .delete(`/api/time-logs/${timeLogId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
    
    if (taskId) {
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
    
    if (planId) {
      await request(app)
        .delete(`/api/plans/${planId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }

    // 删除测试用户
    await request(app)
      .delete('/api/auth/user')
      .set('Authorization', `Bearer ${authToken}`);
  });
});

// 测试工具函数
const TestUtils = {
  // 生成测试数据
  generateTestPlan: (type = 'yearly') => ({
    title: `测试${type}计划`,
    description: `这是一个${type}测试计划`,
    type,
    startDate: '2024-01-01',
    endDate: type === 'yearly' ? '2024-12-31' : '2024-06-30'
  }),

  generateTestTask: (planId) => ({
    title: '测试任务',
    description: '这是一个测试任务',
    priority: 'medium',
    category: '测试',
    tags: ['测试', '自动化'],
    planId
  }),

  // 等待异步操作
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // 验证响应格式
  validateApiResponse: (response, expectedFields) => {
    expectedFields.forEach(field => {
      expect(response.body).toHaveProperty(field);
    });
  },

  // 生成随机字符串
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  }
};

module.exports = TestUtils;