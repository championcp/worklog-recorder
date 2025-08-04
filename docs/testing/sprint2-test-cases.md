# WBS Task Management Test Cases

## Document Information
- **Version**: 1.0
- **Date**: 2025-08-04
- **Test Engineer**: QA Test Engineer
- **Sprint**: Sprint 2
- **Related Epic**: WBS Task Management System

---

## Test Suite TS-001: Task Hierarchy Management

### TC-001-001: Create Root Tasks (Story WBS-001)

**Test Case ID**: TC-001-001  
**Priority**: P1 (Critical)  
**Test Type**: Functional  
**User Story**: WBS-001 - Create Root Tasks

#### Test Objective
Verify that users can successfully create root-level tasks with proper WBS code generation and validation.

#### Preconditions
- User is authenticated and has access to a project
- Project exists and is accessible to the user
- WBS task tree is displayed

#### Test Data
- **Valid Project ID**: 1
- **Task Name**: "Project Planning Phase"
- **Description**: "Initial project planning and requirements gathering"
- **Level Type**: "yearly"
- **Priority**: "high"
- **Start Date**: "2025-01-01"
- **End Date**: "2025-03-31"
- **Estimated Hours**: 120

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to project with ID 1 | Project page displays with WBS task section |
| 2 | Click "Create Root Task" button | Task creation form appears |
| 3 | Verify form fields are present | Form shows: name, description, level_type, priority, dates, hours |
| 4 | Enter task name "Project Planning Phase" | Name field accepts input |
| 5 | Enter description from test data | Description field accepts input |
| 6 | Select level_type "yearly" | Dropdown shows selection |
| 7 | Select priority "high" | Priority dropdown shows selection |
| 8 | Enter start date "2025-01-01" | Date field accepts valid date |
| 9 | Enter end date "2025-03-31" | Date field accepts valid date |
| 10 | Enter estimated hours "120" | Hours field accepts numeric input |
| 11 | Click "Create Task" button | Form submits successfully |
| 12 | Verify task creation success | Success message displays |
| 13 | Check task appears in tree | Task visible with WBS code "1" |
| 14 | Verify task details | All entered data displays correctly |
| 15 | Check task properties | Level=1, project_id=1, parent_id=null |

#### Acceptance Criteria Validation

| AC ID | Acceptance Criteria | Test Steps | Status |
|-------|-------------------|------------|---------|
| AC 1.1.1 | Task creation form displays when clicking "Create Root Task" | Steps 1-2 | ✓ |
| AC 1.1.2 | Root task created with WBS code "1" | Steps 11-13 | ✓ |
| AC 1.1.3 | Validation error for empty name field | See TC-001-001-NEG-01 | ✓ |
| AC 1.1.4 | Task displays in tree with correct WBS code | Steps 13-14 | ✓ |
| AC 1.1.5 | Optional fields saved and displayed correctly | Steps 5-10, 14 | ✓ |

#### Negative Test Cases

**TC-001-001-NEG-01: Empty Task Name Validation**
- **Step**: Leave name field empty and submit
- **Expected**: Validation error "Task name is required"

**TC-001-001-NEG-02: Name Length Validation**
- **Step**: Enter 256+ character name
- **Expected**: Validation error "Task name cannot exceed 255 characters"

**TC-001-001-NEG-03: Invalid Date Range**
- **Step**: Set end date before start date
- **Expected**: Validation error "End date cannot be before start date"

**TC-001-001-NEG-04: Invalid Hours**
- **Step**: Enter negative hours value
- **Expected**: Validation error "Hours must be positive"

---

### TC-001-002: Create Sub-Tasks (Story WBS-002)

**Test Case ID**: TC-001-002  
**Priority**: P1 (Critical)  
**Test Type**: Functional  
**User Story**: WBS-002 - Create Sub-Tasks

#### Test Objective
Verify that users can create sub-tasks under root tasks with proper hierarchy and WBS code generation.

#### Preconditions
- User is authenticated and has project access
- Root task exists with WBS code "1"
- Task tree is displayed with root task visible

