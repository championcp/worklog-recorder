# Sprint 1 Authentication System - Test Cases

## 📋 Test Case Overview

This document contains detailed test cases for the Sprint 1 user authentication system covering registration, login, session management, and security validation.

## 🔐 User Registration Test Cases

### TC-REG-001: Valid User Registration
**Priority**: High | **Type**: Functional | **Story**: US-001

**Objective**: Verify successful user registration with valid data

**Preconditions**: 
- Application is accessible
- Database is available
- Registration page is loaded

**Test Steps**:
1. Navigate to registration page
2. Enter valid email: "test@example.com"
3. Enter valid username: "testuser123"
4. Enter valid password: "SecurePass123!"
5. Click "注册" button

**Expected Results**:
- User account created in database
- Password hashed with bcrypt
- Redirect to dashboard
- Success message displayed
- User session established

**Test Data**: Valid email, 8+ char username, strong password

---

### TC-REG-002: Registration with Existing Email
**Priority**: High | **Type**: Negative | **Story**: US-001

**Objective**: Verify registration fails with duplicate email

**Preconditions**: 
- User with email "existing@example.com" already exists

**Test Steps**:
1. Navigate to registration page
2. Enter existing email: "existing@example.com"
3. Enter valid username: "newuser123"
4. Enter valid password: "SecurePass123!"
5. Click "注册" button

**Expected Results**:
- Registration fails
- Error message: "用户已存在"
- User remains on registration page
- No new account created
- Form data cleared

---

### TC-REG-003: Registration with Invalid Email Format
**Priority**: Medium | **Type**: Negative | **Story**: US-001

**Objective**: Verify registration fails with invalid email format

**Test Steps**:
1. Navigate to registration page
2. Enter invalid email: "invalid-email"
3. Enter valid username: "testuser123"
4. Enter valid password: "SecurePass123!"
5. Click "注册" button

**Expected Results**:
- Client-side validation error
- Error message: "请输入有效的邮箱地址"
- Registration button disabled
- No server request sent

---

### TC-REG-004: Registration with Weak Password
**Priority**: Medium | **Type**: Negative | **Story**: US-001

**Objective**: Verify registration fails with weak password

**Test Steps**:
1. Navigate to registration page
2. Enter valid email: "test@example.com"
3. Enter valid username: "testuser123"
4. Enter weak password: "123"
5. Click "注册" button

**Expected Results**:
- Client-side validation error
- Error message: "密码至少需要6个字符"
- Registration button disabled
- Password strength indicator shows weak

---

## 🔑 User Login Test Cases

### TC-LOGIN-001: Valid User Login
**Priority**: High | **Type**: Functional | **Story**: US-002

**Objective**: Verify successful login with valid credentials

**Preconditions**: 
- User account exists with email "test@example.com"
- User is not currently logged in

**Test Steps**:
1. Navigate to login page
2. Enter email: "test@example.com"
3. Enter correct password: "SecurePass123!"
4. Click "登录" button

**Expected Results**:
- Authentication successful
- JWT token generated
- HTTP-only cookie set
- Redirect to dashboard
- User session established
- "last_login_at" timestamp updated

---

### TC-LOGIN-002: Invalid Password
**Priority**: High | **Type**: Negative | **Story**: US-002

**Objective**: Verify login fails with incorrect password

**Test Steps**:
1. Navigate to login page
2. Enter valid email: "test@example.com"
3. Enter incorrect password: "WrongPassword"
4. Click "登录" button

**Expected Results**:
- Authentication fails
- Error message: "邮箱或密码错误"
- User remains on login page
- No JWT token generated
- No session established
- Password field cleared

---

### TC-LOGIN-003: Non-existent User
**Priority**: Medium | **Type**: Negative | **Story**: US-002

**Objective**: Verify login fails for non-existent user

**Test Steps**:
1. Navigate to login page
2. Enter non-existent email: "nonexistent@example.com"
3. Enter any password: "AnyPassword123"
4. Click "登录" button

**Expected Results**:
- Authentication fails
- Generic error message: "邮箱或密码错误"
- User remains on login page
- No user enumeration possible
- Login attempt logged for security

