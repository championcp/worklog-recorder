import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { taskRoutes } from './routes/tasks';
import { categoryRoutes } from './routes/categories';
import { tagRoutes } from './routes/tags';
import { planRoutes } from './routes/plans';
import { timeLogRoutes } from './routes/timeLogs';
import { reminderRoutes } from './routes/reminders';
import { templateRoutes } from './routes/templates';
import { reportRoutes } from './routes/reports';
import { statisticsRoutes } from './routes/statistics';
import { initDatabase } from './database/init';
import { startReminderService } from './services/reminderService';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// 信任代理设置（用于rate-limit）
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// 压缩响应
app.use(compression());

// 请求日志
app.use(morgan('combined'));

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api', limiter);

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/time-logs', timeLogRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/statistics', statisticsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();
    console.log('✅ 数据库初始化完成');

    // 启动提醒服务
    startReminderService();
    console.log('✅ 提醒服务启动完成');

    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📊 API文档: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

startServer();