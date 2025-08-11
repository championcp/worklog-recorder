# Nobody Logger Sprint 1 - Authentication Wireframes and Interaction Patterns

## Overview

This document provides detailed wireframes and interaction patterns for the Nobody Logger authentication system. It includes visual representations of all authentication interfaces, interaction flows, and responsive behavior patterns to guide implementation and ensure consistent user experience.

## Wireframe Conventions

### Visual Legend
```
┌─────────────────┐  Container/Card
│                 │
├─────────────────┤  Section Divider  
│                 │
└─────────────────┘

[Button Text]        Button Element
<Input Field>        Input Element
Link Text            Clickable Link
* Required           Required Field Indicator
⚠ Error Message     Error State
✓ Success           Success State
⟳ Loading...        Loading State
```

### Spacing Notation
- `S` = Small spacing (4px)
- `M` = Medium spacing (8px) 
- `L` = Large spacing (16px)
- `XL` = Extra large spacing (24px)
- `XXL` = Double extra large spacing (32px)

## Page Wireframes

### 1. Login Page Wireframe

#### Desktop Layout (1024px+)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     XXL (32px)                              │
│                                                             │
│               Nobody Logger                                 │
│               (text-3xl, bold)                              │
│                                                             │
│                    XL (24px)                                │
│                                                             │
│               登录您的账户                                    │
│               (text-2xl, semibold)                          │
│                                                             │
│                    S (4px)                                  │
│                                                             │
│            还没有账户？[立即注册]                               │
│            (text-sm, link styled)                           │
│                                                             │
│                   XXL (32px)                                │
│                                                             │
│    ┌─────────────────────────────────────────────────┐     │
│    │                                                 │     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    │         ⚠ Error Message Area                    │     │
│    │         (conditional, red background)           │     │
│    │                                                 │     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    │    邮箱地址 *                                     │     │
│    │    (text-sm, medium)                            │     │
│    │                                                 │     │
│    │       S (4px)                                   │     │
│    │                                                 │     │
│    │    <输入您的邮箱地址>                              │     │
│    │    (full width input)                           │     │
│    │                                                 │     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    │    密码 *                                        │     │
│    │    (text-sm, medium)                            │     │
│    │                                                 │     │
│    │       S (4px)                                   │     │
│    │                                                 │     │
│    │    <输入您的密码>                                 │     │
│    │    (full width password input)                  │     │
│    │                                                 │     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    │         [登录 / 登录中...]                        │     │
│    │         (full width primary button)             │     │
│    │                                                 │     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    │    ├─────── 快速登录 ───────┤                    │     │
│    │    (divider with text)                          │     │
│    │                                                 │     │
│    │              M (8px)                            │     │
│    │                                                 │     │
│    │         使用测试账户登录                           │     │
│    │         (text link, blue)                       │     │
│    │                                                 │     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    └─────────────────────────────────────────────────┘     │
│                                                             │
│                   XXL (32px)                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Mobile Layout (320px - 639px)
```
┌─────────────────────────┐
│        XL (24px)        │
│                         │
│     Nobody Logger       │
│     (text-2xl, bold)    │
│                         │
│        L (16px)         │
│                         │
│      登录您的账户         │
│   (text-xl, semibold)   │
│                         │
│        S (4px)          │
│                         │
│   还没有账户？[立即注册]    │
│   (text-sm, centered)   │
│                         │
│        L (16px)         │
│                         │
│ ┌─────────────────────┐ │
│ │    L (16px)         │ │
│ │                     │ │
│ │  ⚠ Error Message    │ │
│ │  (if present)       │ │
│ │                     │ │
│ │    L (16px)         │ │
│ │                     │ │
│ │ 邮箱地址 *           │ │
│ │                     │ │
│ │   S (4px)           │ │
│ │                     │ │
│ │ <邮箱输入框>         │ │
│ │ (full width)        │ │
│ │                     │ │
│ │    L (16px)         │ │
│ │                     │ │
│ │ 密码 *               │ │
│ │                     │ │
│ │   S (4px)           │ │
│ │                     │ │
│ │ <密码输入框>         │ │
│ │ (full width)        │ │
│ │                     │ │
│ │    L (16px)         │ │
│ │                     │ │
│ │    [登录]           │ │
│ │  (full width)       │ │
│ │                     │ │
│ │    L (16px)         │ │
│ │                     │ │
│ │ ├── 快速登录 ──┤     │ │
│ │                     │ │
│ │    M (8px)          │ │
│ │                     │ │
│ │  使用测试账户登录      │ │
│ │  (centered link)    │ │
│ │                     │ │
│ │    L (16px)         │ │
│ │                     │ │
│ └─────────────────────┘ │
│                         │
│        L (16px)         │
│                         │
└─────────────────────────┘
```

