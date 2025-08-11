/**
 * Time Tracking Integration Test Scenarios
 * Tests time logging functionality with multi-level WBS tasks
 */

import { test, expect, Page } from '@playwright/test';

class TimeTrackingTestManager {
  constructor(private page: Page) {}

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

  // Task Setup Helpers
  async createTaskHierarchy() {
    // Create comprehensive hierarchy for testing
    await this.createTask(null, {
      name: 'Project Development',
      levelType: 'yearly',
      estimatedHours: 480
    });

    await this.createTask(1, {
      name: 'Frontend Development',
      estimatedHours: 240
    });

    await this.createTask(1, {
      name: 'Backend Development', 
      estimatedHours: 240
    });

    await this.createTask(2, {
      name: 'Component Development',
      estimatedHours: 120
    });

    await this.createTask(2, {
      name: 'Integration Testing',
      estimatedHours: 120
    });

    await this.createTask(3, {
      name: 'API Development',
      estimatedHours: 160
    });

    await this.createTask(4, {
      name: 'UI Components',
      estimatedHours: 80
    });

    await this.createTask(4, {
      name: 'State Management',
      estimatedHours: 40
    });

    return {
      root: 1,           // Project Development
      level2: [2, 3],    // Frontend, Backend
      level3: [4, 5, 6, 7, 8]  // Components, Testing, API, UI, State
    };
  }

