/**
 * Integration Tests for WBS Task API Endpoints
 * Tests the complete API integration including authentication, validation, and database operations
 */

import request from 'supertest';
import { NextRequest } from 'next/server';
import { AuthService } from '../../src/lib/auth/AuthService';
import { WBSTaskService } from '../../src/lib/services/WBSTaskService';
import { getDatabase } from '../../src/lib/db/client';

// Mock dependencies
jest.mock('../../src/lib/auth/AuthService');
jest.mock('../../src/lib/services/WBSTaskService');
jest.mock('../../src/lib/db/client');

// Import API handlers
import { GET as getTasks, POST as createTask } from '../../src/app/api/tasks/route';
import { 
  GET as getTask, 
  PUT as updateTask, 
  DELETE as deleteTask 
} from '../../src/app/api/tasks/[id]/route';

describe('WBS Tasks API Integration Tests', () => {
  let mockAuthService: jest.Mocked<AuthService>;
  let mockWbsTaskService: jest.Mocked<WBSTaskService>;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup auth service mock
    mockAuthService = new AuthService() as jest.Mocked<AuthService>;
    mockAuthService.verifyToken = jest.fn();

    // Setup WBS task service mock
    mockWbsTaskService = new WBSTaskService() as jest.Mocked<WBSTaskService>;
    
    // Setup database mock
    mockDb = {
      prepare: jest.fn().mockReturnValue({
        get: jest.fn(),
        all: jest.fn(),
        run: jest.fn()
      })
    };
    (getDatabase as jest.Mock).mockReturnValue(mockDb);
  });

  describe('GET /api/tasks', () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    const mockTasks = [
      {
        id: 1,
        project_id: 1,
        parent_id: null,
        wbs_code: '1',
        name: 'Root Task',
        level: 1,
        status: 'not_started',
        progress_percentage: 0
      }
    ];
    const mockStats = {
      total_tasks: 1,
      completed_tasks: 0,
      in_progress_tasks: 0,
      not_started_tasks: 1,
      avg_progress: 0,
      total_estimated_hours: 0,
      total_actual_hours: 0
    };

    it('should return tasks successfully with valid authentication', async () => {
      // Mock authentication
      mockAuthService.verifyToken.mockReturnValue(mockUser);
      
      // Mock service methods
      mockWbsTaskService.findProjectWBSTasks = jest.fn().mockReturnValue(mockTasks);
      mockWbsTaskService.getWBSTaskStats = jest.fn().mockReturnValue(mockStats);

      const request = new NextRequest('http://localhost/api/tasks?project_id=1', {
        headers: { cookie: 'auth-token=valid_token' }
      });

      const response = await getTasks(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.tasks).toEqual(mockTasks);
      expect(responseData.data.stats).toEqual(mockStats);
    });

    it('should return tree structure when tree=true', async () => {
      const mockTreeTasks = [
        {
          ...mockTasks[0],
          children: [],
          full_path: '1',
          depth: 1
        }
      ];

      mockAuthService.verifyToken.mockReturnValue(mockUser);
      mockWbsTaskService.getWBSTaskTree = jest.fn().mockReturnValue(mockTreeTasks);
      mockWbsTaskService.getWBSTaskStats = jest.fn().mockReturnValue(mockStats);

      const request = new NextRequest('http://localhost/api/tasks?project_id=1&tree=true', {
        headers: { cookie: 'auth-token=valid_token' }
      });

      const response = await getTasks(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.tasks).toEqual(mockTreeTasks);
      expect(mockWbsTaskService.getWBSTaskTree).toHaveBeenCalledWith(1, 1);
    });

    it('should return 401 when no auth token provided', async () => {
      const request = new NextRequest('http://localhost/api/tasks?project_id=1');

      const response = await getTasks(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('UNAUTHORIZED');
      expect(responseData.error.message).toBe('未找到认证token');
    });

    it('should return 401 when auth token is invalid', async () => {
      mockAuthService.verifyToken.mockReturnValue(null);

      const request = new NextRequest('http://localhost/api/tasks?project_id=1', {
        headers: { cookie: 'auth-token=invalid_token' }
      });

      const response = await getTasks(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error.message).toBe('无效的认证token');
    });

    it('should return 400 when project_id is missing', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);

      const request = new NextRequest('http://localhost/api/tasks', {
        headers: { cookie: 'auth-token=valid_token' }
      });

      const response = await getTasks(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
      expect(responseData.error.message).toBe('缺少project_id参数');
    });

    it('should return 400 when project_id is invalid', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);

      const request = new NextRequest('http://localhost/api/tasks?project_id=invalid', {
        headers: { cookie: 'auth-token=valid_token' }
      });

      const response = await getTasks(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.message).toBe('无效的project_id参数');
    });

    it('should return 500 when service throws error', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);
      mockWbsTaskService.findProjectWBSTasks = jest.fn().mockImplementation(() => {
        throw new Error('项目不存在或没有权限');
      });

      const request = new NextRequest('http://localhost/api/tasks?project_id=1', {
        headers: { cookie: 'auth-token=valid_token' }
      });

      const response = await getTasks(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error.code).toBe('TASKS_FETCH_ERROR');
    });
  });

  describe('POST /api/tasks', () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    const validTaskData = {
      project_id: 1,
      name: 'New Test Task',
      description: 'Test description',
      level_type: 'yearly',
      priority: 'medium',
      estimated_hours: 40
    };
    const mockCreatedTask = {
      id: 1,
      ...validTaskData,
      wbs_code: '1',
      level: 1,
      status: 'not_started',
      progress_percentage: 0
    };

    it('should create task successfully with valid data', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);
      mockWbsTaskService.createWBSTask = jest.fn().mockResolvedValue(mockCreatedTask);

      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 
          cookie: 'auth-token=valid_token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(validTaskData)
      });

      const response = await createTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.task).toEqual(mockCreatedTask);
      expect(responseData.message).toBe('任务创建成功');
    });

    it('should return 400 when project_id is missing', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);

      const invalidData = { ...validTaskData };
      delete (invalidData as any).project_id;

      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 
          cookie: 'auth-token=valid_token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      const response = await createTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.message).toBe('项目ID不能为空');
    });

    it('should return 400 when task name is empty', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);

      const invalidData = { ...validTaskData, name: '' };

      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 
          cookie: 'auth-token=valid_token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      const response = await createTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.message).toBe('任务名称不能为空');
    });

    it('should return 400 when task name is too long', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);

      const invalidData = { ...validTaskData, name: 'A'.repeat(256) };

      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 
          cookie: 'auth-token=valid_token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      const response = await createTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.message).toBe('任务名称不能超过255个字符');
    });

    it('should return 400 when level_type is missing', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);

      const invalidData = { ...validTaskData };
      delete (invalidData as any).level_type;

      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 
          cookie: 'auth-token=valid_token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      const response = await createTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.message).toBe('任务层级类型不能为空');
    });

    it('should return 400 when level_type is invalid', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);

      const invalidData = { ...validTaskData, level_type: 'invalid_level' };

      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 
          cookie: 'auth-token=valid_token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      const response = await createTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.message).toBe('无效的任务层级类型');
    });

    it('should return 400 when estimated_hours is negative', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);

      const invalidData = { ...validTaskData, estimated_hours: -10 };

      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 
          cookie: 'auth-token=valid_token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      const response = await createTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.message).toBe('预估工时必须在0-9999小时之间');
    });

    it('should return 400 when date range is invalid', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);

      const invalidData = { 
        ...validTaskData, 
        start_date: '2025-12-31',
        end_date: '2025-01-01'
      };

      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 
          cookie: 'auth-token=valid_token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      const response = await createTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.message).toBe('开始日期不能晚于结束日期');
    });

    it('should return 500 when service throws error', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);
      mockWbsTaskService.createWBSTask = jest.fn().mockRejectedValue(
        new Error('项目不存在或没有权限')
      );

      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 
          cookie: 'auth-token=valid_token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(validTaskData)
      });

      const response = await createTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error.code).toBe('TASK_CREATE_ERROR');
    });
  });

  describe('GET /api/tasks/[id]', () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    const mockTask = {
      id: 1,
      project_id: 1,
      name: 'Test Task',
      wbs_code: '1',
      level: 1
    };

    it('should return task successfully', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);
      mockWbsTaskService.findWBSTaskById = jest.fn().mockReturnValue(mockTask);
      mockWbsTaskService.findProjectWBSTasks = jest.fn().mockReturnValue([mockTask]);

      const request = new NextRequest('http://localhost/api/tasks/1', {
        headers: { cookie: 'auth-token=valid_token' }
      });

      const response = await getTask(request, { params: { id: '1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.task).toEqual(mockTask);
    });

    it('should return 400 for invalid task ID', async () => {
      const request = new NextRequest('http://localhost/api/tasks/invalid', {
        headers: { cookie: 'auth-token=valid_token' }
      });

      const response = await getTask(request, { params: { id: 'invalid' } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.code).toBe('INVALID_TASK_ID');
    });

    it('should return 404 when task not found', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);
      mockWbsTaskService.findWBSTaskById = jest.fn().mockReturnValue(null);

      const request = new NextRequest('http://localhost/api/tasks/999', {
        headers: { cookie: 'auth-token=valid_token' }
      });

      const response = await getTask(request, { params: { id: '999' } });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error.code).toBe('TASK_NOT_FOUND');
    });

    it('should return 403 when user has no permission', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);
      mockWbsTaskService.findWBSTaskById = jest.fn().mockReturnValue(mockTask);
      mockWbsTaskService.findProjectWBSTasks = jest.fn().mockImplementation(() => {
        throw new Error('项目不存在或没有权限');
      });

      const request = new NextRequest('http://localhost/api/tasks/1', {
        headers: { cookie: 'auth-token=valid_token' }
      });

      const response = await getTask(request, { params: { id: '1' } });
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT /api/tasks/[id]', () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    const updateData = {
      name: 'Updated Task Name',
      status: 'in_progress',
      progress_percentage: 50
    };
    const mockUpdatedTask = {
      id: 1,
      name: 'Updated Task Name',
      status: 'in_progress',
      progress_percentage: 50
    };

    it('should update task successfully', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);
      mockWbsTaskService.updateWBSTask = jest.fn().mockResolvedValue(mockUpdatedTask);

      const request = new NextRequest('http://localhost/api/tasks/1', {
        method: 'PUT',
        headers: { 
          cookie: 'auth-token=valid_token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const response = await updateTask(request, { params: { id: '1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.task).toEqual(mockUpdatedTask);
    });

    it('should return 400 when name is empty', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);

      const invalidData = { name: '' };

      const request = new NextRequest('http://localhost/api/tasks/1', {
        method: 'PUT',
        headers: { 
          cookie: 'auth-token=valid_token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      const response = await updateTask(request, { params: { id: '1' } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.message).toBe('任务名称不能为空');
    });

    it('should return 400 when progress percentage is invalid', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);

      const invalidData = { progress_percentage: 150 };

      const request = new NextRequest('http://localhost/api/tasks/1', {
        method: 'PUT',
        headers: { 
          cookie: 'auth-token=valid_token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      const response = await updateTask(request, { params: { id: '1' } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.message).toBe('进度百分比必须在0-100之间');
    });
  });

  describe('DELETE /api/tasks/[id]', () => {
    const mockUser = { id: 1, email: 'test@example.com' };

    it('should delete task successfully', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);
      mockWbsTaskService.deleteWBSTask = jest.fn().mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/tasks/1', {
        method: 'DELETE',
        headers: { cookie: 'auth-token=valid_token' }
      });

      const response = await deleteTask(request, { params: { id: '1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('任务删除成功');
    });

    it('should return 400 for invalid task ID', async () => {
      const request = new NextRequest('http://localhost/api/tasks/invalid', {
        method: 'DELETE',
        headers: { cookie: 'auth-token=valid_token' }
      });

      const response = await deleteTask(request, { params: { id: 'invalid' } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.code).toBe('INVALID_TASK_ID');
    });

    it('should return 500 when task has children', async () => {
      mockAuthService.verifyToken.mockReturnValue(mockUser);
      mockWbsTaskService.deleteWBSTask = jest.fn().mockRejectedValue(
        new Error('请先删除所有子任务')
      );

      const request = new NextRequest('http://localhost/api/tasks/1', {
        method: 'DELETE',
        headers: { cookie: 'auth-token=valid_token' }
      });

      const response = await deleteTask(request, { params: { id: '1' } });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error.code).toBe('TASK_DELETE_ERROR');
    });
  });

  describe('Request/Response Format Validation', () => {
    it('should include timestamp in all responses', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      mockAuthService.verifyToken.mockReturnValue(mockUser);
      mockWbsTaskService.findProjectWBSTasks = jest.fn().mockReturnValue([]);
      mockWbsTaskService.getWBSTaskStats = jest.fn().mockReturnValue({
        total_tasks: 0, completed_tasks: 0, in_progress_tasks: 0,
        not_started_tasks: 0, avg_progress: 0, total_estimated_hours: 0,
        total_actual_hours: 0
      });

      const request = new NextRequest('http://localhost/api/tasks?project_id=1', {
        headers: { cookie: 'auth-token=valid_token' }
      });

      const response = await getTasks(request);
      const responseData = await response.json();

      expect(responseData.timestamp).toBeDefined();
      expect(typeof responseData.timestamp).toBe('string');
      expect(new Date(responseData.timestamp)).toBeInstanceOf(Date);
    });

    it('should maintain consistent error response format', async () => {
      const request = new NextRequest('http://localhost/api/tasks?project_id=1');

      const response = await getTasks(request);
      const responseData = await response.json();

      expect(responseData).toHaveProperty('success', false);
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toHaveProperty('code');
      expect(responseData.error).toHaveProperty('message');
      expect(responseData).toHaveProperty('timestamp');
    });
  });
});