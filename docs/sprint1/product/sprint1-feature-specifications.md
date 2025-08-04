# Nobody Logger - Sprint 1 Feature Specifications

## Document Information

**Product:** Nobody Logger  
**Sprint:** Sprint 1 - User Authentication System  
**Version:** 1.0  
**Date:** August 4, 2025  
**Author:** Product Owner

## Overview

This document provides detailed technical and functional specifications for all authentication features delivered in Sprint 1. It serves as a comprehensive reference for understanding the implementation, behavior, and integration points of the user authentication system.

---

## Feature 1: User Registration System

### Feature ID: FEAT-001
**Priority:** Must Have (P0)  
**Complexity:** High  
**Dependencies:** Database schema, password hashing library

### Functional Specification

#### 1.1 Registration Form Interface

**Component:** `src/app/register/page.tsx`

**Form Fields:**
- **Username Field**
  - Input Type: `text`
  - Validation: 2-20 characters, required
  - Placeholder: "输入用户名"
  - Error States: Invalid length, empty field
  
- **Email Field**
  - Input Type: `email`
  - Validation: RFC 5322 format, required, unique
  - Placeholder: "输入您的邮箱地址"
  - Error States: Invalid format, duplicate email, empty field
  
- **Password Field**
  - Input Type: `password`
  - Validation: Minimum 6 characters, required
  - Placeholder: "输入密码（至少6位）"
  - Error States: Too short, empty field
  
- **Confirm Password Field**
  - Input Type: `password`
  - Validation: Must match password field, required
  - Placeholder: "再次输入密码"
  - Error States: Mismatch, empty field

**Form Behavior:**
- Real-time client-side validation
- Submit button disabled during processing
- Loading state: "注册中..." text and disabled state
- Success: Automatic redirect to dashboard
- Error: Display error message above form, maintain field values

#### 1.2 Registration API Endpoint

**Endpoint:** `POST /api/auth/register`  
**File:** `src/app/api/auth/register/route.ts`

**Request Format:**
```typescript
{
  email: string;      // Valid email format
  password: string;   // Minimum 6 characters  
  username: string;   // 2-20 characters
}
```

**Response Format:**
```typescript
// Success (201 Created)
{
  success: true;
  data: {
    user: {
      id: number;
      email: string;
      username: string;
    };
    token: string;
  };
  message: "注册成功";
  timestamp: string; // ISO format
}

// Error (400 Bad Request)
{
  success: false;
  error: {
    code: string; // VALIDATION_ERROR, INVALID_EMAIL, WEAK_PASSWORD, etc.
    message: string; // User-friendly Chinese message
  };
  timestamp: string;
}
```

**Validation Rules:**
1. **Email Validation:**
   - Format: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Uniqueness: Check against existing users
   - Error Codes: `INVALID_EMAIL`, `DUPLICATE_EMAIL`

2. **Password Validation:**
   - Minimum Length: 6 characters
   - Hashing: bcrypt with 12 salt rounds
   - Error Code: `WEAK_PASSWORD`

3. **Username Validation:**
   - Length: 2-20 characters (inclusive)
   - No character restrictions (Unicode supported)
   - Error Code: `INVALID_USERNAME`

4. **Required Fields:**
   - All fields mandatory
   - Error Code: `VALIDATION_ERROR`

#### 1.3 User Creation Process

**Service:** `AuthService.createUser()` and `AuthService.register()`  
**File:** `src/lib/auth/AuthService.ts`

**Process Flow:**
1. **Input Validation:** Server-side validation of all fields
2. **Duplicate Check:** Verify email uniqueness
3. **Password Hashing:** bcrypt with cost factor 12
4. **Device ID Generation:** Format `device_{timestamp}_{random}`
5. **Database Insertion:** Atomic transaction with error handling
6. **JWT Generation:** Create 7-day token with user claims
7. **Response Formation:** Return user data and authentication token

**Database Fields Populated:**
```sql
INSERT INTO users (
  email,           -- User provided
  password_hash,   -- bcrypt hash
  username,        -- User provided
  device_id,       -- Auto-generated
  created_at,      -- Current timestamp
  updated_at,      -- Current timestamp
  is_active,       -- Default: true
  sync_version     -- Default: 1
)
```

### Technical Implementation

#### 1.4 Error Handling Strategy

**Client-Side Errors:**
- Form validation errors displayed inline
- Network errors show generic retry message
- Loading states prevent double submission
- Error messages cleared on field modification

**Server-Side Errors:**
- Standardized error response format
- Generic security messages for authentication
- Detailed validation messages for format errors
- Error logging for debugging and monitoring