### 2. Registration Page Wireframe

#### Desktop Layout (1024px+)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     XXL (32px)                              │
│                                                             │
│               Nobody Logger                                 │
│               (text-3xl, bold)                              │
│                                                             │
│                    XL (24px)                                │
│                                                             │
│               创建新账户                                      │
│               (text-2xl, semibold)                          │
│                                                             │
│                    S (4px)                                  │
│                                                             │
│            已有账户？[立即登录]                               │
│            (text-sm, link styled)                           │
│                                                             │
│                   XXL (32px)                                │
│                                                             │
│    ┌─────────────────────────────────────────────────┐     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    │         ⚠ Error Message Area                    │     │
│    │         (conditional, red background)           │     │
│    │                                                 │     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    │    用户名 *                                      │     │
│    │    (text-sm, medium)                            │     │
│    │       S (4px)                                   │     │
│    │    <输入用户名>                                   │     │
│    │    (full width input)                           │     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    │    邮箱地址 *                                     │     │
│    │    (text-sm, medium)                            │     │
│    │       S (4px)                                   │     │
│    │    <输入您的邮箱地址>                              │     │
│    │    (full width input)                           │     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    │    密码 *                                        │     │
│    │    (text-sm, medium)                            │     │
│    │       S (4px)                                   │     │
│    │    <输入密码（至少6位）>                           │     │
│    │    (full width password input)                  │     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    │    确认密码 *                                     │     │
│    │    (text-sm, medium)                            │     │
│    │       S (4px)                                   │     │
│    │    <再次输入密码>                                 │     │
│    │    (full width password input)                  │     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    │         [注册 / 注册中...]                        │     │
│    │         (full width primary button)             │     │
│    │                                                 │     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    │    注册即表示您同意我们的服务条款和隐私政策          │     │
│    │    (text-xs, gray, centered)                    │     │
│    │                                                 │     │
│    │              XL (24px)                          │     │
│    │                                                 │     │
│    └─────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Dashboard Authentication Loading State

#### Loading Screen Wireframe
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                                                             │
│                    XXL (32px)                               │
│                                                             │
│                     ⟳ Loading                               │
│                  (spinning circle)                          │
│                  32px diameter                              │
│                                                             │
│                    L (16px)                                 │
│                                                             │
│                    加载中...                                 │
│                 (text-gray-600)                             │
│                                                             │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Interaction Patterns

### 1. Form Field Interaction Pattern

#### Input Field State Progression
```
Default State:
┌─────────────────────────────────────┐
│ Label Text                          │
│ <Placeholder Text>                  │  ← Gray border, white bg
└─────────────────────────────────────┘

Focus State:
┌─────────────────────────────────────┐
│ Label Text                          │
│ <User Input|>                       │  ← Blue border, blue ring
└─────────────────────────────────────┘

Error State:
┌─────────────────────────────────────┐
│ Label Text                          │
│ <Invalid Input>                     │  ← Red border, red bg tint
│ ⚠ Error message explanation         │
└─────────────────────────────────────┘

Success State (for complex validation):
┌─────────────────────────────────────┐
│ Label Text                          │
│ <Valid Input>                       │  ← Green border, subtle indicator
│ ✓ Valid                            │
└─────────────────────────────────────┘
```

### 2. Button Interaction Pattern

#### Primary Button State Progression
```
Default State:
[    登录    ]  ← Blue background, white text, shadow

Hover State:
[    登录    ]  ← Darker blue background, smooth transition

Active State:
[    登录    ]  ← Pressed appearance with inset shadow

Loading State:
[  登录中...  ]  ← Slightly transparent, loading text

Disabled State:
[    登录    ]  ← 50% opacity, not-allowed cursor
```

### 3. Error Message Interaction Pattern

#### Error Display and Recovery Flow
```
Step 1: Error Occurs
┌─────────────────────────────────────┐
│ ⚠ 两次输入的密码不一致                │  ← Error appears
└─────────────────────────────────────┘

Step 2: User Begins Correction
┌─────────────────────────────────────┐
│ ⚠ 两次输入的密码不一致                │  ← Error remains visible
│ <User typing...>                    │  ← User can see error while typing
└─────────────────────────────────────┘

Step 3: Error Resolved
┌─────────────────────────────────────┐
│ <Matching passwords>                │  ← Error automatically clears
└─────────────────────────────────────┘
```

### 4. Page Navigation Interaction Pattern

#### Between Authentication Pages
```
Login Page Navigation:
┌─────────────────────────────────────┐
│         登录您的账户                  │
│   还没有账户？[立即注册]              │  ← Click triggers navigation
└─────────────────────────────────────┘
                    ↓
                Navigation
                    ↓
┌─────────────────────────────────────┐
│         创建新账户                    │
│   已有账户？[立即登录]                │  ← Reverse navigation available
└─────────────────────────────────────┘
```