  async createTask(parentId: number | null, taskData: {
    name: string;
    levelType?: string;
    estimatedHours?: number;
    priority?: string;
  }) {
    if (parentId === null) {
      await this.page.click('[data-testid="create-root-task-btn"]');
    } else {
      await this.page.click(`[data-testid="add-child-task-${parentId}"]`);
    }

    await this.page.waitForSelector('[data-testid="task-form-modal"]');
    await this.page.fill('[data-testid="task-name-input"]', taskData.name);

    if (taskData.levelType) {
      await this.page.selectOption('[data-testid="level-type-select"]', taskData.levelType);
    }

    if (taskData.estimatedHours) {
      await this.page.fill('[data-testid="estimated-hours-input"]', taskData.estimatedHours.toString());
    }

    if (taskData.priority) {
      await this.page.selectOption('[data-testid="priority-select"]', taskData.priority);
    }

    await this.page.click('[data-testid="submit-task-form"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  // Time Tracking Operations
  async startTimeTracking(taskId: number) {
    await this.page.click(`[data-testid="start-timer-${taskId}"]`);
    await this.page.waitForSelector('[data-testid="timer-started-notification"]');
  }

  async stopTimeTracking() {
    await this.page.click('[data-testid="stop-timer-btn"]');
    await this.page.waitForSelector('[data-testid="timer-stopped-notification"]');
  }

  async pauseTimeTracking() {
    await this.page.click('[data-testid="pause-timer-btn"]');
    await this.page.waitForSelector('[data-testid="timer-paused-notification"]');
  }

  async resumeTimeTracking() {
    await this.page.click('[data-testid="resume-timer-btn"]');
    await this.page.waitForSelector('[data-testid="timer-resumed-notification"]');
  }

  async logTimeEntry(taskId: number, timeData: {
    hours: number;
    description?: string;
    date?: string;
  }) {
    await this.page.click(`[data-testid="log-time-${taskId}"]`);
    await this.page.waitForSelector('[data-testid="time-entry-modal"]');

    await this.page.fill('[data-testid="hours-input"]', timeData.hours.toString());

    if (timeData.description) {
      await this.page.fill('[data-testid="description-input"]', timeData.description);
    }

    if (timeData.date) {
      await this.page.fill('[data-testid="date-input"]', timeData.date);
    }

    await this.page.click('[data-testid="save-time-entry"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  async bulkLogTime(entries: {
    taskId: number;
    hours: number;
    description: string;
    date: string;
  }[]) {
    await this.page.click('[data-testid="bulk-time-entry-btn"]');
    await this.page.waitForSelector('[data-testid="bulk-time-entry-modal"]');

    for (const entry of entries) {
      await this.page.click('[data-testid="add-bulk-entry"]');
      const entryRow = this.page.locator('[data-testid="bulk-entry-row"]').last();

      await entryRow.locator('[data-testid="task-select"]').selectOption(entry.taskId.toString());
      await entryRow.locator('[data-testid="hours-input"]').fill(entry.hours.toString());
      await entryRow.locator('[data-testid="description-input"]').fill(entry.description);
      await entryRow.locator('[data-testid="date-input"]').fill(entry.date);
    }

    await this.page.click('[data-testid="save-bulk-entries"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  // Time Tracking Verification
  async verifyTimerState(expectedState: 'stopped' | 'running' | 'paused', taskId?: number) {
    const timerStatus = this.page.locator('[data-testid="timer-status"]');
    
    switch (expectedState) {
      case 'stopped':
        await expect(timerStatus).toContainText('已停止');
        break;
      case 'running':
        await expect(timerStatus).toContainText('运行中');
        if (taskId) {
          const activeTask = this.page.locator('[data-testid="active-task-name"]');
          await expect(activeTask).toBeVisible();
        }
        break;
      case 'paused':
        await expect(timerStatus).toContainText('已暂停');
        break;
    }
  }

  async verifyTaskTimeTracking(taskId: number, expectedData: {
    actualHours?: number;
    estimatedHours?: number;
    progressPercentage?: number;
    timeEntries?: number;
  }) {
    const taskRow = this.page.locator(`[data-testid="task-row-${taskId}"]`);

    if (expectedData.actualHours !== undefined) {
      const actualHours = taskRow.locator('[data-testid="actual-hours"]');
      await expect(actualHours).toContainText(`${expectedData.actualHours}h`);
    }

    if (expectedData.estimatedHours !== undefined) {
      const estimatedHours = taskRow.locator('[data-testid="estimated-hours"]');
      await expect(estimatedHours).toContainText(`${expectedData.estimatedHours}h`);
    }

    if (expectedData.progressPercentage !== undefined) {
      const progressBar = taskRow.locator('[data-testid="progress-bar"]');
      const progressText = taskRow.locator('[data-testid="progress-text"]');
      
      await expect(progressText).toHaveText(`${expectedData.progressPercentage}%`);
      await expect(progressBar).toHaveCSS('width', `${expectedData.progressPercentage}%`);
    }

    if (expectedData.timeEntries !== undefined) {
      await this.page.click(`[data-testid="view-time-entries-${taskId}"]`);
      await this.page.waitForSelector('[data-testid="time-entries-modal"]');
      
      const entryCount = await this.page.locator('[data-testid="time-entry-row"]').count();
      expect(entryCount).toBe(expectedData.timeEntries);
      
      await this.page.click('[data-testid="close-time-entries"]');
    }
  }

  async verifyTimeAggregation(parentTaskId: number, expectedTotalHours: number) {
    const parentRow = this.page.locator(`[data-testid="task-row-${parentTaskId}"]`);
    const aggregatedHours = parentRow.locator('[data-testid="aggregated-hours"]');
    
    await expect(aggregatedHours).toContainText(`${expectedTotalHours}h`);
  }

  // Time Reporting
  async generateTimeReport(options: {
    dateRange?: { start: string; end: string };
    taskFilter?: number[];
    groupBy?: 'task' | 'date' | 'user';
  }) {
    await this.page.click('[data-testid="time-reports-btn"]');
    await this.page.waitForSelector('[data-testid="time-reports-modal"]');

    if (options.dateRange) {
      await this.page.fill('[data-testid="start-date-filter"]', options.dateRange.start);
      await this.page.fill('[data-testid="end-date-filter"]', options.dateRange.end);
    }

    if (options.taskFilter) {
      for (const taskId of options.taskFilter) {
        await this.page.click(`[data-testid="task-filter-${taskId}"]`);
      }
    }

    if (options.groupBy) {
      await this.page.selectOption('[data-testid="group-by-select"]', options.groupBy);
    }

    await this.page.click('[data-testid="generate-report"]');
    await this.page.waitForSelector('[data-testid="report-results"]');
  }

  async verifyReportData(expectedData: {
    totalHours: number;
    taskBreakdown: { taskId: number; hours: number }[];
    dateBreakdown?: { date: string; hours: number }[];
  }) {
    const totalHours = this.page.locator('[data-testid="report-total-hours"]');
    await expect(totalHours).toContainText(`${expectedData.totalHours}h`);

    for (const task of expectedData.taskBreakdown) {
      const taskHours = this.page.locator(`[data-testid="report-task-${task.taskId}-hours"]`);
      await expect(taskHours).toContainText(`${task.hours}h`);
    }

    if (expectedData.dateBreakdown) {
      for (const dateEntry of expectedData.dateBreakdown) {
        const dateHours = this.page.locator(`[data-testid="report-date-${dateEntry.date}-hours"]`);
        await expect(dateHours).toContainText(`${dateEntry.hours}h`);
      }
    }
  }

  // Task Progress Integration
  async updateTaskProgressFromTime(taskId: number, newProgress: number) {
    await this.page.click(`[data-testid="sync-progress-${taskId}"]`);
    await this.page.waitForSelector('[data-testid="progress-sync-modal"]');
    
    await this.page.fill('[data-testid="progress-input"]', newProgress.toString());
    await this.page.click('[data-testid="update-progress"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  async verifyProgressCalculation(taskId: number, estimatedHours: number, actualHours: number) {
    const expectedProgress = Math.min(Math.round((actualHours / estimatedHours) * 100), 100);
    
    await this.verifyTaskTimeTracking(taskId, {
      actualHours,
      estimatedHours,
      progressPercentage: expectedProgress
    });
  }
}

describe('Time Tracking Integration - Multi-Level Tasks', () => {
  let timeManager: TimeTrackingTestManager;
  const TEST_PROJECT_ID = 1;

  test.beforeEach(async ({ page }) => {
    timeManager = new TimeTrackingTestManager(page);
    await timeManager.loginAsTestUser();
    await timeManager.navigateToProject(TEST_PROJECT_ID);
  });

  test.describe('Basic Time Tracking Operations', () => {
    test('should start and stop timer on different task levels', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Test timer on root task
      await timeManager.startTimeTracking(taskHierarchy.root);
      await timeManager.verifyTimerState('running', taskHierarchy.root);

      // Wait 2 seconds and stop
      await timeManager.page.waitForTimeout(2000);
      await timeManager.stopTimeTracking();
      await timeManager.verifyTimerState('stopped');

      // Verify time was logged (approximately 2 seconds)
      await timeManager.verifyTaskTimeTracking(taskHierarchy.root, {
        actualHours: 0, // Should show 0 hours for such short duration
        estimatedHours: 480
      });

      // Test timer on level 2 task
      await timeManager.startTimeTracking(taskHierarchy.level2[0]);
      await timeManager.verifyTimerState('running', taskHierarchy.level2[0]);

      await timeManager.page.waitForTimeout(1000);
      await timeManager.stopTimeTracking();

      // Test timer on level 3 task
      await timeManager.startTimeTracking(taskHierarchy.level3[0]);
      await timeManager.verifyTimerState('running', taskHierarchy.level3[0]);

      await timeManager.page.waitForTimeout(1000);
      await timeManager.stopTimeTracking();
    });

    test('should handle timer pause and resume', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Start timer
      await timeManager.startTimeTracking(taskHierarchy.level3[0]);
      await timeManager.verifyTimerState('running');

      // Pause timer
      await timeManager.pauseTimeTracking();
      await timeManager.verifyTimerState('paused');

      // Resume timer
      await timeManager.resumeTimeTracking();
      await timeManager.verifyTimerState('running');

      // Stop timer
      await timeManager.stopTimeTracking();
      await timeManager.verifyTimerState('stopped');
    });

    test('should prevent multiple concurrent timers', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Start timer on first task
      await timeManager.startTimeTracking(taskHierarchy.level3[0]);
      await timeManager.verifyTimerState('running');

      // Try to start timer on second task - should prompt to stop first
      await timeManager.page.click(`[data-testid="start-timer-${taskHierarchy.level3[1]}"]`);
      await timeManager.page.waitForSelector('[data-testid="concurrent-timer-modal"]');
      
      await expect(timeManager.page.locator('[data-testid="concurrent-timer-message"]'))
        .toContainText('已有正在运行的计时器，是否停止当前计时器并开始新的？');

      // Confirm switch
      await timeManager.page.click('[data-testid="confirm-timer-switch"]');
      await timeManager.verifyTimerState('running', taskHierarchy.level3[1]);

      await timeManager.stopTimeTracking();
    });
  });

  test.describe('Manual Time Entry', () => {
    test('should log time entries for all task levels', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Log time on root task
      await timeManager.logTimeEntry(taskHierarchy.root, {
        hours: 8,
        description: 'Project planning and setup',
        date: '2025-08-05'
      });

      await timeManager.verifyTaskTimeTracking(taskHierarchy.root, {
        actualHours: 8,
        timeEntries: 1
      });

      // Log time on level 2 task
      await timeManager.logTimeEntry(taskHierarchy.level2[0], {
        hours: 4,
        description: 'Frontend architecture design'
      });

      await timeManager.verifyTaskTimeTracking(taskHierarchy.level2[0], {
        actualHours: 4,
        timeEntries: 1
      });

      // Log time on level 3 task
      await timeManager.logTimeEntry(taskHierarchy.level3[0], {
        hours: 2,
        description: 'Component wireframing'
      });

      await timeManager.verifyTaskTimeTracking(taskHierarchy.level3[0], {
        actualHours: 2,
        timeEntries: 1
      });
    });

    test('should handle multiple time entries per task', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();
      const taskId = taskHierarchy.level3[0];

      // Log multiple entries
      await timeManager.logTimeEntry(taskId, {
        hours: 3,
        description: 'Morning work session',
        date: '2025-08-05'
      });

      await timeManager.logTimeEntry(taskId, {
        hours: 2.5,
        description: 'Afternoon work session',
        date: '2025-08-05'
      });

      await timeManager.logTimeEntry(taskId, {
        hours: 1,
        description: 'Evening fixes',
        date: '2025-08-05'
      });

      // Verify aggregated time
      await timeManager.verifyTaskTimeTracking(taskId, {
        actualHours: 6.5,
        timeEntries: 3
      });
    });

    test('should validate time entry inputs', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Test negative hours
      await timeManager.page.click(`[data-testid="log-time-${taskHierarchy.level3[0]}"]`);
      await timeManager.page.fill('[data-testid="hours-input"]', '-1');
      await timeManager.page.click('[data-testid="save-time-entry"]');
      
      await expect(timeManager.page.locator('[data-testid="hours-error"]'))
        .toContainText('工时不能为负数');

      // Test excessive hours
      await timeManager.page.fill('[data-testid="hours-input"]', '25');
      await timeManager.page.click('[data-testid="save-time-entry"]');
      
      await expect(timeManager.page.locator('[data-testid="hours-error"]'))
        .toContainText('单日工时不能超过24小时');

      // Test invalid date
      await timeManager.page.fill('[data-testid="hours-input"]', '8');
      await timeManager.page.fill('[data-testid="date-input"]', '2030-01-01');
      await timeManager.page.click('[data-testid="save-time-entry"]');
      
      await expect(timeManager.page.locator('[data-testid="date-error"]'))
        .toContainText('日期不能是未来时间');

      await timeManager.page.click('[data-testid="cancel-time-entry"]');
    });

    test('should handle bulk time entry', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      await timeManager.bulkLogTime([
        {
          taskId: taskHierarchy.level3[0],
          hours: 4,
          description: 'UI component development',
          date: '2025-08-05'
        },
        {
          taskId: taskHierarchy.level3[1],
          hours: 3,
          description: 'State management setup',
          date: '2025-08-05'
        },
        {
          taskId: taskHierarchy.level3[2],
          hours: 5,
          description: 'API integration',
          date: '2025-08-05'
        }
      ]);

      // Verify all entries were created
      await timeManager.verifyTaskTimeTracking(taskHierarchy.level3[0], {
        actualHours: 4,
        timeEntries: 1
      });

      await timeManager.verifyTaskTimeTracking(taskHierarchy.level3[1], {
        actualHours: 3,
        timeEntries: 1
      });

      await timeManager.verifyTaskTimeTracking(taskHierarchy.level3[2], {
        actualHours: 5,
        timeEntries: 1
      });
    });
  });

  test.describe('Time Aggregation and Hierarchy', () => {
    test('should aggregate time from child tasks to parents', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Log time on level 3 tasks
      await timeManager.logTimeEntry(taskHierarchy.level3[0], { hours: 4, description: 'UI work' });
      await timeManager.logTimeEntry(taskHierarchy.level3[1], { hours: 3, description: 'State work' });

      // Level 2 parent should show aggregated time
      await timeManager.verifyTimeAggregation(taskHierarchy.level2[0], 7);

      // Log time on another level 3 task under different parent
      await timeManager.logTimeEntry(taskHierarchy.level3[2], { hours: 6, description: 'API work' });

      // Verify aggregation for second level 2 parent
      await timeManager.verifyTimeAggregation(taskHierarchy.level2[1], 6);

      // Root task should show total aggregated time
      await timeManager.verifyTimeAggregation(taskHierarchy.root, 13);
    });

    test('should handle mixed direct and aggregated time', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Log direct time on level 2 task
      await timeManager.logTimeEntry(taskHierarchy.level2[0], {
        hours: 2,
        description: 'Direct frontend work'
      });

      // Log time on its child tasks
      await timeManager.logTimeEntry(taskHierarchy.level3[0], {
        hours: 4,
        description: 'UI components'
      });

      await timeManager.logTimeEntry(taskHierarchy.level3[1], {
        hours: 3,
        description: 'State management'
      });

      // Level 2 task should show both direct (2h) and aggregated (7h) time
      await timeManager.page.click(`[data-testid="view-time-breakdown-${taskHierarchy.level2[0]}"]`);
      await timeManager.page.waitForSelector('[data-testid="time-breakdown-modal"]');
      
      const directTime = timeManager.page.locator('[data-testid="direct-time"]');
      const aggregatedTime = timeManager.page.locator('[data-testid="aggregated-time"]');
      const totalTime = timeManager.page.locator('[data-testid="total-time"]');
      
      await expect(directTime).toContainText('2h');
      await expect(aggregatedTime).toContainText('7h');
      await expect(totalTime).toContainText('9h');
      
      await timeManager.page.click('[data-testid="close-breakdown"]');
    });

    test('should update aggregations when child time changes', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Initial time entry
      await timeManager.logTimeEntry(taskHierarchy.level3[0], {
        hours: 4,
        description: 'Initial work'
      });

      await timeManager.verifyTimeAggregation(taskHierarchy.level2[0], 4);

      // Add more time to same task
      await timeManager.logTimeEntry(taskHierarchy.level3[0], {
        hours: 2,
        description: 'Additional work'
      });

      await timeManager.verifyTimeAggregation(taskHierarchy.level2[0], 6);

      // Edit existing time entry
      await timeManager.page.click(`[data-testid="view-time-entries-${taskHierarchy.level3[0]}"]`);
      await timeManager.page.click('[data-testid="edit-time-entry-1"]');
      await timeManager.page.fill('[data-testid="edit-hours-input"]', '5');
      await timeManager.page.click('[data-testid="save-time-entry-changes"]');
      
      // Aggregation should update (5 + 2 = 7)
      await timeManager.verifyTimeAggregation(taskHierarchy.level2[0], 7);
    });
  });

  test.describe('Progress Calculation Integration', () => {
    test('should calculate progress based on time vs estimate', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Task has 80h estimate, log 20h work (25% progress)
      await timeManager.logTimeEntry(taskHierarchy.level3[0], {
        hours: 20,
        description: 'Quarter progress work'
      });

      await timeManager.verifyProgressCalculation(
        taskHierarchy.level3[0],
        80, // estimated
        20  // actual
      );

      // Log more time (40h total = 50% progress)
      await timeManager.logTimeEntry(taskHierarchy.level3[0], {
        hours: 20,
        description: 'Half progress work'
      });

      await timeManager.verifyProgressCalculation(
        taskHierarchy.level3[0],
        80, // estimated
        40  // actual
      );

      // Exceed estimate (100h actual vs 80h estimate = 100% progress)
      await timeManager.logTimeEntry(taskHierarchy.level3[0], {
        hours: 60,
        description: 'Overtime work'
      });

      await timeManager.verifyProgressCalculation(
        taskHierarchy.level3[0],
        80,  // estimated
        100  // actual (should cap progress at 100%)
      );
    });

    test('should allow manual progress override', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Log 20h on 80h task (would be 25% auto-calculated)
      await timeManager.logTimeEntry(taskHierarchy.level3[0], {
        hours: 20,
        description: 'Partial work'
      });

      // Manually set progress to 50% (maybe work was more efficient)
      await timeManager.updateTaskProgressFromTime(taskHierarchy.level3[0], 50);

      await timeManager.verifyTaskTimeTracking(taskHierarchy.level3[0], {
        actualHours: 20,
        estimatedHours: 80,
        progressPercentage: 50
      });
    });

    test('should handle progress aggregation in hierarchy', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Set progress on child tasks
      await timeManager.logTimeEntry(taskHierarchy.level3[0], { hours: 40, description: 'UI work' }); // 50% of 80h
      await timeManager.logTimeEntry(taskHierarchy.level3[1], { hours: 20, description: 'State work' }); // 50% of 40h

      // Parent progress should be weighted average
      // UI: 80h * 50% = 40h equivalent
      // State: 40h * 50% = 20h equivalent  
      // Total: 60h equivalent out of 120h = 50%
      
      await timeManager.page.click(`[data-testid="view-progress-breakdown-${taskHierarchy.level2[0]}"]`);
      const parentProgress = timeManager.page.locator('[data-testid="aggregated-progress"]');
      await expect(parentProgress).toContainText('50%');
    });
  });

  test.describe('Time Reporting and Analytics', () => {
    test('should generate comprehensive time reports', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Log time across multiple tasks and dates
      await timeManager.logTimeEntry(taskHierarchy.level3[0], {
        hours: 8,
        description: 'Day 1 UI work',
        date: '2025-08-01'
      });

      await timeManager.logTimeEntry(taskHierarchy.level3[1], {
        hours: 6,
        description: 'Day 1 State work',
        date: '2025-08-01'
      });

      await timeManager.logTimeEntry(taskHierarchy.level3[0], {
        hours: 4,
        description: 'Day 2 UI work',
        date: '2025-08-02'
      });

      await timeManager.logTimeEntry(taskHierarchy.level3[2], {
        hours: 8,
        description: 'Day 2 API work',
        date: '2025-08-02'
      });

      // Generate report for date range
      await timeManager.generateTimeReport({
        dateRange: { start: '2025-08-01', end: '2025-08-02' },
        groupBy: 'task'
      });

      await timeManager.verifyReportData({
        totalHours: 26,
        taskBreakdown: [
          { taskId: taskHierarchy.level3[0], hours: 12 },
          { taskId: taskHierarchy.level3[1], hours: 6 },
          { taskId: taskHierarchy.level3[2], hours: 8 }
        ]
      });

      // Generate report grouped by date
      await timeManager.generateTimeReport({
        dateRange: { start: '2025-08-01', end: '2025-08-02' },
        groupBy: 'date'
      });

      await timeManager.verifyReportData({
        totalHours: 26,
        taskBreakdown: [], // Not applicable for date grouping
        dateBreakdown: [
          { date: '2025-08-01', hours: 14 },
          { date: '2025-08-02', hours: 12 }
        ]
      });
    });

    test('should filter reports by task hierarchy', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Log time on various tasks
      await timeManager.logTimeEntry(taskHierarchy.level3[0], { hours: 8, description: 'UI work' });
      await timeManager.logTimeEntry(taskHierarchy.level3[1], { hours: 6, description: 'State work' });
      await timeManager.logTimeEntry(taskHierarchy.level3[2], { hours: 4, description: 'API work' });

      // Filter report to only frontend tasks (level2[0] and its children)
      await timeManager.generateTimeReport({
        taskFilter: [taskHierarchy.level2[0]]
      });

      await timeManager.verifyReportData({
        totalHours: 14, // UI (8h) + State (6h)
        taskBreakdown: [
          { taskId: taskHierarchy.level3[0], hours: 8 },
          { taskId: taskHierarchy.level3[1], hours: 6 }
        ]
      });
    });

    test('should export time reports', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      await timeManager.logTimeEntry(taskHierarchy.level3[0], {
        hours: 8,
        description: 'Export test work'
      });

      await timeManager.generateTimeReport({ groupBy: 'task' });

      // Test CSV export
      const downloadPromise = timeManager.page.waitForEvent('download');
      await timeManager.page.click('[data-testid="export-csv"]');
      const csvDownload = await downloadPromise;
      expect(csvDownload.suggestedFilename()).toContain('.csv');

      // Test PDF export
      const pdfDownloadPromise = timeManager.page.waitForEvent('download');
      await timeManager.page.click('[data-testid="export-pdf"]');
      const pdfDownload = await pdfDownloadPromise;
      expect(pdfDownload.suggestedFilename()).toContain('.pdf');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle timer interruptions gracefully', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Start timer
      await timeManager.startTimeTracking(taskHierarchy.level3[0]);

      // Simulate page refresh (timer should be restored)
      await timeManager.page.reload();
      await timeManager.page.waitForSelector('[data-testid="wbs-task-tree"]');
      
      // Timer should still be running
      await timeManager.verifyTimerState('running', taskHierarchy.level3[0]);

      // Should be able to stop
      await timeManager.stopTimeTracking();
    });

    test('should handle concurrent time entries', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Simulate multiple users or browser tabs logging time
      const promises = [
        timeManager.logTimeEntry(taskHierarchy.level3[0], {
          hours: 4,
          description: 'Concurrent entry 1'
        }),
        timeManager.logTimeEntry(taskHierarchy.level3[0], {
          hours: 3,
          description: 'Concurrent entry 2'
        })
      ];

      await Promise.all(promises);

      // Both entries should be saved
      await timeManager.verifyTaskTimeTracking(taskHierarchy.level3[0], {
        actualHours: 7,
        timeEntries: 2
      });
    });

    test('should handle deleted tasks with time entries', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Log time on task
      await timeManager.logTimeEntry(taskHierarchy.level3[0], {
        hours: 8,
        description: 'Work before deletion'
      });

      // Delete the task
      await timeManager.page.click(`[data-testid="delete-task-${taskHierarchy.level3[0]}"]`);
      await timeManager.page.click('[data-testid="confirm-delete-btn"]');

      // Time entries should be archived/marked with deleted task
      await timeManager.generateTimeReport({});
      
      // Should show archived time entries section
      const archivedSection = timeManager.page.locator('[data-testid="archived-time-entries"]');
      await expect(archivedSection).toBeVisible();
      await expect(archivedSection).toContainText('8h');
    });

    test('should validate time entry limits', async () => {
      const taskHierarchy = await timeManager.createTaskHierarchy();

      // Try to log excessive daily hours
      await timeManager.logTimeEntry(taskHierarchy.level3[0], {
        hours: 16,
        description: 'Long day work',
        date: '2025-08-01'
      });

      // Try to log more hours on same day
      await timeManager.page.click(`[data-testid="log-time-${taskHierarchy.level3[0]}"]`);
      await timeManager.page.fill('[data-testid="hours-input"]', '10');
      await timeManager.page.fill('[data-testid="date-input"]', '2025-08-01');
      await timeManager.page.click('[data-testid="save-time-entry"]');

      // Should warn about excessive daily hours
      await expect(timeManager.page.locator('[data-testid="daily-hours-warning"]'))
        .toContainText('当日总工时将超过24小时，请确认是否正确');

      // Should allow confirmation or cancellation
      await timeManager.page.click('[data-testid="confirm-excessive-hours"]');
      await timeManager.page.waitForSelector('[data-testid="success-notification"]');
    });
  });
});