import Database from 'better-sqlite3';
import path from 'path';

export interface Category {
  id: number;
  user_id: number;
  parent_id?: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  level: number;
  sort_order: number;
  task_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  parent_id?: number;
  sort_order?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
  depth: number;
}

export class CategoryService {
  private db: Database.Database;
  
  constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'nobody-logger.db');
    this.db = new Database(dbPath);
  }

  /**
   * 获取用户的所有分类（平铺列表）
   */
  findUserCategories(userId: number, includeInactive = false): Category[] {
    const query = `
      SELECT * FROM categories 
      WHERE user_id = ? 
        AND is_deleted = 0 
        ${includeInactive ? '' : 'AND is_active = 1'}
      ORDER BY level ASC, sort_order ASC, name ASC
    `;
    
    return this.db.prepare(query).all(userId) as Category[];
  }

  /**
   * 获取用户的分类树结构
   */
  findUserCategoryTree(userId: number, includeInactive = false): CategoryTree[] {
    const categories = this.findUserCategories(userId, includeInactive);
    return this.buildCategoryTree(categories);
  }

  /**
   * 根据ID获取分类
   */
  findCategoryById(id: number, userId: number): Category | null {
    const query = `
      SELECT * FROM categories 
      WHERE id = ? AND user_id = ? AND is_deleted = 0
    `;
    
    return this.db.prepare(query).get(id, userId) as Category | null;
  }

  /**
   * 创建新分类
   */
  async createCategory(userId: number, input: CreateCategoryInput): Promise<Category> {
    // 计算层级
    let level = 0;
    if (input.parent_id) {
      const parent = this.findCategoryById(input.parent_id, userId);
      if (!parent) {
        throw new Error('父分类不存在');
      }
      level = parent.level + 1;
      if (level > 2) { // 最多3层 (0, 1, 2)
        throw new Error('分类层级不能超过3层');
      }
    }

    // 检查名称唯一性（同一用户下）
    const existingQuery = `
      SELECT id FROM categories 
      WHERE user_id = ? AND name = ? AND is_deleted = 0
    `;
    const existing = this.db.prepare(existingQuery).get(userId, input.name);
    if (existing) {
      throw new Error('分类名称已存在');
    }

    // 计算排序顺序
    let sortOrder = input.sort_order || 0;
    if (sortOrder === 0) {
      const maxOrderQuery = `
        SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order 
        FROM categories 
        WHERE user_id = ? AND parent_id ${input.parent_id ? '= ?' : 'IS NULL'} AND is_deleted = 0
      `;
      const params = input.parent_id ? [userId, input.parent_id] : [userId];
      const result = this.db.prepare(maxOrderQuery).get(...params) as { next_order: number };
      sortOrder = result.next_order;
    }

    const insertQuery = `
      INSERT INTO categories (
        user_id, parent_id, name, description, color, icon, 
        level, sort_order, task_count, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
    `;

    const result = this.db.prepare(insertQuery).run(
      userId,
      input.parent_id || null,
      input.name,
      input.description || null,
      input.color,
      input.icon || null,
      level,
      sortOrder
    );

    const category = this.findCategoryById(result.lastInsertRowid as number, userId);
    if (!category) {
      throw new Error('创建分类失败');
    }

    return category;
  }

  /**
   * 更新分类
   */
  async updateCategory(id: number, userId: number, input: UpdateCategoryInput): Promise<Category> {
    const category = this.findCategoryById(id, userId);
    if (!category) {
      throw new Error('分类不存在');
    }

    // 检查名称唯一性（如果更改了名称）
    if (input.name && input.name !== category.name) {
      const existingQuery = `
        SELECT id FROM categories 
        WHERE user_id = ? AND name = ? AND id != ? AND is_deleted = 0
      `;
      const existing = this.db.prepare(existingQuery).get(userId, input.name, id);
      if (existing) {
        throw new Error('分类名称已存在');
      }
    }

    // 检查父分类变更
    if (input.parent_id !== undefined && input.parent_id !== category.parent_id) {
      if (input.parent_id) {
        const parent = this.findCategoryById(input.parent_id, userId);
        if (!parent) {
          throw new Error('父分类不存在');
        }
        // 检查是否会造成循环引用
        if (this.wouldCreateCycle(id, input.parent_id)) {
          throw new Error('不能将分类移动到自己的子分类下');
        }
        // 检查层级限制
        if (parent.level >= 2) {
          throw new Error('分类层级不能超过3层');
        }
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (input.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(input.name);
    }
    if (input.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(input.description);
    }
    if (input.color !== undefined) {
      updateFields.push('color = ?');
      updateValues.push(input.color);
    }
    if (input.icon !== undefined) {
      updateFields.push('icon = ?');
      updateValues.push(input.icon);
    }
    if (input.parent_id !== undefined) {
      updateFields.push('parent_id = ?');
      updateValues.push(input.parent_id);
      // 重新计算层级
      const newLevel = input.parent_id ? 
        (this.findCategoryById(input.parent_id, userId)?.level || 0) + 1 : 0;
      updateFields.push('level = ?');
      updateValues.push(newLevel);
    }
    if (input.sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      updateValues.push(input.sort_order);
    }
    if (input.is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(input.is_active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return category;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id, userId);

    const updateQuery = `
      UPDATE categories 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND user_id = ?
    `;

    this.db.prepare(updateQuery).run(...updateValues);

    const updatedCategory = this.findCategoryById(id, userId);
    if (!updatedCategory) {
      throw new Error('更新分类失败');
    }

    return updatedCategory;
  }

  /**
   * 删除分类（软删除）
   */
  async deleteCategory(id: number, userId: number): Promise<void> {
    const category = this.findCategoryById(id, userId);
    if (!category) {
      throw new Error('分类不存在');
    }

    // 检查是否有子分类
    const childrenQuery = `
      SELECT COUNT(*) as count FROM categories 
      WHERE parent_id = ? AND is_deleted = 0
    `;
    const childrenResult = this.db.prepare(childrenQuery).get(id) as { count: number };
    if (childrenResult.count > 0) {
      throw new Error('不能删除包含子分类的分类，请先删除或移动子分类');
    }

    // 检查是否有关联的任务
    const tasksQuery = `
      SELECT COUNT(*) as count FROM task_categories tc
      INNER JOIN wbs_tasks wt ON tc.task_id = wt.id
      WHERE tc.category_id = ? AND wt.is_deleted = 0
    `;
    const tasksResult = this.db.prepare(tasksQuery).get(id) as { count: number };
    if (tasksResult.count > 0) {
      throw new Error('不能删除包含任务的分类，请先移除任务关联');
    }

    const deleteQuery = `
      UPDATE categories 
      SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `;
    
    this.db.prepare(deleteQuery).run(id, userId);
  }

  /**
   * 批量重新排序分类
   */
  async reorderCategories(userId: number, categoryOrders: { id: number; sort_order: number }[]): Promise<void> {
    const transaction = this.db.transaction(() => {
      for (const { id, sort_order } of categoryOrders) {
        const updateQuery = `
          UPDATE categories 
          SET sort_order = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ? AND user_id = ?
        `;
        this.db.prepare(updateQuery).run(sort_order, id, userId);
      }
    });

    transaction();
  }

  /**
   * 搜索分类
   */
  searchCategories(userId: number, query: string): Category[] {
    const searchQuery = `
      SELECT * FROM categories 
      WHERE user_id = ? 
        AND is_deleted = 0 
        AND is_active = 1
        AND (name LIKE ? OR description LIKE ?)
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1
          ELSE 2
        END,
        name ASC
    `;
    
    const searchTerm = `%${query}%`;
    const exactTerm = `${query}%`;
    
    return this.db.prepare(searchQuery).all(userId, searchTerm, searchTerm, exactTerm) as Category[];
  }

  /**
   * 构建分类树结构
   */
  private buildCategoryTree(categories: Category[], parentId: number | null = null, depth = 0): CategoryTree[] {
    const children = categories
      .filter(cat => cat.parent_id === parentId)
      .map(cat => ({
        ...cat,
        children: this.buildCategoryTree(categories, cat.id, depth + 1),
        depth
      }))
      .sort((a, b) => a.sort_order - b.sort_order);

    return children;
  }

  /**
   * 检查是否会造成循环引用
   */
  private wouldCreateCycle(categoryId: number, newParentId: number): boolean {
    let currentId: number | null = newParentId;
    
    while (currentId) {
      if (currentId === categoryId) {
        return true;
      }
      
      const parentQuery = `SELECT parent_id FROM categories WHERE id = ?`;
      const result = this.db.prepare(parentQuery).get(currentId) as { parent_id: number | null } | undefined;
      currentId = result?.parent_id || null;
    }
    
    return false;
  }

  /**
   * 更新分类的任务计数
   */
  async updateCategoryTaskCount(categoryId: number): Promise<void> {
    const countQuery = `
      SELECT COUNT(*) as count FROM task_categories tc
      INNER JOIN wbs_tasks wt ON tc.task_id = wt.id
      WHERE tc.category_id = ? AND wt.is_deleted = 0
    `;
    const result = this.db.prepare(countQuery).get(categoryId) as { count: number };
    
    const updateQuery = `
      UPDATE categories 
      SET task_count = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    this.db.prepare(updateQuery).run(result.count, categoryId);
  }

  /**
   * 获取分类统计信息
   */
  getCategoryStats(userId: number): Array<Category & { task_count: number; active_task_count: number }> {
    const query = `
      SELECT 
        c.*,
        COALESCE(tc.total_tasks, 0) as task_count,
        COALESCE(tc.active_tasks, 0) as active_task_count
      FROM categories c
      LEFT JOIN (
        SELECT 
          tc.category_id,
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN wt.status != 'completed' THEN 1 END) as active_tasks
        FROM task_categories tc
        INNER JOIN wbs_tasks wt ON tc.task_id = wt.id
        WHERE wt.is_deleted = 0
        GROUP BY tc.category_id
      ) tc ON c.id = tc.category_id
      WHERE c.user_id = ? AND c.is_deleted = 0
      ORDER BY c.level ASC, c.sort_order ASC, c.name ASC
    `;
    
    return this.db.prepare(query).all(userId) as Array<Category & { task_count: number; active_task_count: number }>;
  }
}