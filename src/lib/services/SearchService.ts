import Database from 'better-sqlite3';
import path from 'path';

export interface SearchResult {
  id: number;
  type: 'task' | 'project' | 'category' | 'tag';
  title: string;
  snippet: string;
  highlights: string[];
  score: number;
  metadata: {
    project_name?: string;
    project_id?: number;
    category_name?: string;
    status?: string;
    priority?: string;
    created_at: string;
    updated_at: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  search_time: number;
  suggestions: string[];
  filters?: SearchFilters;
}

export interface SearchFilters {
  categories?: number[];
  tags?: number[];
  tag_logic?: 'AND' | 'OR';
  projects?: number[];
  status?: string[];
  priority?: string[];
  date_range?: {
    field: 'created' | 'updated' | 'deadline';
    start?: string;
    end?: string;
  };
  assignees?: number[];
}

export interface AdvancedSearchCriteria {
  keywords?: string;
  filters?: SearchFilters;
  sort_by?: 'relevance' | 'created' | 'updated' | 'priority' | 'deadline';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export class SearchService {
  private db: Database.Database;
  
  constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'nobody-logger.db');
    this.db = new Database(dbPath);
  }

  /**
   * 全局搜索
   */
  async globalSearch(
    userId: number, 
    query: string, 
    type?: 'all' | 'tasks' | 'projects' | 'categories' | 'tags',
    limit = 50,
    offset = 0
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const searchType = type || 'all';
    
    let results: SearchResult[] = [];
    
    if (searchType === 'all' || searchType === 'tasks') {
      const taskResults = await this.searchTasks(userId, query, limit, offset);
      results.push(...taskResults);
    }
    
    if (searchType === 'all' || searchType === 'projects') {
      const projectResults = await this.searchProjects(userId, query, limit, offset);
      results.push(...projectResults);
    }
    
    if (searchType === 'all' || searchType === 'categories') {
      const categoryResults = await this.searchCategories(userId, query, limit, offset);
      results.push(...categoryResults);
    }
    
    if (searchType === 'all' || searchType === 'tags') {
      const tagResults = await this.searchTags(userId, query, limit, offset);
      results.push(...tagResults);
    }

    // 按相关度排序
    results.sort((a, b) => b.score - a.score);
    
    // 应用分页
    const paginatedResults = results.slice(offset, offset + limit);
    
    // 生成搜索建议
    const suggestions = await this.generateSearchSuggestions(userId, query);
    
    // 保存搜索历史
    await this.saveSearchHistory(userId, query, 'global', null, results.length);
    
    const searchTime = Date.now() - startTime;
    
    return {
      results: paginatedResults,
      total: results.length,
      query,
      search_time: searchTime,
      suggestions
    };
  }

