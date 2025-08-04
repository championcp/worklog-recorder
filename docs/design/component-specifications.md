# WBS Component Specifications & Design Patterns
*Detailed Component Library Documentation*

## Overview

This document provides comprehensive specifications for all components used in the WBS Task Management interface. Each component is documented with visual specifications, interaction patterns, accessibility requirements, and implementation guidelines.

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Core Components](#core-components)
3. [Layout Components](#layout-components)
4. [Form Components](#form-components)
5. [Feedback Components](#feedback-components)
6. [Design Patterns](#design-patterns)
7. [Implementation Standards](#implementation-standards)

## Component Architecture

### Design Principles
- **Atomic Design**: Components built from atoms → molecules → organisms
- **Composition over Inheritance**: Flexible component combination
- **Single Responsibility**: Each component has one clear purpose
- **Consistent API**: Predictable props and behavior patterns

### Component Hierarchy
```
Page Level (Templates)
├── WBSTaskTreeComponent (Organism)
│   ├── TaskNode (Molecule)
│   │   ├── TaskMetadata (Molecule)
│   │   ├── StatusBadge (Atom)
│   │   ├── ProgressBar (Atom)
│   │   └── ActionButtons (Molecule)
│   ├── CreateTaskForm (Organism)
│   └── EditTaskForm (Organism)
└── ProjectManager (Organism)
    ├── ProjectCard (Molecule)
    └── CreateProjectForm (Organism)
```

## Core Components

### 1. WBSTaskTreeComponent

#### Purpose
Primary interface for displaying and managing hierarchical task structures with full CRUD operations and tree navigation.

#### Visual Specifications

**Container**
```css
.wbs-task-tree {
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
```

**Header Section**
```css
.wbs-header {
  padding: 24px;
  border-bottom: 1px solid #E0E0E0;
  background: #FAFAFA;
}

.wbs-title {
  font-size: 18px;
  font-weight: 600;
  color: #212121;
  margin: 0 0 16px 0;
}

.wbs-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}
```

**Tree Content Area**
```css
.wbs-content {
  padding: 24px;
  max-height: 600px;
  overflow-y: auto;
}

.wbs-empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #757575;
}
```

#### Component Props
```typescript
interface WBSTaskTreeProps {
  projectId: number;
  onTaskSelect?: (task: WBSTask) => void;
  onBack?: () => void;
  projectName?: string;
  initialExpanded?: number[];
  maxTreeDepth?: number;
}
```

#### Interaction States
- **Loading**: Skeleton loader with animated placeholders
- **Empty**: Illustrated empty state with create task CTA
- **Error**: Error message with retry action
- **Success**: Populated tree with smooth animations

#### Accessibility Features
- **Role**: `tree` with proper ARIA attributes
- **Keyboard Navigation**: Full keyboard support for tree traversal
- **Screen Reader**: Descriptive labels for tree structure
- **Focus Management**: Proper focus trapping and restoration

### 2. TaskNode Component

#### Purpose
Individual task item within the tree structure, displaying metadata, status, and available actions.

#### Visual Specifications

**Base Structure**
```css
.task-node {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 6px;
  transition: all 150ms ease-out;
  margin-bottom: 2px;
  position: relative;
}

.task-node:hover {
  background-color: #F5F5F5;
}

.task-node.selected {
  background-color: #E3F2FD;
  border: 1px solid #1976D2;
}
```

**Hierarchy Indicators**
```css
.task-node[data-depth="1"] {
  margin-left: 24px;
  border-left: 2px solid #E0E0E0;
}

.task-node[data-depth="2"] {
  margin-left: 48px;
  border-left: 2px solid #E0E0E0;
}

.task-node[data-depth="3"] {
  margin-left: 72px;
  border-left: 2px solid #E0E0E0;
}
```

#### Component Structure

**Expand/Collapse Toggle**
```css
.expand-toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
}

.expand-toggle:hover {
  background-color: #F0F0F0;
}

.expand-icon {
  width: 16px;
  height: 16px;
  transition: transform 150ms ease-out;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}
```

**WBS Code Display**
```css
.wbs-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #757575;
  background: #F5F5F5;
  padding: 2px 6px;
  border-radius: 3px;
  margin-right: 12px;
  min-width: 60px;
  text-align: center;
}
```

**Task Information**
```css
.task-info {
  flex: 1;
  min-width: 0;
}

.task-name {
  font-size: 14px;
  font-weight: 500;
  color: #212121;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #757575;
}
```

#### Component Props
```typescript
interface TaskNodeProps {
  task: WBSTaskTree;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onCreateChild: (parentTask: WBSTask) => void;
  onEdit: (task: WBSTask) => void;
  onDelete: (taskId: number) => void;
  onSelect?: (task: WBSTask) => void;
  depth: number;
  maxDepth?: number;
}
```

### 3. StatusBadge Component

#### Purpose
Visual indicator for task status with consistent color coding and accessibility support.

#### Visual Specifications
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  text-transform: capitalize;
  gap: 4px;
}

/* Status Variants */
.status-not-started {
  background: #F5F5F5;
  color: #616161;
}

.status-in-progress {
  background: #E3F2FD;
  color: #1976D2;
}

.status-completed {
  background: #E8F5E8;
  color: #388E3C;
}

.status-paused {
  background: #FFF8E1;
  color: #F57C00;
}

.status-cancelled {
  background: #FFEBEE;
  color: #D32F2F;
}
```

#### Component Props
```typescript
interface StatusBadgeProps {
  status: TaskStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

type TaskStatus = 
  | 'not_started'
  | 'in_progress' 
  | 'completed'
  | 'paused'
  | 'cancelled';
```

#### Accessibility Features
- **Color Independence**: Icons accompany color coding
- **ARIA Label**: Descriptive status information
- **High Contrast**: Support for high contrast mode

### 4. ProgressBar Component

#### Purpose
Visual representation of task completion percentage with smooth animations.

#### Visual Specifications
```css
.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  width: 64px;
  height: 6px;
  background: #E0E0E0;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1976D2 0%, #42A5F5 100%);
  border-radius: inherit;
  transition: width 300ms ease-out;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.progress-text {
  font-size: 12px;
  color: #757575;
  font-weight: 500;
  min-width: 32px;
  text-align: right;
}
```

#### Component Props
```typescript
interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  animated?: boolean;
}
```

#### Accessibility Features
- **ARIA Attributes**: `role="progressbar"`, `aria-valuenow`, `aria-valuemax`
- **Screen Reader**: Percentage value announced
- **Reduced Motion**: Respects `prefers-reduced-motion`

## Layout Components

### 1. ProjectManager Component

#### Purpose
Main project listing and management interface with grid layout and project cards.

#### Visual Specifications
```css
.project-manager {
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #E0E0E0;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 24px;
}

@media (max-width: 768px) {
  .project-grid {
    grid-template-columns: 1fr;
  }
}
```

### 2. ProjectCard Component

#### Purpose
Individual project display card with metadata, status, and actions.

#### Visual Specifications
```css
.project-card {
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  padding: 16px;
  transition: all 200ms ease-out;
  cursor: pointer;
}

.project-card:hover {
  border-color: #BDBDBD;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.project-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.project-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.project-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.project-name {
  font-size: 14px;
  font-weight: 500;
  color: #212121;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.project-card:hover .project-actions {
  opacity: 1;
}
```

## Form Components

### 1. CreateTaskForm Component

#### Purpose
Modal form for creating new tasks with validation and smart defaults.

#### Visual Specifications
```css
.task-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-row.two-columns {
  grid-template-columns: 1fr 1fr;
}

.form-row.three-columns {
  grid-template-columns: 1fr 1fr 1fr;
}

@media (max-width: 768px) {
  .form-row.two-columns,
  .form-row.three-columns {
    grid-template-columns: 1fr;
  }
}
```

#### Form Field Specifications
```css
.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #212121;
}

.form-label.required::after {
  content: ' *';
  color: #F44336;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 150ms ease-out;
}

.form-input:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.form-input.error {
  border-color: #F44336;
}

.form-input.error:focus {
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.1);
}
```

#### Component Props
```typescript
interface CreateTaskFormProps {
  projectId: number;
  parentTask: WBSTask | null;
  onSubmit: (data: CreateWBSTaskInput) => Promise<WBSTask>;
  onCancel: () => void;
  loading?: boolean;
}
```

### 2. FormInput Component

#### Purpose
Reusable input field with validation and consistent styling.

#### Visual Specifications
```css
.input-container {
  position: relative;
  display: flex;
  flex-direction: column;
}

.input-field {
  width: 100%;
  padding: 12px;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  font-size: 14px;
  background: #FFFFFF;
  transition: all 150ms ease-out;
}

.input-field:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.input-field:disabled {
  background: #F5F5F5;
  color: #BDBDBD;
  cursor: not-allowed;
}

.input-error-message {
  font-size: 12px;
  color: #F44336;
  margin-top: 4px;
}

.input-help-text {
  font-size: 12px;
  color: #757575;
  margin-top: 4px;
}
```

#### Component Props
```typescript
interface FormInputProps {
  type?: 'text' | 'email' | 'number' | 'date' | 'textarea';
  label?: string;
  placeholder?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number; // for textarea
}
```

### 3. FormSelect Component

#### Purpose
Custom select dropdown with consistent styling and accessibility.

#### Visual Specifications
```css
.select-container {
  position: relative;
}

.select-trigger {
  width: 100%;
  padding: 12px;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  background: #FFFFFF;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 150ms ease-out;
}

.select-trigger:hover {
  border-color: #BDBDBD;
}

.select-trigger.open {
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 50;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
}

.select-option {
  padding: 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 150ms ease-out;
}

.select-option:hover {
  background-color: #F5F5F5;
}

.select-option.selected {
  background-color: #E3F2FD;
  color: #1976D2;
  font-weight: 500;
}
```

## Feedback Components

### 1. Modal Component

#### Purpose
Base modal component for forms and confirmations with backdrop and focus management.

#### Visual Specifications
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal-container {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalEnter 200ms ease-out;
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #E0E0E0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #212121;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #757575;
  transition: all 150ms ease-out;
}

.modal-close:hover {
  background: #F5F5F5;
  color: #212121;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px 24px;
  border-top: 1px solid #E0E0E0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
```

### 2. LoadingSpinner Component

#### Purpose
Consistent loading indicator with multiple sizes and styles.

#### Visual Specifications
```css
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #E0E0E0;
  border-top: 2px solid #1976D2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner.small {
  width: 16px;
  height: 16px;
  border-width: 1.5px;
}

.spinner.large {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner-with-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #757575;
  font-size: 14px;
}
```

### 3. ErrorMessage Component

#### Purpose
Consistent error display with retry actions and dismissal.

#### Visual Specifications
```css
.error-container {
  padding: 16px;
  background: #FFEBEE;
  border: 1px solid #FFCDD2;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.error-icon {
  width: 20px;
  height: 20px;
  color: #F44336;
  flex-shrink: 0;
  margin-top: 1px;
}

.error-content {
  flex: 1;
}

.error-message {
  font-size: 14px;
  color: #D32F2F;
  margin: 0 0 8px 0;
}

.error-actions {
  display: flex;
  gap: 8px;
}

.error-dismiss {
  background: transparent;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: #F44336;
}

.error-dismiss:hover {
  background: rgba(244, 67, 54, 0.1);
}
```

## Design Patterns

### 1. Data Loading Pattern

#### Implementation
```typescript
const useTaskTree = (projectId: number) => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchTaskTree(projectId)
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, [projectId]);

  return state;
};
```

#### Visual States
- **Loading**: Skeleton placeholders maintain layout
- **Success**: Smooth transition to loaded content
- **Error**: Clear error message with retry option
- **Empty**: Helpful empty state with primary action

### 2. Form Validation Pattern

#### Real-time Validation
```typescript
const useFormValidation = (schema: ValidationSchema) => {
  const [errors, setErrors] = useState({});
  
  const validate = useCallback((field: string, value: any) => {
    const fieldSchema = schema[field];
    const error = fieldSchema ? validateField(value, fieldSchema) : null;
    
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    return !error;
  }, [schema]);

  return { errors, validate };
};
```

#### Error Display
- **Inline Errors**: Show immediately below field
- **Summary Errors**: Display at form level for submission errors
- **Field States**: Visual indication of error state
- **Recovery**: Clear errors on successful validation

### 3. Optimistic Updates Pattern

#### Implementation
```typescript
const useOptimisticUpdate = (mutationFn: Function) => {
  const [optimisticData, setOptimisticData] = useState(null);
  
  const mutate = async (data: any) => {
    // Apply optimistic update
    setOptimisticData(data);
    
    try {
      const result = await mutationFn(data);
      setOptimisticData(null);
      return result;
    } catch (error) {
      // Revert optimistic update
      setOptimisticData(null);
      throw error;
    }
  };

  return { mutate, optimisticData };
};
```

#### User Experience
- **Immediate Feedback**: Show changes instantly
- **Error Recovery**: Revert changes on failure
- **Loading States**: Indicate when sync is happening
- **Conflict Resolution**: Handle concurrent updates

### 4. Tree State Management Pattern

#### Expansion State
```typescript
const useTreeExpansion = (initialExpanded: number[] = []) => {
  const [expanded, setExpanded] = useState(new Set(initialExpanded));
  
  const toggle = useCallback((nodeId: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback((nodeIds: number[]) => {
    setExpanded(new Set(nodeIds));
  }, []);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  return { expanded, toggle, expandAll, collapseAll };
};
```

## Implementation Standards

### 1. TypeScript Interfaces

#### Component Props
```typescript
// Base component props
interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
  children?: React.ReactNode;
}

// Task-related interfaces
interface WBSTask {
  id: number;
  name: string;
  description?: string;
  wbs_code: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress_percentage: number;
  level: number;
  level_type: LevelType;
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
}

interface WBSTaskTree extends WBSTask {
  children?: WBSTaskTree[];
}
```

#### Form Data Types
```typescript
interface CreateWBSTaskInput {
  project_id: number;
  parent_id?: number;
  name: string;
  description?: string;
  level_type: LevelType;
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  priority: TaskPriority;
}

interface UpdateWBSTaskInput {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  status?: TaskStatus;
  progress_percentage?: number;
  priority?: TaskPriority;
}
```

### 2. Testing Patterns

#### Component Testing
```typescript
// Test component rendering
describe('TaskNode', () => {
  it('renders task information correctly', () => {
    const mockTask = createMockTask();
    render(<TaskNode task={mockTask} {...defaultProps} />);
    
    expect(screen.getByText(mockTask.name)).toBeInTheDocument();
    expect(screen.getByText(mockTask.wbs_code)).toBeInTheDocument();
  });

  it('handles expansion toggle', () => {
    const onToggle = jest.fn();
    render(<TaskNode {...defaultProps} onToggleExpanded={onToggle} />);
    
    fireEvent.click(screen.getByRole('button', { name: /expand/i }));
    expect(onToggle).toHaveBeenCalled();
  });
});
```

#### Accessibility Testing
```typescript
describe('Accessibility', () => {
  it('supports keyboard navigation', () => {
    render(<WBSTaskTree {...defaultProps} />);
    
    const treeElement = screen.getByRole('tree');
    expect(treeElement).toBeInTheDocument();
    
    // Test keyboard navigation
    fireEvent.keyDown(treeElement, { key: 'ArrowDown' });
    // Assert focus management
  });

  it('provides proper ARIA labels', () => {
    render(<TaskNode task={mockTask} {...defaultProps} />);
    
    const treeItem = screen.getByRole('treeitem');
    expect(treeItem).toHaveAttribute('aria-level', '1');
    expect(treeItem).toHaveAttribute('aria-expanded', 'false');
  });
});
```

### 3. Performance Optimization

#### Memoization Strategy
```typescript
// Memoize expensive calculations
const TaskNode = React.memo(({ task, ...props }) => {
  const taskMetadata = useMemo(() => 
    calculateTaskMetadata(task), [task]
  );

  const statusColor = useMemo(() => 
    getStatusColor(task.status), [task.status]
  );

  return (
    <div className="task-node">
      {/* Component JSX */}
    </div>
  );
});

// Optimize callback props
const TaskTree = ({ projectId }) => {
  const handleTaskEdit = useCallback((task: WBSTask) => {
    // Edit logic
  }, []);

  const handleTaskDelete = useCallback((taskId: number) => {
    // Delete logic
  }, []);

  return (
    <div>
      {tasks.map(task => (
        <TaskNode
          key={task.id}
          task={task}
          onEdit={handleTaskEdit}
          onDelete={handleTaskDelete}
        />
      ))}
    </div>
  );
};
```

#### Virtual Scrolling (for large trees)
```typescript
const VirtualizedTaskTree = ({ tasks }) => {
  const rowRenderer = ({ index, key, style }) => (
    <div key={key} style={style}>
      <TaskNode task={tasks[index]} />
    </div>
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          rowCount={tasks.length}
          rowHeight={60}
          rowRenderer={rowRenderer}
        />
      )}
    </AutoSizer>
  );
};
```

---

This comprehensive component specification provides detailed guidance for implementing consistent, accessible, and maintainable WBS task management interfaces. Each component is designed to work independently while maintaining visual and behavioral consistency across the entire system.