#### 1.5 Security Considerations

**Password Security:**
- bcrypt hashing with cost factor 12
- Passwords never logged or transmitted plaintext
- Salt automatically generated per password
- Hash verification using secure comparison

**Input Sanitization:**
- All inputs validated on server side
- Email normalization (lowercase, trim)
- Username preserved as entered (case-sensitive)
- SQL injection prevention through parameterized queries

**Session Security:**
- JWT token generated immediately on registration
- HTTP-only cookie with secure flags
- Automatic login after successful registration
- 7-day token expiration

---

## Feature 2: User Authentication System

### Feature ID: FEAT-002
**Priority:** Must Have (P0)  
**Complexity:** Medium  
**Dependencies:** Registration system, JWT library

### Functional Specification

#### 2.1 Login Form Interface

**Component:** `src/app/login/page.tsx`

**Form Fields:**
- **Email Field**
  - Input Type: `email`
  - Validation: Required field
  - Placeholder: "输入您的邮箱地址"
  - Auto-complete: `email`
  
- **Password Field**
  - Input Type: `password`
  - Validation: Required field
  - Placeholder: "输入您的密码"
  - Auto-complete: `current-password`

**Form Features:**
- **Test Account Button:** Pre-fills credentials for demo
  - Email: `test@nobody-logger.com`
  - Password: `123456`
- **Registration Link:** Navigation to registration page
- **Remember Me:** Not implemented in Sprint 1
- **Forgot Password:** Not implemented in Sprint 1

**Form Behavior:**
- Submit button disabled during authentication
- Loading state: "登录中..." text
- Success: Redirect to dashboard
- Error: Display error message, clear password field
- Generic error messages for security

#### 2.2 Authentication API Endpoint

**Endpoint:** `POST /api/auth/login`  
**File:** `src/app/api/auth/login/route.ts`

**Request Format:**
```typescript
{
  email: string;    // User's registered email
  password: string; // User's password
}
```

**Response Format:**
```typescript
// Success (200 OK)
{
  success: true;
  data: {
    user: {
      id: number;
      email: string;
      username: string;
    };
    token: string;
  };
  message: "登录成功";
  timestamp: string;
}

// Error (401 Unauthorized)
{
  success: false;
  error: {
    code: "LOGIN_ERROR";
    message: string; // Generic error message
  };
  timestamp: string;
}
```

**Cookie Configuration:**
```typescript
response.cookies.set('auth-token', token, {
  httpOnly: true,                              // XSS protection
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'strict',                          // CSRF protection
  maxAge: 7 * 24 * 60 * 60,                  // 7 days in seconds
  path: '/'                                    // Site-wide access
});
```

#### 2.3 Authentication Process

**Service:** `AuthService.login()`  
**File:** `src/lib/auth/AuthService.ts`

**Process Flow:**
1. **Input Validation:** Verify required fields present
2. **User Lookup:** Find user by email address
3. **Account Status Check:** Verify `is_active = true`
4. **Password Verification:** bcrypt comparison with stored hash
5. **Login Update:** Update `last_login_at` timestamp
6. **JWT Generation:** Create token with user claims
7. **Cookie Setting:** Secure HTTP-only cookie
8. **Response:** Return user data and token

**Security Features:**
- Generic error messages prevent account enumeration
- Account status validation prevents disabled account access
- Last login tracking for audit purposes
- Secure password verification with timing attack protection

### Technical Implementation

#### 2.4 JWT Token Structure

**Token Claims:**
```typescript
{
  userId: number;    // User's primary key
  email: string;     // User's email address
  username: string;  // User's display name
  iat: number;       // Issued at timestamp
  exp: number;       // Expiration timestamp (7 days)
}
```

**Token Configuration:**
- **Algorithm:** HMAC SHA256 (HS256)
- **Secret:** Environment variable `JWT_SECRET`
- **Expiration:** 7 days (`'7d'`)
- **Issuer:** Not specified (default)
- **Audience:** Not specified (default)

#### 2.5 Error Scenarios

**Authentication Failures:**
- **Invalid Email:** User not found in database
- **Invalid Password:** bcrypt comparison fails
- **Inactive Account:** `is_active = false`
- **Network Error:** Database connection issues
- **Server Error:** Unexpected system errors

**Error Response Consistency:**
- All authentication failures return "邮箱或密码错误"
- HTTP status 401 for authentication failures
- HTTP status 400 for validation errors
- Detailed errors logged server-side only

---

## Feature 3: Session Management System