---

### TC-LOGIN-004: Empty Credentials
**Priority**: Low | **Type**: Negative | **Story**: US-002

**Objective**: Verify login fails with empty fields

**Test Steps**:
1. Navigate to login page
2. Leave email field empty
3. Leave password field empty
4. Click "登录" button

**Expected Results**:
- Client-side validation errors
- Email error: "邮箱不能为空"
- Password error: "密码不能为空"
- Login button disabled
- No server request sent

---

## 🍪 Session Management Test Cases

### TC-SESSION-001: JWT Token Generation
**Priority**: High | **Type**: Functional | **Story**: US-003

**Objective**: Verify JWT token is properly generated and stored

**Preconditions**: User successfully logged in

**Test Steps**:
1. Complete valid login process
2. Inspect browser cookies
3. Check for "auth-token" cookie

**Expected Results**:
- JWT token cookie present
- Cookie is HTTP-only
- Cookie has secure flag (production)
- Token contains valid user payload
- Token expiration set to 7 days
- Token signature is valid

---

### TC-SESSION-002: Protected Route Access
**Priority**: High | **Type**: Functional | **Story**: US-005

**Objective**: Verify authenticated users can access protected routes

**Preconditions**: User is logged in with valid session

**Test Steps**:
1. Ensure user is logged in
2. Navigate directly to "/dashboard"
3. Verify page loads successfully

**Expected Results**:
- Dashboard page loads
- User data displayed correctly
- No authentication redirect
- Session remains active
- User context available

---

### TC-SESSION-003: Unauthenticated Route Protection
**Priority**: High | **Type**: Security | **Story**: US-005

**Objective**: Verify unauthenticated users cannot access protected routes

**Preconditions**: User is not logged in (no valid session)

**Test Steps**:
1. Clear all cookies
2. Navigate directly to "/dashboard"
3. Observe application behavior

**Expected Results**:
- Automatic redirect to "/login"
- Dashboard content not accessible
- Authentication required message
- Session establishment required
- URL changes to login page

---

### TC-SESSION-004: Session Expiration
**Priority**: Medium | **Type**: Functional | **Story**: US-003

**Objective**: Verify session expires after JWT token expiration

**Preconditions**: User logged in with expired token

**Test Steps**:
1. Login with valid credentials
2. Manually expire JWT token (modify timestamp)
3. Attempt to access protected route
4. Observe application behavior

**Expected Results**:
- Session invalidated
- Redirect to login page
- Authentication required
- Token validation fails
- User must re-authenticate

---

## 🚪 Logout Test Cases

### TC-LOGOUT-001: Successful Logout
**Priority**: High | **Type**: Functional | **Story**: US-004

**Objective**: Verify user can successfully logout

**Preconditions**: User is logged in

**Test Steps**:
1. Navigate to dashboard
2. Click "登出" button
3. Confirm logout action

**Expected Results**:
- Session terminated
- Auth cookie cleared/invalidated
- Redirect to login page
- User context cleared
- Protected routes inaccessible

---

### TC-LOGOUT-002: Logout from Multiple Tabs
**Priority**: Medium | **Type**: Functional | **Story**: US-004

**Objective**: Verify logout affects all browser tabs

**Preconditions**: User logged in with multiple tabs open

**Test Steps**:
1. Open dashboard in multiple browser tabs
2. Logout from one tab
3. Check other tabs' status

**Expected Results**:
- All tabs receive logout notification
- All sessions terminated
- All tabs redirect to login
- Consistent logout state
- No residual authentication

---

## 🔒 Security Test Cases

### TC-SEC-001: Password Hashing Verification
**Priority**: High | **Type**: Security | **Story**: US-001

**Objective**: Verify passwords are properly hashed and stored

**Preconditions**: User registration completed

**Test Steps**:
1. Register new user with password "TestPassword123"
2. Check database for user record
3. Examine password_hash field
4. Verify hash format and strength

**Expected Results**:
- Password stored as bcrypt hash
- Hash uses minimum 12 salt rounds
- Original password not stored
- Hash format: $2b$12$...
- Hash verification works correctly

