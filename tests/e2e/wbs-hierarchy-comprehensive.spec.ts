/**
 * Comprehensive WBS Hierarchy Test Scenarios
 * Detailed test cases for all three levels of task management
 */

import { test, expect, Page } from '@playwright/test';

// Enhanced test utilities for hierarchy testing
class WBSHierarchyTestPage {
  constructor(private page: Page) {}

  // Navigation and setup
  async navigateToProject(projectId: number) {
    await this.page.goto(`/projects/${projectId}`);
    await this.page.waitForSelector('[data-testid="wbs-task-tree"]', { timeout: 10000 });
  }

  // Task creation with full validation
  async createTaskAtLevel(level: 1 | 2 | 3, parentTaskId?: number, taskData?: {
    name: string;
    description?: string;
    levelType?: string;
    priority?: string;
    estimatedHours?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const defaultData = {
      name: `Test Task Level ${level}`,
      description: `Description for level ${level} task`,
      levelType: level === 1 ? 'yearly' : level === 2 ? 'quarterly' : 'monthly',
      priority: 'medium',
      estimatedHours: 8
    };
    
    const data = { ...defaultData, ...taskData };

    if (level === 1) {
      await this.page.click('[data-testid="create-root-task-btn"]');
    } else {
      await this.page.click(`[data-testid="add-child-task-${parentTaskId}"]`);
    }

    await this.page.waitForSelector('[data-testid="task-form-modal"]');
    
    // Fill form fields
    await this.page.fill('[data-testid="task-name-input"]', data.name);
    
    if (data.description) {
      await this.page.fill('[data-testid="task-description-input"]', data.description);
    }
    
    await this.page.selectOption('[data-testid="level-type-select"]', data.levelType);
    await this.page.selectOption('[data-testid="priority-select"]', data.priority);
    
    if (data.estimatedHours) {
      await this.page.fill('[data-testid="estimated-hours-input"]', data.estimatedHours.toString());
    }
    
    if (data.startDate) {
      await this.page.fill('[data-testid="start-date-input"]', data.startDate);
    }
    
    if (data.endDate) {
      await this.page.fill('[data-testid="end-date-input"]', data.endDate);
    }

    await this.page.click('[data-testid="submit-task-form"]');
    await this.page.waitForSelector('[data-testid="success-notification"]', { timeout: 5000 });
  }

  // Hierarchy navigation controls
  async expandTask(taskId: number) {
    const expandButton = this.page.locator(`[data-testid="expand-task-${taskId}"]`);
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await this.page.waitForTimeout(300); // Wait for animation
    }
  }

  async collapseTask(taskId: number) {
    const collapseButton = this.page.locator(`[data-testid="collapse-task-${taskId}"]`);
    if (await collapseButton.isVisible()) {
      await collapseButton.click();
      await this.page.waitForTimeout(300); // Wait for animation
    }
  }

  async expandAllTasks() {
    await this.page.click('[data-testid="expand-all-btn"]');
    await this.page.waitForTimeout(500); // Wait for all animations
  }

  async collapseAllTasks() {
    await this.page.click('[data-testid="collapse-all-btn"]');
    await this.page.waitForTimeout(500); // Wait for all animations
  }

  // Task verification methods
  async verifyTaskVisible(wbsCode: string) {
    const task = this.page.locator(`[data-testid="task-${wbsCode}"]`);
    await expect(task).toBeVisible();
    return task;
  }

  async verifyTaskHidden(wbsCode: string) {
    const task = this.page.locator(`[data-testid="task-${wbsCode}"]`);
    await expect(task).not.toBeVisible();
  }

  async verifyWBSCode(taskId: number, expectedCode: string) {
    const wbsElement = this.page.locator(`[data-testid="wbs-code-${taskId}"]`);
    await expect(wbsElement).toHaveText(expectedCode);
  }

  async verifyTaskLevel(taskId: number, expectedLevel: number) {
    const taskElement = this.page.locator(`[data-testid="task-row-${taskId}"]`);
    await expect(taskElement).toHaveAttribute('data-level', expectedLevel.toString());
  }

  async verifyExpandCollapseControls(taskId: number, hasChildren: boolean) {
    if (hasChildren) {
      const expandControl = this.page.locator(`[data-testid="expand-collapse-${taskId}"]`);
      await expect(expandControl).toBeVisible();
    } else {
      const expandControl = this.page.locator(`[data-testid="expand-collapse-${taskId}"]`);
      await expect(expandControl).not.toBeVisible();
    }
  }