### Feature ID: FEAT-003
**Priority:** Must Have (P0)  
**Complexity:** Medium  
**Dependencies:** JWT library, cookie handling

### Functional Specification

#### 3.1 Session Validation Endpoint

**Endpoint:** `GET /api/auth/me`  
**File:** `src/app/api/auth/me/route.ts`

**Request Requirements:**
- Authentication cookie `auth-token` must be present
- No request body required
- Automatic cookie transmission by browser

**Response Format:**
```typescript
// Success (200 OK)
{
  success: true;
  data: {
    user: {
      id: number;
      email: string;
      username: string;
    }
  };
  message: "认证成功";
  timestamp: string;
}

// Error (401 Unauthorized)
{
  success: false;
  error: {
    code: "NO_TOKEN" | "INVALID_TOKEN" | "AUTH_ERROR";
    message: string;
  };
  timestamp: string;
}
```

#### 3.2 Token Validation Process

**Service:** `AuthService.verifyToken()`  
**File:** `src/lib/auth/AuthService.ts`

**Validation Steps:**
1. **Token Extraction:** Retrieve token from HTTP-only cookie
2. **JWT Verification:** Validate signature and expiration
3. **Payload Extraction:** Extract user claims from token
4. **User Verification:** Confirm user exists and is active
5. **Response Formation:** Return validated user information

**Validation Rules:**
- Token signature must be valid (signed with correct secret)
- Token must not be expired (`exp` claim check)
- User ID from token must exist in database
- User account must be active (`is_active = true`)
- All validation failures result in authentication error

#### 3.3 Client-Side Session Management

**Component:** Dashboard page and protected routes  
**File:** `src/app/dashboard/page.tsx`

**Authentication Check Flow:**
1. **Component Mount:** Trigger authentication verification
2. **API Call:** Request to `/api/auth/me` endpoint
3. **Loading State:** Display loading indicator
4. **Success Handling:** Set user state, render authenticated content
5. **Error Handling:** Redirect to login page
6. **State Management:** Maintain user context throughout session

**Implementation Pattern:**
```typescript
const checkAuth = useCallback(async () => {
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    
    if (data.success) {
      setUser(data.data.user);
    } else {
      router.push('/login');
    }
  } catch (error) {
    console.error('认证检查失败:', error);
    router.push('/login');
  } finally {
    setLoading(false);
  }
}, [router]);
```

### Technical Implementation

#### 3.4 Session Persistence

**Cookie Persistence:**
- Session survives browser restarts
- 7-day maximum duration
- Automatic expiration handling
- Secure transmission in production

**State Management:**
- Client-side user state maintained during session
- Authentication status reflected in UI
- Automatic cleanup on session expiration
- Consistent state across browser tabs

#### 3.5 Session Security

**Security Measures:**
- HTTP-only cookies prevent XSS token access
- Secure flag ensures HTTPS transmission in production
- SameSite strict prevents CSRF attacks
- Token validation includes user account status
- Expired tokens automatically cleaned up

**Cross-Tab Synchronization:**
- Single session shared across browser tabs
- Logout from one tab affects all tabs
- Authentication state synchronized
- Session expiration handled consistently

---

## Feature 4: User Logout System

### Feature ID: FEAT-004
**Priority:** Must Have (P0)  
**Complexity:** Low  
**Dependencies:** Cookie management

### Functional Specification

#### 4.1 Logout API Endpoint

**Endpoint:** `POST /api/auth/logout`  
**File:** `src/app/api/auth/logout/route.ts`

**Request Requirements:**
- No request body required
- Authentication not strictly required (cleanup operation)
- Handles both authenticated and unauthenticated requests

**Response Format:**
```typescript
// Success (200 OK)
{
  success: true;
  message: "登出成功";
  timestamp: string;
}

// Error (500 Internal Server Error) - Rare
{
  success: false;
  error: {
    code: "LOGOUT_ERROR";
    message: "登出失败";
  };
  timestamp: string;
}
```

**Cookie Cleanup:**
```typescript
response.cookies.delete('auth-token');
```

#### 4.2 Logout User Interface

**Component:** Dashboard navigation and logout button  
**File:** `src/app/dashboard/page.tsx`

**Logout Button:**
- **Placement:** Top-right navigation bar
- **Style:** Red background (`bg-red-600 hover:bg-red-700`)
- **Text:** "登出"
- **Behavior:** Immediate logout on click
- **Feedback:** No confirmation dialog (immediate action)

**Logout Process:**
```typescript
const handleLogout = async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  } catch (error) {
    console.error('登出失败:', error);
    // Still redirect to login on error
    router.push('/login');
  }
};
```