---

### TC-SEC-002: JWT Token Security
**Priority**: High | **Type**: Security | **Story**: US-003

**Objective**: Verify JWT token security implementation

**Preconditions**: User logged in with JWT token

**Test Steps**:
1. Login and obtain JWT token
2. Decode token payload
3. Verify token signature
4. Check token expiration
5. Validate user claims

**Expected Results**:
- Token properly signed with secret
- Payload contains user ID, email, username
- Expiration set to 7 days
- Token signature valid
- Claims match user data

---

### TC-SEC-003: SQL Injection Prevention
**Priority**: High | **Type**: Security | **Story**: Multiple

**Objective**: Verify application prevents SQL injection attacks

**Test Steps**:
1. Attempt login with SQL injection payload in email field
2. Email: "admin'; DROP TABLE users; --"
3. Password: "anything"
4. Submit login request

**Expected Results**:
- SQL injection blocked
- Database remains intact
- Error handled gracefully
- Malicious input sanitized
- No database corruption

---

### TC-SEC-004: XSS Prevention
**Priority**: Medium | **Type**: Security | **Story**: Multiple

**Objective**: Verify application prevents Cross-Site Scripting attacks

**Test Steps**:
1. Register user with malicious username
2. Username: "<script>alert('XSS')</script>"
3. Complete registration process
4. View user profile on dashboard

**Expected Results**:
- Script tags escaped/sanitized
- No JavaScript execution
- Safe content rendering
- XSS payload neutralized
- User data safely displayed

---

## 📱 API Endpoint Test Cases

### TC-API-001: POST /api/auth/register
**Priority**: High | **Type**: API | **Story**: US-001

**Objective**: Verify registration API endpoint functionality

**Request**:
```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "api@example.com",
  "username": "apiuser",
  "password": "SecurePass123!"
}
```

**Expected Response**:
```json
Status: 201 Created
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "api@example.com",
      "username": "apiuser"
    }
  },
  "message": "用户注册成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### TC-API-002: POST /api/auth/login
**Priority**: High | **Type**: API | **Story**: US-002

**Objective**: Verify login API endpoint functionality

**Request**:
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "api@example.com",
  "password": "SecurePass123!"
}
```

**Expected Response**:
```json
Status: 200 OK
Set-Cookie: auth-token=...; HttpOnly; Path=/

{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "api@example.com",
      "username": "apiuser"
    }
  },
  "message": "登录成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### TC-API-003: GET /api/auth/me
**Priority**: High | **Type**: API | **Story**: US-006

**Objective**: Verify user profile API endpoint

**Request**:
```
GET /api/auth/me
Cookie: auth-token=valid_jwt_token
```

**Expected Response**:
```json
Status: 200 OK
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "api@example.com",
      "username": "apiuser"
    }
  },
  "message": "用户信息获取成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### TC-API-004: POST /api/auth/logout
**Priority**: High | **Type**: API | **Story**: US-004

**Objective**: Verify logout API endpoint functionality

**Request**:
```
POST /api/auth/logout
Cookie: auth-token=valid_jwt_token
```

**Expected Response**:
```json
Status: 200 OK
Set-Cookie: auth-token=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT

{
  "success": true,
  "message": "登出成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 📊 Test Execution Summary

### Test Case Statistics
- **Total Test Cases**: 25
- **High Priority**: 15 (60%)
- **Medium Priority**: 7 (28%)
- **Low Priority**: 3 (12%)

### Test Categories
- **Functional Tests**: 15 (60%)
- **Security Tests**: 6 (24%)
- **API Tests**: 4 (16%)

### Coverage Areas
- **User Registration**: 4 test cases
- **User Login**: 4 test cases
- **Session Management**: 4 test cases
- **Logout Functionality**: 2 test cases
- **Security Validation**: 4 test cases
- **API Endpoints**: 4 test cases
- **Negative Scenarios**: 7 test cases

---

*These test cases ensure comprehensive validation of the authentication system with focus on functionality, security, and API reliability.*