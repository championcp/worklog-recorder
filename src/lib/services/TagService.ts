import Database from 'better-sqlite3';
import path from 'path';

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTagInput {
  name: string;
  color: string;
  icon?: string;
  description?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
  icon?: string;
  description?: string;
}

export interface TagUsageStats {
  tag: Tag;
  tasks: Array<{
    id: number;
    name: string;
    project_name: string;
  }>;
  usage_trend: Array<{
    date: string;
    count: number;
  }>;
}

export class TagService {
  private db: Database.Database;
  
  constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'nobody-logger.db');
    this.db = new Database(dbPath);
  }

  /**
   * 获取用户的所有标签
   */
  findUserTags(userId: number, sortBy: 'name' | 'usage' | 'created' = 'name'): Tag[] {
    let orderClause = 'ORDER BY name ASC';
    
    switch (sortBy) {
      case 'usage':
        orderClause = 'ORDER BY usage_count DESC, name ASC';
        break;
      case 'created':
        orderClause = 'ORDER BY created_at DESC';
        break;
      default:
        orderClause = 'ORDER BY name ASC';
    }
    
    const query = `
      SELECT * FROM tags 
      WHERE user_id = ? AND is_deleted = 0 
      ${orderClause}
    `;
    
    return this.db.prepare(query).all(userId) as Tag[];
  }

  /**
   * 根据ID获取标签
   */
  findTagById(id: number, userId: number): Tag | null {
    const query = `
      SELECT * FROM tags 
      WHERE id = ? AND user_id = ? AND is_deleted = 0
    `;
    
    return this.db.prepare(query).get(id, userId) as Tag | null;
  }

  /**
   * 创建新标签
   */
  async createTag(userId: number, input: CreateTagInput): Promise<Tag> {
    // 检查名称唯一性（同一用户下，不区分大小写）
    const existingQuery = `
      SELECT id FROM tags 
      WHERE user_id = ? AND LOWER(name) = LOWER(?) AND is_deleted = 0
    `;
    const existing = this.db.prepare(existingQuery).get(userId, input.name);
    if (existing) {
      throw new Error('标签名称已存在');
    }

    const insertQuery = `
      INSERT INTO tags (user_id, name, color, icon, description, usage_count) 
      VALUES (?, ?, ?, ?, ?, 0)
    `;

    const result = this.db.prepare(insertQuery).run(
      userId,
      input.name,
      input.color,
      input.icon || null,
      input.description || null
    );

    const tag = this.findTagById(result.lastInsertRowid as number, userId);
    if (!tag) {
      throw new Error('创建标签失败');
    }

    return tag;
  }

  /**
   * 更新标签
   */
  async updateTag(id: number, userId: number, input: UpdateTagInput): Promise<Tag> {
    const tag = this.findTagById(id, userId);
    if (!tag) {
      throw new Error('标签不存在');
    }

    // 检查名称唯一性（如果更改了名称）
    if (input.name && input.name.toLowerCase() !== tag.name.toLowerCase()) {
      const existingQuery = `
        SELECT id FROM tags 
        WHERE user_id = ? AND LOWER(name) = LOWER(?) AND id != ? AND is_deleted = 0
      `;
      const existing = this.db.prepare(existingQuery).get(userId, input.name, id);
      if (existing) {
        throw new Error('标签名称已存在');
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (input.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(input.name);
    }
    if (input.color !== undefined) {
      updateFields.push('color = ?');
      updateValues.push(input.color);
    }
    if (input.icon !== undefined) {
      updateFields.push('icon = ?');
      updateValues.push(input.icon);
    }
    if (input.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(input.description);
    }

    if (updateFields.length === 0) {
      return tag;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id, userId);

    const updateQuery = `
      UPDATE tags 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND user_id = ?
    `;

    this.db.prepare(updateQuery).run(...updateValues);

    const updatedTag = this.findTagById(id, userId);
    if (!updatedTag) {
      throw new Error('更新标签失败');
    }

    return updatedTag;
  }

  /**
   * 删除标签（软删除）
   */
  async deleteTag(id: number, userId: number): Promise<void> {
    const tag = this.findTagById(id, userId);
    if (!tag) {
      throw new Error('标签不存在');
    }

    const transaction = this.db.transaction(() => {
      // 删除所有任务关联
      const deleteAssociationsQuery = `
        DELETE FROM task_tags WHERE tag_id = ?
      `;
      this.db.prepare(deleteAssociationsQuery).run(id);

      // 软删除标签
      const deleteQuery = `
        UPDATE tags 
        SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `;
      this.db.prepare(deleteQuery).run(id, userId);
    });

    transaction();
  }

  /**
   * 搜索标签
   */
  searchTags(userId: number, query: string): Tag[] {
    const searchQuery = `
      SELECT * FROM tags 
      WHERE user_id = ? 
        AND is_deleted = 0 
        AND (name LIKE ? OR description LIKE ?)
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1
          WHEN description LIKE ? THEN 2
          ELSE 3
        END,
        usage_count DESC,
        name ASC
    `;
    
    const searchTerm = `%${query}%`;
    const exactTerm = `${query}%`;
    
    return this.db.prepare(searchQuery).all(
      userId, searchTerm, searchTerm, exactTerm, exactTerm
    ) as Tag[];
  }

  /**
   * 获取热门标签（使用频率最高的标签）
   */
  getPopularTags(userId: number, limit = 10): Tag[] {
    const query = `
      SELECT * FROM tags 
      WHERE user_id = ? AND is_deleted = 0 AND usage_count > 0
      ORDER BY usage_count DESC, name ASC
      LIMIT ?
    `;
    
    return this.db.prepare(query).all(userId, limit) as Tag[];
  }

  /**
   * 获取最近使用的标签
   */
  getRecentlyUsedTags(userId: number, limit = 10): Tag[] {
    const query = `
      SELECT * FROM tags 
      WHERE user_id = ? AND is_deleted = 0 AND last_used_at IS NOT NULL
      ORDER BY last_used_at DESC, name ASC
      LIMIT ?
    `;
    
    return this.db.prepare(query).all(userId, limit) as Tag[];
  }

  /**
   * 为任务添加标签
   */
  async addTagToTask(taskId: number, tagId: number, userId: number): Promise<void> {
    // 验证标签所有权
    const tag = this.findTagById(tagId, userId);
    if (!tag) {
      throw new Error('标签不存在或无权限');
    }

    // 验证任务存在且属于该用户
    const taskQuery = `
      SELECT id FROM wbs_tasks 
      WHERE id = ? AND project_id IN (
        SELECT id FROM projects WHERE user_id = ?
      ) AND is_deleted = 0
    `;
    const task = this.db.prepare(taskQuery).get(taskId, userId);
    if (!task) {
      throw new Error('任务不存在或无权限');
    }

    // 检查是否已经关联
    const existingQuery = `
      SELECT id FROM task_tags WHERE task_id = ? AND tag_id = ?
    `;
    const existing = this.db.prepare(existingQuery).get(taskId, tagId);
    if (existing) {
      return; // 已经关联，不需要重复添加
    }

    // 添加关联（触发器会自动更新usage_count和last_used_at）
    const insertQuery = `
      INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)
    `;
    this.db.prepare(insertQuery).run(taskId, tagId);
  }

  /**
   * 从任务移除标签
   */
  async removeTagFromTask(taskId: number, tagId: number, userId: number): Promise<void> {
    // 验证标签所有权
    const tag = this.findTagById(tagId, userId);
    if (!tag) {
      throw new Error('标签不存在或无权限');
    }

    // 移除关联（触发器会自动更新usage_count）
    const deleteQuery = `
      DELETE FROM task_tags 
      WHERE task_id = ? AND tag_id = ?
    `;
    this.db.prepare(deleteQuery).run(taskId, tagId);
  }

  /**
   * 获取任务的所有标签
   */
  getTaskTags(taskId: number, userId: number): Tag[] {
    const query = `
      SELECT t.* FROM tags t
      INNER JOIN task_tags tt ON t.id = tt.tag_id
      WHERE tt.task_id = ? AND t.user_id = ? AND t.is_deleted = 0
      ORDER BY t.name ASC
    `;
    
    return this.db.prepare(query).all(taskId, userId) as Tag[];
  }

  /**
   * 批量为任务添加标签
   */
  async addTagsToTask(taskId: number, tagIds: number[], userId: number): Promise<void> {
    const transaction = this.db.transaction(() => {
      for (const tagId of tagIds) {
        // 使用try-catch避免重复添加时的错误
        try {
          this.addTagToTask(taskId, tagId, userId);
        } catch (err) {
          // 忽略已存在的关联
          if (err instanceof Error && !err.message.includes('已经关联')) {
            throw err;
          }
        }
      }
    });

    await transaction();
  }

  /**
   * 批量从任务移除标签
   */
  async removeTagsFromTask(taskId: number, tagIds: number[], userId: number): Promise<void> {
    const transaction = this.db.transaction(() => {
      for (const tagId of tagIds) {
        this.removeTagFromTask(taskId, tagId, userId);
      }
    });

    await transaction();
  }

  /**
   * 获取标签的使用统计
   */
  getTagUsageStats(tagId: number, userId: number): TagUsageStats | null {
    const tag = this.findTagById(tagId, userId);
    if (!tag) {
      return null;
    }

    // 获取使用该标签的任务
    const tasksQuery = `
      SELECT 
        wt.id,
        wt.name,
        p.name as project_name
      FROM wbs_tasks wt
      INNER JOIN task_tags tt ON wt.id = tt.task_id
      INNER JOIN projects p ON wt.project_id = p.id
      WHERE tt.tag_id = ? 
        AND p.user_id = ? 
        AND wt.is_deleted = 0 
        AND p.is_deleted = 0
      ORDER BY wt.name ASC
    `;
    const tasks = this.db.prepare(tasksQuery).all(tagId, userId) as Array<{
      id: number;
      name: string;
      project_name: string;
    }>;

    // 获取最近30天的使用趋势（简化版本，实际可以基于task_tags的created_at）
    const trendQuery = `
      SELECT 
        DATE(tt.created_at) as date,
        COUNT(*) as count
      FROM task_tags tt
      INNER JOIN wbs_tasks wt ON tt.task_id = wt.id
      INNER JOIN projects p ON wt.project_id = p.id
      WHERE tt.tag_id = ? 
        AND p.user_id = ?
        AND tt.created_at >= DATE('now', '-30 days')
      GROUP BY DATE(tt.created_at)
      ORDER BY date DESC
    `;
    const usageTrend = this.db.prepare(trendQuery).all(tagId, userId) as Array<{
      date: string;
      count: number;
    }>;

    return {
      tag,
      tasks,
      usage_trend: usageTrend
    };
  }

  /**
   * 清理未使用的标签
   */
  async cleanupUnusedTags(userId: number, daysUnused = 30): Promise<number> {
    const query = `
      UPDATE tags 
      SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? 
        AND usage_count = 0 
        AND created_at < DATE('now', '-${daysUnused} days')
        AND is_deleted = 0
    `;
    
    const result = this.db.prepare(query).run(userId);
    return result.changes;
  }

  /**
   * 获取标签建议（基于任务内容的智能推荐）
   */
  getSuggestedTags(userId: number, taskName: string, taskDescription?: string): Tag[] {
    const content = `${taskName} ${taskDescription || ''}`.toLowerCase();
    
    // 简单的关键词匹配推荐
    const query = `
      SELECT DISTINCT t.* FROM tags t
      WHERE t.user_id = ? 
        AND t.is_deleted = 0
        AND (
          INSTR(LOWER(?), LOWER(t.name)) > 0 
          OR INSTR(LOWER(?), LOWER(COALESCE(t.description, ''))) > 0
        )
      ORDER BY t.usage_count DESC, t.name ASC
      LIMIT 5
    `;
    
    return this.db.prepare(query).all(userId, content, content) as Tag[];
  }

  /**
   * 获取标签云数据（用于可视化）
   */
  getTagCloud(userId: number): Array<Tag & { weight: number }> {
    const query = `
      SELECT 
        *,
        CASE 
          WHEN usage_count = 0 THEN 1
          ELSE ROUND((usage_count * 1.0 / MAX(usage_count) OVER()) * 5 + 1)
        END as weight
      FROM tags 
      WHERE user_id = ? AND is_deleted = 0 AND usage_count > 0
      ORDER BY usage_count DESC, name ASC
    `;
    
    return this.db.prepare(query).all(userId) as Array<Tag & { weight: number }>;
  }
}