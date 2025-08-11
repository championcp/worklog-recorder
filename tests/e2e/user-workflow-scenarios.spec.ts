/**
 * Real-World User Workflow Testing Scenarios
 * Tests complete user journeys from actual usage perspectives
 */

import { test, expect, Page } from '@playwright/test';

class UserWorkflowTestManager {
  constructor(private page: Page) {}

  async loginAsUser(userType: 'project_manager' | 'developer' | 'team_lead') {
    const credentials = {
      project_manager: { email: 'pm@example.com', password: 'pm123' },
      developer: { email: 'dev@example.com', password: 'dev123' },
      team_lead: { email: 'lead@example.com', password: 'lead123' }
    };

    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', credentials[userType].email);
    await this.page.fill('[data-testid="password-input"]', credentials[userType].password);
    await this.page.click('[data-testid="login-btn"]');
    await this.page.waitForURL('/dashboard');
  }

  async navigateToProject(projectId: number) {
    await this.page.goto(`/projects/${projectId}`);
    await this.page.waitForSelector('[data-testid="wbs-task-tree"]');
  }

  // Workflow Helper Methods
  async quickCreateTask(parentId: number | null, name: string, options?: {
    priority?: string;
    estimatedHours?: number;
    assignee?: string;
  }) {
    if (parentId === null) {
      await this.page.click('[data-testid="create-root-task-btn"]');
    } else {
      await this.page.click(`[data-testid="add-child-task-${parentId}"]`);
    }

    await this.page.fill('[data-testid="task-name-input"]', name);
    
    if (options?.priority) {
      await this.page.selectOption('[data-testid="priority-select"]', options.priority);
    }
    
    if (options?.estimatedHours) {
      await this.page.fill('[data-testid="estimated-hours-input"]', options.estimatedHours.toString());
    }

    if (options?.assignee) {
      await this.page.selectOption('[data-testid="assignee-select"]', options.assignee);
    }

    await this.page.click('[data-testid="submit-task-form"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  async quickUpdateTaskStatus(taskId: number, status: string, progress?: number) {
    // Use quick status update (not full edit form)
    await this.page.click(`[data-testid="status-dropdown-${taskId}"]`);
    await this.page.click(`[data-testid="status-option-${status}"]`);
    
    if (progress !== undefined) {
      await this.page.fill(`[data-testid="quick-progress-${taskId}"]`, progress.toString());
      await this.page.keyboard.press('Enter');
    }
    
    await this.page.waitForSelector('[data-testid="status-updated-notification"]');
  }

  async logWorkSession(taskId: number, hours: number, description: string) {
    await this.page.click(`[data-testid="log-time-${taskId}"]`);
    await this.page.fill('[data-testid="hours-input"]', hours.toString());
    await this.page.fill('[data-testid="description-input"]', description);
    await this.page.click('[data-testid="save-time-entry"]');
    await this.page.waitForSelector('[data-testid="success-notification"]');
  }

  async startWorkingOnTask(taskId: number) {
    await this.page.click(`[data-testid="start-timer-${taskId}"]`);
    await this.page.waitForSelector('[data-testid="timer-started-notification"]');
  }

  async finishWorkSession() {
    await this.page.click('[data-testid="stop-timer-btn"]');
    await this.page.waitForSelector('[data-testid="timer-stopped-notification"]');
  }

  async checkInWithTeam(taskId: number, update: string) {
    await this.page.click(`[data-testid="add-comment-${taskId}"]`);
    await this.page.fill('[data-testid="comment-input"]', update);
    await this.page.click('[data-testid="post-comment"]');
    await this.page.waitForSelector('[data-testid="comment-posted-notification"]');
  }

  async reviewTeamProgress() {
    await this.page.click('[data-testid="team-dashboard-btn"]');
    await this.page.waitForSelector('[data-testid="team-progress-overview"]');
  }

  async generateStatusReport() {
    await this.page.click('[data-testid="reports-btn"]');
    await this.page.click('[data-testid="generate-status-report"]');
    await this.page.waitForSelector('[data-testid="report-generated"]');
  }

  // Verification Methods
  async verifyProjectStructure(expectedStructure: {
    rootTasks: string[];
    subTasks: { parent: string; children: string[] }[];
    detailTasks: { parent: string; children: string[] }[];
  }) {
    // Expand all to see full structure
    await this.page.click('[data-testid="expand-all-btn"]');
    
    // Verify root tasks
    for (const rootTask of expectedStructure.rootTasks) {
      await expect(this.page.locator(`text="${rootTask}"`)).toBeVisible();
    }
    
    // Verify sub tasks
    for (const subGroup of expectedStructure.subTasks) {
      for (const child of subGroup.children) {
        await expect(this.page.locator(`text="${child}"`)).toBeVisible();
      }
    }
    
    // Verify detail tasks
    for (const detailGroup of expectedStructure.detailTasks) {
      for (const child of detailGroup.children) {
        await expect(this.page.locator(`text="${child}"`)).toBeVisible();
      }
    }
  }

  async verifyWorkflowOutcome(expectedOutcomes: {
    tasksCompleted: number;
    totalHoursLogged: number;
    teamUpdates: number;
    projectProgress: number;
  }) {
    await this.page.click('[data-testid="project-summary-btn"]');
    
    const completedTasks = this.page.locator('[data-testid="completed-tasks-count"]');
    await expect(completedTasks).toContainText(expectedOutcomes.tasksCompleted.toString());
    
    const totalHours = this.page.locator('[data-testid="total-hours-logged"]');
    await expect(totalHours).toContainText(expectedOutcomes.totalHoursLogged.toString());
    
    const teamUpdates = this.page.locator('[data-testid="team-updates-count"]');
    await expect(teamUpdates).toContainText(expectedOutcomes.teamUpdates.toString());
    
    const projectProgress = this.page.locator('[data-testid="project-progress-percentage"]');
    await expect(projectProgress).toContainText(`${expectedOutcomes.projectProgress}%`);
  }
}

describe('Real-World User Workflow Testing', () => {
  let workflowManager: UserWorkflowTestManager;
  const TEST_PROJECT_ID = 1;

  test.describe('Project Manager Daily Workflows', () => {
    test.beforeEach(async ({ page }) => {
      workflowManager = new UserWorkflowTestManager(page);
      await workflowManager.loginAsUser('project_manager');
    });

    test('should complete morning project setup routine', async () => {
      await workflowManager.navigateToProject(TEST_PROJECT_ID);

      // Morning routine: Set up project structure for new sprint
      await workflowManager.quickCreateTask(null, 'Sprint 3 - Mobile App Development', {
        priority: 'high',
        estimatedHours: 320
      });

      await workflowManager.quickCreateTask(1, 'Frontend Mobile Development', {
        priority: 'high',
        estimatedHours: 160
      });

      await workflowManager.quickCreateTask(1, 'Backend API Enhancements', {
        priority: 'medium',
        estimatedHours: 120
      });

      await workflowManager.quickCreateTask(1, 'Testing & Quality Assurance', {
        priority: 'high',
        estimatedHours: 40
      });

      // Create detailed breakdown for frontend
      await workflowManager.quickCreateTask(2, 'React Native Setup', {
        priority: 'urgent',
        estimatedHours: 24,
        assignee: 'dev1'
      });

      await workflowManager.quickCreateTask(2, 'Core Components', {
        priority: 'high',
        estimatedHours: 80,
        assignee: 'dev2'
      });

      await workflowManager.quickCreateTask(2, 'Navigation & Routing', {
        priority: 'medium',
        estimatedHours: 32,
        assignee: 'dev1'
      });

      await workflowManager.quickCreateTask(2, 'State Management', {
        priority: 'medium',
        estimatedHours: 24,
        assignee: 'dev3'
      });

      // Create API development tasks
      await workflowManager.quickCreateTask(3, 'User Authentication API', {
        priority: 'urgent',
        estimatedHours: 40,
        assignee: 'backend_dev1'
      });

      await workflowManager.quickCreateTask(3, 'Data Synchronization', {
        priority: 'high',
        estimatedHours: 48,
        assignee: 'backend_dev2'
      });

      await workflowManager.quickCreateTask(3, 'Push Notifications', {
        priority: 'medium',
        estimatedHours: 32,
        assignee: 'backend_dev1'
      });

      // Verify complete project structure
      await workflowManager.verifyProjectStructure({
        rootTasks: ['Sprint 3 - Mobile App Development'],
        subTasks: [
          {
            parent: 'Sprint 3 - Mobile App Development',
            children: [
              'Frontend Mobile Development',
              'Backend API Enhancements', 
              'Testing & Quality Assurance'
            ]
          }
        ],
        detailTasks: [
          {
            parent: 'Frontend Mobile Development',
            children: [
              'React Native Setup',
              'Core Components',
              'Navigation & Routing',
              'State Management'
            ]
          },
          {
            parent: 'Backend API Enhancements',
            children: [
              'User Authentication API',
              'Data Synchronization',
              'Push Notifications'
            ]
          }
        ]
      });

      // Generate initial project report
      await workflowManager.generateStatusReport();
    });

    test('should complete evening progress review routine', async () => {
      // Setup: Create project structure and simulate some progress
      await workflowManager.navigateToProject(TEST_PROJECT_ID);
      
      // Simulate a project in progress
      await workflowManager.quickCreateTask(null, 'Web Platform Enhancement', {
        priority: 'high',
        estimatedHours: 200
      });

      await workflowManager.quickCreateTask(1, 'UI/UX Improvements', {
        estimatedHours: 80
      });

      await workflowManager.quickCreateTask(1, 'Performance Optimization', {
        estimatedHours: 60
      });

      await workflowManager.quickCreateTask(1, 'Security Updates', {
        estimatedHours: 60
      });

      // Simulate team progress throughout the day
      await workflowManager.quickUpdateTaskStatus(2, 'in_progress', 75);
      await workflowManager.quickUpdateTaskStatus(3, 'completed', 100);
      await workflowManager.quickUpdateTaskStatus(4, 'in_progress', 30);

      // Log some work time
      await workflowManager.logWorkSession(2, 6, 'Redesigned dashboard layout and navigation');
      await workflowManager.logWorkSession(3, 8, 'Optimized database queries and API responses');
      await workflowManager.logWorkSession(4, 2.5, 'Updated authentication middleware');

      // Evening review: Check team progress
      await workflowManager.reviewTeamProgress();
      
      // Generate daily status report
      await workflowManager.generateStatusReport();
      
      // Verify overall progress
      await workflowManager.verifyWorkflowOutcome({
        tasksCompleted: 1,
        totalHoursLogged: 16.5,
        teamUpdates: 3,
        projectProgress: 68 // Weighted progress based on estimates and completion
      });
    });

    test('should handle sprint planning workflow', async () => {
      await workflowManager.navigateToProject(TEST_PROJECT_ID);

      // Sprint planning session: Create comprehensive backlog
      const sprintTasks = [
        {
          name: 'User Management System',
          priority: 'urgent',
          estimatedHours: 120,
          subtasks: [
            { name: 'User Registration Flow', hours: 40, priority: 'urgent' },
            { name: 'Profile Management', hours: 32, priority: 'high' },
            { name: 'Role-Based Access Control', hours: 48, priority: 'high' }
          ]
        },
        {
          name: 'Reporting Dashboard',
          priority: 'high',
          estimatedHours: 80,
          subtasks: [
            { name: 'Data Visualization Components', hours: 40, priority: 'high' },
            { name: 'Export Functionality', hours: 24, priority: 'medium' },
            { name: 'Real-time Updates', hours: 16, priority: 'low' }
          ]
        },
        {
          name: 'Mobile Responsiveness',
          priority: 'medium',
          estimatedHours: 60,
          subtasks: [
            { name: 'Responsive Layout', hours: 32, priority: 'medium' },
            { name: 'Touch Interactions', hours: 16, priority: 'medium' },
            { name: 'Mobile-First Components', hours: 12, priority: 'low' }
          ]
        }
      ];

      // Create all tasks in the planning structure
      for (let i = 0; i < sprintTasks.length; i++) {
        const task = sprintTasks[i];
        
        // Create main task
        await workflowManager.quickCreateTask(null, task.name, {
          priority: task.priority,
          estimatedHours: task.estimatedHours
        });
        
        const mainTaskId = i + 1;
        
        // Create subtasks
        for (let j = 0; j < task.subtasks.length; j++) {
          const subtask = task.subtasks[j];
          await workflowManager.quickCreateTask(mainTaskId, subtask.name, {
            priority: subtask.priority,
            estimatedHours: subtask.hours
          });
        }
      }

      // Verify sprint structure
      await workflowManager.verifyProjectStructure({
        rootTasks: [
          'User Management System',
          'Reporting Dashboard', 
          'Mobile Responsiveness'
        ],
        subTasks: [
          {
            parent: 'User Management System',
            children: [
              'User Registration Flow',
              'Profile Management',
              'Role-Based Access Control'
            ]
          },
          {
            parent: 'Reporting Dashboard',
            children: [
              'Data Visualization Components',
              'Export Functionality',
              'Real-time Updates'
            ]
          }
        ],
        detailTasks: []
      });

      // Set sprint priorities and assignments
      await workflowManager.quickUpdateTaskStatus(2, 'ready', 0); // User Registration ready to start
      await workflowManager.quickUpdateTaskStatus(5, 'ready', 0); // Data Visualization ready
    });
  });

  test.describe('Developer Daily Workflows', () => {
    test.beforeEach(async ({ page }) => {
      workflowManager = new UserWorkflowTestManager(page);
      await workflowManager.loginAsUser('developer');
    });

    test('should complete typical development workday', async () => {
      await workflowManager.navigateToProject(TEST_PROJECT_ID);

      // Pre-setup: Create tasks that developer would work on
      await workflowManager.quickCreateTask(null, 'E-commerce Platform', {
        estimatedHours: 400
      });

      await workflowManager.quickCreateTask(1, 'Shopping Cart Feature', {
        estimatedHours: 120
      });

      await workflowManager.quickCreateTask(2, 'Add to Cart Functionality', {
        estimatedHours: 32,
        assignee: 'current_user'
      });

      await workflowManager.quickCreateTask(2, 'Cart State Management', {
        estimatedHours: 24,
        assignee: 'current_user'
      });

      await workflowManager.quickCreateTask(2, 'Checkout Process', {
        estimatedHours: 48,
        assignee: 'teammate'
      });

      // Morning: Start working on Add to Cart
      await workflowManager.quickUpdateTaskStatus(3, 'in_progress', 0);
      await workflowManager.startWorkingOnTask(3);

      // Simulate focused work session (2 hours)
      await workflowManager.page.waitForTimeout(2000); // Simulate 2 hours of work
      await workflowManager.finishWorkSession();
      
      // Update progress and add development notes
      await workflowManager.quickUpdateTaskStatus(3, 'in_progress', 60);
      await workflowManager.checkInWithTeam(3, 'Completed add to cart button and basic state updates. Working on quantity controls next.');

      // Midday: Switch to Cart State Management
      await workflowManager.quickUpdateTaskStatus(4, 'in_progress', 0);
      await workflowManager.startWorkingOnTask(4);

      // Another work session
      await workflowManager.page.waitForTimeout(1500); // Simulate 1.5 hours
      await workflowManager.finishWorkSession();
      
      await workflowManager.quickUpdateTaskStatus(4, 'in_progress', 40);
      await workflowManager.checkInWithTeam(4, 'Set up Redux store for cart state. Need to integrate with existing user auth state.');

      // Afternoon: Continue with Add to Cart (finish it)
      await workflowManager.startWorkingOnTask(3);
      await workflowManager.page.waitForTimeout(1000); // 1 more hour
      await workflowManager.finishWorkSession();

      await workflowManager.quickUpdateTaskStatus(3, 'completed', 100);
      await workflowManager.checkInWithTeam(3, 'Add to Cart functionality complete! Added unit tests and updated documentation.');

      // End of day: Log manual time for code review and meetings
      await workflowManager.logWorkSession(2, 1, 'Code review and team standup meeting');

      // Verify end-of-day status
      await workflowManager.verifyWorkflowOutcome({
        tasksCompleted: 1,
        totalHoursLogged: 5.5, // 2 + 1.5 + 1 + 1 manual
        teamUpdates: 3,
        projectProgress: 23 // Partial progress on shopping cart feature
      });
    });

    test('should handle bug fixing workflow', async () => {
      await workflowManager.navigateToProject(TEST_PROJECT_ID);

      // Setup: Project with reported bugs
      await workflowManager.quickCreateTask(null, 'Bug Fixes - Critical Issues', {
        priority: 'urgent',
        estimatedHours: 16
      });

      await workflowManager.quickCreateTask(1, 'Login Page Redirect Issue', {
        priority: 'urgent',
        estimatedHours: 4
      });

      await workflowManager.quickCreateTask(1, 'Data Loading Performance', {
        priority: 'high',
        estimatedHours: 8
      });

      await workflowManager.quickCreateTask(1, 'Mobile Layout Broken on iOS', {
        priority: 'high',
        estimatedHours: 4
      });

      // Start with most critical bug
      await workflowManager.quickUpdateTaskStatus(2, 'in_progress', 0);
      await workflowManager.startWorkingOnTask(2);
      
      // Quick investigation and fix
      await workflowManager.page.waitForTimeout(800); // 45 minutes investigation
      await workflowManager.checkInWithTeam(2, 'Found the issue - missing redirect parameter in auth flow. Implementing fix.');
      
      await workflowManager.page.waitForTimeout(600); // 30 minutes fix
      await workflowManager.finishWorkSession();
      
      await workflowManager.quickUpdateTaskStatus(2, 'completed', 100);
      await workflowManager.checkInWithTeam(2, 'Fixed redirect issue. Tested on dev environment. Ready for QA.');

      // Move to performance issue
      await workflowManager.quickUpdateTaskStatus(3, 'in_progress', 0);
      await workflowManager.startWorkingOnTask(3);
      
      // Longer investigation needed
      await workflowManager.page.waitForTimeout(1200); // 2 hours investigation
      await workflowManager.checkInWithTeam(3, 'Identified multiple database query inefficiencies. Optimizing largest bottlenecks first.');
      
      await workflowManager.quickUpdateTaskStatus(3, 'in_progress', 25);
      
      // Continue work
      await workflowManager.page.waitForTimeout(1800); // 3 hours optimization
      await workflowManager.finishWorkSession();
      
      await workflowManager.quickUpdateTaskStatus(3, 'in_progress', 75);
      await workflowManager.checkInWithTeam(3, 'Optimized main queries. Seeing 60% improvement in load times. Testing edge cases tomorrow.');

      // End of day status
      await workflowManager.verifyWorkflowOutcome({
        tasksCompleted: 1,
        totalHoursLogged: 6.25, // 1.25 + 5 hours
        teamUpdates: 4,
        projectProgress: 56 // 1 complete + 75% of second task
      });
    });

    test('should handle feature development with testing workflow', async () => {
      await workflowManager.navigateToProject(TEST_PROJECT_ID);

      // Setup: New feature development
      await workflowManager.quickCreateTask(null, 'User Notification System', {
        priority: 'high',
        estimatedHours: 80
      });

      await workflowManager.quickCreateTask(1, 'Backend Notification Service', {
        estimatedHours: 40
      });

      await workflowManager.quickCreateTask(1, 'Frontend Notification UI', {
        estimatedHours: 24
      });

      await workflowManager.quickCreateTask(1, 'Testing & Integration', {
        estimatedHours: 16
      });

      // Day 1: Start with backend service
      await workflowManager.quickUpdateTaskStatus(2, 'in_progress', 0);
      await workflowManager.startWorkingOnTask(2);

      // Development session with regular check-ins
      await workflowManager.page.waitForTimeout(2000); // 4 hours morning work
      await workflowManager.checkInWithTeam(2, 'Set up notification service architecture. Implemented email notifications.');
      await workflowManager.quickUpdateTaskStatus(2, 'in_progress', 50);

      // Lunch break, then continue
      await workflowManager.page.waitForTimeout(2000); // 4 hours afternoon
      await workflowManager.finishWorkSession();
      
      await workflowManager.quickUpdateTaskStatus(2, 'completed', 100);
      await workflowManager.checkInWithTeam(2, 'Backend service complete with email, SMS, and push notification support. Added comprehensive logging.');

      // Day 2: Move to frontend
      await workflowManager.quickUpdateTaskStatus(3, 'in_progress', 0);
      await workflowManager.startWorkingOnTask(3);

      await workflowManager.page.waitForTimeout(1500); // 3 hours
      await workflowManager.checkInWithTeam(3, 'Built notification components and integrated with backend API. Working on user preferences UI.');
      
      await workflowManager.page.waitForTimeout(2500); // 5 hours total
      await workflowManager.finishWorkSession();
      
      await workflowManager.quickUpdateTaskStatus(3, 'completed', 100);
      await workflowManager.checkInWithTeam(3, 'Frontend notification system complete. Users can manage preferences and view notification history.');

      // Day 3: Testing phase
      await workflowManager.quickUpdateTaskStatus(4, 'in_progress', 0);
      await workflowManager.startWorkingOnTask(4);

      await workflowManager.page.waitForTimeout(2000); // 4 hours testing
      await workflowManager.finishWorkSession();
      
      await workflowManager.quickUpdateTaskStatus(4, 'completed', 100);
      await workflowManager.checkInWithTeam(4, 'All tests passing. Integration tests cover all notification types. Feature ready for deployment.');

      // Verify complete feature development
      await workflowManager.verifyWorkflowOutcome({
        tasksCompleted: 3,
        totalHoursLogged: 20, // 8 + 8 + 4 hours
        teamUpdates: 6,
        projectProgress: 100
      });
    });
  });

  test.describe('Team Lead Coordination Workflows', () => {
    test.beforeEach(async ({ page }) => {
      workflowManager = new UserWorkflowTestManager(page);
      await workflowManager.loginAsUser('team_lead');
    });

    test('should complete daily team coordination routine', async () => {
      await workflowManager.navigateToProject(TEST_PROJECT_ID);

      // Setup: Multi-developer project
      await workflowManager.quickCreateTask(null, 'Team Collaboration Platform', {
        priority: 'high',
        estimatedHours: 320
      });

      // Frontend team tasks
      await workflowManager.quickCreateTask(1, 'Chat System Frontend', {
        estimatedHours: 80,
        assignee: 'frontend_dev1'
      });

      await workflowManager.quickCreateTask(1, 'File Sharing UI', {
        estimatedHours: 60,
        assignee: 'frontend_dev2'
      });

      // Backend team tasks
      await workflowManager.quickCreateTask(1, 'Real-time Message Service', {
        estimatedHours: 100,
        assignee: 'backend_dev1'
      });

      await workflowManager.quickCreateTask(1, 'File Storage Service', {
        estimatedHours: 80,
        assignee: 'backend_dev2'
      });

      // Simulate team progress
      await workflowManager.quickUpdateTaskStatus(2, 'in_progress', 30);
      await workflowManager.quickUpdateTaskStatus(3, 'in_progress', 50);
      await workflowManager.quickUpdateTaskStatus(4, 'in_progress', 20);
      await workflowManager.quickUpdateTaskStatus(5, 'not_started', 0);

      // Log work time for team members
      await workflowManager.logWorkSession(2, 3, 'Chat UI components and message threading');
      await workflowManager.logWorkSession(3, 4, 'File picker and preview components');
      await workflowManager.logWorkSession(4, 2, 'WebSocket connection setup and message routing');

      // Team lead activities
      await workflowManager.checkInWithTeam(2, 'Great progress on chat UI! Consider adding typing indicators next.');
      await workflowManager.checkInWithTeam(3, 'File sharing looks good. Make sure to handle large file uploads gracefully.');
      await workflowManager.checkInWithTeam(4, 'Good foundation for real-time messaging. Coordinate with frontend team for API integration.');

      // Coordinate between teams - create integration task
      await workflowManager.quickCreateTask(1, 'Frontend-Backend Integration', {
        priority: 'high',
        estimatedHours: 16,
        assignee: 'team_lead'
      });

      await workflowManager.quickUpdateTaskStatus(6, 'in_progress', 0);
      await workflowManager.logWorkSession(6, 2, 'API documentation and integration planning meeting');

      // Generate team status report
      await workflowManager.reviewTeamProgress();
      await workflowManager.generateStatusReport();

      // Verify team coordination outcome
      await workflowManager.verifyWorkflowOutcome({
        tasksCompleted: 0, // All in progress
        totalHoursLogged: 11, // Team total: 3 + 4 + 2 + 2
        teamUpdates: 4, // 3 team check-ins + 1 integration task
        projectProgress: 31 // Weighted progress across all tasks
      });
    });

    test('should handle sprint retrospective and planning workflow', async () => {
      await workflowManager.navigateToProject(TEST_PROJECT_ID);

      // Previous sprint setup (simulate completed work)
      await workflowManager.quickCreateTask(null, 'Completed Sprint - User Authentication', {
        estimatedHours: 160
      });

      await workflowManager.quickCreateTask(1, 'Login System', {
        estimatedHours: 60
      });

      await workflowManager.quickCreateTask(1, 'User Registration', {
        estimatedHours: 40
      });

      await workflowManager.quickCreateTask(1, 'Password Recovery', {
        estimatedHours: 32
      });

      await workflowManager.quickCreateTask(1, 'Security Hardening', {
        estimatedHours: 28
      });

      // Mark previous sprint as completed
      await workflowManager.quickUpdateTaskStatus(2, 'completed', 100);
      await workflowManager.quickUpdateTaskStatus(3, 'completed', 100);
      await workflowManager.quickUpdateTaskStatus(4, 'completed', 100);
      await workflowManager.quickUpdateTaskStatus(5, 'completed', 100);

      // Log historical time entries
      await workflowManager.logWorkSession(2, 55, 'Login system development and testing');
      await workflowManager.logWorkSession(3, 38, 'Registration flow and email verification');
      await workflowManager.logWorkSession(4, 30, 'Password recovery implementation');
      await workflowManager.logWorkSession(5, 25, 'Security audit and improvements');

      // New sprint planning
      await workflowManager.quickCreateTask(null, 'Sprint 4 - Data Management', {
        priority: 'high',
        estimatedHours: 200
      });

      // Plan new sprint based on team capacity
      await workflowManager.quickCreateTask(6, 'Database Schema Updates', {
        priority: 'urgent',
        estimatedHours: 40,
        assignee: 'backend_dev1'
      });

      await workflowManager.quickCreateTask(6, 'Data Migration Scripts', {
        priority: 'high',
        estimatedHours: 32,
        assignee: 'backend_dev2'
      });

      await workflowManager.quickCreateTask(6, 'Admin Data Interface', {
        priority: 'medium',
        estimatedHours: 80,
        assignee: 'frontend_dev1'
      });

      await workflowManager.quickCreateTask(6, 'Data Backup System', {
        priority: 'medium',
        estimatedHours: 48,
        assignee: 'devops_engineer'
      });

      // Set initial sprint status
      await workflowManager.quickUpdateTaskStatus(7, 'ready', 0);
      await workflowManager.quickUpdateTaskStatus(8, 'ready', 0);
      await workflowManager.quickUpdateTaskStatus(9, 'not_started', 0);
      await workflowManager.quickUpdateTaskStatus(10, 'not_started', 0);

      // Team lead planning activities
      await workflowManager.logWorkSession(6, 4, 'Sprint planning, retrospective, and team capacity assessment');

      // Add planning notes
      await workflowManager.checkInWithTeam(7, 'Priority 1: Critical for data consistency. Coordinate with migration scripts.');
      await workflowManager.checkInWithTeam(8, 'Should run after schema updates. Prepare rollback procedures.');
      await workflowManager.checkInWithTeam(9, 'Can start in parallel with backend work. Mock data initially.');
      await workflowManager.checkInWithTeam(10, 'Lower priority. Can be pushed to next sprint if needed.');

      // Generate sprint transition report
      await workflowManager.generateStatusReport();

      // Verify sprint planning outcome
      await workflowManager.verifyWorkflowOutcome({
        tasksCompleted: 4, // Previous sprint completed
        totalHoursLogged: 152, // Previous sprint actual time + planning time
        teamUpdates: 4, // Planning notes for new tasks
        projectProgress: 100 // Previous sprint complete, new sprint ready
      });
    });

    test('should handle cross-team dependency management', async () => {
      await workflowManager.navigateToProject(TEST_PROJECT_ID);

      // Complex project with dependencies
      await workflowManager.quickCreateTask(null, 'Microservices Migration', {
        priority: 'urgent',
        estimatedHours: 480
      });

      // Infrastructure team tasks
      await workflowManager.quickCreateTask(1, 'Container Orchestration Setup', {
        priority: 'urgent',
        estimatedHours: 80,
        assignee: 'devops_lead'
      });

      await workflowManager.quickCreateTask(1, 'Service Discovery Implementation', {
        priority: 'urgent',
        estimatedHours: 60,
        assignee: 'platform_engineer'
      });

      // Backend team tasks (dependent on infrastructure)
      await workflowManager.quickCreateTask(1, 'User Service Migration', {
        priority: 'high',
        estimatedHours: 120,
        assignee: 'backend_lead'
      });

      await workflowManager.quickCreateTask(1, 'Order Service Migration', {
        priority: 'high',
        estimatedHours: 100,
        assignee: 'backend_dev1'
      });

      // Frontend team tasks (dependent on backend services)
      await workflowManager.quickCreateTask(1, 'Service Integration Layer', {
        priority: 'medium',
        estimatedHours: 80,
        assignee: 'frontend_lead'
      });

      await workflowManager.quickCreateTask(1, 'Client-Side Service Discovery', {
        priority: 'medium',
        estimatedHours: 40,
        assignee: 'frontend_dev1'
      });

      // Set up dependency chain
      await workflowManager.quickUpdateTaskStatus(2, 'in_progress', 40); // Infra started
      await workflowManager.quickUpdateTaskStatus(3, 'in_progress', 60); // Service discovery ahead
      await workflowManager.quickUpdateTaskStatus(4, 'blocked', 0); // Waiting for infra
      await workflowManager.quickUpdateTaskStatus(5, 'blocked', 0); // Waiting for infra
      await workflowManager.quickUpdateTaskStatus(6, 'blocked', 0); // Waiting for backend
      await workflowManager.quickUpdateTaskStatus(7, 'blocked', 0); // Waiting for backend

      // Log current work
      await workflowManager.logWorkSession(2, 32, 'Kubernetes cluster setup and networking configuration');
      await workflowManager.logWorkSession(3, 36, 'Consul service registry and health checks');

      // Team lead coordination activities
      await workflowManager.logWorkSession(1, 6, 'Cross-team coordination meetings and dependency management');

      // Manage dependencies and unblock teams
      await workflowManager.checkInWithTeam(2, 'Infra foundation looking good. ETA for dev environment: end of week.');
      await workflowManager.checkInWithTeam(3, 'Service discovery ready for testing. Great work on health checks!');
      await workflowManager.checkInWithTeam(4, 'Backend team: Infra will be ready soon. Start preparing service interfaces.');
      await workflowManager.checkInWithTeam(5, 'Can begin planning migration strategy. Coordinate with User Service team.');

      // Unblock first backend task as infra becomes ready
      await workflowManager.quickUpdateTaskStatus(4, 'ready', 0);
      await workflowManager.checkInWithTeam(4, 'Infra ready! You can start User Service migration. Platform team standing by for support.');

      // Create coordination task
      await workflowManager.quickCreateTask(1, 'Daily Dependency Standup', {
        priority: 'medium',
        estimatedHours: 20,
        assignee: 'team_lead'
      });

      await workflowManager.quickUpdateTaskStatus(8, 'in_progress', 25);
      await workflowManager.logWorkSession(8, 5, 'Daily cross-team standups and blocker resolution');

      // Verify dependency management outcome
      await workflowManager.verifyWorkflowOutcome({
        tasksCompleted: 0, // Complex migration in progress
        totalHoursLogged: 79, // Cross-team work logged
        teamUpdates: 5, // Coordination updates
        projectProgress: 23 // Early stage but dependencies being resolved
      });
    });
  });

  test.describe('Mixed Role Collaboration Workflows', () => {
    test('should handle end-to-end feature delivery workflow', async ({ browser }) => {
      // Create multiple browser contexts for different users
      const pmContext = await browser.newContext();
      const devContext = await browser.newContext();
      const leadContext = await browser.newContext();

      const pmPage = await pmContext.newPage();
      const devPage = await devContext.newPage();
      const leadPage = await leadContext.newPage();

      const pmWorkflow = new UserWorkflowTestManager(pmPage);
      const devWorkflow = new UserWorkflowTestManager(devPage);
      const leadWorkflow = new UserWorkflowTestManager(leadPage);

      // Phase 1: PM creates feature requirements
      await pmWorkflow.loginAsUser('project_manager');
      await pmWorkflow.navigateToProject(TEST_PROJECT_ID);

      await pmWorkflow.quickCreateTask(null, 'Advanced Search Feature', {
        priority: 'high',
        estimatedHours: 160
      });

      await pmWorkflow.quickCreateTask(1, 'Search Algorithm Implementation', {
        priority: 'urgent',
        estimatedHours: 80
      });

      await pmWorkflow.quickCreateTask(1, 'Search UI Components', {
        priority: 'high',
        estimatedHours: 48
      });

      await pmWorkflow.quickCreateTask(1, 'Search Results Page', {
        priority: 'medium',
        estimatedHours: 32
      });

      await pmWorkflow.checkInWithTeam(1, 'New search feature requirements defined. Need full-text search with filters and faceting.');

      // Phase 2: Team Lead assigns and coordinates
      await leadWorkflow.loginAsUser('team_lead');
      await leadWorkflow.navigateToProject(TEST_PROJECT_ID);

      await leadWorkflow.quickUpdateTaskStatus(2, 'ready', 0);
      await leadWorkflow.quickUpdateTaskStatus(3, 'ready', 0);
      await leadWorkflow.checkInWithTeam(2, 'Assigned to backend team. Research Elasticsearch integration options.');
      await leadWorkflow.checkInWithTeam(3, 'Assigned to frontend team. Design mockups first, then implement.');

      // Phase 3: Developer implements features
      await devWorkflow.loginAsUser('developer');
      await devWorkflow.navigateToProject(TEST_PROJECT_ID);

      // Backend development
      await devWorkflow.quickUpdateTaskStatus(2, 'in_progress', 0);
      await devWorkflow.startWorkingOnTask(2);
      await devWorkflow.page.waitForTimeout(2000); // 4 hours work
      await devWorkflow.finishWorkSession();

      await devWorkflow.quickUpdateTaskStatus(2, 'in_progress', 60);
      await devWorkflow.checkInWithTeam(2, 'Elasticsearch integration complete. Working on query optimization and caching.');

      // Continue backend work
      await devWorkflow.startWorkingOnTask(2);
      await devWorkflow.page.waitForTimeout(1500); // 3 hours more
      await devWorkflow.finishWorkSession();

      await devWorkflow.quickUpdateTaskStatus(2, 'completed', 100);
      await devWorkflow.checkInWithTeam(2, 'Search algorithm complete with faceted search and relevance scoring. Ready for frontend integration.');

      // Frontend development
      await devWorkflow.quickUpdateTaskStatus(3, 'in_progress', 0);
      await devWorkflow.startWorkingOnTask(3);
      await devWorkflow.page.waitForTimeout(1800); // 3.5 hours
      await devWorkflow.finishWorkSession();

      await devWorkflow.quickUpdateTaskStatus(3, 'completed', 100);
      await devWorkflow.checkInWithTeam(3, 'Search UI components complete with auto-complete, filters, and responsive design.');

      // Phase 4: Team coordination for final integration
      await leadWorkflow.quickUpdateTaskStatus(4, 'in_progress', 0);
      await leadWorkflow.logWorkSession(4, 4, 'Search results page integration and end-to-end testing');
      await leadWorkflow.quickUpdateTaskStatus(4, 'completed', 100);

      // Phase 5: PM review and approval
      await pmWorkflow.quickUpdateTaskStatus(1, 'review', 90);
      await pmWorkflow.logWorkSession(1, 2, 'Feature review, user acceptance testing, and documentation review');
      await pmWorkflow.quickUpdateTaskStatus(1, 'completed', 100);
      await pmWorkflow.checkInWithTeam(1, 'Advanced search feature approved! Excellent work team. Ready for production deployment.');

      // Verify end-to-end delivery
      // Note: This would be verified from any of the user contexts
      await pmWorkflow.verifyWorkflowOutcome({
        tasksCompleted: 4, // All feature tasks complete
        totalHoursLogged: 18.5, // Combined team effort
        teamUpdates: 8, // Updates from all team members
        projectProgress: 100 // Feature fully delivered
      });

      // Cleanup
      await pmContext.close();
      await devContext.close();
      await leadContext.close();
    });
  });
});