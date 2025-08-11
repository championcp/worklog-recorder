/**
 * End-to-End Tests for WBS Task Management
 * Tests complete user workflows using Playwright
 */

import { test, expect, Page } from '@playwright/test';

// Test data and helper functions
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

const TEST_PROJECT = {
  id: 1,
  name: 'E2E Test Project'
};

class WBSTaskPage {
  constructor(private page: Page) {}

  async navigateToProject(projectId: number) {
    await this.page.goto(`/projects/${projectId}`);
    await this.page.waitForSelector('[data-testid="wbs-section"]');
  }

  async createRootTask(taskData: {
    name: string;
    description?: string;
    levelType?: string;
    priority?: string;
    estimatedHours?: number;
  }) {
    await this.page.click('[data-testid="create-root-task"]');
    await this.page.waitForSelector('[data-testid="task-form"]');
    
    await this.page.fill('[data-testid="task-name"]', taskData.name);
    
    if (taskData.description) {
      await this.page.fill('[data-testid="task-description"]', taskData.description);
    }
    
    if (taskData.levelType) {
      await this.page.selectOption('[data-testid="level-type"]', taskData.levelType);
    }
    
    if (taskData.priority) {
      await this.page.selectOption('[data-testid="priority"]', taskData.priority);
    }
    
    if (taskData.estimatedHours) {
      await this.page.fill('[data-testid="estimated-hours"]', taskData.estimatedHours.toString());
    }
    
    await this.page.click('[data-testid="create-task-submit"]');
    await this.page.waitForSelector('[data-testid="success-message"]');
  }

  async createSubTask(parentTaskId: number, taskData: {
    name: string;
    description?: string;
    levelType?: string;
    priority?: string;
  }) {
    await this.page.click(`[data-testid="add-child-task-${parentTaskId}"]`);
    await this.page.waitForSelector('[data-testid="task-form"]');
    
    await this.page.fill('[data-testid="task-name"]', taskData.name);
    
    if (taskData.description) {
      await this.page.fill('[data-testid="task-description"]', taskData.description);
    }
    
    if (taskData.priority) {
      await this.page.selectOption('[data-testid="priority"]', taskData.priority);
    }
    
    await this.page.click('[data-testid="create-task-submit"]');
    await this.page.waitForSelector('[data-testid="success-message"]');
  }

  async editTask(taskId: number, updates: {
    name?: string;
    status?: string;
    progress?: number;
    priority?: string;
  }) {
    await this.page.click(`[data-testid="edit-task-${taskId}"]`);
    await this.page.waitForSelector('[data-testid="edit-form"]');
    
    if (updates.name) {
      await this.page.fill('[data-testid="task-name"]', updates.name);
    }
    
    if (updates.status) {
      await this.page.selectOption('[data-testid="status"]', updates.status);
    }
    
    if (updates.progress !== undefined) {
      await this.page.fill('[data-testid="progress"]', updates.progress.toString());
    }
    
    if (updates.priority) {
      await this.page.selectOption('[data-testid="priority"]', updates.priority);
    }
    
    await this.page.click('[data-testid="update-task-submit"]');
    await this.page.waitForSelector('[data-testid="success-message"]');
  }

  async deleteTask(taskId: number) {
    await this.page.click(`[data-testid="delete-task-${taskId}"]`);
    await this.page.waitForSelector('[data-testid="confirm-dialog"]');
    await this.page.click('[data-testid="confirm-delete"]');
    await this.page.waitForSelector('[data-testid="success-message"]');
  }

  async expandAll() {
    await this.page.click('[data-testid="expand-all"]');
  }

  async collapseAll() {
    await this.page.click('[data-testid="collapse-all"]');
  }

  async getTaskByWBSCode(wbsCode: string) {
    return this.page.locator(`[data-testid="task-wbs-${wbsCode}"]`);
  }

  async getTaskStatus(taskId: number) {
    return this.page.locator(`[data-testid="status-badge-${taskId}"]`);
  }

  async getTaskProgress(taskId: number) {
    return this.page.locator(`[data-testid="progress-bar-${taskId}"]`);
  }
}