### Technical Implementation

#### 4.3 Session Termination

**Server-Side Cleanup:**
- Authentication cookie deleted from browser
- No server-side session store to clean up
- JWT tokens become invalid after cookie removal
- Immediate effect across all browser tabs

**Client-Side Cleanup:**
- User state cleared from React component
- Redirect to login page
- No cached authentication data remains
- Error handling ensures redirect even on API failure

#### 4.4 Multi-Tab Logout

**Behavior:**
- Logout affects all browser tabs immediately
- Other tabs redirect to login when accessed
- No session state remains in any tab
- Consistent logout experience across application

---

## Feature 5: Protected Route Authentication

### Feature ID: FEAT-005
**Priority:** Must Have (P0)  
**Complexity:** Medium  
**Dependencies:** Session management, routing system

### Functional Specification

#### 5.1 Route Protection Implementation

**Protected Routes:**
- `/dashboard` - Main application interface
- `/api/auth/me` - User profile endpoint
- Future application routes (projects, tasks, etc.)

**Public Routes:**
- `/` - Home page (currently redirects to login)
- `/login` - Login page
- `/register` - Registration page
- Static assets and public resources

#### 5.2 Authentication Check Process

**Client-Side Protection:**
```typescript
// Dashboard page authentication check
useEffect(() => {
  checkAuth();
}, [checkAuth]);

const checkAuth = useCallback(async () => {
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();

    if (data.success) {
      setUser(data.data.user);
    } else {
      router.push('/login');
    }
  } catch (error) {
    router.push('/login');
  } finally {
    setLoading(false);
  }
}, [router]);
```

**Loading State Management:**
- Display loading spinner during authentication check
- Prevent content flash for unauthenticated users
- Graceful error handling with redirect
- User feedback during authentication process

#### 5.3 API Route Protection

**Protected API Endpoints:**
```typescript
// /api/auth/me route protection
export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: '未找到认证token'
      }
    }, { status: 401 });
  }
  
  const user = authService.verifyToken(token);
  if (!user) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token无效或已过期'
      }
    }, { status: 401 });
  }
  
  // Return user data
}
```

### Technical Implementation

#### 5.4 Route-Level Authentication

**Implementation Strategy:**
- Each protected component performs authentication check
- Authentication verification on component mount
- Redirect to login page for unauthorized access
- Loading states prevent content exposure

**Error Handling:**
- Network errors redirect to login page
- Expired tokens handled gracefully
- Invalid tokens cleared and user redirected
- Consistent behavior across all protected routes

#### 5.5 Navigation State Management

**Authenticated Navigation:**
- Username display in navigation bar
- Logout button availability
- Access to application features
- Personalized user interface elements

**Unauthenticated State:**
- Redirect to login page
- No access to protected content
- Clear navigation options
- Login and registration links available

---

## Feature 6: User Profile Display

### Feature ID: FEAT-006
**Priority:** Must Have (P0)  
**Complexity:** Low  
**Dependencies:** Session management, user interface

### Functional Specification

#### 6.1 Profile Information Display

**Component:** Dashboard overview section  
**File:** `src/app/dashboard/page.tsx`

**Displayed Information:**
- **Username:** Display name for personalization
- **Email Address:** Account identifier
- **User ID:** System identifier for reference
- **Account Status:** Implicitly shown through access

**UI Implementation:**
```typescript
// User information card
<div className="bg-gray-50 rounded-lg p-4 max-w-md">
  <h3 className="text-lg font-medium text-gray-900 mb-3">用户信息</h3>
  <div className="space-y-2 text-sm">
    <p><span className="font-medium text-gray-700">用户名:</span> 
       <span className="text-gray-900">{user.username}</span></p>
    <p><span className="font-medium text-gray-700">邮箱:</span> 
       <span className="text-gray-900">{user.email}</span></p>
    <p><span className="font-medium text-gray-700">用户ID:</span> 
       <span className="text-gray-900">{user.id}</span></p>
  </div>
</div>
```

#### 6.2 Personalization Elements

**Navigation Bar:**
```typescript
<span className="text-gray-700">欢迎，{user?.username}</span>
```

**Dashboard Welcome:**
```typescript
<h2 className="text-2xl font-bold text-gray-900 mb-4">
  欢迎来到Nobody Logger仪表板
</h2>
```

**Profile Data Source:**
- Information retrieved from validated JWT token
- Real-time data from session validation
- No additional API calls required
- Consistent with authentication state

### Technical Implementation