  /**
   * 高级搜索
   */
  async advancedSearch(
    userId: number,
    criteria: AdvancedSearchCriteria
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const { keywords, filters, sort_by = 'relevance', sort_order = 'desc', limit = 50, offset = 0 } = criteria;
    
    // 构建搜索查询
    const searchQuery = this.buildAdvancedSearchQuery(userId, keywords, filters, sort_by, sort_order);
    
    const results = this.db.prepare(searchQuery.sql).all(...searchQuery.params) as any[];
    
    // 转换结果格式
    const searchResults: SearchResult[] = results.map(row => ({
      id: row.id,
      type: row.result_type,
      title: row.title,
      snippet: this.generateSnippet(row.content || row.description || '', keywords || ''),
      highlights: this.extractHighlights(row.title + ' ' + (row.content || row.description || ''), keywords || ''),
      score: this.calculateRelevanceScore(row, keywords || ''),
      metadata: {
        project_name: row.project_name,
        project_id: row.project_id,
        category_name: row.category_name,
        status: row.status,
        priority: row.priority,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    }));

    // 应用分页
    const paginatedResults = searchResults.slice(offset, offset + limit);
    
    // 生成搜索建议
    const suggestions = await this.generateSearchSuggestions(userId, keywords || '');
    
    // 保存搜索历史
    await this.saveSearchHistory(userId, keywords || '', 'advanced', filters, searchResults.length);
    
    const searchTime = Date.now() - startTime;
    
    return {
      results: paginatedResults,
      total: searchResults.length,
      query: keywords || '',
      search_time: searchTime,
      suggestions,
      filters
    };
  }

  /**
   * 搜索任务
   */
  private async searchTasks(userId: number, query: string, limit: number, offset: number): Promise<SearchResult[]> {
    const sql = `
      SELECT 
        wt.id,
        wt.name as title,
        wt.description as content,
        p.name as project_name,
        p.id as project_id,
        wt.status,
        wt.priority,
        wt.created_at,
        wt.updated_at,
        'task' as result_type
      FROM wbs_tasks wt
      INNER JOIN projects p ON wt.project_id = p.id
      WHERE p.user_id = ?
        AND wt.is_deleted = 0
        AND p.is_deleted = 0
        AND (
          wt.name LIKE ? 
          OR wt.description LIKE ?
        )
      ORDER BY 
        CASE 
          WHEN wt.name LIKE ? THEN 1
          WHEN wt.description LIKE ? THEN 2
          ELSE 3
        END,
        wt.updated_at DESC
    `;
    
    const searchTerm = `%${query}%`;
    const exactTerm = `${query}%`;
    
    const results = this.db.prepare(sql).all(
      userId, searchTerm, searchTerm, exactTerm, exactTerm
    ) as any[];
    
    return results.map(row => ({
      id: row.id,
      type: 'task' as const,
      title: row.title,
      snippet: this.generateSnippet(row.content || '', query),
      highlights: this.extractHighlights(row.title + ' ' + (row.content || ''), query),
      score: this.calculateRelevanceScore(row, query),
      metadata: {
        project_name: row.project_name,
        project_id: row.project_id,
        status: row.status,
        priority: row.priority,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    }));
  }

  /**
   * 搜索项目
   */
  private async searchProjects(userId: number, query: string, limit: number, offset: number): Promise<SearchResult[]> {
    const sql = `
      SELECT 
        id,
        name as title,
        description as content,
        created_at,
        updated_at,
        'project' as result_type
      FROM projects
      WHERE user_id = ?
        AND is_deleted = 0
        AND (name LIKE ? OR description LIKE ?)
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1
          ELSE 2
        END,
        updated_at DESC
    `;
    
    const searchTerm = `%${query}%`;
    const exactTerm = `${query}%`;
    
    const results = this.db.prepare(sql).all(
      userId, searchTerm, searchTerm, exactTerm
    ) as any[];
    
    return results.map(row => ({
      id: row.id,
      type: 'project' as const,
      title: row.title,
      snippet: this.generateSnippet(row.content || '', query),
      highlights: this.extractHighlights(row.title + ' ' + (row.content || ''), query),
      score: this.calculateRelevanceScore(row, query),
      metadata: {
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    }));
  }

  /**
   * 搜索分类
   */
  private async searchCategories(userId: number, query: string, limit: number, offset: number): Promise<SearchResult[]> {
    const sql = `
      SELECT 
        id,
        name as title,
        description as content,
        task_count,
        created_at,
        updated_at,
        'category' as result_type
      FROM categories
      WHERE user_id = ?
        AND is_deleted = 0
        AND is_active = 1
        AND (name LIKE ? OR description LIKE ?)
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1
          ELSE 2
        END,
        task_count DESC,
        name ASC
    `;
    
    const searchTerm = `%${query}%`;
    const exactTerm = `${query}%`;
    
    const results = this.db.prepare(sql).all(
      userId, searchTerm, searchTerm, exactTerm
    ) as any[];
    
    return results.map(row => ({
      id: row.id,
      type: 'category' as const,
      title: row.title,
      snippet: this.generateSnippet(row.content || '', query),
      highlights: this.extractHighlights(row.title + ' ' + (row.content || ''), query),
      score: this.calculateRelevanceScore(row, query) + (row.task_count * 0.1), // 任务数量加权
      metadata: {
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    }));
  }

  /**
   * 搜索标签
   */
  private async searchTags(userId: number, query: string, limit: number, offset: number): Promise<SearchResult[]> {
    const sql = `
      SELECT 
        id,
        name as title,
        description as content,
        usage_count,
        created_at,
        updated_at,
        'tag' as result_type
      FROM tags
      WHERE user_id = ?
        AND is_deleted = 0
        AND (name LIKE ? OR description LIKE ?)
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1
          ELSE 2
        END,
        usage_count DESC,
        name ASC
    `;
    
    const searchTerm = `%${query}%`;
    const exactTerm = `${query}%`;
    
    const results = this.db.prepare(sql).all(
      userId, searchTerm, searchTerm, exactTerm
    ) as any[];
    
    return results.map(row => ({
      id: row.id,
      type: 'tag' as const,
      title: row.title,
      snippet: this.generateSnippet(row.content || '', query),
      highlights: this.extractHighlights(row.title + ' ' + (row.content || ''), query),
      score: this.calculateRelevanceScore(row, query) + (row.usage_count * 0.05), // 使用次数加权
      metadata: {
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    }));
  }

  /**
   * 构建高级搜索查询
   */
  private buildAdvancedSearchQuery(
    userId: number,
    keywords?: string,
    filters?: SearchFilters,
    sortBy = 'relevance',
    sortOrder = 'desc'
  ): { sql: string; params: any[] } {
    // 这里实现复杂的查询构建逻辑
    // 为了简化，先返回基本的任务搜索
    let sql = `
      SELECT DISTINCT
        wt.id,
        wt.name as title,
        wt.description as content,
        p.name as project_name,
        p.id as project_id,
        wt.status,
        wt.priority,
        wt.created_at,
        wt.updated_at,
        'task' as result_type
      FROM wbs_tasks wt
      INNER JOIN projects p ON wt.project_id = p.id
    `;

    const conditions = ['p.user_id = ?', 'wt.is_deleted = 0', 'p.is_deleted = 0'];
    const params = [userId];

    // 添加关键词搜索条件
    if (keywords && keywords.trim()) {
      conditions.push('(wt.name LIKE ? OR wt.description LIKE ?)');
      const searchTerm = `%${keywords.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    // 添加筛选条件
    if (filters) {
      if (filters.projects && filters.projects.length > 0) {
        conditions.push(`p.id IN (${filters.projects.map(() => '?').join(',')})`);
        params.push(...filters.projects);
      }

      if (filters.status && filters.status.length > 0) {
        conditions.push(`wt.status IN (${filters.status.map(() => '?').join(',')})`);
        params.push(...filters.status);
      }

      if (filters.priority && filters.priority.length > 0) {
        conditions.push(`wt.priority IN (${filters.priority.map(() => '?').join(',')})`);
        params.push(...filters.priority);
      }

      if (filters.date_range) {
        const dateField = filters.date_range.field === 'created' ? 'wt.created_at' :
                          filters.date_range.field === 'updated' ? 'wt.updated_at' : 'wt.end_date';
        
        if (filters.date_range.start) {
          conditions.push(`DATE(${dateField}) >= DATE(?)`);
          params.push(filters.date_range.start);
        }
        
        if (filters.date_range.end) {
          conditions.push(`DATE(${dateField}) <= DATE(?)`);
          params.push(filters.date_range.end);
        }
      }

      // 分类筛选
      if (filters.categories && filters.categories.length > 0) {
        sql += ` LEFT JOIN task_categories tc ON wt.id = tc.task_id`;
        conditions.push(`tc.category_id IN (${filters.categories.map(() => '?').join(',')})`);
        params.push(...filters.categories);
      }

      // 标签筛选
      if (filters.tags && filters.tags.length > 0) {
        sql += ` LEFT JOIN task_tags tt ON wt.id = tt.task_id`;
        if (filters.tag_logic === 'AND') {
          // AND逻辑：任务必须包含所有指定标签
          conditions.push(`tt.tag_id IN (${filters.tags.map(() => '?').join(',')})`);
          params.push(...filters.tags);
          sql += ` GROUP BY wt.id HAVING COUNT(DISTINCT tt.tag_id) = ?`;
          params.push(filters.tags.length);
        } else {
          // OR逻辑：任务包含任一指定标签
          conditions.push(`tt.tag_id IN (${filters.tags.map(() => '?').join(',')})`);
          params.push(...filters.tags);
        }
      }
    }

    // 添加WHERE条件
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // 添加排序
    let orderBy = '';
    switch (sortBy) {
      case 'created':
        orderBy = `ORDER BY wt.created_at ${sortOrder.toUpperCase()}`;
        break;
      case 'updated':
        orderBy = `ORDER BY wt.updated_at ${sortOrder.toUpperCase()}`;
        break;
      case 'priority':
        orderBy = `ORDER BY 
          CASE wt.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END ${sortOrder.toUpperCase()},
          wt.updated_at DESC`;
        break;
      case 'deadline':
        orderBy = `ORDER BY wt.end_date ${sortOrder.toUpperCase()} NULLS LAST, wt.updated_at DESC`;
        break;
      default: // relevance
        if (keywords && keywords.trim()) {
          orderBy = `ORDER BY 
            CASE 
              WHEN wt.name LIKE ? THEN 1
              WHEN wt.description LIKE ? THEN 2
              ELSE 3
            END,
            wt.updated_at DESC`;
          const exactTerm = `${keywords.trim()}%`;
          params.push(exactTerm, exactTerm);
        } else {
          orderBy = `ORDER BY wt.updated_at DESC`;
        }
    }

    sql += ` ${orderBy}`;

    return { sql, params };
  }

  /**
   * 生成搜索结果片段
   */
  private generateSnippet(content: string, query: string, maxLength = 150): string {
    if (!content) return '';
    
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);
    
    if (index === -1) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 100);
    
    let snippet = content.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  }

  /**
   * 提取高亮关键词
   */
  private extractHighlights(text: string, query: string): string[] {
    if (!text || !query) return [];
    
    const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const highlights = new Set<string>();
    
    words.forEach(word => {
      const regex = new RegExp(`\\b${word}\\w*`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(match => highlights.add(match));
      }
    });
    
    return Array.from(highlights);
  }

  /**
   * 计算相关度分数
   */
  private calculateRelevanceScore(row: any, query: string): number {
    if (!query) return 1;
    
    const title = (row.title || '').toLowerCase();
    const content = (row.content || '').toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    let score = 0;
    
    // 标题匹配权重更高
    if (title.includes(lowerQuery)) {
      score += title.startsWith(lowerQuery) ? 10 : 5;
    }
    
    // 内容匹配
    if (content.includes(lowerQuery)) {
      score += 2;
    }
    
    // 时间衰减因子（越新的内容分数越高）
    const updatedAt = new Date(row.updated_at).getTime();
    const now = Date.now();
    const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);
    const timeFactor = Math.max(0.1, 1 - daysSinceUpdate / 365); // 一年内的内容有时间加权
    
    return score * timeFactor;
  }

  /**
   * 生成搜索建议
   */
  private async generateSearchSuggestions(userId: number, query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];
    
    const sql = `
      SELECT DISTINCT query, COUNT(*) as frequency
      FROM search_history 
      WHERE user_id = ? 
        AND query LIKE ? 
        AND query != ?
        AND LENGTH(query) >= 2
      GROUP BY query
      ORDER BY frequency DESC, LENGTH(query) ASC
      LIMIT 5
    `;
    
    const searchTerm = `%${query}%`;
    const results = this.db.prepare(sql).all(userId, searchTerm, query) as { query: string; frequency: number }[];
    
    return results.map(r => r.query);
  }

  /**
   * 保存搜索历史
   */
  private async saveSearchHistory(
    userId: number,
    query: string,
    searchType: string,
    filters?: SearchFilters | null,
    resultCount = 0
  ): Promise<void> {
    if (!query.trim()) return;
    
    const sql = `
      INSERT INTO search_history (user_id, query, search_type, filters, result_count)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    this.db.prepare(sql).run(
      userId,
      query.trim(),
      searchType,
      filters ? JSON.stringify(filters) : null,
      resultCount
    );
  }

  /**
   * 获取搜索历史
   */
  getSearchHistory(userId: number, limit = 10): Array<{ query: string; search_type: string; result_count: number; created_at: string }> {
    const sql = `
      SELECT query, search_type, result_count, created_at
      FROM search_history 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    
    return this.db.prepare(sql).all(userId, limit) as Array<{ query: string; search_type: string; result_count: number; created_at: string }>;
  }

  /**
   * 清理搜索历史
   */
  async cleanupSearchHistory(userId: number, daysToKeep = 30): Promise<number> {
    const sql = `
      DELETE FROM search_history
      WHERE user_id = ? 
        AND created_at < DATE('now', '-${daysToKeep} days')
    `;
    
    const result = this.db.prepare(sql).run(userId);
    return result.changes;
  }
}