### 5. Loading State Progression Pattern

#### Form Submission Loading Flow
```
Step 1: User Clicks Submit
[    注册    ]  ← Normal button state

Step 2: Immediate Visual Feedback
[  注册中...  ]  ← Loading state begins immediately

Step 3: Processing State
[  注册中...  ]  ← Button remains in loading state
                   Form fields remain accessible but non-interactive

Step 4A: Success Response
Navigation to Dashboard  ← Automatic redirect on success

Step 4B: Error Response  
[    注册    ]  ← Button returns to normal state
⚠ Error Message  ← Error message appears
```

## Responsive Interaction Patterns

### 1. Touch vs. Mouse Interaction Adaptation

#### Mobile Touch Patterns
- **Touch Targets**: Minimum 44px height for all interactive elements
- **Hover States**: Disabled on touch devices to prevent sticky hover
- **Focus States**: Enhanced focus indicators for keyboard users
- **Gestures**: Standard touch gestures without custom gesture conflicts

#### Desktop Mouse Patterns
- **Hover Feedback**: Immediate visual feedback on mouse over
- **Click Areas**: Precise click boundaries with visual feedback
- **Keyboard Navigation**: Full keyboard accessibility with visible focus
- **Context Menus**: Standard right-click behavior preserved

### 2. Viewport Size Adaptation Patterns

#### Small Screen Adaptation (< 640px)
```
┌─────────────────┐
│  Full Width     │  ← Forms expand to full container width
│  Navigation     │  ← Simplified navigation elements
│                 │
│  ┌───────────┐  │
│  │  Stacked  │  │  ← Vertical layout for all elements
│  │  Elements │  │
│  └───────────┘  │
│                 │
│  Single Column  │  ← No multi-column layouts
└─────────────────┘
```

#### Large Screen Adaptation (> 1024px)
```
┌─────────────────────────────────────────┐
│        Centered Layout                  │
│                                         │
│      ┌─────────────────┐               │  ← Constrained width
│      │   Form Content  │               │  ← Centered alignment
│      │                 │               │
│      │  Enhanced       │               │  ← Enhanced spacing
│      │  Spacing        │               │
│      └─────────────────┘               │
│                                         │
│        Additional Whitespace           │
└─────────────────────────────────────────┘
```

## Advanced Interaction Patterns

### 1. Real-time Validation Pattern

#### Progressive Validation Flow
```
Field Entry Progress:
Empty Field → Typing → Validation → Feedback

Username Field Example:
<empty> → "u" → "us" → "user" → "user@" → ⚠ "Invalid username format"
                                       ↓
<corrections> → "username" → ✓ "Valid username"
```

### 2. Multi-field Validation Coordination

#### Password Confirmation Pattern
```
Password Field: <password123>
                     ↓
Confirm Field: <password1> → ⚠ "Passwords don't match"
                     ↓
Confirm Field: <password123> → ✓ "Passwords match"
```

### 3. Quick Action Patterns

#### Test Account Quick Fill
```
Before Quick Fill:
Email: <empty>
Password: <empty>

After Quick Fill Click:
Email: <test@nobody-logger.com>  ← Auto-populated
Password: <123456>               ← Auto-populated
[登录] ← Ready for immediate submission
```

## Accessibility Interaction Patterns

### 1. Screen Reader Navigation Pattern

#### Form Navigation Sequence
```
Screen Reader Sequence:
1. "Nobody Logger" - Heading Level 1
2. "登录您的账户" - Heading Level 2  
3. "还没有账户？立即注册" - Link
4. "邮箱地址, required" - Label
5. "输入您的邮箱地址" - Input field
6. "密码, required" - Label
7. "输入您的密码" - Password field
8. "登录" - Button
```

### 2. Keyboard Navigation Pattern

#### Tab Order Flow
```
Tab Sequence:
Tab 1: Email Input Field
Tab 2: Password Input Field  
Tab 3: Login Button
Tab 4: Register Link
Tab 5: Quick Login Link (if present)

Shift+Tab: Reverse order navigation
Enter: Submit form (when on button or last field)
```

### 3. Error Announcement Pattern

#### Screen Reader Error Feedback
```
Error Occurs → ARIA Live Region Updates → Screen Reader Announces:
"Error: 两次输入的密码不一致"

User Corrects → Live Region Clears → Screen Reader Announces:
"Error cleared"
```

This comprehensive wireframe and interaction pattern documentation ensures consistent implementation of the Nobody Logger authentication system with proper consideration for all user interaction scenarios, device types, and accessibility requirements.