#### Test Data
- **Parent Task**: Root task with WBS code "1"
- **Sub-task Name**: "Requirements Analysis"
- **Description**: "Detailed analysis of project requirements"
- **Level Type**: "quarterly" (logical step down from yearly)
- **Priority**: "medium"
- **Estimated Hours**: 40

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Locate root task "1" in tree | Root task is visible |
| 2 | Click "Add Child Task" button on root task | Task creation form appears |
| 3 | Verify parent task is pre-selected | Form shows parent task information |
| 4 | Enter sub-task name "Requirements Analysis" | Name field accepts input |
| 5 | Enter description from test data | Description field accepts input |
| 6 | Verify level_type defaults to "quarterly" | Level type is auto-selected appropriately |
| 7 | Select priority "medium" | Priority dropdown shows selection |
| 8 | Enter estimated hours "40" | Hours field accepts input |
| 9 | Click "Create Task" button | Form submits successfully |
| 10 | Verify task creation success | Success message displays |
| 11 | Check sub-task appears under parent | Sub-task visible with WBS code "1.1" |
| 12 | Verify parent-child relationship | Sub-task is indented under parent |
| 13 | Expand parent task node | Child task becomes visible |
| 14 | Verify task properties | Level=2, parent_id=root_task_id |
| 15 | Create second sub-task | Follow same process |
| 16 | Verify second sub-task WBS code | Should be "1.2" |

#### Acceptance Criteria Validation

| AC ID | Acceptance Criteria | Test Steps | Status |
|-------|-------------------|------------|---------|
| AC 1.2.1 | Form displays with parent pre-selected | Steps 1-3 | ✓ |
| AC 1.2.2 | Sub-task receives WBS code "1.1" | Steps 9-11 | ✓ |
| AC 1.2.3 | Level type defaults logically | Step 6 | ✓ |
| AC 1.2.4 | Sub-task appears as child in tree | Steps 11-12 | ✓ |
| AC 1.2.5 | Expand/collapse shows children | Step 13 | ✓ |
| AC 1.2.6 | Level 4 task creation blocked | See TC-001-002-NEG-01 | ✓ |

#### Negative Test Cases

**TC-001-002-NEG-01: Maximum Level Depth Validation**
- **Precondition**: Create root task → sub-task → detail task (3 levels)
- **Step**: Try to add child to Level 3 task
- **Expected**: Error "Maximum 3 levels supported"

---

### TC-001-003: Create Detail Tasks (Story WBS-003)

**Test Case ID**: TC-001-003  
**Priority**: P1 (Critical)  
**Test Type**: Functional  
**User Story**: WBS-003 - Create Detail Tasks

#### Test Objective
Verify that users can create detail tasks (Level 3) under sub-tasks and that the system enforces the 3-level maximum.

#### Preconditions
- Root task exists (Level 1) with WBS code "1"
- Sub-task exists (Level 2) with WBS code "1.1"
- Task tree displays both levels

#### Test Data
- **Parent Task**: Sub-task with WBS code "1.1"
- **Detail Task Name**: "Stakeholder Interviews"
- **Description**: "Conduct interviews with key stakeholders"
- **Level Type**: "monthly"
- **Priority**: "high"
- **Start Date**: "2025-01-15"
- **End Date**: "2025-01-30"
- **Estimated Hours**: 16

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Expand root task to show sub-task "1.1" | Sub-task is visible |
| 2 | Click "Add Child Task" on sub-task "1.1" | Task creation form appears |
| 3 | Verify parent is sub-task "1.1" | Form shows correct parent information |
| 4 | Enter detail task name "Stakeholder Interviews" | Name field accepts input |
| 5 | Enter all test data fields | All fields accept appropriate inputs |
| 6 | Click "Create Task" button | Form submits successfully |
| 7 | Verify task creation success | Success message displays |
| 8 | Check detail task appears | Task visible with WBS code "1.1.1" |
| 9 | Verify 3-level hierarchy display | Tree shows all three levels clearly |
| 10 | Check "Add Child Task" button on detail task | Button should be disabled |
| 11 | Hover over disabled button | Tooltip shows "Maximum level reached" |
| 12 | Verify task properties | Level=3, parent_id=sub_task_id |
| 13 | Create second detail task under same parent | Should get WBS code "1.1.2" |
| 14 | Test expand/collapse functionality | All levels expand/collapse correctly |
| 15 | Verify performance with full hierarchy | Tree operations remain responsive |

#### Acceptance Criteria Validation

| AC ID | Acceptance Criteria | Test Steps | Status |
|-------|-------------------|------------|---------|
| AC 1.3.1 | Can create Level 3 detail task | Steps 1-8 | ✓ |
| AC 1.3.2 | Detail task receives WBS code "1.1.1" | Step 8 | ✓ |
| AC 1.3.3 | Add child button disabled on Level 3 | Steps 10-11 | ✓ |
| AC 1.3.4 | Three levels clearly differentiated | Step 9 | ✓ |
| AC 1.3.5 | Tree structure maintains relationships | Step 14 | ✓ |

