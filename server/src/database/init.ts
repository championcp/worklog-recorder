import fs from 'fs';
import path from 'path';
import { db } from './config';

export async function initDatabase() {
  try {
    // 确保数据目录存在
    const dataDir = path.dirname(process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite'));
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 创建用户表
    await db.schema.hasTable('users').then(async (exists) => {
      if (!exists) {
        await db.schema.createTable('users', (table) => {
          table.string('id').primary();
          table.string('username').unique().notNullable();
          table.string('email').unique().notNullable();
          table.string('password_hash').notNullable();
          table.timestamps(true, true);
        });
        console.log('✅ 用户表创建完成');
      }
    });

    // 创建分类表
    await db.schema.hasTable('categories').then(async (exists) => {
      if (!exists) {
        await db.schema.createTable('categories', (table) => {
          table.string('id').primary();
          table.string('name').notNullable();
          table.string('color').notNullable();
          table.text('description');
          table.string('user_id').notNullable();
          table.timestamps(true, true);
          table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        });
        console.log('✅ 分类表创建完成');
      }
    });

    // 创建标签表
    await db.schema.hasTable('tags').then(async (exists) => {
      if (!exists) {
        await db.schema.createTable('tags', (table) => {
          table.string('id').primary();
          table.string('name').notNullable();
          table.string('color').notNullable();
          table.string('user_id').notNullable();
          table.timestamps(true, true);
          table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        });
        console.log('✅ 标签表创建完成');
      }
    });

    // 创建任务表
    await db.schema.hasTable('tasks').then(async (exists) => {
      if (!exists) {
        await db.schema.createTable('tasks', (table) => {
          table.string('id').primary();
          table.string('title').notNullable();
          table.text('description');
          table.enum('status', ['pending', 'in_progress', 'completed', 'cancelled']).defaultTo('pending');
          table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
          table.string('category_id');
          table.datetime('start_date');
          table.datetime('end_date');
          table.datetime('due_date');
          table.integer('estimated_hours');
          table.integer('actual_hours');
          table.string('user_id').notNullable();
          table.string('parent_task_id');
          table.timestamps(true, true);
          table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
          table.foreign('category_id').references('id').inTable('categories').onDelete('SET NULL');
          table.foreign('parent_task_id').references('id').inTable('tasks').onDelete('CASCADE');
        });
        console.log('✅ 任务表创建完成');
      }
    });

    // 创建任务标签关联表
    await db.schema.hasTable('task_tags').then(async (exists) => {
      if (!exists) {
        await db.schema.createTable('task_tags', (table) => {
          table.string('task_id').notNullable();
          table.string('tag_id').notNullable();
          table.primary(['task_id', 'tag_id']);
          table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
          table.foreign('tag_id').references('id').inTable('tags').onDelete('CASCADE');
        });
        console.log('✅ 任务标签关联表创建完成');
      }
    });

    // 创建计划表
    await db.schema.hasTable('plans').then(async (exists) => {
      if (!exists) {
        await db.schema.createTable('plans', (table) => {
          table.string('id').primary();
          table.string('title').notNullable();
          table.text('description');
          table.enum('time_range', ['day', 'week', 'month', 'year']).notNullable();
          table.datetime('start_date').notNullable();
          table.datetime('end_date').notNullable();
          table.string('parent_plan_id'); // WBS层级关系
          table.string('user_id').notNullable();
          table.timestamps(true, true);
          table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
          table.foreign('parent_plan_id').references('id').inTable('plans').onDelete('CASCADE');
        });
        console.log('✅ 计划表创建完成');
      } else {
        // 检查并添加缺失的列
        const hasParentPlanId = await db.schema.hasColumn('plans', 'parent_plan_id');
        if (!hasParentPlanId) {
          await db.schema.alterTable('plans', (table) => {
            table.string('parent_plan_id');
          });
          console.log('✅ 添加 parent_plan_id 列到计划表');
        }
      }
    });

    // 创建计划任务关联表
    await db.schema.hasTable('plan_tasks').then(async (exists) => {
      if (!exists) {
        await db.schema.createTable('plan_tasks', (table) => {
          table.string('plan_id').notNullable();
          table.string('task_id').notNullable();
          table.primary(['plan_id', 'task_id']);
          table.foreign('plan_id').references('id').inTable('plans').onDelete('CASCADE');
          table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
        });
        console.log('✅ 计划任务关联表创建完成');
      }
    });

    // 创建时间记录表
    await db.schema.hasTable('time_logs').then(async (exists) => {
      if (!exists) {
        await db.schema.createTable('time_logs', (table) => {
          table.string('id').primary();
          table.string('title').notNullable();
          table.text('description');
          table.string('category_id');
          table.string('task_id');
          table.datetime('start_time').notNullable();
          table.datetime('end_time');
          table.integer('duration'); // 秒
          table.boolean('is_running').defaultTo(false);
          table.string('user_id').notNullable();
          table.timestamps(true, true);
          table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
          table.foreign('category_id').references('id').inTable('categories').onDelete('SET NULL');
          table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        });
        console.log('✅ 时间记录表创建完成');
      } else {
        // 检查并添加缺失的列
        const hasTitle = await db.schema.hasColumn('time_logs', 'title');
        if (!hasTitle) {
          await db.schema.alterTable('time_logs', (table) => {
            table.string('title').notNullable().defaultTo('时间记录');
          });
          console.log('✅ 添加 title 列到时间记录表');
        }

        const hasIsRunning = await db.schema.hasColumn('time_logs', 'is_running');
        if (!hasIsRunning) {
          await db.schema.alterTable('time_logs', (table) => {
            table.boolean('is_running').defaultTo(false);
          });
          console.log('✅ 添加 is_running 列到时间记录表');
        }

        const hasCategoryId = await db.schema.hasColumn('time_logs', 'category_id');
        if (!hasCategoryId) {
          await db.schema.alterTable('time_logs', (table) => {
            table.string('category_id');
          });
          console.log('✅ 添加 category_id 列到时间记录表');
        }

        // 检查 task_id 是否允许为空
        const taskIdInfo = await db.raw("PRAGMA table_info(time_logs)");
        const taskIdColumn = taskIdInfo.find((col: any) => col.name === 'task_id');
        if (taskIdColumn && taskIdColumn.notnull === 1) {
          // SQLite 不支持直接修改列的 NOT NULL 约束，需要重建表
          console.log('⚠️  需要手动处理 task_id 列的 NOT NULL 约束');
        }
      }
    });

    // 创建提醒表
    await db.schema.hasTable('reminders').then(async (exists) => {
      if (!exists) {
        await db.schema.createTable('reminders', (table) => {
          table.string('id').primary();
          table.string('task_id').notNullable();
          table.datetime('reminder_time').notNullable();
          table.string('message').notNullable();
          table.boolean('is_recurring').defaultTo(false);
          table.string('recurring_pattern'); // cron表达式
          table.boolean('is_active').defaultTo(true);
          table.string('user_id').notNullable();
          table.timestamps(true, true);
          table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
          table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        });
        console.log('✅ 提醒表创建完成');
      }
    });

    // 创建模板表
    await db.schema.hasTable('templates').then(async (exists) => {
      if (!exists) {
        await db.schema.createTable('templates', (table) => {
          table.string('id').primary();
          table.string('name').notNullable();
          table.enum('type', ['task', 'plan']).notNullable();
          table.json('content').notNullable();
          table.string('user_id').notNullable();
          table.timestamps(true, true);
          table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        });
        console.log('✅ 模板表创建完成');
      }
    });

    // 创建报告表
    await db.schema.hasTable('reports').then(async (exists) => {
      if (!exists) {
        await db.schema.createTable('reports', (table) => {
          table.string('id').primary();
          table.string('title').notNullable();
          table.string('type').notNullable(); // 'daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual'
          table.text('content').notNullable();
          table.date('start_date').notNullable();
          table.date('end_date').notNullable();
          table.text('statistics'); // JSON格式的统计数据
          table.boolean('is_auto_generated').defaultTo(false);
          table.string('user_id').notNullable();
          table.timestamps(true, true);
          
          table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        });
        console.log('✅ 报告表创建完成');
      }
    });

    console.log('🎉 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}