  async verifyAddChildButtonState(taskId: number, taskLevel: number) {
    const addChildBtn = this.page.locator(`[data-testid="add-child-task-${taskId}"]`);
    
    if (taskLevel >= 3) {
      await expect(addChildBtn).toBeDisabled();
      await addChildBtn.hover();
      await expect(this.page.locator('[data-testid="tooltip"]')).toContainText('Maximum level reached');
    } else {
      await expect(addChildBtn).toBeEnabled();
    }
  }

  // Task manipulation methods
  async editTask(taskId: number, updates: {
    name?: string;
    status?: string;
    progress?: number;
    priority?: string;
  }) {
    await this.page.click(`[data-testid="edit-task-${taskId}"]`);
    await this.page.waitForSelector('[data-testid="edit-task-modal"]');

    if (updates.name) {
      await this.page.fill('[data-testid="edit-task-name"]', updates.name);
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

    await this.page.click('[data-testid="save-task-changes"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  async deleteTask(taskId: number, confirmDelete: boolean = true) {
    await this.page.click(`[data-testid="delete-task-${taskId}"]`);
    await this.page.waitForSelector('[data-testid="delete-confirmation-modal"]');
    
    if (confirmDelete) {
      await this.page.click('[data-testid="confirm-delete-btn"]');
      await this.page.waitForSelector('[data-testid="success-notification"]');
    } else {
      await this.page.click('[data-testid="cancel-delete-btn"]');
    }
  }

  // Status and progress verification
  async verifyTaskStatus(taskId: number, expectedStatus: string) {
    const statusBadge = this.page.locator(`[data-testid="status-badge-${taskId}"]`);
    await expect(statusBadge).toContainText(expectedStatus);
  }

  async verifyTaskProgress(taskId: number, expectedProgress: number) {
    const progressBar = this.page.locator(`[data-testid="progress-bar-${taskId}"]`);
    const progressText = this.page.locator(`[data-testid="progress-text-${taskId}"]`);
    
    await expect(progressText).toHaveText(`${expectedProgress}%`);
    await expect(progressBar).toHaveCSS('width', `${expectedProgress}%`);
  }

  // Bulk operations
  async selectTask(taskId: number) {
    await this.page.click(`[data-testid="select-task-${taskId}"]`);
  }

  async selectMultipleTasks(taskIds: number[]) {
    for (const taskId of taskIds) {
      await this.selectTask(taskId);
    }
  }

  async bulkUpdateStatus(newStatus: string) {
    await this.page.click('[data-testid="bulk-actions-btn"]');
    await this.page.click('[data-testid="bulk-update-status"]');
    await this.page.selectOption('[data-testid="bulk-status-select"]', newStatus);
    await this.page.click('[data-testid="apply-bulk-update"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }
}

describe('WBS Hierarchy Functionality - Level-Specific Tests', () => {
  let hierarchyPage: WBSHierarchyTestPage;
  const TEST_PROJECT_ID = 1;

  test.beforeEach(async ({ page }) => {
    hierarchyPage = new WBSHierarchyTestPage(page);
    
    // Login (assuming login helper exists)
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-btn"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('First Level (Root Tasks) Testing', () => {
    test('should create root task with correct WBS code', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      await hierarchyPage.createTaskAtLevel(1, undefined, {
        name: 'Project Foundation',
        description: 'Core project setup and planning',
        levelType: 'yearly',
        priority: 'high',
        estimatedHours: 120
      });

      // Verify task creation
      await hierarchyPage.verifyTaskVisible('1');
      await hierarchyPage.verifyWBSCode(1, '1');
      await hierarchyPage.verifyTaskLevel(1, 1);
      await hierarchyPage.verifyExpandCollapseControls(1, false); // No children initially
    });

    test('should create multiple root tasks with sequential WBS codes', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create first root task
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root Task 1' });
      await hierarchyPage.verifyWBSCode(1, '1');
      
      // Create second root task
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root Task 2' });
      await hierarchyPage.verifyWBSCode(2, '2');
      
      // Create third root task
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root Task 3' });
      await hierarchyPage.verifyWBSCode(3, '3');
      
      // Verify all are visible
      await hierarchyPage.verifyTaskVisible('1');
      await hierarchyPage.verifyTaskVisible('2');
      await hierarchyPage.verifyTaskVisible('3');
    });

    test('should handle root task CRUD operations', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create
      await hierarchyPage.createTaskAtLevel(1, undefined, {
        name: 'CRUD Test Task',
        priority: 'medium'
      });
      
      // Read (verify creation)
      await hierarchyPage.verifyTaskVisible('1');
      await hierarchyPage.verifyTaskStatus(1, '未开始');
      
      // Update
      await hierarchyPage.editTask(1, {
        name: 'Updated CRUD Task',
        status: 'in_progress',
        progress: 25,
        priority: 'high'
      });
      
      // Verify updates
      const taskElement = await hierarchyPage.verifyTaskVisible('1');
      await expect(taskElement.locator('[data-testid="task-name"]')).toContainText('Updated CRUD Task');
      await hierarchyPage.verifyTaskStatus(1, '进行中');
      await hierarchyPage.verifyTaskProgress(1, 25);
      
      // Delete (should work since no children)
      await hierarchyPage.deleteTask(1, true);
      await hierarchyPage.verifyTaskHidden('1');
    });
  });

  test.describe('Second Level (Sub Tasks) Testing', () => {
    test('should create sub task under root with correct WBS code', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create root task first
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Parent Task' });
      
      // Create sub task
      await hierarchyPage.createTaskAtLevel(2, 1, {
        name: 'Sub Task 1',
        levelType: 'quarterly',
        priority: 'medium'
      });
      
      // Verify sub task creation
      await hierarchyPage.verifyWBSCode(2, '1.1');
      await hierarchyPage.verifyTaskLevel(2, 2);
      
      // Verify parent now has expand/collapse controls
      await hierarchyPage.verifyExpandCollapseControls(1, true);
      
      // Initially sub task should be visible (expanded by default in some implementations)
      // or hidden (collapsed by default) - verify your specific implementation
      await hierarchyPage.expandTask(1);
      await hierarchyPage.verifyTaskVisible('1.1');
    });

    test('should create multiple sub tasks with sequential numbering', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create root task
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Multi-Sub Parent' });
      
      // Create multiple sub tasks
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub Task 1.1' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub Task 1.2' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub Task 1.3' });
      
      // Verify WBS codes
      await hierarchyPage.verifyWBSCode(2, '1.1');
      await hierarchyPage.verifyWBSCode(3, '1.2');
      await hierarchyPage.verifyWBSCode(4, '1.3');
      
      // Expand parent and verify all children visible
      await hierarchyPage.expandTask(1);
      await hierarchyPage.verifyTaskVisible('1.1');
      await hierarchyPage.verifyTaskVisible('1.2');
      await hierarchyPage.verifyTaskVisible('1.3');
    });

    test('should handle independent sub task hierarchies', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create two root tasks
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root A' });
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root B' });
      
      // Create sub tasks under each root
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub A.1' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub A.2' });
      await hierarchyPage.createTaskAtLevel(2, 2, { name: 'Sub B.1' });
      
      // Verify independent numbering
      await hierarchyPage.verifyWBSCode(3, '1.1'); // Sub A.1
      await hierarchyPage.verifyWBSCode(4, '1.2'); // Sub A.2
      await hierarchyPage.verifyWBSCode(5, '2.1'); // Sub B.1
      
      // Verify expand/collapse independence
      await hierarchyPage.expandTask(1); // Expand Root A
      await hierarchyPage.verifyTaskVisible('1.1');
      await hierarchyPage.verifyTaskVisible('1.2');
      await hierarchyPage.verifyTaskHidden('2.1'); // Root B still collapsed
      
      await hierarchyPage.expandTask(2); // Expand Root B
      await hierarchyPage.verifyTaskVisible('2.1');
    });
  });

  test.describe('Third Level (Detail Tasks) Testing', () => {
    test('should create third level task with correct WBS code', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create hierarchy: Root -> Sub -> Detail
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root Task' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub Task' });
      await hierarchyPage.createTaskAtLevel(3, 2, { name: 'Detail Task' });
      
      // Verify WBS codes at all levels
      await hierarchyPage.verifyWBSCode(1, '1');
      await hierarchyPage.verifyWBSCode(2, '1.1');
      await hierarchyPage.verifyWBSCode(3, '1.1.1');
      
      // Verify task levels
      await hierarchyPage.verifyTaskLevel(1, 1);
      await hierarchyPage.verifyTaskLevel(2, 2);
      await hierarchyPage.verifyTaskLevel(3, 3);
    });

    test('should enforce three-level limit', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create full three-level hierarchy
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Level 1' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Level 2' });
      await hierarchyPage.createTaskAtLevel(3, 2, { name: 'Level 3' });
      
      // Verify level 3 task cannot have children
      await hierarchyPage.verifyAddChildButtonState(3, 3); // Should be disabled
      
      // Verify level 1 and 2 can still have children
      await hierarchyPage.verifyAddChildButtonState(1, 1); // Should be enabled
      await hierarchyPage.verifyAddChildButtonState(2, 2); // Should be enabled
    });

    test('should handle complex multi-branch hierarchy', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create complex hierarchy:
      // 1. Root A
      //    1.1. Sub A.1
      //        1.1.1. Detail A.1.1
      //        1.1.2. Detail A.1.2
      //    1.2. Sub A.2
      //        1.2.1. Detail A.2.1
      // 2. Root B
      //    2.1. Sub B.1
      //        2.1.1. Detail B.1.1
      
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root A' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub A.1' });
      await hierarchyPage.createTaskAtLevel(3, 2, { name: 'Detail A.1.1' });
      await hierarchyPage.createTaskAtLevel(3, 2, { name: 'Detail A.1.2' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub A.2' });
      await hierarchyPage.createTaskAtLevel(3, 5, { name: 'Detail A.2.1' });
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root B' });
      await hierarchyPage.createTaskAtLevel(2, 7, { name: 'Sub B.1' });
      await hierarchyPage.createTaskAtLevel(3, 8, { name: 'Detail B.1.1' });
      
      // Verify all WBS codes
      await hierarchyPage.verifyWBSCode(1, '1');     // Root A
      await hierarchyPage.verifyWBSCode(2, '1.1');   // Sub A.1
      await hierarchyPage.verifyWBSCode(3, '1.1.1'); // Detail A.1.1
      await hierarchyPage.verifyWBSCode(4, '1.1.2'); // Detail A.1.2
      await hierarchyPage.verifyWBSCode(5, '1.2');   // Sub A.2
      await hierarchyPage.verifyWBSCode(6, '1.2.1'); // Detail A.2.1
      await hierarchyPage.verifyWBSCode(7, '2');     // Root B
      await hierarchyPage.verifyWBSCode(8, '2.1');   // Sub B.1
      await hierarchyPage.verifyWBSCode(9, '2.1.1'); // Detail B.1.1
    });
  });

  test.describe('Expand/Collapse Navigation Testing', () => {
    test('should handle individual node expand/collapse at all levels', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create test hierarchy
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub' });
      await hierarchyPage.createTaskAtLevel(3, 2, { name: 'Detail' });
      
      // Initially, only root should be visible
      await hierarchyPage.verifyTaskVisible('1');
      await hierarchyPage.verifyTaskHidden('1.1');
      await hierarchyPage.verifyTaskHidden('1.1.1');
      
      // Expand root - sub should become visible
      await hierarchyPage.expandTask(1);
      await hierarchyPage.verifyTaskVisible('1.1');
      await hierarchyPage.verifyTaskHidden('1.1.1'); // Detail still hidden
      
      // Expand sub - detail should become visible
      await hierarchyPage.expandTask(2);
      await hierarchyPage.verifyTaskVisible('1.1.1');
      
      // Collapse sub - detail should be hidden
      await hierarchyPage.collapseTask(2);
      await hierarchyPage.verifyTaskHidden('1.1.1');
      await hierarchyPage.verifyTaskVisible('1.1'); // Sub still visible
      
      // Collapse root - all children hidden
      await hierarchyPage.collapseTask(1);
      await hierarchyPage.verifyTaskHidden('1.1');
      await hierarchyPage.verifyTaskHidden('1.1.1');
    });

    test('should handle expand all functionality', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create multiple hierarchies
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root 1' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub 1.1' });
      await hierarchyPage.createTaskAtLevel(3, 2, { name: 'Detail 1.1.1' });
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root 2' });
      await hierarchyPage.createTaskAtLevel(2, 4, { name: 'Sub 2.1' });
      
      // Use expand all
      await hierarchyPage.expandAllTasks();
      
      // Verify all tasks are visible
      await hierarchyPage.verifyTaskVisible('1');
      await hierarchyPage.verifyTaskVisible('1.1');
      await hierarchyPage.verifyTaskVisible('1.1.1');
      await hierarchyPage.verifyTaskVisible('2');
      await hierarchyPage.verifyTaskVisible('2.1');
    });

    test('should handle collapse all functionality', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create hierarchy and expand all
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub' });
      await hierarchyPage.createTaskAtLevel(3, 2, { name: 'Detail' });
      await hierarchyPage.expandAllTasks();
      
      // Verify all visible
      await hierarchyPage.verifyTaskVisible('1');
      await hierarchyPage.verifyTaskVisible('1.1');
      await hierarchyPage.verifyTaskVisible('1.1.1');
      
      // Collapse all
      await hierarchyPage.collapseAllTasks();
      
      // Verify only root tasks visible
      await hierarchyPage.verifyTaskVisible('1');
      await hierarchyPage.verifyTaskHidden('1.1');
      await hierarchyPage.verifyTaskHidden('1.1.1');
    });

    test('should maintain expand/collapse state during other operations', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create and expand hierarchy
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub' });
      await hierarchyPage.expandTask(1);
      await hierarchyPage.verifyTaskVisible('1.1');
      
      // Edit a task
      await hierarchyPage.editTask(2, { status: 'in_progress' });
      
      // Verify expand state maintained
      await hierarchyPage.verifyTaskVisible('1.1');
      
      // Create another sub task
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub 2' });
      
      // Verify expand state still maintained
      await hierarchyPage.verifyTaskVisible('1.1');
      await hierarchyPage.verifyTaskVisible('1.2');
    });
  });

  test.describe('Task Deletion Rules Testing', () => {
    test('should prevent parent task deletion when children exist', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create parent-child relationship
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Parent' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Child' });
      
      // Try to delete parent
      await hierarchyPage.deleteTask(1, true);
      
      // Should show error message
      await expect(hierarchyPage.page.locator('[data-testid="error-notification"]'))
        .toContainText('请先删除所有子任务');
      
      // Parent should still exist
      await hierarchyPage.verifyTaskVisible('1');
    });

    test('should allow parent deletion after children are deleted', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create hierarchy
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Parent' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Child' });
      
      // Delete child first
      await hierarchyPage.deleteTask(2, true);
      await hierarchyPage.verifyTaskHidden('1.1');
      
      // Now delete parent should work
      await hierarchyPage.deleteTask(1, true);
      await hierarchyPage.verifyTaskHidden('1');
    });

    test('should handle complex hierarchy deletion order', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create 3-level hierarchy
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Root' });
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Sub' });
      await hierarchyPage.createTaskAtLevel(3, 2, { name: 'Detail' });
      
      // Try to delete root - should fail
      await hierarchyPage.deleteTask(1, true);
      await expect(hierarchyPage.page.locator('[data-testid="error-notification"]'))
        .toContainText('请先删除所有子任务');
      
      // Try to delete sub - should fail (has detail child)
      await hierarchyPage.deleteTask(2, true);
      await expect(hierarchyPage.page.locator('[data-testid="error-notification"]'))
        .toContainText('请先删除所有子任务');
      
      // Delete detail first - should work
      await hierarchyPage.deleteTask(3, true);
      await hierarchyPage.verifyTaskHidden('1.1.1');
      
      // Now delete sub - should work
      await hierarchyPage.deleteTask(2, true);
      await hierarchyPage.verifyTaskHidden('1.1');
      
      // Finally delete root - should work
      await hierarchyPage.deleteTask(1, true);
      await hierarchyPage.verifyTaskHidden('1');
    });
  });

  test.describe('Form Validation Across All Levels', () => {
    test('should validate task name at all levels', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Test root task validation
      await hierarchyPage.page.click('[data-testid="create-root-task-btn"]');
      await hierarchyPage.page.click('[data-testid="submit-task-form"]');
      await expect(hierarchyPage.page.locator('[data-testid="name-error"]'))
        .toContainText('任务名称不能为空');
      
      // Fill name and create root task
      await hierarchyPage.page.fill('[data-testid="task-name-input"]', 'Valid Root');
      await hierarchyPage.page.click('[data-testid="submit-task-form"]');
      
      // Test sub task validation
      await hierarchyPage.page.click('[data-testid="add-child-task-1"]');
      await hierarchyPage.page.click('[data-testid="submit-task-form"]');
      await expect(hierarchyPage.page.locator('[data-testid="name-error"]'))
        .toContainText('任务名称不能为空');
      
      // Cancel and create valid sub task
      await hierarchyPage.page.click('[data-testid="cancel-task-form"]');
      await hierarchyPage.createTaskAtLevel(2, 1, { name: 'Valid Sub' });
      
      // Test detail task validation
      await hierarchyPage.page.click('[data-testid="add-child-task-2"]');
      await hierarchyPage.page.click('[data-testid="submit-task-form"]');
      await expect(hierarchyPage.page.locator('[data-testid="name-error"]'))
        .toContainText('任务名称不能为空');
    });

    test('should validate estimated hours at all levels', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      const invalidHoursTests = [
        { value: '-1', error: '预估工时不能为负数' },
        { value: '10000', error: '预估工时不能超过9999小时' },
        { value: 'abc', error: '请输入有效的数字' }
      ];
      
      for (const test of invalidHoursTests) {
        await hierarchyPage.page.click('[data-testid="create-root-task-btn"]');
        await hierarchyPage.page.fill('[data-testid="task-name-input"]', 'Test Task');
        await hierarchyPage.page.fill('[data-testid="estimated-hours-input"]', test.value);
        await hierarchyPage.page.click('[data-testid="submit-task-form"]');
        
        await expect(hierarchyPage.page.locator('[data-testid="hours-error"]'))
          .toContainText(test.error);
        
        await hierarchyPage.page.click('[data-testid="cancel-task-form"]');
      }
    });

    test('should validate date ranges at all levels', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Test invalid date range
      await hierarchyPage.page.click('[data-testid="create-root-task-btn"]');
      await hierarchyPage.page.fill('[data-testid="task-name-input"]', 'Date Test');
      await hierarchyPage.page.fill('[data-testid="start-date-input"]', '2025-12-31');
      await hierarchyPage.page.fill('[data-testid="end-date-input"]', '2025-01-01');
      await hierarchyPage.page.click('[data-testid="submit-task-form"]');
      
      await expect(hierarchyPage.page.locator('[data-testid="date-error"]'))
        .toContainText('开始日期不能晚于结束日期');
    });
  });

  test.describe('Performance and Stress Testing', () => {
    test('should handle large hierarchy efficiently', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      const startTime = Date.now();
      
      // Create large hierarchy: 5 root tasks, each with 5 sub tasks, each with 3 detail tasks
      for (let i = 1; i <= 5; i++) {
        await hierarchyPage.createTaskAtLevel(1, undefined, { name: `Root ${i}` });
        
        for (let j = 1; j <= 5; j++) {
          const rootTaskId = (i - 1) * 16 + 1; // Calculate root task ID
          await hierarchyPage.createTaskAtLevel(2, rootTaskId, { name: `Sub ${i}.${j}` });
          
          for (let k = 1; k <= 3; k++) {
            const subTaskId = rootTaskId + (j - 1) * 4 + 1; // Calculate sub task ID
            await hierarchyPage.createTaskAtLevel(3, subTaskId, { name: `Detail ${i}.${j}.${k}` });
          }
        }
      }
      
      const creationTime = Date.now() - startTime;
      console.log(`Created 95 tasks in ${creationTime}ms`);
      
      // Test navigation performance
      const navStartTime = Date.now();
      await hierarchyPage.expandAllTasks();
      const expandTime = Date.now() - navStartTime;
      
      expect(expandTime).toBeLessThan(2000); // Should expand all within 2 seconds
      
      // Test collapse performance
      const collapseStartTime = Date.now();
      await hierarchyPage.collapseAllTasks();
      const collapseTime = Date.now() - collapseStartTime;
      
      expect(collapseTime).toBeLessThan(1000); // Should collapse all within 1 second
    });

    test('should handle rapid operations without breaking', async () => {
      await hierarchyPage.navigateToProject(TEST_PROJECT_ID);
      
      // Create base task
      await hierarchyPage.createTaskAtLevel(1, undefined, { name: 'Rapid Test' });
      
      // Perform rapid expand/collapse operations
      for (let i = 0; i < 10; i++) {
        await hierarchyPage.createTaskAtLevel(2, 1, { name: `Rapid Sub ${i}` });
      }
      
      // Rapid expand/collapse cycles
      for (let i = 0; i < 5; i++) {
        await hierarchyPage.expandTask(1);
        await hierarchyPage.collapseTask(1);
      }
      
      // Verify hierarchy still intact
      await hierarchyPage.expandTask(1);
      for (let i = 0; i < 10; i++) {
        await hierarchyPage.verifyTaskVisible(`1.${i + 1}`);
      }
    });
  });
});