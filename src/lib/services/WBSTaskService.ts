import Database from 'better-sqlite3';
import { getDatabase } from '../db/client';
import type { WBSTask, CreateWBSTaskInput, UpdateWBSTaskInput, WBSTaskTree } from '@/types/project';

export class WBSTaskService {
  private db = getDatabase();

  // 创建WBS任务
  async createWBSTask(userId: number, input: CreateWBSTaskInput): Promise<WBSTask> {
    const { 
      project_id, 
      parent_id, 
      name, 
      description, 
      level_type, 
      start_date, 
      end_date, 
      estimated_hours, 
      priority = 'medium' 
    } = input;

    // 验证项目是否属于用户
    const projectCheck = this.db.prepare(`
      SELECT id FROM projects WHERE id = ? AND user_id = ? AND is_deleted = 0
    `).get(project_id, userId);

    if (!projectCheck) {
      throw new Error('项目不存在或没有权限');
    }

    // 验证父任务（如果有）
    if (parent_id) {
      const parentTask = this.db.prepare(`
        SELECT level FROM wbs_tasks 
        WHERE id = ? AND project_id = ? AND is_deleted = 0
      `).get(parent_id, project_id) as { level: number } | undefined;

      if (!parentTask) {
        throw new Error('父任务不存在');
      }

      // 验证层级限制（最多3级）
      if (parentTask.level >= 3) {
        throw new Error('任务层级不能超过3级');
      }
    }

    // 计算任务层级和排序
    const level = parent_id ? 
      ((this.db.prepare(`SELECT level FROM wbs_tasks WHERE id = ? AND is_deleted = 0`).get(parent_id) as {level: number} | undefined)?.level || 0) + 1 
      : 1;

    // 获取下一个排序号
    const maxSort = this.db.prepare(`
      SELECT COALESCE(MAX(sort_order), 0) as max_sort 
      FROM wbs_tasks 
      WHERE project_id = ? AND parent_id ${parent_id ? '= ?' : 'IS NULL'} AND is_deleted = 0
    `).get(parent_id ? [project_id, parent_id] : [project_id]) as { max_sort: number } | undefined;

    const sort_order = (maxSort?.max_sort || 0) + 1;

    // 生成WBS编码
    const wbs_code = await this.generateWBSCode(project_id, parent_id, sort_order);

    // 插入任务
    const stmt = this.db.prepare(`
      INSERT INTO wbs_tasks (
        project_id, parent_id, wbs_code, name, description, level, level_type,
        sort_order, start_date, end_date, estimated_hours, actual_hours,
        status, progress_percentage, priority, created_at, updated_at, sync_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'not_started', 0, ?, datetime('now'), datetime('now'), 1)
    `);

    const result = stmt.run(
      project_id, parent_id, wbs_code, name, description, level, level_type,
      sort_order, start_date, end_date, estimated_hours, priority
    );

    const taskId = result.lastInsertRowid as number;

    // 返回创建的任务
    return this.findWBSTaskById(taskId)!;
  }

  // 生成WBS编码
  private async generateWBSCode(projectId: number, parentId: number | undefined, sortOrder: number): Promise<string> {
    if (!parentId) {
      // 根任务：直接使用排序号
      return sortOrder.toString();
    }

    // 子任务：获取父任务的编码
    const parent = this.db.prepare(`
      SELECT wbs_code FROM wbs_tasks WHERE id = ? AND is_deleted = 0
    `).get(parentId) as { wbs_code: string } | undefined;

    if (!parent) {
      throw new Error('父任务不存在');
    }

    return `${parent.wbs_code}.${sortOrder}`;
  }

  // 根据ID查找WBS任务
  findWBSTaskById(taskId: number): WBSTask | null {
    const stmt = this.db.prepare(`
      SELECT * FROM wbs_tasks WHERE id = ? AND is_deleted = 0
    `);
    return stmt.get(taskId) as WBSTask | null;
  }

