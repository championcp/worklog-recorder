/**
 * Test Helper Functions and Utilities
 * Common functions used across multiple test files
 */

import type { WBSTask, WBSTaskTree, CreateWBSTaskInput } from '../../src/types/project';

// Mock data generators
export const createMockTask = (overrides: Partial<WBSTask> = {}): WBSTask => ({
  id: 1,
  project_id: 1,
  parent_id: undefined,
  wbs_code: '1',
  name: 'Mock Task',
  description: 'Mock task description',
  level: 1,
  level_type: 'yearly',
  sort_order: 1,
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  estimated_hours: 40,
  actual_hours: 0,
  status: 'not_started',
  progress_percentage: 0,
  priority: 'medium',
  created_at: '2025-08-04T10:00:00.000Z',
  updated_at: '2025-08-04T10:00:00.000Z',
  sync_version: 1,
  is_deleted: false,
  ...overrides
});

export const createMockTaskTree = (overrides: Partial<WBSTaskTree> = {}): WBSTaskTree => ({
  ...createMockTask(),
  children: [],
  full_path: '1',
  depth: 1,
  ...overrides
});

export const createMockHierarchy = (): WBSTaskTree[] => [
  {
    ...createMockTask({ id: 1, name: 'Root Task 1', wbs_code: '1' }),
    children: [
      {
        ...createMockTask({ 
          id: 2, 
          parent_id: 1, 
          name: 'Sub Task 1.1', 
          wbs_code: '1.1', 
          level: 2,
          level_type: 'quarterly'
        }),
        children: [
          {
            ...createMockTask({ 
              id: 3, 
              parent_id: 2, 
              name: 'Detail Task 1.1.1', 
              wbs_code: '1.1.1', 
              level: 3,
              level_type: 'monthly'
            }),
            children: [],
            full_path: '1.1.1',
            depth: 3
          }
        ],
        full_path: '1.1',
        depth: 2
      }
    ],
    full_path: '1',
    depth: 1
  },
  {
    ...createMockTask({ id: 4, name: 'Root Task 2', wbs_code: '2' }),
    children: [],
    full_path: '2',
    depth: 1
  }
];

export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  ...overrides
});

export const createMockProject = (overrides = {}) => ({
  id: 1,
  name: 'Test Project',
  description: 'Test project description',
  user_id: 1,
  ...overrides
});

// API response mocks
export const createMockApiResponse = (data: any, success = true) => ({
  success,
  data,
  message: success ? '操作成功' : '操作失败',
  timestamp: '2025-08-04T10:00:00.000Z',
  ...(success ? {} : { error: { code: 'ERROR', message: '操作失败' } })
});

export const createMockTasksResponse = (tasks: WBSTaskTree[] = []) => 
  createMockApiResponse({
    tasks,
    stats: {
      total_tasks: tasks.length,
      completed_tasks: tasks.filter(t => t.status === 'completed').length,
      in_progress_tasks: tasks.filter(t => t.status === 'in_progress').length,
      not_started_tasks: tasks.filter(t => t.status === 'not_started').length,
      avg_progress: tasks.reduce((sum, t) => sum + t.progress_percentage, 0) / (tasks.length || 1),
      total_estimated_hours: tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0),
      total_actual_hours: tasks.reduce((sum, t) => sum + t.actual_hours, 0)
    }
  });

// Database mock helpers
export const createMockDatabase = () => {
  const queries: { [key: string]: any } = {};
  
  const mockPrepare = jest.fn().mockImplementation((sql: string) => {
    const mockStatement = {
      get: jest.fn(),
      all: jest.fn(),
      run: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
    };
    
    queries[sql] = mockStatement;
    return mockStatement;
  });

  return {
    prepare: mockPrepare,
    queries,
    // Helper to setup query responses
    mockQuery: (sql: string, method: 'get' | 'all' | 'run', returnValue: any) => {
      if (queries[sql]) {
        queries[sql][method].mockReturnValue(returnValue);
      }
    }
  };
};

// Form testing helpers
export const fillForm = async (user: any, formData: { [key: string]: string }) => {
  for (const [field, value] of Object.entries(formData)) {
    const input = document.querySelector(`[data-testid="${field}"]`) as HTMLElement;
    if (input) {
      if (input.tagName === 'SELECT') {
        await user.selectOptions(input, value);
      } else {
        await user.clear(input);
        await user.type(input, value);
      }
    }
  }
};

