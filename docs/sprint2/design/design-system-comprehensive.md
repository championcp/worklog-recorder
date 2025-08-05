# WBS Task Management Design System
*Comprehensive Design System Documentation*

## Executive Summary

This document defines the comprehensive design system for the WBS (Work Breakdown Structure) Task Management interface within the Nobody Logger application. The design system establishes visual consistency, interaction patterns, accessibility standards, and implementation guidelines that ensure a cohesive user experience across all task management features.

## Table of Contents

1. [Design Principles](#design-principles)
2. [Visual Foundation](#visual-foundation)
3. [Component Library](#component-library)
4. [Interaction Patterns](#interaction-patterns)
5. [Accessibility Standards](#accessibility-standards)
6. [Responsive Design](#responsive-design)
7. [Implementation Guidelines](#implementation-guidelines)

## Design Principles

### 1. Clarity and Hierarchy
- **Visual Hierarchy**: Clear information architecture using typography, spacing, and color to guide user attention
- **Progressive Disclosure**: Show essential information first, provide details on demand
- **Contextual Information**: Display relevant data based on user's current task and location

### 2. Efficiency and Performance
- **Task-Oriented Design**: Interface optimized for completing WBS management tasks quickly
- **Minimal Cognitive Load**: Reduce mental effort required to understand and use the interface
- **Keyboard Navigation**: Full keyboard accessibility for power users

### 3. Consistency and Predictability
- **Pattern Reuse**: Consistent interaction patterns across similar functions
- **Visual Language**: Unified visual vocabulary throughout the application
- **Behavioral Consistency**: Similar actions produce similar results

### 4. Flexibility and Scalability
- **Adaptive Interface**: Design accommodates different project sizes and complexity levels
- **Responsive Design**: Optimal experience across desktop, tablet, and mobile devices
- **Extensible System**: Design system supports future feature additions

## Visual Foundation

### Typography System

#### Font Hierarchy
```css
/* Primary Font Stack */
font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 
             'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;

/* Monospace Font Stack (for WBS codes) */
font-family: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 
             'Roboto Mono', Consolas, 'Courier New', monospace;
```

#### Typography Scale
| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Page Title | 24px (1.5rem) | 600 | Main page headings |
| Section Title | 20px (1.25rem) | 600 | Major section headers |
| Card Title | 18px (1.125rem) | 600 | Task card headers |
| Body Text | 14px (0.875rem) | 400 | Standard text content |
| Caption | 12px (0.75rem) | 400 | Metadata, timestamps |
| WBS Code | 12px (0.75rem) | 400 | Monospace WBS identifiers |

### Color System

#### Primary Colors
```css
/* Brand Colors */
--primary-blue: #1976D2;
--primary-blue-hover: #1565C0;
--primary-blue-light: #E3F2FD;

/* Success States */
--success-green: #4CAF50;
--success-green-light: #E8F5E8;

/* Warning States */
--warning-orange: #FF9800;
--warning-orange-light: #FFF8E1;

/* Error States */
--error-red: #F44336;
--error-red-light: #FFEBEE;
```

#### Task Status Colors
```css
/* Status Color Mapping */
--status-not-started: #9E9E9E;     /* Gray */
--status-in-progress: #2196F3;     /* Blue */
--status-completed: #4CAF50;       /* Green */
--status-paused: #FF9800;          /* Orange */
--status-cancelled: #F44336;       /* Red */
```

#### Priority Colors
```css
/* Priority Color Mapping */
--priority-low: #81C784;           /* Light Green */
--priority-medium: #FFB74D;        /* Light Orange */
--priority-high: #F06292;          /* Pink */
--priority-urgent: #EF5350;        /* Red */
```

#### Semantic Colors
```css
/* Neutral Grays */
--gray-50: #FAFAFA;
--gray-100: #F5F5F5;
--gray-200: #EEEEEE;
--gray-300: #E0E0E0;
--gray-500: #9E9E9E;
--gray-700: #616161;
--gray-900: #212121;

/* Text Colors */
--text-primary: #212121;
--text-secondary: #757575;
--text-disabled: #BDBDBD;
```

### Spacing System

#### Base Unit: 4px Grid System
```css
/* Spacing Scale */
--space-1: 4px;    /* xs - tight spacing */
--space-2: 8px;    /* sm - compact spacing */
--space-3: 12px;   /* md - standard spacing */
--space-4: 16px;   /* lg - comfortable spacing */
--space-6: 24px;   /* xl - section spacing */
--space-8: 32px;   /* 2xl - major spacing */
```

#### Component Spacing
- **Form Elements**: 12px internal padding, 16px between elements
- **Card Components**: 16px internal padding, 24px between cards
- **Button Groups**: 12px between buttons
- **Tree Indentation**: 24px per level

### Elevation and Shadows

#### Shadow System
```css
/* Shadow Levels */
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);     /* Cards */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);  /* Hover states */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1); /* Modals */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1); /* Overlays */
```

#### Border Radius
```css
/* Radius Scale */
--radius-sm: 4px;    /* Input fields, small buttons */
--radius-md: 8px;    /* Cards, standard buttons */
--radius-lg: 12px;   /* Large cards, containers */
--radius-full: 9999px; /* Pills, badges */
```

## Component Library

### 1. Task Tree Component

#### Structure
- **Expandable Tree**: Hierarchical task display with expand/collapse functionality
- **Task Nodes**: Individual task items with metadata and actions
- **WBS Codes**: Unique identifiers displayed in monospace font

#### Visual Elements
- **Indentation**: 24px per hierarchy level with left border indicator
- **Expansion Icons**: Chevron right/down icons (16px)
- **Status Badges**: Rounded pills with status-specific colors
- **Progress Bars**: 6px height with animated fill and percentage display

#### Interaction States
```css
/* Hover State */
.task-node:hover {
  background-color: var(--gray-50);
  border-color: var(--gray-300);
}

/* Selected State */
.task-node.selected {
  background-color: var(--primary-blue-light);
  border-color: var(--primary-blue);
}

/* Focus State */
.task-node:focus {
  outline: 2px solid var(--primary-blue);
  outline-offset: -2px;
}
```

### 2. Modal Dialog Components

#### Create/Edit Task Forms
- **Modal Container**: 90% max-width, 90% max-height with centered positioning
- **Form Layout**: Single column with logical grouping
- **Input Validation**: Real-time validation with error states
- **Action Buttons**: Primary/secondary button pattern at bottom

#### Modal Specifications
```css
/* Modal Container */
.modal-container {
  max-width: 600px;
  max-height: 90vh;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  background: white;
}

/* Modal Header */
.modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--gray-200);
}

/* Modal Body */
.modal-body {
  padding: 24px;
  overflow-y: auto;
}

/* Modal Footer */
.modal-footer {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--gray-200);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
```

### 3. Button System

#### Button Variants
| Variant | Usage | Visual Treatment |
|---------|-------|------------------|
| Primary | Main actions (Create, Save) | Blue background, white text |
| Secondary | Secondary actions (Cancel, Edit) | Gray border, gray text |
| Danger | Destructive actions (Delete) | Red background, white text |
| Ghost | Tertiary actions (Expand All) | Transparent background, colored text |

#### Button States
```css
/* Primary Button */
.btn-primary {
  background: var(--primary-blue);
  color: white;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all 150ms ease-out;
}

.btn-primary:hover {
  background: var(--primary-blue-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
```

### 4. Form Components

#### Input Fields
- **Standard Input**: 40px height, 12px padding, rounded corners
- **Textarea**: Resizable vertical, 80px minimum height
- **Select Dropdown**: Custom styling with chevron icon
- **Date Picker**: Native date input with consistent styling

#### Form Validation
```css
/* Error State */
.form-input.error {
  border-color: var(--error-red);
  box-shadow: 0 0 0 1px var(--error-red);
}

/* Success State */
.form-input.success {
  border-color: var(--success-green);
  box-shadow: 0 0 0 1px var(--success-green);
}

/* Error Message */
.form-error-message {
  color: var(--error-red);
  font-size: 12px;
  margin-top: 4px;
}
```

### 5. Status and Priority Indicators

#### Status Badges
```css
/* Status Badge Base */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

/* Status Variants */
.status-not-started { background: #F5F5F5; color: #616161; }
.status-in-progress { background: #E3F2FD; color: #1976D2; }
.status-completed { background: #E8F5E8; color: #388E3C; }
.status-paused { background: #FFF8E1; color: #F57C00; }
.status-cancelled { background: #FFEBEE; color: #D32F2F; }
```

#### Progress Indicators
```css
/* Progress Bar Container */
.progress-bar {
  width: 64px;
  height: 6px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

/* Progress Fill */
.progress-fill {
  height: 100%;
  background: var(--primary-blue);
  border-radius: inherit;
  transition: width 300ms ease-out;
}
```

## Interaction Patterns

### 1. Tree Navigation Patterns

#### Expansion/Collapse
- **Single Click**: Toggle expansion state of clicked node
- **Keyboard**: Space bar or Enter key toggles expansion
- **Visual Feedback**: Smooth rotation animation for chevron icons (200ms)

#### Bulk Operations
- **Expand All**: Button expands entire tree structure
- **Collapse All**: Button collapses all nodes to root level
- **Persistent State**: Expansion state maintained during session

### 2. Task Management Workflows

#### Create Task Flow
1. **Trigger**: Click "New Task" or "Add Child Task" button
2. **Modal**: Create task form opens with relevant fields
3. **Validation**: Real-time validation as user types
4. **Submission**: Task created and tree refreshes with new item
5. **Feedback**: Success message and focus on new task

#### Edit Task Flow
1. **Trigger**: Click edit icon on task node
2. **Modal**: Edit form pre-populated with current values
3. **Changes**: User modifies fields with validation feedback
4. **Save**: Updates applied and reflected in tree immediately
5. **Cancel**: No changes applied, modal closes

#### Delete Task Flow
1. **Trigger**: Click delete icon on task node
2. **Confirmation**: Modal dialog confirms destructive action
3. **Execution**: Task removed from tree with animation
4. **Feedback**: Success message displayed

### 3. Form Interaction Patterns

#### Progressive Enhancement
- **Smart Defaults**: Pre-fill fields based on context (parent task, level type)
- **Dynamic Validation**: Real-time feedback without form submission
- **Field Dependencies**: Level type affects available options
- **Auto-completion**: Suggest values based on previous entries

#### Error Handling
- **Inline Validation**: Show errors immediately below affected fields
- **Summary Errors**: Display overall form errors at top of modal
- **Recovery Guidance**: Provide specific instructions for fixing errors

## Accessibility Standards

### 1. Keyboard Navigation

#### Focus Management
```css
/* Focus Indicator */
*:focus {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
}

/* Focus Within Containers */
.task-node:focus-within {
  background-color: var(--primary-blue-light);
}
```

#### Tab Order
1. **Page Header**: Logo, main navigation, user menu
2. **Tree Controls**: Expand/collapse buttons, create task button
3. **Tree Content**: Task nodes in hierarchical order
4. **Task Actions**: Edit, delete, add child buttons per task

### 2. Screen Reader Support

#### Semantic HTML
```html
<!-- Tree Structure -->
<nav role="tree" aria-label="Project task hierarchy">
  <ul role="group">
    <li role="treeitem" aria-expanded="true" aria-level="1">
      <button aria-controls="subtask-list-1">Parent Task</button>
      <ul role="group" id="subtask-list-1">
        <li role="treeitem" aria-level="2">Child Task</li>
      </ul>
    </li>
  </ul>
</nav>

<!-- Status Information -->
<span role="status" aria-live="polite">Task status updated to In Progress</span>
```

#### ARIA Labels
- **Tree Items**: `aria-label` describes task name and key metadata
- **Progress Bars**: `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- **Status Changes**: `aria-live="polite"` for non-disruptive updates
- **Form Errors**: `aria-describedby` links fields to error messages

### 3. Color and Contrast

#### Contrast Ratios
- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **Interactive Elements**: Minimum 3:1 contrast for UI components

#### Color Independence
- **Status Indicators**: Icons accompany color coding
- **Priority Levels**: Text labels supplement color indicators
- **Form Validation**: Icons and text reinforce color-based feedback

## Responsive Design

### 1. Breakpoint Strategy

#### Device Categories
```css
/* Mobile First Approach */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large Desktop */ }
```

#### Layout Adaptations
- **Mobile (< 768px)**: Single column, stacked forms, simplified tree view
- **Tablet (768px - 1023px)**: Two-column forms, expanded tree metadata
- **Desktop (≥ 1024px)**: Full feature set, side-by-side layouts

### 2. Component Responsive Behavior

#### Task Tree Component
```css
/* Mobile: Simplified view */
@media (max-width: 767px) {
  .task-metadata { display: none; }
  .task-actions { opacity: 1; } /* Always visible */
  .task-node { padding: 12px 8px; }
}

/* Desktop: Full information */
@media (min-width: 1024px) {
  .task-metadata { display: flex; }
  .task-actions { opacity: 0; } /* Visible on hover */
  .task-node { padding: 12px 16px; }
}
```

#### Modal Dialogs
```css
/* Mobile: Full screen modals */
@media (max-width: 767px) {
  .modal-container {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    margin: 0;
  }
}

/* Desktop: Centered modals */
@media (min-width: 768px) {
  .modal-container {
    max-width: 600px;
    border-radius: var(--radius-lg);
    margin: auto;
  }
}
```

## Implementation Guidelines

### 1. CSS Architecture

#### Naming Convention (BEM)
```css
/* Block */
.task-tree { }

/* Element */
.task-tree__node { }
.task-tree__actions { }

/* Modifier */
.task-tree__node--selected { }
.task-tree__node--expanded { }
```

#### CSS Custom Properties
```css
/* Component-scoped variables */
.task-tree {
  --node-padding: 12px;
  --indent-size: 24px;
  --border-color: var(--gray-200);
}
```

### 2. Component Development Standards

#### React Component Structure
```typescript
interface TaskTreeProps {
  projectId: number;
  onTaskSelect?: (task: WBSTask) => void;
  onBack?: () => void;
  projectName?: string;
}

const TaskTree: React.FC<TaskTreeProps> = ({
  projectId,
  onTaskSelect,
  onBack,
  projectName
}) => {
  // Component logic
};
```

#### State Management
- **Local State**: UI state (expanded nodes, form data)
- **Server State**: Task data managed via React Query or SWR
- **Global State**: User preferences, theme settings

### 3. Testing Requirements

#### Visual Regression Tests
- Screenshot comparisons for major components
- Cross-browser consistency verification
- Responsive design validation

#### Accessibility Testing
- Keyboard navigation completeness
- Screen reader compatibility
- Color contrast verification
- Focus management validation

#### Interaction Testing
- Form submission workflows
- Tree navigation behaviors
- Modal dialog interactions
- Error state handling

## Design Tokens Implementation

### 1. Token Structure
```json
{
  "color": {
    "primary": {
      "50": "#E3F2FD",
      "500": "#1976D2",
      "700": "#1565C0"
    },
    "status": {
      "not-started": "#9E9E9E",
      "in-progress": "#2196F3",
      "completed": "#4CAF50"
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "12px",
    "lg": "16px"
  },
  "typography": {
    "font-size": {
      "sm": "12px",
      "base": "14px",
      "lg": "18px"
    }
  }
}
```

### 2. Token Generation
- **Build Process**: Generate CSS custom properties from design tokens
- **Documentation**: Auto-generate design token documentation
- **Validation**: Ensure token usage consistency across components

## Future Enhancements

### 1. Advanced Features
- **Drag and Drop**: Reorder tasks within tree structure
- **Bulk Operations**: Multi-select and batch actions
- **Advanced Filtering**: Complex filter combinations
- **Custom Views**: User-configurable tree presentations

### 2. Design System Evolution
- **Component Variants**: Additional button sizes and styles
- **Theme System**: Support for custom brand themes
- **Animation Library**: Standardized micro-interactions
- **Icon System**: Comprehensive icon library

### 3. Accessibility Improvements
- **High Contrast Mode**: Enhanced visibility options
- **Reduced Motion**: Respect user motion preferences
- **Voice Navigation**: Speech recognition support
- **Magnification**: Support for zoom levels up to 400%

---

This comprehensive design system provides the foundation for consistent, accessible, and maintainable WBS task management interfaces. Regular reviews and updates ensure the system evolves with user needs and technology advances.