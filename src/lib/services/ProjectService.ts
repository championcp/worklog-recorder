import { getDatabase } from '@/lib/db/client';
import type { 
  Project, 
  CreateProjectInput, 
  UpdateProjectInput,
  ProjectStats
} from '@/types/project';

export class ProjectService {
  private db = getDatabase();

  /**
   * 创建新项目
   */
  async createProject(userId: number, input: CreateProjectInput): Promise<Project> {
    const { name, description, color = '#1976d2' } = input;

    const stmt = this.db.prepare(`
      INSERT INTO projects (user_id, name, description, color)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(userId, name, description, color);
    const projectId = result.lastInsertRowid as number;

    const project = this.findProjectById(userId, projectId);
    if (!project) {
      throw new Error('项目创建失败');
    }

    return project;
  }

  /**
   * 获取用户的所有项目
   */
  findUserProjects(userId: number, includeInactive = false): Project[] {
    const whereClause = includeInactive 
      ? 'WHERE user_id = ? AND is_deleted = 0'
      : 'WHERE user_id = ? AND is_active = 1 AND is_deleted = 0';

    const stmt = this.db.prepare(`
      SELECT * FROM projects 
      ${whereClause}
      ORDER BY updated_at DESC
    `);

    return stmt.all(userId) as Project[];
  }

  /**
   * 根据ID获取项目
   */
  findProjectById(userId: number, projectId: number): Project | null {
    const stmt = this.db.prepare(`
      SELECT * FROM projects 
      WHERE id = ? AND user_id = ? AND is_deleted = 0
    `);

    const project = stmt.get(projectId, userId) as Project | undefined;
    return project || null;
  }

  /**
   * 更新项目
   */
  async updateProject(userId: number, projectId: number, input: UpdateProjectInput): Promise<Project> {
    const project = this.findProjectById(userId, projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.color !== undefined) {
      updates.push('color = ?');
      values.push(input.color);
    }
    if (input.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(input.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return project;
    }

    updates.push('sync_version = sync_version + 1');
    values.push(projectId, userId);

    const stmt = this.db.prepare(`
      UPDATE projects 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(...values);

    const updatedProject = this.findProjectById(userId, projectId);
    if (!updatedProject) {
      throw new Error('项目更新失败');
    }

    return updatedProject;
  }

  /**
   * 删除项目（软删除）
   */
  async deleteProject(userId: number, projectId: number): Promise<void> {
    const project = this.findProjectById(userId, projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    // 软删除项目
    const stmt = this.db.prepare(`
      UPDATE projects 
      SET is_deleted = 1, sync_version = sync_version + 1 
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(projectId, userId);

    // 同时软删除项目下的所有任务
    const deleteTasksStmt = this.db.prepare(`
      UPDATE wbs_tasks 
      SET is_deleted = 1, sync_version = sync_version + 1 
      WHERE project_id = ?
    `);

    deleteTasksStmt.run(projectId);
  }

  /**
   * 获取项目统计信息
   */
  getProjectStats(userId: number, projectId: number): ProjectStats | null {
    const stmt = this.db.prepare(`
      SELECT 
        p.id as project_id,
        COUNT(DISTINCT wt.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN wt.status = 'completed' THEN wt.id END) as completed_tasks,
        COUNT(DISTINCT CASE WHEN wt.status = 'in_progress' THEN wt.id END) as in_progress_tasks,
        ROUND(AVG(wt.progress_percentage), 2) as avg_progress,
        SUM(COALESCE(wt.estimated_hours, 0)) as total_estimated_hours,
        SUM(COALESCE(wt.actual_hours, 0)) as total_actual_hours
      FROM projects p
      LEFT JOIN wbs_tasks wt ON p.id = wt.project_id AND wt.is_deleted = 0
      WHERE p.id = ? AND p.user_id = ? AND p.is_deleted = 0
      GROUP BY p.id
    `);

    const stats = stmt.get(projectId, userId) as ProjectStats | undefined;
    return stats || null;
  }

  /**
   * 检查项目是否属于用户
   */
  checkProjectOwnership(userId: number, projectId: number): boolean {
    const stmt = this.db.prepare(`
      SELECT 1 FROM projects 
      WHERE id = ? AND user_id = ? AND is_deleted = 0
    `);

    return !!stmt.get(projectId, userId);
  }

  /**
   * 激活/停用项目
   */
  async toggleProjectStatus(userId: number, projectId: number): Promise<Project> {
    const project = this.findProjectById(userId, projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const stmt = this.db.prepare(`
      UPDATE projects 
      SET is_active = ?, sync_version = sync_version + 1
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(project.is_active ? 0 : 1, projectId, userId);

    const updatedProject = this.findProjectById(userId, projectId);
    if (!updatedProject) {
      throw new Error('项目状态更新失败');
    }

    return updatedProject;
  }

  /**
   * 搜索项目
   */
  searchProjects(userId: number, query: string): Project[] {
    const stmt = this.db.prepare(`
      SELECT * FROM projects 
      WHERE user_id = ? AND is_deleted = 0 
        AND (name LIKE ? OR description LIKE ?)
      ORDER BY 
        CASE WHEN name LIKE ? THEN 1 ELSE 2 END,
        updated_at DESC
    `);

    const searchTerm = `%${query}%`;
    const exactSearchTerm = `${query}%`;
    
    return stmt.all(userId, searchTerm, searchTerm, exactSearchTerm) as Project[];
  }
}