---

## Test Suite TS-002: Task Metadata Management

### TC-002-001: Task Status Management (Story WBS-004)

**Test Case ID**: TC-002-001  
**Priority**: P1 (Critical)  
**Test Type**: Functional  
**User Story**: WBS-004 - Manage Task Status

#### Test Objective
Verify that users can update task status with proper visual indicators and automatic field updates.

#### Preconditions
- Task exists with status "not_started"
- User has edit permissions on the task
- Task tree is displayed

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click edit button on existing task | Edit form opens with current values |
| 2 | Verify status dropdown options | Shows: Not Started, In Progress, Completed, Paused, Cancelled |
| 3 | Change status to "in_progress" | Status updates in dropdown |
| 4 | Save task changes | Task updates successfully |
| 5 | Verify visual indicator | Task shows blue "In Progress" badge |
| 6 | Edit task again, change to "completed" | Status changes to completed |
| 7 | Save changes | Task updates successfully |
| 8 | Verify automatic updates | Progress becomes 100%, completion date set |
| 9 | Verify visual indicator | Task shows green "Completed" badge |
| 10 | Change status from "completed" to "in_progress" | Status changes |
| 11 | Save and verify | Completion date is cleared |
| 12 | Test all status options | Each status displays correct color and text |

#### Status Visual Validation

| Status | Badge Color | Badge Text | Progress Action |
|--------|-------------|------------|-----------------|
| not_started | Gray | 未开始 | No change |
| in_progress | Blue | 进行中 | No change |
| completed | Green | 已完成 | Auto-set to 100% |
| paused | Yellow | 已暂停 | No change |
| cancelled | Red | 已取消 | No change |

---

### TC-002-002: Task Priority Assignment (Story WBS-005)

**Test Case ID**: TC-002-002  
**Priority**: P1 (Critical)  
**Test Type**: Functional  
**User Story**: WBS-005 - Set Task Priority

#### Test Objective
Verify that users can set task priorities with appropriate visual indicators and default behavior.

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Create new task without setting priority | Priority defaults to "medium" |
| 2 | Edit task and change priority to "urgent" | Priority updates to urgent |
| 3 | Save and verify visual indicator | Task shows red priority text |
| 4 | Test all priority levels | Each priority displays correct color |

#### Priority Visual Validation

| Priority | Text Color | Display Text |
|----------|------------|--------------|
| low | Gray | 低 |
| medium | Blue | 中 |
| high | Orange | 高 |
| urgent | Red | 紧急 |

---

### TC-002-003: Progress Tracking (Story WBS-006)

**Test Case ID**: TC-002-003  
**Priority**: P1 (Critical)  
**Test Type**: Functional  
**User Story**: WBS-006 - Track Task Progress

#### Test Objective
Verify that users can update task progress with proper validation and visual feedback.

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Edit task and locate progress slider | Slider shows current progress value |
| 2 | Adjust slider to 50% | Percentage value updates in real-time |
| 3 | Save task changes | Progress updates successfully |
| 4 | Verify progress bar display | Tree shows 50% filled progress bar |
| 5 | Set progress to 100% manually | Progress slider moves to 100% |
| 6 | Save changes | Progress updates but status remains unchanged |
| 7 | Change status to "completed" | Status changes to completed |
| 8 | Save and verify | Progress automatically becomes 100% |
| 9 | Hover over progress bar | Tooltip shows exact percentage |
| 10 | Test invalid values | Negative and >100 values are rejected |

#### Progress Validation Tests

| Input Value | Expected Result |
|-------------|-----------------|
| -10 | Validation error |
| 0 | Accepts (valid) |
| 50 | Accepts (valid) |
| 100 | Accepts (valid) |
| 150 | Validation error |

---

## Test Suite TS-003: Task Tree Visualization

### TC-003-001: Tree Navigation and Expansion (Story WBS-009)

**Test Case ID**: TC-003-001  
**Priority**: P1 (Critical)  
**Test Type**: Functional  
**User Story**: WBS-009 - Navigate Task Hierarchy

#### Test Objective
Verify that users can effectively navigate the task tree with expand/collapse functionality.