export const submitForm = async (user: any, submitButtonText = '提交') => {
  const submitButton = document.querySelector(`button:contains("${submitButtonText}")`) as HTMLElement;
  if (submitButton) {
    await user.click(submitButton);
  }
};

// Test data validation helpers
export const validateTaskData = (task: WBSTask) => {
  expect(task).toHaveProperty('id');
  expect(task).toHaveProperty('project_id');
  expect(task).toHaveProperty('wbs_code');
  expect(task).toHaveProperty('name');
  expect(task).toHaveProperty('level');
  expect(task).toHaveProperty('status');
  expect(task).toHaveProperty('priority');
  expect(task.progress_percentage).toBeGreaterThanOrEqual(0);
  expect(task.progress_percentage).toBeLessThanOrEqual(100);
};

export const validateWBSCode = (wbsCode: string, expectedPattern: RegExp) => {
  expect(wbsCode).toMatch(expectedPattern);
};

export const validateHierarchy = (tasks: WBSTaskTree[]) => {
  const validateNode = (node: WBSTaskTree, expectedDepth: number) => {
    expect(node.depth).toBe(expectedDepth);
    expect(node.level).toBe(expectedDepth);
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        expect(child.parent_id).toBe(node.id);
        expect(child.wbs_code).toMatch(new RegExp(`^${node.wbs_code}\\.\\d+$`));
        validateNode(child, expectedDepth + 1);
      });
    }
  };

  tasks.forEach(rootTask => {
    expect(rootTask.parent_id).toBeUndefined();
    expect(rootTask.wbs_code).toMatch(/^\d+$/);
    validateNode(rootTask, 1);
  });
};

// Performance testing helpers
export const measureTime = async (fn: () => Promise<any>) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

export const expectPerformance = (actualTime: number, maxTime: number, operation: string) => {
  expect(actualTime).toBeLessThan(maxTime);
  console.log(`✓ ${operation} completed in ${actualTime.toFixed(2)}ms (limit: ${maxTime}ms)`);
};

// Error simulation helpers
export const createNetworkError = () => new Error('Network request failed');

export const createServerError = (code = 'SERVER_ERROR', message = 'Internal Server Error') => ({
  success: false,
  error: { code, message },
  timestamp: '2025-08-04T10:00:00.000Z'
});

export const createValidationError = (field: string, message: string) => ({
  success: false,
  error: { 
    code: 'VALIDATION_ERROR', 
    message,
    field 
  },
  timestamp: '2025-08-04T10:00:00.000Z'
});

// Mock fetch helper
export const mockFetchResponse = (data: any, status = 200, ok = true) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  } as Response);
};

export const mockFetchError = (error: Error) => Promise.reject(error);

// Auth helpers for testing
export const mockAuthToken = 'mock-jwt-token';

export const mockAuthHeaders = {
  'Cookie': `auth-token=${mockAuthToken}`,
  'Content-Type': 'application/json'
};

export const createAuthenticatedRequest = (url: string, options: RequestInit = {}) => ({
  url,
  options: {
    ...options,
    headers: {
      ...mockAuthHeaders,
      ...options.headers
    }
  }
});

// Component testing helpers
export const waitForElementToBeRemoved = async (element: HTMLElement, timeout = 5000) => {
  const start = Date.now();
  
  while (element.isConnected && Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  if (element.isConnected) {
    throw new Error(`Element was not removed within ${timeout}ms`);
  }
};

export const expectElementToHaveClass = (element: HTMLElement, className: string) => {
  expect(element.classList.contains(className)).toBe(true);
};

export const expectElementToHaveAttribute = (element: HTMLElement, attribute: string, value?: string) => {
  expect(element.hasAttribute(attribute)).toBe(true);
  if (value !== undefined) {
    expect(element.getAttribute(attribute)).toBe(value);
  }
};

// Test cleanup helpers
export const cleanupTestData = () => {
  // Clear any global state, local storage, etc.
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset any global mocks
  jest.clearAllMocks();
};

// Custom matchers for Jest
expect.extend({
  toBeValidWBSCode(received: string) {
    const pass = /^\d+(\.\d+)*$/.test(received);
    return {
      message: () => `expected ${received} to be a valid WBS code`,
      pass
    };
  },
  
  toHaveValidTaskStructure(received: WBSTask) {
    try {
      validateTaskData(received);
      return { message: () => '', pass: true };
    } catch (error) {
      return { 
        message: () => `Task structure is invalid: ${error}`, 
        pass: false 
      };
    }
  }
});

// TypeScript declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidWBSCode(): R;
      toHaveValidTaskStructure(): R;
    }
  }
}