  // 获取项目的WBS任务列表
  findProjectWBSTasks(userId: number, projectId: number): WBSTask[] {
    // 验证项目权限
    const projectCheck = this.db.prepare(`
      SELECT id FROM projects WHERE id = ? AND user_id = ? AND is_deleted = 0
    `).get(projectId, userId);

    if (!projectCheck) {
      throw new Error('项目不存在或没有权限');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM wbs_tasks 
      WHERE project_id = ? AND is_deleted = 0 
      ORDER BY level ASC, sort_order ASC
    `);
    return stmt.all(projectId) as WBSTask[];
  }

  // 获取WBS任务树形结构
  getWBSTaskTree(userId: number, projectId: number): WBSTaskTree[] {
    const tasks = this.findProjectWBSTasks(userId, projectId);
    return this.buildTaskTree(tasks);
  }

  // 构建任务树形结构
  private buildTaskTree(tasks: WBSTask[]): WBSTaskTree[] {
    const taskMap = new Map<number, WBSTaskTree>();
    const rootTasks: WBSTaskTree[] = [];

    // 将所有任务添加到Map中
    tasks.forEach(task => {
      taskMap.set(task.id, {
        ...task,
        children: [],
        full_path: task.wbs_code,
        depth: task.level
      });
    });

    // 构建树形结构
    tasks.forEach(task => {
      const taskNode = taskMap.get(task.id)!;
      
      if (task.parent_id) {
        const parent = taskMap.get(task.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(taskNode);
        }
      } else {
        rootTasks.push(taskNode);
      }
    });

    return rootTasks;
  }

  // 更新WBS任务
  async updateWBSTask(userId: number, taskId: number, input: UpdateWBSTaskInput): Promise<WBSTask> {
    // 验证任务存在和权限
    const task = this.db.prepare(`
      SELECT t.*, p.user_id 
      FROM wbs_tasks t 
      JOIN projects p ON t.project_id = p.id 
      WHERE t.id = ? AND t.is_deleted = 0 AND p.is_deleted = 0
    `).get(taskId) as (WBSTask & { user_id: number }) | undefined;

    if (!task || task.user_id !== userId) {
      throw new Error('任务不存在或没有权限');
    }

    const { 
      name, 
      description, 
      start_date, 
      end_date, 
      estimated_hours, 
      status, 
      progress_percentage, 
      priority 
    } = input;

    // 构建更新语句
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (start_date !== undefined) {
      updateFields.push('start_date = ?');
      updateValues.push(start_date);
    }
    if (end_date !== undefined) {
      updateFields.push('end_date = ?');
      updateValues.push(end_date);
    }
    if (estimated_hours !== undefined) {
      updateFields.push('estimated_hours = ?');
      updateValues.push(estimated_hours);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
      
      // 如果状态改为完成，自动设置完成时间
      if (status === 'completed') {
        updateFields.push('completed_at = ?');
        updateValues.push(new Date().toISOString());
        
        // 如果进度百分比未设置，自动设为100%
        if (progress_percentage === undefined) {
          updateFields.push('progress_percentage = ?');
          updateValues.push(100);
        }
      }
    }
    if (progress_percentage !== undefined) {
      updateFields.push('progress_percentage = ?');
      updateValues.push(progress_percentage);
    }
    if (priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(priority);
    }

    if (updateFields.length === 0) {
      return this.findWBSTaskById(taskId)!;
    }

    // 添加更新时间和同步版本
    updateFields.push('updated_at = ?', 'sync_version = sync_version + 1');
    updateValues.push(new Date().toISOString());
    updateValues.push(taskId);

    const stmt = this.db.prepare(`
      UPDATE wbs_tasks 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `);

    stmt.run(...updateValues);

    return this.findWBSTaskById(taskId)!;
  }

  // 删除WBS任务
  async deleteWBSTask(userId: number, taskId: number): Promise<void> {
    // 验证任务存在和权限
    const task = this.db.prepare(`
      SELECT t.*, p.user_id 
      FROM wbs_tasks t 
      JOIN projects p ON t.project_id = p.id 
      WHERE t.id = ? AND t.is_deleted = 0 AND p.is_deleted = 0
    `).get(taskId) as (WBSTask & { user_id: number }) | undefined;

    if (!task || task.user_id !== userId) {
      throw new Error('任务不存在或没有权限');
    }

    // 检查是否有子任务
    const childCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM wbs_tasks 
      WHERE parent_id = ? AND is_deleted = 0
    `).get(taskId) as { count: number } | undefined;

    if ((childCount?.count || 0) > 0) {
      throw new Error('请先删除所有子任务');
    }

    // 软删除任务
    const stmt = this.db.prepare(`
      UPDATE wbs_tasks 
      SET is_deleted = 1, updated_at = ?, sync_version = sync_version + 1 
      WHERE id = ?
    `);

    stmt.run(new Date().toISOString(), taskId);
  }

  // 获取任务统计信息
  getWBSTaskStats(userId: number, projectId: number): {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    not_started_tasks: number;
    avg_progress: number;
    total_estimated_hours: number;
    total_actual_hours: number;
  } {
    // 验证项目权限
    const projectCheck = this.db.prepare(`
      SELECT id FROM projects WHERE id = ? AND user_id = ? AND is_deleted = 0
    `).get(projectId, userId);

    if (!projectCheck) {
      throw new Error('项目不存在或没有权限');
    }

    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) as not_started_tasks,
        AVG(progress_percentage) as avg_progress,
        SUM(COALESCE(estimated_hours, 0)) as total_estimated_hours,
        SUM(actual_hours) as total_actual_hours
      FROM wbs_tasks 
      WHERE project_id = ? AND is_deleted = 0
    `).get(projectId) as {
      total_tasks: number;
      completed_tasks: number;
      in_progress_tasks: number;
      not_started_tasks: number;
      avg_progress: number;
      total_estimated_hours: number;
      total_actual_hours: number;
    } | undefined;

    return {
      total_tasks: stats?.total_tasks || 0,
      completed_tasks: stats?.completed_tasks || 0,
      in_progress_tasks: stats?.in_progress_tasks || 0,
      not_started_tasks: stats?.not_started_tasks || 0,
      avg_progress: Math.round(stats?.avg_progress || 0),
      total_estimated_hours: stats?.total_estimated_hours || 0,
      total_actual_hours: stats?.total_actual_hours || 0
    };
  }
}