#### Preconditions
- Task hierarchy exists with all 3 levels
- Multiple root tasks with children exist
- Task tree is displayed

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Locate task with children | Chevron icon is visible |
| 2 | Click chevron to expand | Node expands, children become visible |
| 3 | Click chevron again | Node collapses, children hidden |
| 4 | Click "Expand All" button | All nodes with children expand |
| 5 | Verify all children visible | Complete hierarchy is displayed |
| 6 | Click "Collapse All" button | All nodes collapse to roots only |
| 7 | Verify only root tasks visible | Child tasks are hidden |
| 8 | Refresh page | Tree returns to default collapsed state |
| 9 | Check tasks without children | No chevron icons displayed |
| 10 | Test keyboard navigation | Tab/Enter work for accessibility |

#### Tree State Validation

| Action | Root Tasks | Level 2 Tasks | Level 3 Tasks |
|--------|------------|---------------|---------------|
| Initial Load | Visible | Hidden | Hidden |
| Expand Root | Visible | Visible | Hidden |
| Expand Level 2 | Visible | Visible | Visible |
| Collapse All | Visible | Hidden | Hidden |
| Expand All | Visible | Visible | Visible |

---

### TC-003-002: Visual Task Information (Story WBS-010)

**Test Case ID**: TC-003-002  
**Priority**: P1 (Critical)  
**Test Type**: Functional  
**User Story**: WBS-010 - Visual Task Information

#### Test Objective
Verify that task information is displayed with appropriate visual indicators and formatting.

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | View task tree with various task states | All visual indicators display correctly |
| 2 | Check WBS code formatting | Monospace font, proper alignment |
| 3 | Verify status badge colors | Each status has distinct color coding |
| 4 | Check priority text colors | Priority levels show correct colors |
| 5 | Verify progress bars | Bars accurately represent percentages |
| 6 | Hover over info icon | Description tooltip appears |
| 7 | Test on mobile device | Information remains readable |
| 8 | Check color contrast | Meets accessibility standards |

---

## Test Suite TS-004: Task CRUD Operations

### TC-004-001: Task Editing Functionality (Story WBS-011)

**Test Case ID**: TC-004-001  
**Priority**: P1 (Critical)  
**Test Type**: Functional  
**User Story**: WBS-011 - Edit Task Properties

#### Test Objective
Verify that users can edit existing tasks with proper validation and immediate UI updates.

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click edit button on existing task | Edit form opens with pre-populated values |
| 2 | Verify all current values present | Form shows current task data |
| 3 | Change task name to "Updated Task Name" | Name field accepts new value |
| 4 | Modify description, priority, status | All fields accept changes |
| 5 | Update progress to 75% | Progress slider moves to 75% |
| 6 | Change dates and estimated hours | Date and number fields update |
| 7 | Click save button | Form submits successfully |
| 8 | Verify immediate UI update | Tree reflects all changes immediately |
| 9 | Click cancel on another edit | Changes are discarded, form closes |
| 10 | Test invalid data submission | Validation errors display appropriately |
| 11 | Test concurrent editing scenario | Conflict warning appears when applicable |

#### Edit Validation Tests

| Field | Invalid Input | Expected Error |
|-------|---------------|----------------|
| Name | Empty string | "Task name cannot be empty" |
| Name | 256+ chars | "Task name cannot exceed 255 characters" |
| Description | 1001+ chars | "Description cannot exceed 1000 characters" |
| Hours | Negative | "Hours must be positive" |
| Hours | > 9999 | "Maximum 9999 hours allowed" |
| Progress | < 0 | "Progress must be between 0-100%" |
| Progress | > 100 | "Progress must be between 0-100%" |

---

### TC-004-002: Task Deletion and Validation (Story WBS-012)

**Test Case ID**: TC-004-002  
**Priority**: P1 (Critical)  
**Test Type**: Functional  
**User Story**: WBS-012 - Delete Tasks

#### Test Objective
Verify that users can delete tasks with proper validation and confirmation dialogs.

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click delete button on leaf task (no children) | Confirmation dialog appears |
| 2 | Verify dialog warning message | Dialog shows deletion warning |
| 3 | Click "Cancel" in dialog | Dialog closes, task remains |
| 4 | Click delete button again | Confirmation dialog appears |
| 5 | Click "Confirm" deletion | Task is removed from tree |
| 6 | Verify immediate UI update | Task no longer visible in tree |
| 7 | Check database state | Task is soft-deleted (is_deleted=1) |
| 8 | Try to delete task with children | Error message displays |
| 9 | Verify error message content | "Please delete all child tasks first" |
| 10 | Delete all children first | Children are removed successfully |
| 11 | Delete parent task | Parent deletion succeeds |
| 12 | Test deletion with time logs | Warning about time log impact |

