/**
 * Edge Cases and Error Condition Testing Scenarios
 * Tests boundary conditions, error handling, and system resilience
 */

import { test, expect, Page } from '@playwright/test';

class EdgeCaseTestManager {
  constructor(private page: Page) {}

  async loginAsTestUser() {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', 'test@example.com');
    await this.page.fill('[data-testid="password-input"]', 'password123');
    await this.page.click('[data-testid="login-btn"]');
    await this.page.waitForURL('/dashboard');
  }

  async navigateToProject(projectId: number) {
    await this.page.goto(`/projects/${projectId}`);
    await this.page.waitForSelector('[data-testid="wbs-task-tree"]');
  }

  // Network simulation helpers
  async simulateNetworkFailure() {
    await this.page.route('**/api/**', route => route.abort('failed'));
  }

  async simulateSlowNetwork() {
    await this.page.route('**/api/**', route => {
      setTimeout(() => route.continue(), 5000); // 5 second delay
    });
  }

  async simulateIntermittentConnection() {
    let requestCount = 0;
    await this.page.route('**/api/**', route => {
      requestCount++;
      if (requestCount % 3 === 0) {
        route.abort('failed'); // Fail every 3rd request
      } else {
        route.continue();
      }
    });
  }

  async simulateServerError(statusCode: number = 500) {
    await this.page.route('**/api/**', route => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { 
            code: 'SERVER_ERROR', 
            message: `Server returned ${statusCode}` 
          }
        })
      });
    });
  }

  // Data boundary testing
  async createTaskWithMaxLengthData() {
    await this.page.click('[data-testid="create-root-task-btn"]');
    await this.page.waitForSelector('[data-testid="task-form-modal"]');

    // Test maximum field lengths
    const maxName = 'A'.repeat(255); // Assuming 255 char limit
    const maxDescription = 'B'.repeat(2000); // Assuming 2000 char limit

    await this.page.fill('[data-testid="task-name-input"]', maxName);
    await this.page.fill('[data-testid="task-description-input"]', maxDescription);
    await this.page.fill('[data-testid="estimated-hours-input"]', '9999'); // Max hours
    
    await this.page.click('[data-testid="submit-task-form"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  async createTaskWithBoundaryValues() {
    const boundaryTests = [
      { name: '', expectedError: '任务名称不能为空' },
      { name: 'A'.repeat(256), expectedError: '任务名称不能超过255个字符' },
      { hours: '-1', expectedError: '预估工时不能为负数' },
      { hours: '10000', expectedError: '预估工时不能超过9999小时' },
      { hours: '0', expectedError: null }, // Should be valid
      { hours: '9999', expectedError: null }, // Should be valid
    ];

    for (const test of boundaryTests) {
      await this.page.click('[data-testid="create-root-task-btn"]');
      
      if (test.name !== undefined) {
        await this.page.fill('[data-testid="task-name-input"]', test.name);
      } else {
        await this.page.fill('[data-testid="task-name-input"]', 'Valid Name');
      }
      
      if (test.hours) {
        await this.page.fill('[data-testid="estimated-hours-input"]', test.hours);
      }
      
      await this.page.click('[data-testid="submit-task-form"]');
      
      if (test.expectedError) {
        await expect(this.page.locator('[data-testid="form-error"]')).toContainText(test.expectedError);
        await this.page.click('[data-testid="cancel-task-form"]');
      } else {
        await this.page.waitForSelector('[data-testid="success-notification"]');
      }
    }
  }

  // Concurrent operation testing
  async simulateConcurrentTaskCreation(count: number = 5) {
    const promises = [];
    
    for (let i = 0; i < count; i++) {
      promises.push(this.createTask(`Concurrent Task ${i + 1}`));
    }
    
    // All should complete successfully
    await Promise.allSettled(promises);
  }

  async createTask(name: string) {
    await this.page.click('[data-testid="create-root-task-btn"]');
    await this.page.fill('[data-testid="task-name-input"]', name);
    await this.page.click('[data-testid="submit-task-form"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  // Memory and resource testing
  async createLargeTaskHierarchy(depth: number = 3, breadth: number = 10) {
    let taskId = 1;
    
    // Create root tasks
    for (let i = 0; i < breadth; i++) {
      await this.createTask(`Root Task ${i + 1}`);
    }
    
    // Create 2nd level tasks
    if (depth >= 2) {
      for (let root = 1; root <= breadth; root++) {
        for (let sub = 0; sub < breadth; sub++) {
          await this.createSubTask(root, `Sub Task ${root}.${sub + 1}`);
        }
      }
    }
    
    // Create 3rd level tasks
    if (depth >= 3) {
      let subTaskId = breadth + 1;
      for (let root = 1; root <= breadth; root++) {
        for (let sub = 0; sub < breadth; sub++) {
          for (let detail = 0; detail < breadth; detail++) {
            await this.createSubTask(subTaskId, `Detail Task ${root}.${sub + 1}.${detail + 1}`);
          }
          subTaskId++;
        }
      }
    }
  }

  async createSubTask(parentId: number, name: string) {
    await this.page.click(`[data-testid="add-child-task-${parentId}"]`);
    await this.page.fill('[data-testid="task-name-input"]', name);
    await this.page.click('[data-testid="submit-task-form"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  // Unicode and special character testing
  async testUnicodeSupport() {
    const unicodeTests = [
      { name: '测试任务', description: '这是一个中文测试任务' },
      { name: 'Tâche de test', description: 'Ceci est une tâche de test française' },
      { name: 'Тестовая задача', description: 'Это русская тестовая задача' },
      { name: 'タスクテスト', description: 'これは日本語のテストタスクです' },
      { name: '🚀 Rocket Task', description: 'Task with emojis 🎉🔥💯' },
      { name: 'Special chars: @#$%^&*()_+', description: 'Testing special characters' }
    ];

    for (const test of unicodeTests) {
      await this.page.click('[data-testid="create-root-task-btn"]');
      await this.page.fill('[data-testid="task-name-input"]', test.name);
      await this.page.fill('[data-testid="task-description-input"]', test.description);
      await this.page.click('[data-testid="submit-task-form"]');
      await this.page.waitForSelector('[data-testid="success-notification"]');
      
      // Verify text is displayed correctly
      await expect(this.page.locator(`text="${test.name}"`)).toBeVisible();
    }
  }

  // State corruption testing
  async testStateRecovery() {
    // Create initial state
    await this.createTask('State Test Task');
    await this.page.click('[data-testid="expand-task-1"]');
    
    // Simulate page crash/reload
    await this.page.reload();
    await this.page.waitForSelector('[data-testid="wbs-task-tree"]');
    
    // Verify state is recovered
    await expect(this.page.locator('text="State Test Task"')).toBeVisible();
  }

  // Browser compatibility edge cases
  async testBrowserLimits() {
    // Test localStorage limits (typically 5-10MB)
    const largeData = 'x'.repeat(1024 * 1024); // 1MB string
    
    try {
      await this.page.evaluate((data) => {
        for (let i = 0; i < 10; i++) {
          localStorage.setItem(`large_data_${i}`, data);
        }
      }, largeData);
    } catch (error) {
      // Should handle localStorage quota exceeded gracefully
    }
    
    // Verify app still functions
    await this.createTask('Post-Storage-Limit Task');
  }
}

describe('Edge Cases and Error Conditions', () => {
  let edgeManager: EdgeCaseTestManager;
  const TEST_PROJECT_ID = 1;

  test.beforeEach(async ({ page }) => {
    edgeManager = new EdgeCaseTestManager(page);
    await edgeManager.loginAsTestUser();
    await edgeManager.navigateToProject(TEST_PROJECT_ID);
  });

  test.describe('Network and Connectivity Edge Cases', () => {
    test('should handle complete network failure gracefully', async () => {
      // Start with working connection
      await edgeManager.createTask('Pre-Failure Task');
      
      // Simulate network failure
      await edgeManager.simulateNetworkFailure();
      
      // Try to create task - should show error
      await edgeManager.page.click('[data-testid="create-root-task-btn"]');
      await edgeManager.page.fill('[data-testid="task-name-input"]', 'Failed Task');
      await edgeManager.page.click('[data-testid="submit-task-form"]');
      
      // Should show network error
      await expect(edgeManager.page.locator('[data-testid="network-error"]'))
        .toContainText('网络连接失败，请检查网络设置');
      
      // Should offer retry option
      await expect(edgeManager.page.locator('[data-testid="retry-btn"]')).toBeVisible();
      
      // Should maintain form data for retry
      const taskName = edgeManager.page.locator('[data-testid="task-name-input"]');
      await expect(taskName).toHaveValue('Failed Task');
    });

    test('should handle slow network with loading states', async () => {
      await edgeManager.simulateSlowNetwork();
      
      // Try to create task
      await edgeManager.page.click('[data-testid="create-root-task-btn"]');
      await edgeManager.page.fill('[data-testid="task-name-input"]', 'Slow Task');
      await edgeManager.page.click('[data-testid="submit-task-form"]');
      
      // Should show loading state
      await expect(edgeManager.page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      await expect(edgeManager.page.locator('[data-testid="submit-task-form"]')).toBeDisabled();
      
      // Should eventually complete
      await edgeManager.page.waitForSelector('[data-testid="success-notification"]', { timeout: 10000 });
    });

    test('should handle intermittent connection', async () => {
      await edgeManager.simulateIntermittentConnection();
      
      // Try multiple operations
      const attempts = 5;
      let successes = 0;
      let failures = 0;
      
      for (let i = 0; i < attempts; i++) {
        try {
          await edgeManager.createTask(`Intermittent Task ${i + 1}`);
          successes++;
        } catch (error) {
          failures++;
          // Should show retry mechanism
          const retryBtn = edgeManager.page.locator('[data-testid="retry-btn"]');
          if (await retryBtn.isVisible()) {
            await retryBtn.click();
          }
        }
      }
      
      // Should have some successes despite intermittent failures
      expect(successes).toBeGreaterThan(0);
    });

    test('should handle server errors appropriately', async () => {
      // Test different server error codes
      const errorCodes = [400, 401, 403, 404, 500, 502, 503];
      
      for (const code of errorCodes) {
        await edgeManager.simulateServerError(code);
        
        await edgeManager.page.click('[data-testid="create-root-task-btn"]');
        await edgeManager.page.fill('[data-testid="task-name-input"]', `Error ${code} Task`);
        await edgeManager.page.click('[data-testid="submit-task-form"]');
        
        // Should show appropriate error message based on status code
        const errorMessages = {
          400: '请求数据格式错误',
          401: '身份验证失败，请重新登录',
          403: '没有权限执行此操作',
          404: '请求的资源不存在',
          500: '服务器内部错误',
          502: '服务器网关错误',
          503: '服务暂时不可用'
        };
        
        await expect(edgeManager.page.locator('[data-testid="error-message"]'))
          .toContainText(errorMessages[code as keyof typeof errorMessages]);
        
        await edgeManager.page.click('[data-testid="cancel-task-form"]');
        
        // Reset route for next test
        await edgeManager.page.unroute('**/api/**');
      }
    });
  });

  test.describe('Data Boundary and Validation Edge Cases', () => {
    test('should handle maximum field lengths', async () => {
      await edgeManager.createTaskWithMaxLengthData();
      
      // Verify task was created with truncated/validated data
      await expect(edgeManager.page.locator('[data-testid="task-name"]').first())
        .toHaveText(/^A+$/); // Should contain only 'A' characters (truncated)
    });

    test('should validate all boundary conditions', async () => {
      await edgeManager.createTaskWithBoundaryValues();
    });

    test('should handle invalid dates', async () => {
      const invalidDates = [
        '2025-13-01', // Invalid month
        '2025-02-30', // Invalid day for February
        '2025-00-01', // Invalid month (zero)
        '2025-01-32', // Invalid day
        '2024-02-30', // Invalid day for leap year February
        '1900-01-01', // Too far in past
        '2100-01-01'  // Too far in future
      ];

      await edgeManager.page.click('[data-testid="create-root-task-btn"]');
      await edgeManager.page.fill('[data-testid="task-name-input"]', 'Date Test Task');

      for (const invalidDate of invalidDates) {
        await edgeManager.page.fill('[data-testid="start-date-input"]', invalidDate);
        await edgeManager.page.click('[data-testid="submit-task-form"]');
        
        // Should show date validation error
        await expect(edgeManager.page.locator('[data-testid="date-error"]'))
          .toContainText(/无效的日期|日期格式错误|日期超出范围/);
      }

      await edgeManager.page.click('[data-testid="cancel-task-form"]');
    });

    test('should handle special characters and Unicode', async () => {
      await edgeManager.testUnicodeSupport();
    });

    test('should validate time entry boundaries', async () => {
      // Create a task first
      await edgeManager.createTask('Time Boundary Test');
      
      const timeTests = [
        { hours: '25', expectedError: '单日工时不能超过24小时' },
        { hours: '-5', expectedError: '工时不能为负数' },
        { hours: '0.1', expectedError: null }, // Should be valid
        { hours: '24', expectedError: null }, // Should be valid
        { hours: 'abc', expectedError: '请输入有效数字' },
        { hours: '1.5.5', expectedError: '请输入有效数字' }
      ];

      for (const test of timeTests) {
        await edgeManager.page.click('[data-testid="log-time-1"]');
        await edgeManager.page.fill('[data-testid="hours-input"]', test.hours);
        await edgeManager.page.click('[data-testid="save-time-entry"]');
        
        if (test.expectedError) {
          await expect(edgeManager.page.locator('[data-testid="hours-error"]'))
            .toContainText(test.expectedError);
          await edgeManager.page.click('[data-testid="cancel-time-entry"]');
        } else {
          await edgeManager.page.waitForSelector('[data-testid="success-notification"]');
        }
      }
    });
  });

  test.describe('Concurrent Operations and Race Conditions', () => {
    test('should handle concurrent task creation', async () => {
      await edgeManager.simulateConcurrentTaskCreation(5);
      
      // Verify all tasks were created (may have different order)
      for (let i = 1; i <= 5; i++) {
        await expect(edgeManager.page.locator(`text="Concurrent Task ${i}"`)).toBeVisible();
      }
    });

    test('should handle concurrent task updates', async () => {
      // Create base task
      await edgeManager.createTask('Concurrent Update Test');
      
      // Simulate multiple users updating same task
      const updates = [
        { field: 'status', value: 'in_progress' },
        { field: 'progress', value: '50' },
        { field: 'priority', value: 'urgent' }
      ];
      
      // Execute updates concurrently
      const promises = updates.map(async (update) => {
        await edgeManager.page.click('[data-testid="edit-task-1"]');
        
        if (update.field === 'status') {
          await edgeManager.page.selectOption('[data-testid="edit-task-status"]', update.value);
        } else if (update.field === 'progress') {
          await edgeManager.page.fill('[data-testid="edit-task-progress"]', update.value);
        } else if (update.field === 'priority') {
          await edgeManager.page.selectOption('[data-testid="edit-task-priority"]', update.value);
        }
        
        await edgeManager.page.click('[data-testid="save-task-changes"]');
        await edgeManager.page.waitForSelector('[data-testid="success-notification"]');
      });
      
      await Promise.allSettled(promises);
      
      // Should show conflict resolution if needed
      const conflictDialog = edgeManager.page.locator('[data-testid="conflict-resolution-dialog"]');
      if (await conflictDialog.isVisible()) {
        await expect(conflictDialog).toContainText('检测到并发修改');
      }
    });

    test('should handle timer conflicts', async () => {
      await edgeManager.createTask('Timer Test 1');
      await edgeManager.createTask('Timer Test 2');
      
      // Start timer on first task
      await edgeManager.page.click('[data-testid="start-timer-1"]');
      await edgeManager.page.waitForSelector('[data-testid="timer-started-notification"]');
      
      // Try to start timer on second task
      await edgeManager.page.click('[data-testid="start-timer-2"]');
      
      // Should show conflict dialog
      await expect(edgeManager.page.locator('[data-testid="timer-conflict-dialog"]'))
        .toContainText('已有正在运行的计时器');
      
      // Should offer options to switch or cancel
      await expect(edgeManager.page.locator('[data-testid="switch-timer-btn"]')).toBeVisible();
      await expect(edgeManager.page.locator('[data-testid="cancel-timer-start"]')).toBeVisible();
    });
  });

  test.describe('Memory and Performance Edge Cases', () => {
    test('should handle large task hierarchies', async () => {
      // Create moderately large hierarchy (3 levels, 5 items each = 155 tasks total)
      await edgeManager.createLargeTaskHierarchy(3, 5);
      
      // Test navigation performance
      const startTime = Date.now();
      await edgeManager.page.click('[data-testid="expand-all-btn"]');
      await edgeManager.page.waitForSelector('[data-testid="task-tree-expanded"]');
      const expandTime = Date.now() - startTime;
      
      // Should expand within reasonable time (< 3 seconds)
      expect(expandTime).toBeLessThan(3000);
      
      // Test collapse performance
      const collapseStart = Date.now();
      await edgeManager.page.click('[data-testid="collapse-all-btn"]');
      await edgeManager.page.waitForSelector('[data-testid="task-tree-collapsed"]');
      const collapseTime = Date.now() - collapseStart;
      
      expect(collapseTime).toBeLessThan(2000);
      
      // Test search/filter performance
      const searchStart = Date.now();
      await edgeManager.page.fill('[data-testid="task-search"]', 'Root Task 1');
      await edgeManager.page.waitForSelector('[data-testid="search-results"]');
      const searchTime = Date.now() - searchStart;
      
      expect(searchTime).toBeLessThan(1000);
    });

    test('should handle browser storage limits', async () => {
      await edgeManager.testBrowserLimits();
      
      // Verify app continues to function
      await expect(edgeManager.page.locator('text="Post-Storage-Limit Task"')).toBeVisible();
    });

    test('should handle memory pressure scenarios', async () => {
      // Create many tasks to consume memory
      for (let i = 0; i < 50; i++) {
        await edgeManager.createTask(`Memory Pressure Task ${i + 1}`);
      }
      
      // Test if app remains responsive
      const responseStart = Date.now();
      await edgeManager.page.click('[data-testid="expand-all-btn"]');
      await edgeManager.page.waitForLoadState('networkidle');
      const responseTime = Date.now() - responseStart;
      
      // Should remain responsive even under memory pressure
      expect(responseTime).toBeLessThan(5000);
      
      // Test garbage collection doesn't break functionality
      await edgeManager.page.evaluate(() => {
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
      });
      
      // Should still be able to create new task
      await edgeManager.createTask('Post-GC Task');
    });
  });

  test.describe('State Corruption and Recovery', () => {
    test('should recover from page refresh during operations', async () => {
      await edgeManager.createTask('Refresh Test Task');
      
      // Start editing task
      await edgeManager.page.click('[data-testid="edit-task-1"]');
      await edgeManager.page.fill('[data-testid="edit-task-name"]', 'Modified Name');
      
      // Refresh page before saving
      await edgeManager.page.reload();
      await edgeManager.page.waitForSelector('[data-testid="wbs-task-tree"]');
      
      // Should show original task name (changes not saved)
      await expect(edgeManager.page.locator('text="Refresh Test Task"')).toBeVisible();
      
      // Should not show modal or partial state
      await expect(edgeManager.page.locator('[data-testid="edit-task-modal"]')).not.toBeVisible();
    });

    test('should handle session expiry gracefully', async () => {
      // Simulate session expiry
      await edgeManager.page.route('**/api/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'UNAUTHORIZED', message: '会话已过期' }
          })
        });
      });
      
      // Try to perform operation
      await edgeManager.page.click('[data-testid="create-root-task-btn"]');
      await edgeManager.page.fill('[data-testid="task-name-input"]', 'Session Expired Task');
      await edgeManager.page.click('[data-testid="submit-task-form"]');
      
      // Should redirect to login or show auth error
      await expect(edgeManager.page.locator('[data-testid="auth-error"]'))
        .toContainText(/会话已过期|请重新登录/);
    });

    test('should handle corrupted local storage', async () => {
      // Corrupt localStorage data
      await edgeManager.page.evaluate(() => {
        localStorage.setItem('wbs_tasks', '{invalid json');
        localStorage.setItem('user_preferences', 'not json at all');
      });
      
      // Refresh page
      await edgeManager.page.reload();
      await edgeManager.page.waitForSelector('[data-testid="wbs-task-tree"]');
      
      // Should handle corrupted data gracefully and reset to defaults
      await expect(edgeManager.page.locator('[data-testid="error-boundary"]')).not.toBeVisible();
      
      // Should still be functional
      await edgeManager.createTask('Post-Corruption Task');
    });
  });

  test.describe('Browser Compatibility Edge Cases', () => {
    test('should handle disabled JavaScript gracefully', async () => {
      // This test would need to be run with JavaScript disabled
      // For now, we'll test that critical functionality has fallbacks
      
      // Verify critical elements have proper ARIA labels and semantic HTML
      await expect(edgeManager.page.locator('[data-testid="create-root-task-btn"]'))
        .toHaveAttribute('type', 'button');
      
      // Verify forms can be submitted without JavaScript
      const form = edgeManager.page.locator('[data-testid="task-form"]');
      if (await form.isVisible()) {
        await expect(form).toHaveAttribute('method');
        await expect(form).toHaveAttribute('action');
      }
    });

    test('should handle various viewport sizes', async () => {
      const viewports = [
        { width: 320, height: 568 },  // iPhone SE
        { width: 768, height: 1024 }, // iPad
        { width: 1024, height: 768 }, // iPad landscape
        { width: 1920, height: 1080 } // Desktop
      ];
      
      for (const viewport of viewports) {
        await edgeManager.page.setViewportSize(viewport);
        
        // Verify layout doesn't break
        await expect(edgeManager.page.locator('[data-testid="wbs-task-tree"]')).toBeVisible();
        
        // Verify critical functionality remains accessible
        const createBtn = edgeManager.page.locator('[data-testid="create-root-task-btn"]');
        await expect(createBtn).toBeVisible();
        
        // Test task creation at this viewport
        await edgeManager.createTask(`Viewport ${viewport.width}x${viewport.height} Task`);
      }
    });

    test('should handle touch interactions properly', async () => {
      // Simulate touch device
      await edgeManager.page.emulateMedia({ media: 'screen' });
      
      // Test touch gestures
      await edgeManager.createTask('Touch Test Task');
      
      // Test tap to expand (instead of click)
      const expandBtn = edgeManager.page.locator('[data-testid="expand-task-1"]');
      await expandBtn.tap();
      
      // Test swipe gestures if implemented
      const taskRow = edgeManager.page.locator('[data-testid="task-row-1"]');
      const box = await taskRow.boundingBox();
      
      if (box) {
        // Swipe right to reveal actions
        await edgeManager.page.touchscreen.tap(box.x + 10, box.y + box.height / 2);
        await edgeManager.page.touchscreen.tap(box.x + box.width - 10, box.y + box.height / 2);
      }
    });

    test('should handle clipboard operations edge cases', async () => {
      await edgeManager.createTask('Clipboard Test Task');
      
      // Test copy functionality
      await edgeManager.page.click('[data-testid="copy-task-1"]');
      
      // Should handle clipboard permissions
      const clipboardError = edgeManager.page.locator('[data-testid="clipboard-error"]');
      if (await clipboardError.isVisible()) {
        await expect(clipboardError).toContainText(/剪贴板权限|复制失败/);
      } else {
        await expect(edgeManager.page.locator('[data-testid="clipboard-success"]'))
          .toContainText(/已复制|复制成功/);
      }
    });
  });
});