#### 6.3 Data Privacy

**Information Exposure:**
- Only safe profile fields displayed (id, email, username)
- Sensitive data never exposed (password_hash, device_id)
- User can only see their own profile information
- No cross-user data access possible

**Security Considerations:**
- Profile data comes from authenticated session
- No direct database queries for profile display
- Information validated through JWT token verification
- Consistent with authentication security model

#### 6.4 User Experience

**Interface Design:**
- Clean, readable profile information layout
- Consistent with overall application design
- Responsive design for different screen sizes
- Clear visual hierarchy and typography

**Information Architecture:**
- Profile information easily accessible on dashboard
- Username prominently displayed for personalization
- Technical details (user ID) available but secondary
- Email address shown for account verification

---

## Integration Specifications

### 7.1 Database Integration

**User Table Schema:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  sync_version INTEGER DEFAULT 1,
  last_sync_at TIMESTAMP,
  device_id VARCHAR(255)
);
```

**Required Indexes:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_device_id ON users(device_id);
```

**Database Operations:**
- User creation (INSERT with validation)
- User lookup by email (SELECT with email index)
- User lookup by ID (SELECT by primary key)
- Login timestamp update (UPDATE with optimistic locking)
- Account status verification (WHERE is_active = 1)

### 7.2 API Integration

**RESTful Endpoint Design:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Session validation
- `POST /api/auth/logout` - Session termination

**Consistent Response Format:**
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  request_id?: string;
}
```

**HTTP Status Codes:**
- 200 OK - Successful operations
- 201 Created - Successful registration
- 400 Bad Request - Validation errors
- 401 Unauthorized - Authentication failures
- 500 Internal Server Error - System errors

### 7.3 Frontend Integration

**React Component Architecture:**
- Page components for routes (`login`, `register`, `dashboard`)
- Shared authentication logic through custom hooks
- State management with React hooks (useState, useEffect)
- Navigation integration with Next.js router

**Error Handling Integration:**
- Consistent error display patterns
- Form validation feedback
- Network error recovery
- User-friendly error messages

**Styling Integration:**
- Tailwind CSS for consistent design
- Responsive layout patterns
- Accessibility considerations
- Loading state indicators

---

## Quality Assurance Specifications

### 8.1 Testing Requirements

**Unit Testing:**
- AuthService method testing
- JWT token generation and validation
- Password hashing and verification
- Input validation functions
- Error handling scenarios

**Integration Testing:**
- Complete authentication flows
- API endpoint functionality
- Database operations
- Cookie handling
- Session management

**End-to-End Testing:**
- User registration workflow
- Login and logout processes
- Protected route access
- Error scenario handling
- Cross-browser compatibility

### 8.2 Performance Specifications

**Response Time Requirements:**
- Registration: < 500ms average
- Login: < 500ms average
- Session validation: < 100ms average
- Logout: < 200ms average

**Concurrent User Support:**
- Minimum 100 concurrent registrations
- Minimum 100 concurrent authentications
- Database connection pooling
- Efficient query patterns

**Resource Usage:**
- Memory efficient JWT handling
- Optimized database queries
- Minimal client-side JavaScript
- Efficient cookie management

### 8.3 Security Specifications

**Password Security:**
- bcrypt hashing with cost factor 12
- Unique salt per password
- Secure password comparison
- No plaintext password storage or logging

**Session Security:**
- HTTP-only cookies for token storage
- Secure cookie flags in production
- SameSite strict for CSRF protection
- 7-day maximum session duration

**Input Security:**
- Server-side validation for all inputs
- SQL injection prevention
- XSS prevention through secure cookies
- Generic error messages for security

---

## Deployment Specifications

### 9.1 Environment Configuration

**Environment Variables:**
```bash
# Required for production
JWT_SECRET=your-production-secret-key
NODE_ENV=production

# Database configuration
DATABASE_URL=path/to/production/database.db
```

**Production Considerations:**
- Secure JWT secret generation and management
- HTTPS enforcement for secure cookies
- Database backup and recovery procedures
- Error logging and monitoring setup

### 9.2 Deployment Requirements

**System Dependencies:**
- Node.js 18+ runtime
- SQLite database
- File system write access for database
- Environment variable support

**Security Configuration:**
- Secure cookie flags enabled in production
- JWT secret properly configured
- Database file permissions secured
- Error logging configured without sensitive data

---

**Document Version:** 1.0  
**Next Review Date:** August 15, 2025  
**Technical Lead:** [Pending Review]  
**QA Lead:** [Pending Review]  
**Security Review:** [Pending Review]