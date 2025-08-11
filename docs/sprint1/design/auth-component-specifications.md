# Nobody Logger Sprint 1 - Authentication Component Specifications

## Overview

This document provides detailed specifications for all authentication-related UI components implemented in Sprint 1. Each component includes design specifications, interaction patterns, accessibility requirements, and implementation guidelines.

## Form Components

### Authentication Form Container

#### Component: AuthFormContainer
**Purpose**: Provides consistent layout and styling for all authentication forms

**Visual Specifications**:
- **Background**: `bg-white` with `shadow` elevation
- **Border Radius**: `sm:rounded-lg` (8px on larger screens)
- **Padding**: `py-8 px-4 sm:px-10` (responsive padding)
- **Max Width**: `sm:max-w-md` (448px maximum width)
- **Margin**: `sm:mx-auto` (centered alignment)

**Layout Structure**:
```
┌─────────────────────────────────┐
│          Form Container         │
│  ┌───────────────────────────┐  │
│  │         Form Title        │  │
│  │                           │  │
│  │      Form Fields Area     │  │
│  │                           │  │
│  │     Action Buttons        │  │
│  │                           │  │
│  │    Supplementary Links    │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Input Field Component

#### Component: AuthInput
**Purpose**: Standardized input field for authentication forms

**Visual Specifications**:
- **Base Styling**: `appearance-none block w-full px-3 py-2`
- **Border**: `border border-gray-300 rounded-md`
- **Typography**: `sm:text-sm`
- **Placeholder**: `placeholder-gray-400`

**State Specifications**:

1. **Default State**:
   - Border: `border-gray-300`
   - Background: `bg-white`
   - Text: `text-gray-900`

2. **Focus State**:
   - Border: `focus:border-blue-500`
   - Ring: `focus:ring-blue-500 focus:ring-2 focus:ring-offset-0`
   - Outline: `focus:outline-none`

3. **Error State**:
   - Border: `border-red-300`
   - Background: `bg-red-50`
   - Ring: `focus:ring-red-500`

**Field Types Implemented**:
- **Email Field**: `type="email"` with `autoComplete="email"`
- **Password Field**: `type="password"` with `autoComplete="current-password"`
- **New Password**: `type="password"` with `autoComplete="new-password"`
- **Text Field**: `type="text"` for username input

**Accessibility Features**:
- Proper `id` and `name` attributes
- Associated `label` elements
- Required field indication with `required` attribute
- ARIA labels for screen readers

### Label Component

#### Component: AuthLabel
**Purpose**: Consistent labeling for form inputs

**Visual Specifications**:
- **Typography**: `text-sm font-medium text-gray-700`
- **Display**: `block` for proper layout
- **Spacing**: Associated with input via `htmlFor` attribute

**Content Guidelines**:
- Clear, descriptive text in Chinese
- Consistent terminology across forms
- Proper association with form controls

### Button Components

#### Component: PrimaryButton
**Purpose**: Main action button for authentication forms

**Visual Specifications**:
- **Layout**: `w-full flex justify-center py-2 px-4`
- **Background**: `bg-blue-600` with `hover:bg-blue-700`
- **Border**: `border border-transparent rounded-md`
- **Shadow**: `shadow-sm`
- **Typography**: `text-sm font-medium text-white`

**Interactive States**:

1. **Default State**:
   - Background: `bg-blue-600`
   - Text: `text-white`
   - Cursor: `cursor-pointer`

2. **Hover State**:
   - Background: `hover:bg-blue-700`
   - Transition: Smooth color transition

3. **Loading State**:
   - Opacity: `disabled:opacity-50`
   - Cursor: `disabled:cursor-not-allowed`
   - Content: Loading text replaces button text

4. **Focus State**:
   - Ring: `focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`
   - Outline: `focus:outline-none`

**Content Patterns**:
- **Login Button**: "登录" (default) / "登录中..." (loading)
- **Register Button**: "注册" (default) / "注册中..." (loading)

#### Component: SecondaryButton
**Purpose**: Secondary actions and utility buttons

**Visual Specifications**:
- **Background**: `bg-gray-100` with `hover:bg-gray-200`
- **Typography**: `text-sm text-gray-700`
- **Border**: `border border-gray-300 rounded-md`

### Error Message Component

#### Component: ErrorMessage
**Purpose**: Display validation and authentication errors

**Visual Specifications**:
- **Background**: `bg-red-50`
- **Border**: `border border-red-200`
- **Typography**: `text-red-700`
- **Padding**: `px-4 py-3`
- **Border Radius**: `rounded`

**Content Guidelines**:
- Clear, actionable error messages in Chinese
- Specific validation feedback
- Non-technical language for user errors

**Error Message Patterns**:
```javascript
// Validation Errors
"两次输入的密码不一致"     // Password mismatch
"密码长度至少为6位"       // Password too short
"请输入有效的邮箱地址"     // Invalid email format

