# WBS Interface Design Guidelines & Visual Standards
*Comprehensive Visual Design Standards for Task Management Interface*

## Overview

This document establishes the visual design standards and interface guidelines for the WBS Task Management system. It defines the visual language, layout principles, iconography, and design standards that ensure consistency, usability, and aesthetic coherence across all interface elements.

## Table of Contents

1. [Visual Design Principles](#visual-design-principles)
2. [Layout and Grid Systems](#layout-and-grid-systems)
3. [Typography Guidelines](#typography-guidelines)
4. [Color Usage Standards](#color-usage-standards)
5. [Iconography and Visual Elements](#iconography-and-visual-elements)
6. [Interface Layouts](#interface-layouts)
7. [Visual Hierarchy](#visual-hierarchy)
8. [Brand Integration](#brand-integration)

## Visual Design Principles

### 1. Clarity and Readability

#### Information Hierarchy
The interface prioritizes information based on user task importance and frequency of access:

**Primary Information (Most Prominent):**
- Task names and WBS codes
- Current status and progress
- Primary action buttons

**Secondary Information (Supporting Details):**
- Task descriptions and metadata
- Timestamps and assignments  
- Priority indicators

**Tertiary Information (Contextual):**
- Detailed statistics
- Advanced options
- System messages

#### Visual Clarity Standards
```css
/* Text Readability Requirements */
.primary-text {
  font-size: minimum 14px;
  line-height: minimum 1.4;
  contrast-ratio: minimum 4.5:1;
}

.secondary-text {
  font-size: minimum 12px;
  line-height: minimum 1.3;
  contrast-ratio: minimum 4.5:1;
}

/* Interactive Element Sizing */
.interactive-element {
  min-height: 44px; /* Touch target minimum */
  min-width: 44px;
  padding: minimum 8px;
}
```

### 2. Consistency and Predictability

#### Design System Adherence
All interface elements follow established patterns:

**Consistent Element Behaviors:**
- Hover states appear within 100ms
- Click feedback provides immediate visual response
- Loading states use consistent spinner/skeleton patterns
- Error states use unified color and icon system

**Predictable Interaction Patterns:**
- Primary actions use blue color scheme
- Destructive actions use red color scheme
- Secondary actions use gray color scheme
- Success states use green color scheme

### 3. Efficiency and Performance

#### Visual Performance Standards
```css
/* Animation Performance Guidelines */
.optimized-animation {
  transform: translateX(0); /* Use transform over position */
  transition: transform 200ms ease-out;
  will-change: transform; /* For complex animations only */
}

/* Avoid expensive properties */
.avoid-these {
  /* DON'T animate these properties */
  width: auto; 
  height: auto;
  left: 0;
  top: 0;
  box-shadow: none;
}
```

#### Information Density
Balance between information richness and visual breathing room:

**High Density Areas (Data Tables):**
- 12px line height
- Compressed spacing (8px units)
- Minimal decorative elements

**Medium Density Areas (Card Layouts):**
- 16px line height  
- Standard spacing (16px units)
- Balanced whitespace

**Low Density Areas (Headers, CTAs):**
- 20px+ line height
- Generous spacing (24px+ units)
- Emphasis on whitespace

## Layout and Grid Systems

### 1. Master Grid System

#### 12-Column Grid Foundation
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}

/* Responsive Breakpoints */
@media (max-width: 768px) {
  .container { padding: 0 16px; }
  .grid { gap: 16px; }
}

@media (max-width: 480px) {
  .container { padding: 0 12px; }
  .grid { gap: 12px; }
}
```

#### Layout Regions
```
┌─────────────────────────────────┐
│           Header (72px)         │
├─────────────────────────────────┤
│  Breadcrumb/Navigation (48px)   │
├─────────────────────────────────┤
│                                 │
│         Main Content            │
│      (Variable Height)          │
│                                 │
├─────────────────────────────────┤
│        Footer (48px)            │
└─────────────────────────────────┘
```

### 2. Component Layout Patterns

#### Task Tree Layout Structure
```css
.wbs-container {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
  max-height: 800px;
}

.wbs-header {
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--surface-color);
}

.wbs-content {
  overflow-y: auto;
  padding: 24px;
}
```

#### Modal Layout Standards
```css
.modal-layout {
  width: min(90vw, 600px);
  max-height: 90vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
}

.modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--border-color);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--border-color);
}
```

### 3. Responsive Layout Behavior

#### Breakpoint Strategy
```css
/* Mobile First Approach */
.responsive-container {
  /* Mobile: < 768px */
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 768px) {
  .responsive-container {
    /* Tablet: 768px - 1023px */
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (min-width: 1024px) {
  .responsive-container {
    /* Desktop: >= 1024px */
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}
```

#### Layout Adaptation Patterns
**Mobile Layout Changes:**
- Single column forms
- Stacked navigation elements
- Full-width modal dialogs
- Simplified tree view with less metadata

**Tablet Layout Changes:**
- Two-column forms where appropriate
- Condensed navigation
- Larger touch targets
- Optimized tree spacing

**Desktop Layout Changes:**
- Multi-column layouts
- Hover-based interactions
- Dense information display
- Keyboard navigation support

## Typography Guidelines

### 1. Font Selection and Hierarchy

#### Primary Font Stack
```css
:root {
  --font-primary: 'Inter', 'SF Pro Display', -apple-system, 
                  BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
                  'Helvetica Neue', Arial, sans-serif;
  
  --font-mono: 'JetBrains Mono', 'SF Mono', Monaco, 
               'Cascadia Code', 'Roboto Mono', Consolas, 
               'Courier New', monospace;
}
```

#### Typography Scale Application

**Page Titles (H1)**
```css
.page-title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
  margin: 0 0 24px 0;
}
```

**Section Headers (H2)**
```css
.section-header {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}
```

**Subsection Headers (H3)**
```css
.subsection-header {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}
```

**Body Text**
```css
.body-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}
```

**Caption Text**
```css
.caption-text {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--text-secondary);
  margin: 0;
}
```

### 2. Specialized Typography

#### WBS Code Display
```css
.wbs-code {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  background: var(--surface-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--text-secondary);
}
```

#### Status and Priority Text
```css
.status-text {
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  letter-spacing: 0.3px;
}

.priority-text {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

### 3. Reading Experience Optimization

#### Line Length and Spacing
```css
.readable-content {
  max-width: 65ch; /* Optimal reading width */
  line-height: 1.6; /* Comfortable reading line height */
  margin-bottom: 1em; /* Paragraph spacing */
}

.dense-content {
  max-width: 80ch; /* Data-heavy content */
  line-height: 1.4; /* Compressed for efficiency */
  margin-bottom: 0.5em;
}
```

#### Accessibility Considerations
- Minimum 12px font size for body text
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text (18px+)
- Support for user zoom up to 200% without horizontal scrolling

## Color Usage Standards

### 1. Color Palette Application

#### Primary Brand Colors
```css
:root {
  /* Primary Blue Family */
  --primary-50: #E3F2FD;
  --primary-100: #BBDEFB;
  --primary-200: #90CAF9;
  --primary-300: #64B5F6;
  --primary-400: #42A5F5;
  --primary-500: #2196F3;   /* Primary brand color */
  --primary-600: #1976D2;   /* Primary hover state */
  --primary-700: #1565C0;
  --primary-800: #1565C0;
  --primary-900: #0D47A1;
}
```

#### Status Color System
```css
:root {
  /* Success States */
  --success-light: #E8F5E8;
  --success-main: #4CAF50;
  --success-dark: #388E3C;
  
  /* Warning States */
  --warning-light: #FFF8E1;
  --warning-main: #FF9800;
  --warning-dark: #F57C00;
  
  /* Error States */
  --error-light: #FFEBEE;
  --error-main: #F44336;
  --error-dark: #D32F2F;
  
  /* Information States */
  --info-light: #E3F2FD;
  --info-main: #2196F3;
  --info-dark: #1976D2;
}
```

### 2. Color Usage Rules

#### Background Color Hierarchy
```css
/* Surface Colors */
.surface-primary {
  background: #FFFFFF;
  color: var(--text-primary);
}

.surface-secondary {
  background: #FAFAFA;
  color: var(--text-primary);
}

.surface-tertiary {
  background: #F5F5F5;
  color: var(--text-primary);
}

/* Elevation Colors */
.elevated-surface {
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.floating-surface {
  background: #FFFFFF;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

#### Interactive Element Colors
```css
/* Primary Actions */
.action-primary {
  background: var(--primary-500);
  color: #FFFFFF;
}

.action-primary:hover {
  background: var(--primary-600);
}

.action-primary:active {
  background: var(--primary-700);
}

/* Secondary Actions */
.action-secondary {
  background: transparent;
  color: var(--primary-500);
  border: 1px solid var(--primary-500);
}

.action-secondary:hover {
  background: var(--primary-50);
}

/* Destructive Actions */
.action-destructive {
  background: var(--error-main);
  color: #FFFFFF;
}

.action-destructive:hover {
  background: var(--error-dark);
}
```

### 3. Semantic Color Application

#### Task Status Color Mapping
```css
.status-not-started {
  background: #F5F5F5;
  color: #616161;
  border: 1px solid #E0E0E0;
}

.status-in-progress {
  background: var(--info-light);
  color: var(--info-dark);
  border: 1px solid var(--info-main);
}

.status-completed {
  background: var(--success-light);
  color: var(--success-dark);
  border: 1px solid var(--success-main);
}

.status-paused {
  background: var(--warning-light);
  color: var(--warning-dark);
  border: 1px solid var(--warning-main);
}

.status-cancelled {
  background: var(--error-light);
  color: var(--error-dark);
  border: 1px solid var(--error-main);
}
```

#### Priority Color System
```css
.priority-low {
  color: #4CAF50;
}

.priority-medium {
  color: #FF9800;
}

.priority-high {
  color: #FF5722;
}

.priority-urgent {
  color: #F44336;
  font-weight: 600;
}
```

## Iconography and Visual Elements

### 1. Icon System Standards

#### Icon Specifications
```css
.icon {
  width: 16px;
  height: 16px;
  display: inline-block;
  vertical-align: middle;
  fill: currentColor;
}

.icon-small {
  width: 12px;
  height: 12px;
}

.icon-medium {
  width: 20px;
  height: 20px;
}

.icon-large {
  width: 24px;
  height: 24px;
}
```

#### Core Icon Set
**Navigation Icons:**
- Chevron Right: Tree expansion
- Chevron Down: Tree collapse  
- Arrow Left: Back navigation
- Home: Dashboard/root navigation

**Action Icons:**
- Plus: Create/add actions
- Edit/Pencil: Edit actions
- Trash: Delete actions
- Settings/Gear: Configuration

**Status Icons:**
- Check Circle: Completed status
- Clock: In progress/time-related
- Pause: Paused status
- X Circle: Cancelled/error status

**UI Icons:**
- Search: Search functionality
- Filter: Filtering options
- Sort: Sorting controls
- Info: Information/help

### 2. Visual Element Standards

#### Progress Indicators
```css
.progress-bar {
  height: 6px;
  background: #E0E0E0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, 
    var(--primary-500) 0%, 
    var(--primary-400) 100%);
  border-radius: inherit;
  transition: width 300ms ease-out;
}
```

#### Loading States
```css
.skeleton-loader {
  background: linear-gradient(90deg, 
    #F0F0F0 25%, 
    #E0E0E0 50%, 
    #F0F0F0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### Dividers and Separators
```css
.divider-horizontal {
  height: 1px;
  background: #E0E0E0;
  margin: 16px 0;
}

.divider-vertical {
  width: 1px;
  background: #E0E0E0;
  margin: 0 16px;
}

.section-divider {
  height: 2px;
  background: #F5F5F5;
  margin: 24px 0;
}
```

## Interface Layouts

### 1. Main Application Layout

#### Header Layout
```css
.app-header {
  height: 72px;
  background: #FFFFFF;
  border-bottom: 1px solid #E0E0E0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-600);
}

.header-navigation {
  display: flex;
  gap: 24px;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
}
```

#### Navigation Breadcrumb
```css
.breadcrumb {
  height: 48px;
  background: #FAFAFA;
  border-bottom: 1px solid #E0E0E0;
  
  display: flex;
  align-items: center;
  padding: 0 24px;
  font-size: 14px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
}

.breadcrumb-item:last-child {
  color: var(--text-primary);
  font-weight: 500;
}

.breadcrumb-separator {
  margin: 0 8px;
  color: var(--text-hint);
}
```

### 2. Task Tree Interface Layout

#### Tree Container Layout
```css
.task-tree-container {
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  overflow: hidden;
  
  display: grid;
  grid-template-rows: auto 1fr;
  height: 600px;
}

.tree-header {
  padding: 24px;
  background: #FAFAFA;
  border-bottom: 1px solid #E0E0E0;
  
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tree-content {
  padding: 24px;
  overflow-y: auto;
}
```

#### Task Node Layout
```css
.task-node {
  display: grid;
  grid-template-columns: auto auto 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 6px;
  transition: background-color 150ms ease-out;
}

.task-node:hover {
  background: #FAFAFA;
}

.task-expand-button {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-wbs-code {
  font-family: var(--font-mono);
  font-size: 12px;
  background: #F5F5F5;
  padding: 2px 6px;
  border-radius: 3px;
  min-width: 60px;
  text-align: center;
}

.task-info {
  min-width: 0; /* Allow text truncation */
}

.task-metadata {
  display: flex;
  gap: 16px;
  align-items: center;
}

.task-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.task-node:hover .task-actions {
  opacity: 1;
}
```

### 3. Modal Layout Standards

#### Form Modal Layout
```css
.form-modal {
  width: min(90vw, 600px);
  max-height: 90vh;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
  
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
}

.form-modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #E0E0E0;
}

.form-modal-body {
  padding: 24px;
  overflow-y: auto;
}

.form-modal-footer {
  padding: 16px 24px 24px;
  border-top: 1px solid #E0E0E0;
  
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
```

## Visual Hierarchy

### 1. Information Architecture

#### Primary Content Hierarchy
```
Level 1 (Dominant):
├── Page titles and main headers
├── Primary action buttons
├── Critical status indicators
└── Current selection/focus

Level 2 (Sub-dominant):
├── Section headers
├── Task names in tree
├── Secondary actions
└── Important metadata

Level 3 (Supporting):
├── Body text and descriptions
├── Timestamps and details
├── Tertiary actions
└── System messages

Level 4 (Background):
├── Borders and dividers
├── Background surfaces
├── Placeholder text
└── Disabled states
```

#### Visual Weight Distribution
```css
/* Dominant Elements */
.visual-weight-high {
  font-weight: 600-700;
  font-size: 18px+;
  color: var(--text-primary);
  contrast-ratio: 7:1+;
}

/* Sub-dominant Elements */
.visual-weight-medium {
  font-weight: 500;
  font-size: 14-16px;
  color: var(--text-primary);
  contrast-ratio: 4.5:1+;
}

/* Supporting Elements */
.visual-weight-low {
  font-weight: 400;
  font-size: 12-14px;
  color: var(--text-secondary);
  contrast-ratio: 4.5:1;
}

/* Background Elements */
.visual-weight-minimal {
  font-weight: 400;
  font-size: 11-12px;
  color: var(--text-hint);
  contrast-ratio: 3:1+;
}
```

### 2. Spacing and Rhythm

#### Vertical Rhythm System
```css
.vertical-rhythm {
  --base-line-height: 24px;
  
  /* Spacing multiples of base line height */
  margin-bottom: calc(var(--base-line-height) * 0.5); /* 12px */
  margin-bottom: calc(var(--base-line-height) * 1);   /* 24px */
  margin-bottom: calc(var(--base-line-height) * 1.5); /* 36px */
  margin-bottom: calc(var(--base-line-height) * 2);   /* 48px */
}
```

#### Content Grouping
```css
/* Related Content Groups */
.content-group {
  margin-bottom: 24px;
}

.content-group + .content-group {
  margin-top: 32px; /* Additional space between groups */
}

/* Sub-groups within content */
.content-subgroup {
  margin-bottom: 16px;
}

/* Individual items */
.content-item {
  margin-bottom: 8px;
}
```

## Brand Integration

### 1. Brand Consistency

#### Logo and Brand Elements
```css
.brand-logo {
  height: 32px;
  width: auto;
  display: block;
}

.brand-wordmark {
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 20px;
  color: var(--primary-600);
  letter-spacing: -0.02em;
}

.brand-tagline {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 400;
}
```

#### Brand Color Application
- Primary brand color for primary actions and focus states
- Brand colors in status indicators where appropriate
- Consistent brand presence in headers and navigation
- Subtle brand integration without overwhelming content

### 2. White-label Considerations

#### Customizable Brand Elements
```css
:root {
  /* Customizable brand colors */
  --brand-primary: #1976D2;
  --brand-secondary: #42A5F5;
  --brand-accent: #FF9800;
  
  /* Customizable typography */
  --brand-font-primary: 'Inter', sans-serif;
  --brand-font-secondary: 'JetBrains Mono', monospace;
}

/* Brand-neutral base styles */
.neutral-interface {
  background: #FFFFFF;
  color: #212121;
  border: 1px solid #E0E0E0;
}
```

---

These comprehensive interface design guidelines ensure visual consistency, usability, and brand coherence across all WBS task management interfaces. The guidelines provide specific implementation details while maintaining flexibility for customization and future enhancements.