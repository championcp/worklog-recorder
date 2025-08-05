/**
 * Comprehensive CRUD Test Scenarios for WBS Task Management
 * Tests Create, Read, Update, Delete operations across all hierarchy levels
 */

import { test, expect, Page } from '@playwright/test';

class CRUDTestManager {
  constructor(private page: Page) {}

  // Setup methods
  async navigateToProject(projectId: number) {
    await this.page.goto(`/projects/${projectId}`);
    await this.page.waitForSelector('[data-testid="wbs-task-tree"]');
  }

  async loginAsTestUser() {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', 'test@example.com');
    await this.page.fill('[data-testid="password-input"]', 'password123');
    await this.page.click('[data-testid="login-btn"]');
    await this.page.waitForURL('/dashboard');
  }

  // CREATE Operations Testing
  async testCreateRootTask(taskData: {
    name: string;
    description?: string;
    levelType?: string;
    priority?: string;
    estimatedHours?: number;
    startDate?: string;
    endDate?: string;
  }) {
    await this.page.click('[data-testid="create-root-task-btn"]');
    await this.page.waitForSelector('[data-testid="task-form-modal"]');

    await this.page.fill('[data-testid="task-name-input"]', taskData.name);
    
    if (taskData.description) {
      await this.page.fill('[data-testid="task-description-input"]', taskData.description);
    }
    
    if (taskData.levelType) {
      await this.page.selectOption('[data-testid="level-type-select"]', taskData.levelType);
    }
    
    if (taskData.priority) {
      await this.page.selectOption('[data-testid="priority-select"]', taskData.priority);
    }
    
    if (taskData.estimatedHours) {
      await this.page.fill('[data-testid="estimated-hours-input"]', taskData.estimatedHours.toString());
    }
    
    if (taskData.startDate) {
      await this.page.fill('[data-testid="start-date-input"]', taskData.startDate);
    }
    
    if (taskData.endDate) {
      await this.page.fill('[data-testid="end-date-input"]', taskData.endDate);
    }

    await this.page.click('[data-testid="submit-task-form"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  async testCreateSubTask(parentTaskId: number, taskData: {
    name: string;
    description?: string;
    priority?: string;
    estimatedHours?: number;
  }) {
    await this.page.click(`[data-testid="add-child-task-${parentTaskId}"]`);
    await this.page.waitForSelector('[data-testid="task-form-modal"]');

    await this.page.fill('[data-testid="task-name-input"]', taskData.name);
    
    if (taskData.description) {
      await this.page.fill('[data-testid="task-description-input"]', taskData.description);
    }
    
    if (taskData.priority) {
      await this.page.selectOption('[data-testid="priority-select"]', taskData.priority);
    }
    
    if (taskData.estimatedHours) {
      await this.page.fill('[data-testid="estimated-hours-input"]', taskData.estimatedHours.toString());
    }

    await this.page.click('[data-testid="submit-task-form"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  // READ Operations Testing
  async verifyTaskDisplay(taskId: number, expectedData: {
    wbsCode: string;
    name: string;
    level: number;
    status?: string;
    progress?: number;
    priority?: string;
  }) {
    const taskRow = this.page.locator(`[data-testid="task-row-${taskId}"]`);
    await expect(taskRow).toBeVisible();

    // Verify WBS code
    const wbsCode = taskRow.locator('[data-testid="wbs-code"]');
    await expect(wbsCode).toHaveText(expectedData.wbsCode);

    // Verify task name
    const taskName = taskRow.locator('[data-testid="task-name"]');
    await expect(taskName).toContainText(expectedData.name);

    // Verify level (visual indentation)
    await expect(taskRow).toHaveAttribute('data-level', expectedData.level.toString());

    // Verify status if provided
    if (expectedData.status) {
      const statusBadge = taskRow.locator('[data-testid="status-badge"]');
      await expect(statusBadge).toContainText(expectedData.status);
    }

    // Verify progress if provided
    if (expectedData.progress !== undefined) {
      const progressText = taskRow.locator('[data-testid="progress-text"]');
      await expect(progressText).toHaveText(`${expectedData.progress}%`);
    }

    // Verify priority if provided
    if (expectedData.priority) {
      const priorityIndicator = taskRow.locator('[data-testid="priority-indicator"]');
      const priorityMap = {
        'low': '低',
        'medium': '中',
        'high': '高',
        'urgent': '紧急'
      };
      await expect(priorityIndicator).toContainText(priorityMap[expectedData.priority as keyof typeof priorityMap]);
    }
  }

  async verifyTaskHierarchy(hierarchyStructure: {
    root: { taskId: number; wbsCode: string; name: string };
    children?: {
      taskId: number;
      wbsCode: string;
      name: string;
      children?: { taskId: number; wbsCode: string; name: string }[];
    }[];
  }) {
    // Verify root task
    await this.verifyTaskDisplay(hierarchyStructure.root.taskId, {
      wbsCode: hierarchyStructure.root.wbsCode,
      name: hierarchyStructure.root.name,
      level: 1
    });

    if (hierarchyStructure.children) {
      // Expand root to see children
      await this.page.click(`[data-testid="expand-task-${hierarchyStructure.root.taskId}"]`);
      
      for (const child of hierarchyStructure.children) {
        await this.verifyTaskDisplay(child.taskId, {
          wbsCode: child.wbsCode,
          name: child.name,
          level: 2
        });

        if (child.children) {
          // Expand child to see grandchildren
          await this.page.click(`[data-testid="expand-task-${child.taskId}"]`);
          
          for (const grandchild of child.children) {
            await this.verifyTaskDisplay(grandchild.taskId, {
              wbsCode: grandchild.wbsCode,
              name: grandchild.name,
              level: 3
            });
          }
        }
      }
    }
  }

  // UPDATE Operations Testing
  async testUpdateTask(taskId: number, updates: {
    name?: string;
    description?: string;
    status?: string;
    progress?: number;
    priority?: string;
    estimatedHours?: number;
    startDate?: string;
    endDate?: string;
  }) {
    await this.page.click(`[data-testid="edit-task-${taskId}"]`);
    await this.page.waitForSelector('[data-testid="edit-task-modal"]');

    if (updates.name) {
      await this.page.fill('[data-testid="edit-task-name"]', updates.name);
    }
    
    if (updates.description) {
      await this.page.fill('[data-testid="edit-task-description"]', updates.description);
    }
    
    if (updates.status) {
      await this.page.selectOption('[data-testid="edit-task-status"]', updates.status);
    }
    
    if (updates.progress !== undefined) {
      await this.page.fill('[data-testid="edit-task-progress"]', updates.progress.toString());
    }
    
    if (updates.priority) {
      await this.page.selectOption('[data-testid="edit-task-priority"]', updates.priority);
    }
    
    if (updates.estimatedHours) {
      await this.page.fill('[data-testid="edit-estimated-hours"]', updates.estimatedHours.toString());
    }
    
    if (updates.startDate) {
      await this.page.fill('[data-testid="edit-start-date"]', updates.startDate);
    }
    
    if (updates.endDate) {
      await this.page.fill('[data-testid="edit-end-date"]', updates.endDate);
    }

    await this.page.click('[data-testid="save-task-changes"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  async testBulkUpdate(taskIds: number[], updates: {
    status?: string;
    priority?: string;
  }) {
    // Select tasks
    for (const taskId of taskIds) {
      await this.page.click(`[data-testid="select-task-${taskId}"]`);
    }

    await this.page.click('[data-testid="bulk-actions-btn"]');
    
    if (updates.status) {
      await this.page.click('[data-testid="bulk-update-status"]');
      await this.page.selectOption('[data-testid="bulk-status-select"]', updates.status);
      await this.page.click('[data-testid="apply-bulk-update"]');
    }
    
    if (updates.priority) {
      await this.page.click('[data-testid="bulk-update-priority"]');
      await this.page.selectOption('[data-testid="bulk-priority-select"]', updates.priority);
      await this.page.click('[data-testid="apply-bulk-update"]');
    }

    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  // DELETE Operations Testing
  async testDeleteTask(taskId: number, expectSuccess: boolean = true) {
    await this.page.click(`[data-testid="delete-task-${taskId}"]`);
    await this.page.waitForSelector('[data-testid="delete-confirmation-modal"]');
    await this.page.click('[data-testid="confirm-delete-btn"]');

    if (expectSuccess) {
      await this.page.waitForSelector('[data-testid="success-notification"]');
      // Verify task is removed from display
      const taskRow = this.page.locator(`[data-testid="task-row-${taskId}"]`);
      await expect(taskRow).not.toBeVisible();
    } else {
      await this.page.waitForSelector('[data-testid="error-notification"]');
      // Verify task still exists
      const taskRow = this.page.locator(`[data-testid="task-row-${taskId}"]`);
      await expect(taskRow).toBeVisible();
    }
  }

  async testDeleteConfirmation(taskId: number, confirm: boolean) {
    await this.page.click(`[data-testid="delete-task-${taskId}"]`);
    await this.page.waitForSelector('[data-testid="delete-confirmation-modal"]');
    
    // Verify confirmation message
    await expect(this.page.locator('[data-testid="delete-confirmation-message"]'))
      .toContainText('确定要删除这个任务吗？删除后无法恢复。');

    if (confirm) {
      await this.page.click('[data-testid="confirm-delete-btn"]');
    } else {
      await this.page.click('[data-testid="cancel-delete-btn"]');
    }

    // Verify modal closes
    await expect(this.page.locator('[data-testid="delete-confirmation-modal"]')).not.toBeVisible();
  }

  // Validation Testing
  async testFormValidation(formType: 'create' | 'edit', taskId?: number) {
    if (formType === 'create') {
      await this.page.click('[data-testid="create-root-task-btn"]');
    } else {
      await this.page.click(`[data-testid="edit-task-${taskId}"]`);
    }
    
    await this.page.waitForSelector(`[data-testid="${formType}-task-modal"]`);

    // Test empty name validation
    await this.page.fill('[data-testid="task-name-input"]', '');
    await this.page.click('[data-testid="submit-task-form"]');
    await expect(this.page.locator('[data-testid="name-error"]'))
      .toContainText('任务名称不能为空');

    // Test long name validation
    await this.page.fill('[data-testid="task-name-input"]', 'A'.repeat(256));
    await this.page.click('[data-testid="submit-task-form"]');
    await expect(this.page.locator('[data-testid="name-error"]'))
      .toContainText('任务名称不能超过255个字符');

    // Test invalid estimated hours
    await this.page.fill('[data-testid="task-name-input"]', 'Valid Name');
    await this.page.fill('[data-testid="estimated-hours-input"]', '-1');
    await this.page.click('[data-testid="submit-task-form"]');
    await expect(this.page.locator('[data-testid="hours-error"]'))
      .toContainText('预估工时不能为负数');

    await this.page.fill('[data-testid="estimated-hours-input"]', '10000');
    await this.page.click('[data-testid="submit-task-form"]');
    await expect(this.page.locator('[data-testid="hours-error"]'))
      .toContainText('预估工时不能超过9999小时');

    // Test invalid date range
    await this.page.fill('[data-testid="estimated-hours-input"]', '8');
    await this.page.fill('[data-testid="start-date-input"]', '2025-12-31');
    await this.page.fill('[data-testid="end-date-input"]', '2025-01-01');
    await this.page.click('[data-testid="submit-task-form"]');
    await expect(this.page.locator('[data-testid="date-error"]'))
      .toContainText('开始日期不能晚于结束日期');

    // Close form
    await this.page.click('[data-testid="cancel-task-form"]');
  }

  // Status Transition Testing
  async testStatusTransitions(taskId: number) {
    const validTransitions = [
      { from: 'not_started', to: 'in_progress', label: '进行中' },
      { from: 'in_progress', to: 'paused', label: '已暂停' },
      { from: 'paused', to: 'in_progress', label: '进行中' },
      { from: 'in_progress', to: 'completed', label: '已完成' },
      { from: 'completed', to: 'in_progress', label: '进行中' },
      { from: 'in_progress', to: 'cancelled', label: '已取消' }
    ];

    for (const transition of validTransitions) {
      await this.testUpdateTask(taskId, { status: transition.to });
      await this.verifyTaskDisplay(taskId, {
        wbsCode: '', // Not testing WBS code here
        name: '', // Not testing name here
        level: 1, // Not testing level here
        status: transition.label
      });
    }
  }

  // Progress Update Testing
  async testProgressUpdates(taskId: number) {
    const progressValues = [0, 25, 50, 75, 100];

    for (const progress of progressValues) {
      await this.testUpdateTask(taskId, { progress });
      await this.verifyTaskDisplay(taskId, {
        wbsCode: '',
        name: '',
        level: 1,
        progress
      });
    }

    // Test automatic progress update when status changes to completed
    await this.testUpdateTask(taskId, { status: 'completed' });
    await this.verifyTaskDisplay(taskId, {
      wbsCode: '',
      name: '',
      level: 1,
      progress: 100,
      status: '已完成'
    });
  }
}

describe('CRUD Operations Testing - All Hierarchy Levels', () => {
  let crudManager: CRUDTestManager;
  const TEST_PROJECT_ID = 1;

  test.beforeEach(async ({ page }) => {
    crudManager = new CRUDTestManager(page);
    await crudManager.loginAsTestUser();
    await crudManager.navigateToProject(TEST_PROJECT_ID);
  });

  test.describe('CREATE Operations', () => {
    test('should create root task with all field types', async () => {
      await crudManager.testCreateRootTask({
        name: 'Complete Root Task',
        description: 'Comprehensive root task with all fields',
        levelType: 'yearly',
        priority: 'high',
        estimatedHours: 120,
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      });

      await crudManager.verifyTaskDisplay(1, {
        wbsCode: '1',
        name: 'Complete Root Task',
        level: 1,
        status: '未开始',
        progress: 0,
        priority: 'high'
      });
    });

    test('should create sub task under root', async () => {
      // Create root first
      await crudManager.testCreateRootTask({
        name: 'Parent Task',
        levelType: 'yearly'
      });

      // Create sub task
      await crudManager.testCreateSubTask(1, {
        name: 'Child Task',
        description: 'Sub task under root',
        priority: 'medium',
        estimatedHours: 40
      });

      await crudManager.verifyTaskHierarchy({
        root: { taskId: 1, wbsCode: '1', name: 'Parent Task' },
        children: [
          { taskId: 2, wbsCode: '1.1', name: 'Child Task' }
        ]
      });
    });

    test('should create detail task under sub task', async () => {
      // Create hierarchy
      await crudManager.testCreateRootTask({ name: 'Root', levelType: 'yearly' });
      await crudManager.testCreateSubTask(1, { name: 'Sub' });
      await crudManager.testCreateSubTask(2, { name: 'Detail' });

      await crudManager.verifyTaskHierarchy({
        root: { taskId: 1, wbsCode: '1', name: 'Root' },
        children: [
          {
            taskId: 2,
            wbsCode: '1.1',
            name: 'Sub',
            children: [
              { taskId: 3, wbsCode: '1.1.1', name: 'Detail' }
            ]
          }
        ]
      });
    });

    test('should create multiple tasks at each level', async () => {
      // Create multiple root tasks
      await crudManager.testCreateRootTask({ name: 'Root 1', levelType: 'yearly' });
      await crudManager.testCreateRootTask({ name: 'Root 2', levelType: 'yearly' });

      // Create multiple sub tasks under Root 1
      await crudManager.testCreateSubTask(1, { name: 'Sub 1.1' });
      await crudManager.testCreateSubTask(1, { name: 'Sub 1.2' });

      // Create multiple detail tasks under Sub 1.1
      await crudManager.testCreateSubTask(3, { name: 'Detail 1.1.1' });
      await crudManager.testCreateSubTask(3, { name: 'Detail 1.1.2' });

      // Verify complete hierarchy
      await crudManager.verifyTaskHierarchy({
        root: { taskId: 1, wbsCode: '1', name: 'Root 1' },
        children: [
          {
            taskId: 3,
            wbsCode: '1.1',
            name: 'Sub 1.1',
            children: [
              { taskId: 5, wbsCode: '1.1.1', name: 'Detail 1.1.1' },
              { taskId: 6, wbsCode: '1.1.2', name: 'Detail 1.1.2' }
            ]
          },
          { taskId: 4, wbsCode: '1.2', name: 'Sub 1.2' }
        ]
      });

      // Verify second root task
      await crudManager.verifyTaskDisplay(2, {
        wbsCode: '2',
        name: 'Root 2',
        level: 1
      });
    });

    test('should validate form inputs during creation', async () => {
      await crudManager.testFormValidation('create');
    });
  });

  test.describe('READ Operations', () => {
    test('should display task hierarchy correctly', async () => {
      // Create test hierarchy
      await crudManager.testCreateRootTask({
        name: 'Display Test Root',
        description: 'Root for display testing',
        levelType: 'yearly',
        priority: 'high',
        estimatedHours: 100
      });

      await crudManager.testCreateSubTask(1, {
        name: 'Display Test Sub',
        description: 'Sub for display testing',
        priority: 'medium',
        estimatedHours: 50
      });

      await crudManager.testCreateSubTask(2, {
        name: 'Display Test Detail',
        priority: 'low',
        estimatedHours: 25
      });

      // Verify all display elements
      await crudManager.verifyTaskDisplay(1, {
        wbsCode: '1',
        name: 'Display Test Root',
        level: 1,
        status: '未开始',
        progress: 0,
        priority: 'high'
      });

      // Expand and verify sub task
      await crudManager.page.click('[data-testid="expand-task-1"]');
      await crudManager.verifyTaskDisplay(2, {
        wbsCode: '1.1',
        name: 'Display Test Sub',
        level: 2,
        priority: 'medium'
      });

      // Expand and verify detail task
      await crudManager.page.click('[data-testid="expand-task-2"]');
      await crudManager.verifyTaskDisplay(3, {
        wbsCode: '1.1.1',
        name: 'Display Test Detail',
        level: 3,
        priority: 'low'
      });
    });

    test('should handle empty states correctly', async () => {
      // Verify empty state message
      await expect(crudManager.page.locator('[data-testid="empty-tasks-message"]'))
        .toContainText('暂无任务');
      
      await expect(crudManager.page.locator('[data-testid="empty-tasks-description"]'))
        .toContainText('创建您的第一个任务来开始使用WBS管理');
    });
  });

  test.describe('UPDATE Operations', () => {
    test('should update task properties at all levels', async () => {
      // Create hierarchy
      await crudManager.testCreateRootTask({ name: 'Original Root', levelType: 'yearly' });
      await crudManager.testCreateSubTask(1, { name: 'Original Sub' });
      await crudManager.testCreateSubTask(2, { name: 'Original Detail' });

      // Update root task
      await crudManager.testUpdateTask(1, {
        name: 'Updated Root',
        description: 'Updated description',
        status: 'in_progress',
        progress: 30,
        priority: 'urgent',
        estimatedHours: 150
      });

      await crudManager.verifyTaskDisplay(1, {
        wbsCode: '1',
        name: 'Updated Root',
        level: 1,
        status: '进行中',
        progress: 30,
        priority: 'urgent'
      });

      // Update sub task
      await crudManager.testUpdateTask(2, {
        name: 'Updated Sub',
        status: 'completed',
        progress: 100
      });

      await crudManager.page.click('[data-testid="expand-task-1"]');
      await crudManager.verifyTaskDisplay(2, {
        wbsCode: '1.1',
        name: 'Updated Sub',
        level: 2,
        status: '已完成',
        progress: 100
      });

      // Update detail task
      await crudManager.testUpdateTask(3, {
        name: 'Updated Detail',
        priority: 'high'
      });

      await crudManager.page.click('[data-testid="expand-task-2"]');
      await crudManager.verifyTaskDisplay(3, {
        wbsCode: '1.1.1',
        name: 'Updated Detail',
        level: 3,
        priority: 'high'
      });
    });

    test('should handle status transitions correctly', async () => {
      await crudManager.testCreateRootTask({ name: 'Status Test Task', levelType: 'monthly' });
      await crudManager.testStatusTransitions(1);
    });

    test('should handle progress updates correctly', async () => {
      await crudManager.testCreateRootTask({ name: 'Progress Test Task', levelType: 'weekly' });
      await crudManager.testProgressUpdates(1);
    });

    test('should validate form inputs during editing', async () => {
      await crudManager.testCreateRootTask({ name: 'Edit Validation Test', levelType: 'daily' });
      await crudManager.testFormValidation('edit', 1);
    });

    test('should handle bulk updates', async () => {
      // Create multiple tasks
      await crudManager.testCreateRootTask({ name: 'Bulk Test 1', levelType: 'yearly' });
      await crudManager.testCreateRootTask({ name: 'Bulk Test 2', levelType: 'yearly' });
      await crudManager.testCreateRootTask({ name: 'Bulk Test 3', levelType: 'yearly' });

      // Test bulk status update
      await crudManager.testBulkUpdate([1, 2, 3], { status: 'in_progress' });

      // Verify all tasks updated
      for (let i = 1; i <= 3; i++) {
        await crudManager.verifyTaskDisplay(i, {
          wbsCode: i.toString(),
          name: `Bulk Test ${i}`,
          level: 1,
          status: '进行中'
        });
      }

      // Test bulk priority update
      await crudManager.testBulkUpdate([1, 2], { priority: 'urgent' });

      // Verify priority updates
      await crudManager.verifyTaskDisplay(1, {
        wbsCode: '1',
        name: 'Bulk Test 1',
        level: 1,
        priority: 'urgent'
      });
    });
  });

  test.describe('DELETE Operations', () => {
    test('should delete leaf tasks successfully', async () => {
      // Create tasks without children
      await crudManager.testCreateRootTask({ name: 'Delete Test 1', levelType: 'yearly' });
      await crudManager.testCreateRootTask({ name: 'Delete Test 2', levelType: 'yearly' });

      // Delete second task
      await crudManager.testDeleteTask(2, true);

      // Verify first task still exists
      await crudManager.verifyTaskDisplay(1, {
        wbsCode: '1',
        name: 'Delete Test 1',
        level: 1
      });
    });

    test('should prevent deletion of tasks with children', async () => {
      // Create parent-child relationship
      await crudManager.testCreateRootTask({ name: 'Parent Task', levelType: 'yearly' });
      await crudManager.testCreateSubTask(1, { name: 'Child Task' });

      // Try to delete parent - should fail
      await crudManager.testDeleteTask(1, false);
      
      // Verify error message
      await expect(crudManager.page.locator('[data-testid="error-notification"]'))
        .toContainText('请先删除所有子任务');
    });

    test('should handle deletion confirmation correctly', async () => {
      await crudManager.testCreateRootTask({ name: 'Confirmation Test', levelType: 'monthly' });

      // Test cancellation
      await crudManager.testDeleteConfirmation(1, false);
      await crudManager.verifyTaskDisplay(1, {
        wbsCode: '1',
        name: 'Confirmation Test',
        level: 1
      });

      // Test confirmation
      await crudManager.testDeleteConfirmation(1, true);
    });

    test('should delete hierarchy in correct order', async () => {
      // Create 3-level hierarchy
      await crudManager.testCreateRootTask({ name: 'Hierarchy Root', levelType: 'yearly' });
      await crudManager.testCreateSubTask(1, { name: 'Hierarchy Sub' });
      await crudManager.testCreateSubTask(2, { name: 'Hierarchy Detail' });

      // Delete from bottom up
      await crudManager.testDeleteTask(3, true); // Detail first
      await crudManager.testDeleteTask(2, true); // Then sub
      await crudManager.testDeleteTask(1, true); // Finally root

      // Verify empty state
      await expect(crudManager.page.locator('[data-testid="empty-tasks-message"]'))
        .toBeVisible();
    });
  });

  test.describe('Complex CRUD Scenarios', () => {
    test('should handle mixed operations on complex hierarchy', async () => {
      // Create complex hierarchy
      await crudManager.testCreateRootTask({ name: 'Complex Root 1', levelType: 'yearly' });
      await crudManager.testCreateSubTask(1, { name: 'Complex Sub 1.1' });
      await crudManager.testCreateSubTask(1, { name: 'Complex Sub 1.2' });
      await crudManager.testCreateSubTask(2, { name: 'Complex Detail 1.1.1' });
      
      await crudManager.testCreateRootTask({ name: 'Complex Root 2', levelType: 'yearly' });
      await crudManager.testCreateSubTask(5, { name: 'Complex Sub 2.1' });

      // Perform mixed operations
      // 1. Update root task
      await crudManager.testUpdateTask(1, { status: 'in_progress', progress: 25 });
      
      // 2. Delete detail task
      await crudManager.testDeleteTask(4, true);
      
      // 3. Create new sub task
      await crudManager.testCreateSubTask(1, { name: 'New Sub 1.3' });
      
      // 4. Update multiple tasks
      await crudManager.testBulkUpdate([2, 3], { priority: 'high' });
      
      // 5. Delete and recreate
      await crudManager.testDeleteTask(6, true);
      await crudManager.testCreateSubTask(5, { name: 'Recreated Sub 2.1' });

      // Verify final state
      await crudManager.verifyTaskHierarchy({
        root: { taskId: 1, wbsCode: '1', name: 'Complex Root 1' },
        children: [
          { taskId: 2, wbsCode: '1.1', name: 'Complex Sub 1.1' },
          { taskId: 3, wbsCode: '1.2', name: 'Complex Sub 1.2' },
          { taskId: 7, wbsCode: '1.3', name: 'New Sub 1.3' }
        ]
      });
    });

    test('should maintain data integrity during rapid operations', async () => {
      // Perform rapid CRUD operations
      const operationStartTime = Date.now();
      
      // Create multiple tasks rapidly
      for (let i = 1; i <= 10; i++) {
        await crudManager.testCreateRootTask({ 
          name: `Rapid Task ${i}`, 
          levelType: 'monthly' 
        });
      }
      
      // Update all tasks rapidly
      for (let i = 1; i <= 10; i++) {
        await crudManager.testUpdateTask(i, { 
          status: 'in_progress', 
          progress: Math.floor(Math.random() * 100) 
        });
      }
      
      // Delete half of them rapidly
      for (let i = 6; i <= 10; i++) {
        await crudManager.testDeleteTask(i, true);
      }
      
      const operationTime = Date.now() - operationStartTime;
      console.log(`Completed rapid operations in ${operationTime}ms`);
      
      // Verify remaining tasks are intact
      for (let i = 1; i <= 5; i++) {
        await crudManager.verifyTaskDisplay(i, {
          wbsCode: i.toString(),
          name: `Rapid Task ${i}`,
          level: 1,
          status: '进行中'
        });
      }
      
      // Verify deleted tasks are gone
      for (let i = 6; i <= 10; i++) {
        const taskRow = crudManager.page.locator(`[data-testid="task-row-${i}"]`);
        await expect(taskRow).not.toBeVisible();
      }
    });
  });
});