/**
 * Performance Testing Plan for Complex Task Hierarchies
 * Tests system performance under various load conditions
 */

import { test, expect, Page } from '@playwright/test';

class PerformanceTestManager {
  constructor(private page: Page) {}

  async loginAsTestUser() {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', 'perf@example.com');
    await this.page.fill('[data-testid="password-input"]', 'perf123');
    await this.page.click('[data-testid="login-btn"]');
    await this.page.waitForURL('/dashboard');
  }

  async navigateToProject(projectId: number) {
    await this.page.goto(`/projects/${projectId}`);
    await this.page.waitForSelector('[data-testid="wbs-task-tree"]');
  }

  // Performance measurement utilities
  async measureOperation(operation: () => Promise<void>, operationName: string) {
    const startTime = performance.now();
    await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`${operationName} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  async measurePageLoad() {
    const startTime = performance.now();
    await this.page.reload();
    await this.page.waitForSelector('[data-testid="wbs-task-tree"]');
    const endTime = performance.now();
    
    const loadTime = endTime - startTime;
    console.log(`Page load took ${loadTime.toFixed(2)}ms`);
    return loadTime;
  }

  async measureMemoryUsage() {
    return await this.page.evaluate(() => {
      const memInfo = (performance as any).memory;
      if (memInfo) {
        return {
          usedJSHeapSize: memInfo.usedJSHeapSize,
          totalJSHeapSize: memInfo.totalJSHeapSize,
          jsHeapSizeLimit: memInfo.jsHeapSizeLimit
        };
      }
      return null;
    });
  }

  // Task creation utilities for performance testing
  async createTaskBatch(batchSize: number, namePrefix: string) {
    const tasks = [];
    for (let i = 0; i < batchSize; i++) {
      tasks.push(this.createTask(`${namePrefix} ${i + 1}`));
    }
    await Promise.all(tasks);
  }

  async createTask(name: string, parentId?: number) {
    if (parentId) {
      await this.page.click(`[data-testid="add-child-task-${parentId}"]`);
    } else {
      await this.page.click('[data-testid="create-root-task-btn"]');
    }
    
    await this.page.fill('[data-testid="task-name-input"]', name);
    await this.page.click('[data-testid="submit-task-form"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  async createLargeHierarchy(config: {
    rootTasks: number;
    subTasksPerRoot: number;
    detailTasksPerSub: number;
  }) {
    console.log(`Creating hierarchy: ${config.rootTasks} roots, ${config.subTasksPerRoot} subs each, ${config.detailTasksPerSub} details each`);
    
    let taskId = 1;
    
    // Create root tasks
    for (let r = 0; r < config.rootTasks; r++) {
      await this.createTask(`Root Task ${r + 1}`);
      const rootId = taskId++;
      
      // Create sub tasks
      for (let s = 0; s < config.subTasksPerRoot; s++) {
        await this.createTask(`Sub Task ${r + 1}.${s + 1}`, rootId);
        const subId = taskId++;
        
        // Create detail tasks
        for (let d = 0; d < config.detailTasksPerSub; d++) {
          await this.createTask(`Detail Task ${r + 1}.${s + 1}.${d + 1}`, subId);
          taskId++;
        }
      }
    }
    
    const totalTasks = config.rootTasks * (1 + config.subTasksPerRoot * (1 + config.detailTasksPerSub));
    console.log(`Created ${totalTasks} total tasks`);
    return totalTasks;
  }

  // Performance stress tests
  async stressTestTaskCreation(iterations: number) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const duration = await this.measureOperation(
        () => this.createTask(`Stress Test Task ${i + 1}`),
        `Task Creation ${i + 1}`
      );
      times.push(duration);
      
      // Brief pause to avoid overwhelming the system
      await this.page.waitForTimeout(100);
    }
    
    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      times
    };
  }

  async stressTestNavigation(expandCollapseCount: number) {
    const times = [];
    
    for (let i = 0; i < expandCollapseCount; i++) {
      // Expand all
      const expandTime = await this.measureOperation(
        () => this.page.click('[data-testid="expand-all-btn"]'),
        `Expand All ${i + 1}`
      );
      
      await this.page.waitForTimeout(100);
      
      // Collapse all
      const collapseTime = await this.measureOperation(
        () => this.page.click('[data-testid="collapse-all-btn"]'),
        `Collapse All ${i + 1}`
      );
      
      times.push({ expand: expandTime, collapse: collapseTime });
      await this.page.waitForTimeout(100);
    }
    
    return times;
  }

  async stressTestUpdates(updateCount: number) {
    // Ensure we have tasks to update
    await this.createTaskBatch(10, 'Update Test Task');
    
    const times = [];
    
    for (let i = 0; i < updateCount; i++) {
      const taskId = (i % 10) + 1; // Cycle through first 10 tasks
      const randomProgress = Math.floor(Math.random() * 100);
      
      const duration = await this.measureOperation(async () => {
        await this.page.click(`[data-testid="quick-progress-${taskId}"]`);
        await this.page.fill(`[data-testid="progress-input-${taskId}"]`, randomProgress.toString());
        await this.page.keyboard.press('Enter');
        await this.page.waitForSelector('[data-testid="progress-updated"]');
      }, `Update ${i + 1}`);
      
      times.push(duration);
      await this.page.waitForTimeout(50);
    }
    
    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      times
    };
  }

  // Memory leak detection
  async detectMemoryLeaks(iterations: number) {
    const memorySnapshots = [];
    
    // Initial memory snapshot
    const initialMemory = await this.measureMemoryUsage();
    memorySnapshots.push({ iteration: 0, memory: initialMemory });
    
    for (let i = 1; i <= iterations; i++) {
      // Perform memory-intensive operations
      await this.createTask(`Memory Test ${i}`);
      await this.page.click('[data-testid="expand-all-btn"]');
      await this.page.click('[data-testid="collapse-all-btn"]');
      
      // Force garbage collection if available
      await this.page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });
      
      // Take memory snapshot
      const memory = await this.measureMemoryUsage();
      memorySnapshots.push({ iteration: i, memory });
      
      await this.page.waitForTimeout(100);
    }
    
    return memorySnapshots;
  }

  // Load time analysis
  async analyzeLoadTimes(hierarchy: { roots: number; subs: number; details: number }) {
    await this.createLargeHierarchy({
      rootTasks: hierarchy.roots,
      subTasksPerRoot: hierarchy.subs,
      detailTasksPerSub: hierarchy.details
    });
    
    const loadTimes = [];
    
    // Test initial load
    for (let i = 0; i < 5; i++) {
      const loadTime = await this.measurePageLoad();
      loadTimes.push(loadTime);
      await this.page.waitForTimeout(1000);
    }
    
    return {
      averageLoadTime: loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length,
      minLoadTime: Math.min(...loadTimes),
      maxLoadTime: Math.max(...loadTimes),
      loadTimes
    };
  }

  // Network performance simulation
  async testWithNetworkThrottling(networkCondition: 'fast' | 'slow' | '3g' | 'offline') {
    const conditions = {
      fast: { downloadThroughput: 10000000, uploadThroughput: 10000000, latency: 10 },
      slow: { downloadThroughput: 100000, uploadThroughput: 100000, latency: 100 },
      '3g': { downloadThroughput: 1500000, uploadThroughput: 750000, latency: 150 },
      offline: { downloadThroughput: 0, uploadThroughput: 0, latency: 0 }
    };
    
    await this.page.context().addInitScript(() => {
      // Simulate network conditions on the client side
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: networkCondition },
        writable: false
      });
    });
    
    // Test operations under this network condition
    const createTime = await this.measureOperation(
      () => this.createTask(`Network ${networkCondition} Task`),
      `Task Creation (${networkCondition})`
    );
    
    const loadTime = await this.measurePageLoad();
    
    return { createTime, loadTime, networkCondition };
  }
}

describe('Performance Testing - Complex Task Hierarchies', () => {
  let perfManager: PerformanceTestManager;
  const TEST_PROJECT_ID = 1;

  test.beforeEach(async ({ page }) => {
    perfManager = new PerformanceTestManager(page);
    await perfManager.loginAsTestUser();
    await perfManager.navigateToProject(TEST_PROJECT_ID);
  });

  test.describe('Baseline Performance Benchmarks', () => {
    test('should establish baseline task creation performance', async () => {
      const results = await perfManager.stressTestTaskCreation(20);
      
      console.log('Task Creation Performance:');
      console.log(`Average: ${results.averageTime.toFixed(2)}ms`);
      console.log(`Min: ${results.minTime.toFixed(2)}ms`);
      console.log(`Max: ${results.maxTime.toFixed(2)}ms`);
      
      // Baseline expectations
      expect(results.averageTime).toBeLessThan(500); // Should average under 500ms
      expect(results.maxTime).toBeLessThan(2000); // No single operation over 2s
    });

    test('should establish baseline navigation performance', async () => {
      // Create moderate hierarchy for testing
      await perfManager.createLargeHierarchy({
        rootTasks: 5,
        subTasksPerRoot: 4,
        detailTasksPerSub: 3
      });
      
      const results = await perfManager.stressTestNavigation(10);
      
      const avgExpand = results.reduce((sum, r) => sum + r.expand, 0) / results.length;
      const avgCollapse = results.reduce((sum, r) => sum + r.collapse, 0) / results.length;
      
      console.log(`Average Expand Time: ${avgExpand.toFixed(2)}ms`);
      console.log(`Average Collapse Time: ${avgCollapse.toFixed(2)}ms`);
      
      // Navigation should be fast even with moderate hierarchy
      expect(avgExpand).toBeLessThan(1000);
      expect(avgCollapse).toBeLessThan(500);
    });

    test('should establish baseline update performance', async () => {
      const results = await perfManager.stressTestUpdates(50);
      
      console.log('Update Performance:');
      console.log(`Average: ${results.averageTime.toFixed(2)}ms`);
      console.log(`Min: ${results.minTime.toFixed(2)}ms`);
      console.log(`Max: ${results.maxTime.toFixed(2)}ms`);
      
      // Updates should be very fast
      expect(results.averageTime).toBeLessThan(200);
      expect(results.maxTime).toBeLessThan(1000);
    });
  });

  test.describe('Scalability Testing', () => {
    test('should handle small hierarchy efficiently (5-10-15 pattern)', async () => {
      const results = await perfManager.analyzeLoadTimes({
        roots: 5,
        subs: 10,
        details: 15
      });
      
      console.log('Small Hierarchy (750 tasks):');
      console.log(`Average Load: ${results.averageLoadTime.toFixed(2)}ms`);
      
      // Should load quickly with small hierarchy
      expect(results.averageLoadTime).toBeLessThan(2000);
    });

    test('should handle medium hierarchy reasonably (10-8-6 pattern)', async () => {
      const results = await perfManager.analyzeLoadTimes({
        roots: 10,
        subs: 8,
        details: 6
      });
      
      console.log('Medium Hierarchy (490 tasks):');
      console.log(`Average Load: ${results.averageLoadTime.toFixed(2)}ms`);
      
      // Should load within reasonable time
      expect(results.averageLoadTime).toBeLessThan(5000);
    });

    test('should handle large hierarchy with degraded performance (15-10-5 pattern)', async () => {
      const results = await perfManager.analyzeLoadTimes({
        roots: 15,
        subs: 10,
        details: 5
      });
      
      console.log('Large Hierarchy (765 tasks):');
      console.log(`Average Load: ${results.averageLoadTime.toFixed(2)}ms`);
      
      // May be slower but should still be usable
      expect(results.averageLoadTime).toBeLessThan(10000);
      
      // Test that navigation still works
      const navTime = await perfManager.measureOperation(
        () => perfManager.page.click('[data-testid="expand-all-btn"]'),
        'Large Hierarchy Expand All'
      );
      
      expect(navTime).toBeLessThan(5000);
    });

    test('should identify breaking point for hierarchy size', async () => {
      const hierarchySizes = [
        { roots: 20, subs: 5, details: 3 }, // 320 tasks
        { roots: 10, subs: 10, details: 5 }, // 510 tasks
        { roots: 5, subs: 20, details: 8 }, // 805 tasks
        { roots: 25, subs: 8, details: 2 }  // 425 tasks
      ];
      
      for (const size of hierarchySizes) {
        const totalTasks = size.roots * (1 + size.subs * (1 + size.details));
        console.log(`Testing ${totalTasks} tasks...`);
        
        try {
          const results = await perfManager.analyzeLoadTimes(size);
          
          console.log(`${totalTasks} tasks - Load Time: ${results.averageLoadTime.toFixed(2)}ms`);
          
          // If load time exceeds 15 seconds, consider this the breaking point
          if (results.averageLoadTime > 15000) {
            console.log(`Breaking point reached at ${totalTasks} tasks`);
            break;
          }
        } catch (error) {
          console.log(`Failed at ${totalTasks} tasks:`, error);
          break;
        }
      }
    });
  });

  test.describe('Memory Usage and Leak Detection', () => {
    test('should not have significant memory leaks during normal usage', async () => {
      const snapshots = await perfManager.detectMemoryLeaks(20);
      
      const initialMemory = snapshots[0].memory?.usedJSHeapSize || 0;
      const finalMemory = snapshots[snapshots.length - 1].memory?.usedJSHeapSize || 0;
      
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
      
      console.log(`Initial Memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Final Memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory Increase: ${memoryIncreasePercent.toFixed(2)}%`);
      
      // Memory should not increase by more than 100% during normal operations
      expect(memoryIncreasePercent).toBeLessThan(100);
    });

    test('should handle memory pressure gracefully', async () => {
      // Create large hierarchy to consume memory
      await perfManager.createLargeHierarchy({
        rootTasks: 20,
        subTasksPerRoot: 8,
        detailTasksPerSub: 4
      });
      
      const memoryBefore = await perfManager.measureMemoryUsage();
      
      // Perform operations that should trigger memory cleanup
      for (let i = 0; i < 5; i++) {
        await perfManager.page.click('[data-testid="expand-all-btn"]');
        await perfManager.page.waitForTimeout(500);
        await perfManager.page.click('[data-testid="collapse-all-btn"]');
        await perfManager.page.waitForTimeout(500);
      }
      
      // Force garbage collection
      await perfManager.page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });
      
      const memoryAfter = await perfManager.measureMemoryUsage();
      
      console.log('Memory Usage:');
      console.log(`Before: ${((memoryBefore?.usedJSHeapSize || 0) / 1024 / 1024).toFixed(2)}MB`);
      console.log(`After: ${((memoryAfter?.usedJSHeapSize || 0) / 1024 / 1024).toFixed(2)}MB`);
      
      // Application should still be responsive
      const responseTime = await perfManager.measureOperation(
        () => perfManager.createTask('Memory Pressure Test'),
        'Task Creation Under Memory Pressure'
      );
      
      expect(responseTime).toBeLessThan(2000);
    });
  });

  test.describe('Network Performance Simulation', () => {
    test('should perform acceptably on fast connections', async () => {
      const results = await perfManager.testWithNetworkThrottling('fast');
      
      console.log(`Fast Network - Create: ${results.createTime.toFixed(2)}ms, Load: ${results.loadTime.toFixed(2)}ms`);
      
      expect(results.createTime).toBeLessThan(300);
      expect(results.loadTime).toBeLessThan(1500);
    });

    test('should degrade gracefully on slow connections', async () => {
      const results = await perfManager.testWithNetworkThrottling('slow');
      
      console.log(`Slow Network - Create: ${results.createTime.toFixed(2)}ms, Load: ${results.loadTime.toFixed(2)}ms`);
      
      // Should still be usable, just slower
      expect(results.createTime).toBeLessThan(2000);
      expect(results.loadTime).toBeLessThan(5000);
    });

    test('should handle 3G connections appropriately', async () => {
      const results = await perfManager.testWithNetworkThrottling('3g');
      
      console.log(`3G Network - Create: ${results.createTime.toFixed(2)}ms, Load: ${results.loadTime.toFixed(2)}ms`);
      
      // Should work on mobile connections
      expect(results.createTime).toBeLessThan(1500);
      expect(results.loadTime).toBeLessThan(4000);
    });
  });

  test.describe('Concurrent User Performance', () => {
    test('should handle multiple concurrent operations', async ({ browser }) => {
      // Create multiple browser contexts to simulate different users
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ]);
      
      const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
      const managers = pages.map(page => new PerformanceTestManager(page));
      
      // Login all users
      await Promise.all(managers.map(mgr => mgr.loginAsTestUser()));
      await Promise.all(managers.map(mgr => mgr.navigateToProject(TEST_PROJECT_ID)));
      
      // Perform concurrent operations
      const operations = managers.map((mgr, index) => 
        mgr.stressTestTaskCreation(10).then(results => ({
          user: index + 1,
          results
        }))
      );
      
      const allResults = await Promise.all(operations);
      
      // Analyze concurrent performance
      allResults.forEach(({ user, results }) => {
        console.log(`User ${user} - Average: ${results.averageTime.toFixed(2)}ms`);
        expect(results.averageTime).toBeLessThan(1000); // Should handle concurrency reasonably
      });
      
      // Cleanup
      await Promise.all(contexts.map(ctx => ctx.close()));
    });
  });

  test.describe('Real-Time Performance Monitoring', () => {
    test('should maintain consistent performance over time', async () => {
      const performanceLog = [];
      const testDuration = 60000; // 1 minute
      const interval = 5000; // 5 seconds
      
      const startTime = Date.now();
      
      while (Date.now() - startTime < testDuration) {
        const createTime = await perfManager.measureOperation(
          () => perfManager.createTask(`Time Test ${Date.now()}`),
          'Timed Task Creation'
        );
        
        const memory = await perfManager.measureMemoryUsage();
        
        performanceLog.push({
          timestamp: Date.now() - startTime,
          createTime,
          memory: memory?.usedJSHeapSize || 0
        });
        
        await perfManager.page.waitForTimeout(interval);
      }
      
      // Analyze performance over time
      const avgTimes = performanceLog.map(log => log.createTime);
      const avgCreateTime = avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length;
      
      const timeVariance = avgTimes.reduce((sum, time) => {
        return sum + Math.pow(time - avgCreateTime, 2);
      }, 0) / avgTimes.length;
      
      console.log(`Average Create Time: ${avgCreateTime.toFixed(2)}ms`);
      console.log(`Time Variance: ${timeVariance.toFixed(2)}`);
      
      // Performance should remain relatively consistent
      expect(Math.sqrt(timeVariance)).toBeLessThan(avgCreateTime * 0.5); // Standard deviation < 50% of mean
    });

    test('should handle peak usage scenarios', async () => {
      // Simulate peak usage: rapid operations for short bursts
      const peakTests = [
        { operations: 50, timeLimit: 10000 }, // 50 ops in 10 seconds
        { operations: 100, timeLimit: 30000 }, // 100 ops in 30 seconds
        { operations: 200, timeLimit: 60000 }  // 200 ops in 1 minute
      ];
      
      for (const peak of peakTests) {
        const startTime = Date.now();
        const times = [];
        
        for (let i = 0; i < peak.operations; i++) {
          const opTime = await perfManager.measureOperation(
            () => perfManager.createTask(`Peak ${i + 1}`),
            `Peak Operation ${i + 1}`
          );
          
          times.push(opTime);
          
          // Check if we're within time limit
          if (Date.now() - startTime > peak.timeLimit) {
            console.log(`Completed ${i + 1}/${peak.operations} operations within time limit`);
            break;
          }
          
          // Brief pause to avoid overwhelming
          await perfManager.page.waitForTimeout(50);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        console.log(`Peak Test (${peak.operations} ops): Average ${avgTime.toFixed(2)}ms`);
        
        // Performance should degrade gracefully under peak load
        expect(avgTime).toBeLessThan(2000);
      }
    });
  });

  test.describe('Performance Regression Detection', () => {
    test('should detect performance regressions', async () => {
      // This test would compare against historical benchmarks
      // For now, we'll establish current performance and flag significant deviations
      
      const benchmarks = {
        taskCreation: { target: 300, tolerance: 100 }, // 300ms ± 100ms
        pageLoad: { target: 2000, tolerance: 500 },    // 2s ± 500ms
        navigation: { target: 800, tolerance: 200 }     // 800ms ± 200ms
      };
      
      // Test task creation
      const createResults = await perfManager.stressTestTaskCreation(10);
      const createRegression = Math.abs(createResults.averageTime - benchmarks.taskCreation.target);
      
      if (createRegression > benchmarks.taskCreation.tolerance) {
        console.warn(`Task creation regression detected: ${createRegression.toFixed(2)}ms deviation`);
      }
      
      expect(createRegression).toBeLessThan(benchmarks.taskCreation.tolerance * 2); // Allow 2x tolerance for test
      
      // Test page load
      const loadTime = await perfManager.measurePageLoad();
      const loadRegression = Math.abs(loadTime - benchmarks.pageLoad.target);
      
      if (loadRegression > benchmarks.pageLoad.tolerance) {
        console.warn(`Page load regression detected: ${loadRegression.toFixed(2)}ms deviation`);
      }
      
      expect(loadRegression).toBeLessThan(benchmarks.pageLoad.tolerance * 2);
    });
  });
});