test.describe('WBS Task Management E2E Tests', () => {
  let wbsPage: WBSTaskPage;

  test.beforeEach(async ({ page }) => {
    wbsPage = new WBSTaskPage(page);
    
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', TEST_USER.email);
    await page.fill('[data-testid="password"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('Task Creation and Hierarchy', () => {
    test('should create complete 3-level task hierarchy', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);

      // Create root task
      await wbsPage.createRootTask({
        name: 'Project Planning',
        description: 'Initial project planning phase',
        levelType: 'yearly',
        priority: 'high',
        estimatedHours: 120
      });

      // Verify root task creation
      const rootTask = await wbsPage.getTaskByWBSCode('1');
      await expect(rootTask).toBeVisible();
      await expect(rootTask.locator('[data-testid="task-name"]')).toHaveText('Project Planning');

      // Create sub-task
      await wbsPage.createSubTask(1, {
        name: 'Requirements Gathering',
        description: 'Gather and analyze requirements',
        priority: 'high'
      });

      // Verify sub-task creation
      const subTask = await wbsPage.getTaskByWBSCode('1.1');
      await expect(subTask).toBeVisible();
      await expect(subTask.locator('[data-testid="task-name"]')).toHaveText('Requirements Gathering');

      // Create detail task
      await wbsPage.createSubTask(2, {
        name: 'User Story Definition',
        description: 'Define user stories and acceptance criteria',
        priority: 'medium'
      });

      // Verify detail task creation
      const detailTask = await wbsPage.getTaskByWBSCode('1.1.1');
      await expect(detailTask).toBeVisible();
      await expect(detailTask.locator('[data-testid="task-name"]')).toHaveText('User Story Definition');

      // Verify level 3 limit - Add Child button should be disabled
      const addChildButton = page.locator(`[data-testid="add-child-task-3"]`);
      await expect(addChildButton).toBeDisabled();

      // Verify tooltip on disabled button
      await addChildButton.hover();
      await expect(page.locator('[data-testid="tooltip"]')).toHaveText('Maximum level reached');
    });

    test('should enforce WBS code generation rules', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);

      // Create multiple root tasks
      await wbsPage.createRootTask({ name: 'Root Task 1', levelType: 'yearly' });
      await wbsPage.createRootTask({ name: 'Root Task 2', levelType: 'yearly' });

      // Verify sequential WBS codes
      await expect(await wbsPage.getTaskByWBSCode('1')).toBeVisible();
      await expect(await wbsPage.getTaskByWBSCode('2')).toBeVisible();

      // Create sub-tasks under first root
      await wbsPage.createSubTask(1, { name: 'Sub Task 1.1' });
      await wbsPage.createSubTask(1, { name: 'Sub Task 1.2' });

      // Verify sub-task WBS codes
      await expect(await wbsPage.getTaskByWBSCode('1.1')).toBeVisible();
      await expect(await wbsPage.getTaskByWBSCode('1.2')).toBeVisible();

      // Create sub-tasks under second root
      await wbsPage.createSubTask(2, { name: 'Sub Task 2.1' });

      // Verify independent numbering
      await expect(await wbsPage.getTaskByWBSCode('2.1')).toBeVisible();
    });
  });

  test.describe('Task Status and Progress Management', () => {
    test('should handle complete task lifecycle', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);

      // Create a task for testing
      await wbsPage.createRootTask({
        name: 'Test Task Lifecycle',
        levelType: 'monthly',
        priority: 'medium'
      });

      // Initial state verification
      let status = await wbsPage.getTaskStatus(1);
      await expect(status).toHaveText('未开始');
      
      let progress = await wbsPage.getTaskProgress(1);
      await expect(progress).toHaveAttribute('style', /width:\s*0%/);

      // Update to In Progress with 25% progress
      await wbsPage.editTask(1, {
        status: 'in_progress',
        progress: 25
      });

      // Verify updates
      status = await wbsPage.getTaskStatus(1);
      await expect(status).toHaveText('进行中');
      await expect(status).toHaveClass(/bg-blue-100/);
      
      progress = await wbsPage.getTaskProgress(1);
      await expect(progress).toHaveAttribute('style', /width:\s*25%/);

      // Update progress to 75%
      await wbsPage.editTask(1, { progress: 75 });
      
      progress = await wbsPage.getTaskProgress(1);
      await expect(progress).toHaveAttribute('style', /width:\s*75%/);

      // Complete the task
      await wbsPage.editTask(1, { status: 'completed' });

      // Verify automatic progress update to 100%
      status = await wbsPage.getTaskStatus(1);
      await expect(status).toHaveText('已完成');
      await expect(status).toHaveClass(/bg-green-100/);
      
      progress = await wbsPage.getTaskProgress(1);
      await expect(progress).toHaveAttribute('style', /width:\s*100%/);

      // Verify completion timestamp is set
      const taskRow = page.locator(`[data-testid="task-row-1"]`);
      await expect(taskRow.locator('[data-testid="completed-at"]')).toBeVisible();
    });

    test('should handle all status transitions correctly', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);
      await wbsPage.createRootTask({ name: 'Status Test Task', levelType: 'weekly' });

      const statusTests = [
        { status: 'in_progress', expectedText: '进行中', expectedClass: 'bg-blue-100' },
        { status: 'paused', expectedText: '已暂停', expectedClass: 'bg-yellow-100' },
        { status: 'cancelled', expectedText: '已取消', expectedClass: 'bg-red-100' },
        { status: 'completed', expectedText: '已完成', expectedClass: 'bg-green-100' },
        { status: 'not_started', expectedText: '未开始', expectedClass: 'bg-gray-100' }
      ];

      for (const test of statusTests) {
        await wbsPage.editTask(1, { status: test.status as any });
        
        const status = await wbsPage.getTaskStatus(1);
        await expect(status).toHaveText(test.expectedText);
        await expect(status).toHaveClass(new RegExp(test.expectedClass));
      }
    });
  });

  test.describe('Task Tree Navigation', () => {
    test('should handle expand/collapse operations', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);

      // Create hierarchy for testing
      await wbsPage.createRootTask({ name: 'Root 1', levelType: 'yearly' });
      await wbsPage.createSubTask(1, { name: 'Sub 1.1' });
      await wbsPage.createSubTask(2, { name: 'Detail 1.1.1' });
      
      await wbsPage.createRootTask({ name: 'Root 2', levelType: 'yearly' });
      await wbsPage.createSubTask(4, { name: 'Sub 2.1' });

      // Initially, only root tasks should be visible
      await expect(await wbsPage.getTaskByWBSCode('1')).toBeVisible();
      await expect(await wbsPage.getTaskByWBSCode('2')).toBeVisible();
      await expect(await wbsPage.getTaskByWBSCode('1.1')).not.toBeVisible();
      await expect(await wbsPage.getTaskByWBSCode('2.1')).not.toBeVisible();

      // Test individual node expansion
      await page.click('[data-testid="expand-node-1"]');
      await expect(await wbsPage.getTaskByWBSCode('1.1')).toBeVisible();
      await expect(await wbsPage.getTaskByWBSCode('1.1.1')).not.toBeVisible();

      // Test expand all
      await wbsPage.expandAll();
      await expect(await wbsPage.getTaskByWBSCode('1.1.1')).toBeVisible();
      await expect(await wbsPage.getTaskByWBSCode('2.1')).toBeVisible();

      // Test collapse all
      await wbsPage.collapseAll();
      await expect(await wbsPage.getTaskByWBSCode('1.1')).not.toBeVisible();
      await expect(await wbsPage.getTaskByWBSCode('2.1')).not.toBeVisible();
      await expect(await wbsPage.getTaskByWBSCode('1.1.1')).not.toBeVisible();
    });

    test('should display visual hierarchy correctly', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);

      // Create 3-level hierarchy
      await wbsPage.createRootTask({ name: 'Level 1 Task', levelType: 'yearly' });
      await wbsPage.createSubTask(1, { name: 'Level 2 Task' });
      await wbsPage.createSubTask(2, { name: 'Level 3 Task' });

      await wbsPage.expandAll();

      // Verify visual indentation
      const level1Task = page.locator('[data-testid="task-row-1"]');
      const level2Task = page.locator('[data-testid="task-row-2"]');
      const level3Task = page.locator('[data-testid="task-row-3"]');

      await expect(level1Task).toHaveClass(/ml-0/);
      await expect(level2Task).toHaveClass(/ml-6/);
      await expect(level3Task).toHaveClass(/ml-12/);

      // Verify WBS codes are displayed
      await expect(level1Task.locator('[data-testid="wbs-code"]')).toHaveText('1');
      await expect(level2Task.locator('[data-testid="wbs-code"]')).toHaveText('1.1');
      await expect(level3Task.locator('[data-testid="wbs-code"]')).toHaveText('1.1.1');
    });
  });

  test.describe('Task Deletion and Validation', () => {
    test('should enforce parent-child deletion rules', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);

      // Create hierarchy
      await wbsPage.createRootTask({ name: 'Parent Task', levelType: 'yearly' });
      await wbsPage.createSubTask(1, { name: 'Child Task' });

      // Try to delete parent task - should fail
      await page.click('[data-testid="delete-task-1"]');
      await page.waitForSelector('[data-testid="confirm-dialog"]');
      await page.click('[data-testid="confirm-delete"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]'))
        .toHaveText('请先删除所有子任务');

      // Parent task should still exist
      await expect(await wbsPage.getTaskByWBSCode('1')).toBeVisible();

      // Delete child task first
      await wbsPage.deleteTask(2);

      // Verify child task is removed
      await expect(await wbsPage.getTaskByWBSCode('1.1')).not.toBeVisible();

      // Now delete parent task - should succeed
      await wbsPage.deleteTask(1);

      // Verify parent task is removed
      await expect(await wbsPage.getTaskByWBSCode('1')).not.toBeVisible();
    });

    test('should handle deletion confirmation correctly', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);
      await wbsPage.createRootTask({ name: 'Task to Delete', levelType: 'monthly' });

      // Click delete button
      await page.click('[data-testid="delete-task-1"]');
      await page.waitForSelector('[data-testid="confirm-dialog"]');

      // Verify confirmation dialog content
      await expect(page.locator('[data-testid="confirm-dialog"]'))
        .toContainText('确定要删除这个任务吗？删除后无法恢复。');

      // Cancel deletion
      await page.click('[data-testid="cancel-delete"]');
      
      // Task should still exist
      await expect(await wbsPage.getTaskByWBSCode('1')).toBeVisible();

      // Try deletion again and confirm
      await page.click('[data-testid="delete-task-1"]');
      await page.waitForSelector('[data-testid="confirm-dialog"]');
      await page.click('[data-testid="confirm-delete"]');

      // Task should be removed
      await expect(await wbsPage.getTaskByWBSCode('1')).not.toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should validate task creation form', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);
      
      // Open create task form
      await page.click('[data-testid="create-root-task"]');
      await page.waitForSelector('[data-testid="task-form"]');

      // Try to submit empty form
      await page.click('[data-testid="create-task-submit"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="name-error"]'))
        .toHaveText('任务名称不能为空');

      // Enter name but invalid data
      await page.fill('[data-testid="task-name"]', 'A'.repeat(256));
      await page.click('[data-testid="create-task-submit"]');

      await expect(page.locator('[data-testid="name-error"]'))
        .toHaveText('任务名称不能超过255个字符');

      // Enter valid name
      await page.fill('[data-testid="task-name"]', 'Valid Task Name');

      // Test invalid estimated hours
      await page.fill('[data-testid="estimated-hours"]', '-10');
      await page.click('[data-testid="create-task-submit"]');

      await expect(page.locator('[data-testid="hours-error"]'))
        .toHaveText('预估工时必须在0-9999小时之间');

      // Test invalid date range
      await page.fill('[data-testid="start-date"]', '2025-12-31');
      await page.fill('[data-testid="end-date"]', '2025-01-01');
      await page.click('[data-testid="create-task-submit"]');

      await expect(page.locator('[data-testid="date-error"]'))
        .toHaveText('开始日期不能晚于结束日期');
    });

    test('should validate task editing form', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);
      await wbsPage.createRootTask({ name: 'Edit Test Task', levelType: 'weekly' });

      // Open edit form
      await page.click('[data-testid="edit-task-1"]');
      await page.waitForSelector('[data-testid="edit-form"]');

      // Clear name and try to save
      await page.fill('[data-testid="task-name"]', '');
      await page.click('[data-testid="update-task-submit"]');

      await expect(page.locator('[data-testid="name-error"]'))
        .toHaveText('任务名称不能为空');

      // Test invalid progress
      await page.fill('[data-testid="task-name"]', 'Valid Name');
      await page.fill('[data-testid="progress"]', '150');
      await page.click('[data-testid="update-task-submit"]');

      await expect(page.locator('[data-testid="progress-error"]'))
        .toHaveText('进度百分比必须在0-100之间');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work correctly on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await wbsPage.navigateToProject(TEST_PROJECT.id);

      // Create some tasks
      await wbsPage.createRootTask({ name: 'Tablet Test Task', levelType: 'monthly' });
      
      // Verify layout adapts
      await expect(page.locator('[data-testid="wbs-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="task-tree"]')).toBeVisible();

      // Test form on tablet
      await page.click('[data-testid="edit-task-1"]');
      await expect(page.locator('[data-testid="edit-form"]')).toBeVisible();
      
      // Form should be readable and usable
      const formWidth = await page.locator('[data-testid="edit-form"]').boundingBox();
      expect(formWidth?.width).toBeLessThanOrEqual(768);
    });

    test('should work correctly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await wbsPage.navigateToProject(TEST_PROJECT.id);

      // Mobile-specific elements should be visible
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Create task on mobile
      await page.click('[data-testid="mobile-create-task"]');
      await page.waitForSelector('[data-testid="mobile-task-form"]');
      
      // Form should be mobile-optimized
      await page.fill('[data-testid="task-name"]', 'Mobile Task');
      await page.selectOption('[data-testid="level-type"]', 'weekly');
      await page.click('[data-testid="create-task-submit"]');
      
      // Task should be created and visible
      await expect(await wbsPage.getTaskByWBSCode('1')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load task tree quickly with many tasks', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);

      // Create multiple tasks (simulate existing large dataset)
      // In real scenario, this would be pre-seeded test data
      const startTime = Date.now();
      
      await page.goto(`/projects/${TEST_PROJECT.id}`);
      await page.waitForSelector('[data-testid="wbs-section"]');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    test('should handle rapid task operations efficiently', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);
      
      // Create task
      const createStartTime = Date.now();
      await wbsPage.createRootTask({ name: 'Performance Test', levelType: 'daily' });
      const createTime = Date.now() - createStartTime;
      
      expect(createTime).toBeLessThan(500);

      // Edit task
      const editStartTime = Date.now();
      await wbsPage.editTask(1, { status: 'in_progress', progress: 50 });
      const editTime = Date.now() - editStartTime;
      
      expect(editTime).toBeLessThan(300);

      // Delete task
      const deleteStartTime = Date.now();
      await wbsPage.deleteTask(1);
      const deleteTime = Date.now() - deleteStartTime;
      
      expect(deleteTime).toBeLessThan(200);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);

      // Simulate network failure during task creation
      await page.route('**/api/tasks', route => {
        route.abort('failed');
      });

      await page.click('[data-testid="create-root-task"]');
      await page.fill('[data-testid="task-name"]', 'Network Error Test');
      await page.selectOption('[data-testid="level-type"]', 'monthly');
      await page.click('[data-testid="create-task-submit"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]'))
        .toContainText('网络错误，请重试');

      // Form should remain open for retry
      await expect(page.locator('[data-testid="task-form"]')).toBeVisible();
    });

    test('should handle server errors appropriately', async ({ page }) => {
      await wbsPage.navigateToProject(TEST_PROJECT.id);

      // Simulate server error
      await page.route('**/api/tasks', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'SERVER_ERROR', message: '服务器内部错误' }
          })
        });
      });

      await page.click('[data-testid="create-root-task"]');
      await page.fill('[data-testid="task-name"]', 'Server Error Test');
      await page.selectOption('[data-testid="level-type"]', 'monthly');
      await page.click('[data-testid="create-task-submit"]');

      // Should show server error message
      await expect(page.locator('[data-testid="error-message"]'))
        .toContainText('服务器内部错误');
    });
  });
});