// Authentication Errors  
"邮箱或密码错误"         // Invalid credentials
"账户已被禁用"           // Account disabled
"网络错误，请稍后重试"     // Network error
```

### Navigation Components

#### Component: AuthLink
**Purpose**: Navigation between authentication pages

**Visual Specifications**:
- **Typography**: `font-medium text-blue-600`
- **Hover State**: `hover:text-blue-500`
- **Underline**: Natural link behavior

**Implementation Pattern**:
```tsx
<Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
  立即注册
</Link>
```

### Header Components

#### Component: AuthHeader
**Purpose**: Page header with brand and title information

**Visual Specifications**:
- **Container**: `text-center` alignment
- **Brand Name**: `text-3xl font-bold text-gray-900`
- **Page Title**: `text-2xl font-semibold text-gray-900`
- **Subtitle**: `text-sm text-gray-600`

**Spacing Pattern**:
- Brand to title: `mt-6`
- Title to subtitle: `mt-2`

### Utility Components

#### Component: FormDivider
**Purpose**: Visual separation within forms

**Visual Specifications**:
- **Container**: `relative` positioning
- **Line**: `absolute inset-0 flex items-center`
- **Border**: `w-full border-t border-gray-300`
- **Label**: `relative flex justify-center text-sm`
- **Background**: `px-2 bg-white text-gray-500`

#### Component: QuickLoginSection
**Purpose**: Development utility for easy testing

**Visual Specifications**:
- **Container**: `mt-4 text-center`
- **Button**: `text-sm text-blue-600 hover:text-blue-500`

**Security Note**: Should be removed in production builds

## Layout Components

### Page Layout Component

#### Component: AuthPageLayout
**Purpose**: Consistent page structure for authentication pages

**Visual Specifications**:
- **Background**: `min-h-screen bg-gray-50`
- **Layout**: `flex flex-col justify-center`
- **Padding**: `py-12 sm:px-6 lg:px-8`

### Loading States

#### Component: LoadingSpinner
**Purpose**: Visual feedback during authentication processes

**Visual Specifications**:
- **Container**: `min-h-screen bg-gray-50 flex items-center justify-center`
- **Spinner**: `animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600`
- **Text**: `mt-4 text-gray-600`

## Form Patterns

### Registration Form Pattern
**Fields Required**:
1. Username (text input)
2. Email (email input) 
3. Password (password input)
4. Confirm Password (password input)

**Validation Rules**:
- All fields required
- Email format validation
- Password minimum 6 characters
- Password confirmation match
- Real-time validation feedback

### Login Form Pattern
**Fields Required**:
1. Email (email input)
2. Password (password input)

**Additional Features**:
- Quick login for development
- Remember me functionality (future enhancement)
- Forgot password link (future enhancement)

## Responsive Behavior

### Mobile (< 640px)
- Full-width containers
- Adjusted padding: `px-4`
- Touch-optimized button sizes
- Simplified layout structure

### Tablet (640px - 1023px)
- Centered form containers
- Enhanced spacing
- Preserved mobile interaction patterns

### Desktop (1024px+)
- Maximum width constraints
- Enhanced hover states
- Keyboard navigation optimization

## Implementation Guidelines

### CSS Class Patterns
```css
/* Form Container */
.auth-form-container {
  @apply bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10;
}

/* Input Field */
.auth-input {
  @apply appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}

/* Primary Button */
.auth-button-primary {
  @apply w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Error Message */
.auth-error {
  @apply bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded;
}
```

### State Management Patterns
- React hooks for form state
- Controlled inputs with proper validation
- Loading states with user feedback
- Error handling with clear messages

### Accessibility Implementation
- Semantic HTML structure
- Proper form labeling
- Keyboard navigation support
- Screen reader compatibility
- Focus management

## Quality Assurance

### Testing Requirements
- Cross-browser compatibility testing
- Mobile device functionality testing
- Accessibility compliance testing
- Form validation testing
- Loading state verification

### Performance Considerations
- Minimal re-renders during typing
- Efficient validation algorithms
- Optimized component updates
- Fast loading feedback

This component specification ensures consistent implementation of authentication interfaces with proper accessibility, responsive design, and user experience optimization.