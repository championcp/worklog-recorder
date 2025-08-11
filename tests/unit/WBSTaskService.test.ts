/**
 * Unit Tests for WBSTaskService
 * Tests the core business logic for WBS task management
 */

import { WBSTaskService } from '../../src/lib/services/WBSTaskService';
import { getDatabase } from '../../src/lib/db/client';
import type { CreateWBSTaskInput, UpdateWBSTaskInput } from '../../src/types/project';

// Mock the database client
jest.mock('../../src/lib/db/client');

describe('WBSTaskService', () => {
  let wbsTaskService: WBSTaskService;
  let mockDb: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock database
    mockDb = {
      prepare: jest.fn().mockReturnValue({
        get: jest.fn(),
        all: jest.fn(),
        run: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
      })
    };
    
    (getDatabase as jest.Mock).mockReturnValue(mockDb);
    wbsTaskService = new WBSTaskService();
  });

  describe('createWBSTask', () => {
    const validCreateInput: CreateWBSTaskInput = {
      project_id: 1,
      name: 'Test Task',
      description: 'Test Description',
      level_type: 'yearly',
      priority: 'medium'
    };

    it('should create a root task successfully', async () => {
      // Mock project validation
      mockDb.prepare().get.mockReturnValueOnce({ id: 1 }); // Project exists
      
      // Mock max sort order query
      mockDb.prepare().get.mockReturnValueOnce({ max_sort: 0 });
      
      // Mock task creation
      mockDb.prepare().run.mockReturnValueOnce({ lastInsertRowid: 1 });
      
      // Mock findWBSTaskById for return value
      mockDb.prepare().get.mockReturnValueOnce({
        id: 1,
        project_id: 1,
        parent_id: null,
        wbs_code: '1',
        name: 'Test Task',
        description: 'Test Description',
        level: 1,
        level_type: 'yearly',
        sort_order: 1,
        status: 'not_started',
        progress_percentage: 0,
        priority: 'medium',
        created_at: '2025-08-04T10:00:00.000Z',
        updated_at: '2025-08-04T10:00:00.000Z',
        sync_version: 1,
        is_deleted: 0
      });

      const result = await wbsTaskService.createWBSTask(1, validCreateInput);

      expect(result).toEqual(expect.objectContaining({
        id: 1,
        project_id: 1,
        parent_id: null,
        wbs_code: '1',
        name: 'Test Task',
        level: 1
      }));
    });

    it('should create a sub-task with correct WBS code', async () => {
      const subTaskInput: CreateWBSTaskInput = {
        ...validCreateInput,
        parent_id: 1,
        name: 'Sub Task'
      };

      // Mock project validation
      mockDb.prepare().get.mockReturnValueOnce({ id: 1 });
      
      // Mock parent task validation
      mockDb.prepare().get.mockReturnValueOnce({ level: 1 });
      
      // Mock parent level query for WBS code generation
      mockDb.prepare().get.mockReturnValueOnce({ level: 1 });
      
      // Mock max sort order
      mockDb.prepare().get.mockReturnValueOnce({ max_sort: 0 });
      
      // Mock parent WBS code for generation
      mockDb.prepare().get.mockReturnValueOnce({ wbs_code: '1' });
      
      // Mock task creation
      mockDb.prepare().run.mockReturnValueOnce({ lastInsertRowid: 2 });
      
      // Mock return task
      mockDb.prepare().get.mockReturnValueOnce({
        id: 2,
        project_id: 1,
        parent_id: 1,
        wbs_code: '1.1',
        name: 'Sub Task',
        level: 2
      });

      const result = await wbsTaskService.createWBSTask(1, subTaskInput);

      expect(result.wbs_code).toBe('1.1');
      expect(result.level).toBe(2);
      expect(result.parent_id).toBe(1);
    });

    it('should throw error for non-existent project', async () => {
      // Mock project not found
      mockDb.prepare().get.mockReturnValueOnce(undefined);

      await expect(wbsTaskService.createWBSTask(1, validCreateInput))
        .rejects.toThrow('项目不存在或没有权限');
    });

    it('should throw error for non-existent parent task', async () => {
      const inputWithInvalidParent: CreateWBSTaskInput = {
        ...validCreateInput,
        parent_id: 999
      };

      // Mock project exists
      mockDb.prepare().get.mockReturnValueOnce({ id: 1 });
      
      // Mock parent task not found
      mockDb.prepare().get.mockReturnValueOnce(undefined);

      await expect(wbsTaskService.createWBSTask(1, inputWithInvalidParent))
        .rejects.toThrow('父任务不存在');
    });

    it('should throw error when exceeding maximum level depth', async () => {
      const inputWithLevel3Parent: CreateWBSTaskInput = {
        ...validCreateInput,
        parent_id: 3
      };

      // Mock project exists
      mockDb.prepare().get.mockReturnValueOnce({ id: 1 });
      
      // Mock parent task at level 3
      mockDb.prepare().get.mockReturnValueOnce({ level: 3 });

      await expect(wbsTaskService.createWBSTask(1, inputWithLevel3Parent))
        .rejects.toThrow('任务层级不能超过3级');
    });
  });

  describe('updateWBSTask', () => {
    const updateInput: UpdateWBSTaskInput = {
      name: 'Updated Task Name',
      description: 'Updated Description',
      status: 'in_progress',
      progress_percentage: 50,
      priority: 'high'
    };

    it('should update task successfully', async () => {
      // Mock task exists and user has permission
      mockDb.prepare().get.mockReturnValueOnce({
        id: 1,
        project_id: 1,
        user_id: 1,
        name: 'Original Name',
        status: 'not_started',
        progress_percentage: 0
      });

      // Mock updated task return
      mockDb.prepare().get.mockReturnValueOnce({
        id: 1,
        name: 'Updated Task Name',
        description: 'Updated Description',
        status: 'in_progress',
        progress_percentage: 50,
        priority: 'high',
        updated_at: '2025-08-04T10:05:00.000Z',
        sync_version: 2
      });

      const result = await wbsTaskService.updateWBSTask(1, 1, updateInput);

      expect(result.name).toBe('Updated Task Name');
      expect(result.status).toBe('in_progress');
      expect(result.progress_percentage).toBe(50);
      expect(result.sync_version).toBe(2);
    });

    it('should auto-update progress to 100% when status is completed', async () => {
      const completedInput: UpdateWBSTaskInput = {
        status: 'completed'
      };

      // Mock task exists
      mockDb.prepare().get.mockReturnValueOnce({
        id: 1,
        project_id: 1,
        user_id: 1,
        status: 'in_progress',
        progress_percentage: 75
      });

      // Mock updated task with auto-updated progress
      mockDb.prepare().get.mockReturnValueOnce({
        id: 1,
        status: 'completed',
        progress_percentage: 100,
        completed_at: '2025-08-04T10:05:00.000Z'
      });

      const result = await wbsTaskService.updateWBSTask(1, 1, completedInput);

      expect(result.status).toBe('completed');
      expect(result.progress_percentage).toBe(100);
      expect(result.completed_at).toBeDefined();
    });

    it('should throw error for non-existent task', async () => {
      // Mock task not found
      mockDb.prepare().get.mockReturnValueOnce(undefined);

      await expect(wbsTaskService.updateWBSTask(1, 999, updateInput))
        .rejects.toThrow('任务不存在或没有权限');
    });

    it('should throw error for unauthorized user', async () => {
      // Mock task exists but belongs to different user
      mockDb.prepare().get.mockReturnValueOnce({
        id: 1,
        project_id: 1,
        user_id: 2 // Different user
      });

      await expect(wbsTaskService.updateWBSTask(1, 1, updateInput))
        .rejects.toThrow('任务不存在或没有权限');
    });

    it('should handle empty update input', async () => {
      // Mock task exists
      mockDb.prepare().get.mockReturnValueOnce({
        id: 1,
        project_id: 1,
        user_id: 1
      });

      // Mock return unchanged task
      mockDb.prepare().get.mockReturnValueOnce({
        id: 1,
        name: 'Original Name'
      });

      const result = await wbsTaskService.updateWBSTask(1, 1, {});

      expect(result.name).toBe('Original Name');
    });
  });

  describe('deleteWBSTask', () => {
    it('should delete task successfully when no children exist', async () => {
      // Mock task exists and user has permission
      mockDb.prepare().get.mockReturnValueOnce({
        id: 1,
        project_id: 1,
        user_id: 1
      });

      // Mock no children exist
      mockDb.prepare().get.mockReturnValueOnce({ count: 0 });

      await expect(wbsTaskService.deleteWBSTask(1, 1)).resolves.not.toThrow();

      // Verify soft delete was called
      expect(mockDb.prepare().run).toHaveBeenCalled();
    });

    it('should throw error when task has children', async () => {
      // Mock task exists
      mockDb.prepare().get.mockReturnValueOnce({
        id: 1,
        project_id: 1,
        user_id: 1
      });

      // Mock children exist
      mockDb.prepare().get.mockReturnValueOnce({ count: 2 });

      await expect(wbsTaskService.deleteWBSTask(1, 1))
        .rejects.toThrow('请先删除所有子任务');
    });

    it('should throw error for non-existent task', async () => {
      // Mock task not found
      mockDb.prepare().get.mockReturnValueOnce(undefined);

      await expect(wbsTaskService.deleteWBSTask(1, 999))
        .rejects.toThrow('任务不存在或没有权限');
    });
  });

  describe('findProjectWBSTasks', () => {
    it('should return tasks for valid project', () => {
      const mockTasks = [
        {
          id: 1,
          project_id: 1,
          wbs_code: '1',
          name: 'Root Task',
          level: 1
        },
        {
          id: 2,
          project_id: 1,
          wbs_code: '1.1',
          name: 'Sub Task',
          level: 2
        }
      ];

      // Mock project validation
      mockDb.prepare().get.mockReturnValueOnce({ id: 1 });
      
      // Mock tasks query
      mockDb.prepare().all.mockReturnValueOnce(mockTasks);

      const result = wbsTaskService.findProjectWBSTasks(1, 1);

      expect(result).toEqual(mockTasks);
      expect(result).toHaveLength(2);
    });

    it('should throw error for unauthorized project access', () => {
      // Mock project not found or no permission
      mockDb.prepare().get.mockReturnValueOnce(undefined);

      expect(() => wbsTaskService.findProjectWBSTasks(1, 1))
        .toThrow('项目不存在或没有权限');
    });
  });

  describe('getWBSTaskTree', () => {
    it('should build correct tree structure', () => {
      const mockTasks = [
        {
          id: 1,
          project_id: 1,
          parent_id: null,
          wbs_code: '1',
          name: 'Root Task',
          level: 1
        },
        {
          id: 2,
          project_id: 1,
          parent_id: 1,
          wbs_code: '1.1',
          name: 'Sub Task',
          level: 2
        },
        {
          id: 3,
          project_id: 1,
          parent_id: 2,
          wbs_code: '1.1.1',
          name: 'Detail Task',
          level: 3
        }
      ];

      // Mock project validation
      mockDb.prepare().get.mockReturnValueOnce({ id: 1 });
      
      // Mock tasks query
      mockDb.prepare().all.mockReturnValueOnce(mockTasks);

      const result = wbsTaskService.getWBSTaskTree(1, 1);

      expect(result).toHaveLength(1); // Only one root task
      expect(result[0].id).toBe(1);
      expect(result[0].children).toHaveLength(1); // One sub-task
      expect(result[0].children[0].id).toBe(2);
      expect(result[0].children[0].children).toHaveLength(1); // One detail task
      expect(result[0].children[0].children[0].id).toBe(3);
    });
  });

  describe('getWBSTaskStats', () => {
    it('should return correct statistics', () => {
      const mockStats = {
        total_tasks: 5,
        completed_tasks: 2,
        in_progress_tasks: 2,
        not_started_tasks: 1,
        avg_progress: 60.5,
        total_estimated_hours: 200,
        total_actual_hours: 120
      };

      // Mock project validation
      mockDb.prepare().get.mockReturnValueOnce({ id: 1 });
      
      // Mock stats query
      mockDb.prepare().get.mockReturnValueOnce(mockStats);

      const result = wbsTaskService.getWBSTaskStats(1, 1);

      expect(result.total_tasks).toBe(5);
      expect(result.completed_tasks).toBe(2);
      expect(result.avg_progress).toBe(61); // Rounded
      expect(result.total_estimated_hours).toBe(200);
    });

    it('should handle empty project statistics', () => {
      // Mock project validation
      mockDb.prepare().get.mockReturnValueOnce({ id: 1 });
      
      // Mock empty stats
      mockDb.prepare().get.mockReturnValueOnce(undefined);

      const result = wbsTaskService.getWBSTaskStats(1, 1);

      expect(result.total_tasks).toBe(0);
      expect(result.completed_tasks).toBe(0);
      expect(result.avg_progress).toBe(0);
    });
  });

  describe('WBS Code Generation', () => {
    it('should generate correct WBS codes for hierarchy', async () => {
      // Test root task WBS code generation
      const rootInput: CreateWBSTaskInput = {
        project_id: 1,
        name: 'Root Task',
        level_type: 'yearly'
      };

      // Mock project validation
      mockDb.prepare().get.mockReturnValueOnce({ id: 1 });
      mockDb.prepare().get.mockReturnValueOnce({ max_sort: 0 });
      mockDb.prepare().run.mockReturnValueOnce({ lastInsertRowid: 1 });
      mockDb.prepare().get.mockReturnValueOnce({
        id: 1,
        wbs_code: '1',
        level: 1
      });

      const rootTask = await wbsTaskService.createWBSTask(1, rootInput);
      expect(rootTask.wbs_code).toBe('1');

      // Test sub-task WBS code generation
      const subInput: CreateWBSTaskInput = {
        project_id: 1,
        parent_id: 1,
        name: 'Sub Task',
        level_type: 'quarterly'
      };

      // Mock validations for sub-task
      mockDb.prepare().get.mockReturnValueOnce({ id: 1 });
      mockDb.prepare().get.mockReturnValueOnce({ level: 1 });
      mockDb.prepare().get.mockReturnValueOnce({ level: 1 });
      mockDb.prepare().get.mockReturnValueOnce({ max_sort: 0 });
      mockDb.prepare().get.mockReturnValueOnce({ wbs_code: '1' });
      mockDb.prepare().run.mockReturnValueOnce({ lastInsertRowid: 2 });
      mockDb.prepare().get.mockReturnValueOnce({
        id: 2,
        wbs_code: '1.1',
        level: 2
      });

      const subTask = await wbsTaskService.createWBSTask(1, subInput);
      expect(subTask.wbs_code).toBe('1.1');
    });
  });
});