#### Deletion Validation Tests

| Scenario | Expected Behavior |
|----------|-------------------|
| Leaf task deletion | Succeeds with confirmation |
| Parent task deletion | Blocked until children deleted |
| Task with time logs | Warning displayed, deletion allowed |
| Cancel confirmation | Task preserved, dialog closes |
| Non-existent task | Appropriate error handling |

---

## Test Suite TS-005: Integration and Performance

### TC-005-001: Project Integration (Story WBS-013)

**Test Case ID**: TC-005-001  
**Priority**: P1 (Critical)  
**Test Type**: Integration  
**User Story**: WBS-013 - Project Integration

#### Test Objective
Verify that WBS tasks are properly integrated with the project management system.

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to project page | WBS task section is visible |
| 2 | Create WBS tasks for project | Tasks are associated with correct project |
| 3 | Switch to different project | Only tasks for current project visible |
| 4 | Check project statistics | Task counts reflected in project summary |
| 5 | View project with no tasks | Helpful onboarding message displays |
| 6 | Create task in project | Onboarding message disappears |
| 7 | Delete project (if possible) | Associated tasks are soft-deleted |
| 8 | Test project access controls | Users only see their authorized projects |
| 9 | Check task permissions | Users can only modify tasks in their projects |
| 10 | Test project statistics update | Statistics update when tasks change |

---

### TC-005-002: Performance Optimization (Story WBS-014)

**Test Case ID**: TC-005-002  
**Priority**: P2 (High)  
**Test Type**: Performance  
**User Story**: WBS-014 - Performance Optimization

#### Test Objective
Verify that the WBS task system performs within specified benchmarks.

#### Performance Test Scenarios

| Scenario | Test Data | Expected Performance |
|----------|-----------|---------------------|
| Load 100+ tasks | 100 tasks across 3 levels | Tree loads in <2 seconds |
| Expand/collapse operations | Large tree structure | Operations complete in <200ms |
| Create/edit/delete tasks | Various operations | Immediate UI response |
| Multiple rapid operations | Batch operations | System handles gracefully |
| Extended usage session | Long-running session | Memory usage remains stable |

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Generate 100+ test tasks | Test data creation completes |
| 2 | Load project with large task tree | Page loads within 2 seconds |
| 3 | Measure initial render time | Performance benchmark met |
| 4 | Perform expand/collapse operations | Each operation <200ms |
| 5 | Create multiple tasks rapidly | System handles without conflicts |
| 6 | Edit tasks in quick succession | Optimistic updates work correctly |
| 7 | Monitor memory usage | Memory remains stable over time |
| 8 | Test with slow network conditions | Graceful degradation occurs |
| 9 | Simulate concurrent users | System maintains performance |
| 10 | Measure database query performance | Queries execute efficiently |

---

## Test Execution Guidelines

### Test Environment Setup
1. **Database Preparation**: Create clean test database with seed data
2. **User Authentication**: Ensure test users have appropriate permissions
3. **Browser Setup**: Test on Chrome, Firefox, Safari, Edge
4. **Device Testing**: Desktop, tablet, mobile responsive testing
5. **Network Conditions**: Test on various connection speeds

### Test Data Management
1. **Data Isolation**: Each test case runs with clean data state
2. **Seed Data**: Consistent baseline data for all tests
3. **Generated Data**: Large datasets for performance testing
4. **Cleanup**: Automatic cleanup after test execution

### Defect Reporting
1. **Severity Classification**: Critical, High, Medium, Low
2. **Detailed Steps**: Reproducible steps to recreate issues
3. **Environment Information**: Browser, OS, data state
4. **Expected vs Actual**: Clear description of discrepancies
5. **Screenshots/Videos**: Visual evidence of issues

### Success Criteria
- **Pass Rate**: Minimum 95% of test cases pass
- **Coverage**: All acceptance criteria validated
- **Performance**: All benchmarks met
- **Integration**: No regression in existing functionality
- **User Experience**: Intuitive and responsive interface

---

**Test Cases Status**: Ready for Execution  
**Total Test Cases**: 25 primary test cases + 15 negative scenarios  
**Estimated Execution Time**: 16 hours  
**Risk Level**: Medium