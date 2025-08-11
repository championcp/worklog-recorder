# Nobody Logger - Sprint 1 Business Rules

## Document Information

**Product:** Nobody Logger  
**Sprint:** Sprint 1 - User Authentication System  
**Version:** 1.0  
**Date:** August 4, 2025  
**Author:** Product Owner

## Overview

This document defines the business rules that govern the user authentication system for Nobody Logger. These rules ensure consistent behavior, maintain data integrity, enforce security policies, and provide clear guidelines for system operations.

---

## 1. User Account Management Rules

### 1.1 User Registration Rules

#### BR-REG-001: Email Address Requirements
- **Rule:** Email addresses must be unique across the entire system
- **Rationale:** Prevents account conflicts and ensures reliable user identification
- **Implementation:** Database constraint + application-level validation
- **Exception Handling:** Registration rejected with error message "邮箱已被注册"

#### BR-REG-002: Email Format Validation
- **Rule:** Email addresses must follow standard RFC 5322 format
- **Pattern:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Rationale:** Ensures valid email addresses for future communication and password recovery
- **Implementation:** Client-side and server-side validation
- **Exception Handling:** Form submission blocked with error "邮箱格式不正确"

#### BR-REG-003: Username Requirements
- **Rule:** Username must be between 2 and 20 characters (inclusive)
- **Rationale:** Ensures meaningful usernames while preventing database overflow
- **Character Restrictions:** No restrictions on character types (Unicode support)
- **Case Sensitivity:** Usernames are case-sensitive
- **Exception Handling:** Registration blocked with error "用户名长度应为2-20位"

#### BR-REG-004: Password Security Standards
- **Rule:** Passwords must be minimum 6 characters in length
- **Rationale:** Balances security with usability for personal productivity tool
- **Complexity:** No complexity requirements for initial release
- **Storage:** Must be hashed using bcrypt with 12 salt rounds
- **Exception Handling:** Registration blocked with error "密码长度至少为6位"

#### BR-REG-005: Account Activation Status
- **Rule:** New accounts are created with `is_active = true` by default
- **Rationale:** Immediate access after registration improves user experience
- **Future Consideration:** Email verification may be added in later sprints
- **Impact:** Users can immediately access system after registration

#### BR-REG-006: Device ID Generation
- **Rule:** Every new account receives a unique device_id for future synchronization
- **Format:** `device_{timestamp}_{random_string}`
- **Rationale:** Supports future multi-device sync capabilities
- **Implementation:** Automatically generated during registration process

### 1.2 User Authentication Rules

#### BR-AUTH-001: Login Credential Validation
- **Rule:** Users must authenticate using email and password combination
- **Alternative Methods:** No social login or alternative authentication methods in Sprint 1
- **Case Sensitivity:** Email is case-insensitive, password is case-sensitive
- **Rate Limiting:** Not implemented in Sprint 1 (future enhancement)

#### BR-AUTH-002: Account Status Verification
- **Rule:** Only active accounts (`is_active = true`) can authenticate
- **Rationale:** Provides administrative control over account access
- **Exception Handling:** Login rejected with error "账户已被禁用"
- **Business Impact:** Supports account suspension functionality

#### BR-AUTH-003: Password Verification
- **Rule:** Password verification must use bcrypt comparison against stored hash
- **Security:** Passwords never stored or transmitted in plaintext
- **Timing Attacks:** Generic error messages prevent account enumeration
- **Exception Handling:** Invalid credentials return "邮箱或密码错误"

#### BR-AUTH-004: Last Login Tracking
- **Rule:** `last_login_at` timestamp updated only on successful authentication
- **Rationale:** Provides audit trail and user activity insights
- **Implementation:** Database update occurs after successful password verification
- **Sync Version:** `sync_version` incremented to support data synchronization

---

## 2. Session Management Rules

### 2.1 JWT Token Rules

#### BR-JWT-001: Token Content Standards
- **Required Claims:** userId, email, username, iat (issued at), exp (expiration)
- **Token Validity:** 7 days from issuance
- **Signing Algorithm:** HMAC SHA256 (HS256)
- **Secret Management:** JWT_SECRET from environment variables
- **Development Default:** "dev-secret-change-in-production" (must be changed for production)

#### BR-JWT-002: Token Validation Requirements
- **Rule:** All token validations must verify signature, expiration, and user account status
- **Account Status Check:** Token invalid if user account is inactive
- **Expiration Handling:** Expired tokens automatically rejected
- **Security:** Token tampering results in authentication failure

#### BR-JWT-003: Token Storage Rules
- **Storage Method:** HTTP-only cookies exclusively
- **Cookie Security:** 
  - `httpOnly: true` (prevents XSS access)
  - `secure: true` in production (HTTPS only)
  - `sameSite: 'strict'` (CSRF protection)
  - `maxAge: 7 days`
  - `path: '/'` (site-wide access)

### 2.2 Session Lifecycle Rules

#### BR-SESS-001: Session Duration Policy
- **Rule:** User sessions remain active for maximum 7 days
- **Automatic Extension:** Sessions not automatically extended
- **Rationale:** Balances security with user convenience for productivity tool
- **Re-authentication:** Users must log in again after session expiration

#### BR-SESS-002: Session Termination Rules
- **Logout:** Immediate session termination and cookie deletion
- **Token Expiration:** Automatic session termination after 7 days
- **Account Deactivation:** All active sessions invalidated immediately
- **Security Breach:** Administrative session termination capability

#### BR-SESS-003: Multi-Tab Session Consistency
- **Rule:** Single session shared across all browser tabs/windows
- **Synchronization:** Logout from one tab terminates session in all tabs
- **State Management:** Authentication state consistent across application
- **Browser Restart:** Session persists across browser restarts within 7-day limit

---

## 3. Security and Privacy Rules

### 3.1 Password Security Rules

#### BR-SEC-001: Password Hashing Standards
- **Algorithm:** bcrypt with cost factor 12
- **Rationale:** Industry standard with appropriate security vs. performance balance
- **Salt:** Unique salt generated for each password
- **Verification:** Always use bcrypt.compare() for password verification
- **Storage:** Only hashed passwords stored in database

#### BR-SEC-002: Error Message Security
- **Rule:** Generic error messages prevent information disclosure
- **Login Errors:** "邮箱或密码错误" for both invalid email and invalid password
- **Registration Errors:** Specific messages only for format validation, generic for system errors
- **Rationale:** Prevents username enumeration and account discovery attacks

#### BR-SEC-003: Input Validation Rules
- **Rule:** All user inputs validated on both client and server side
- **Client Validation:** Immediate feedback for user experience
- **Server Validation:** Authoritative validation for security
- **Sanitization:** Input sanitization prevents injection attacks
- **Required Fields:** Email, password, username are mandatory for registration

### 3.2 Data Privacy Rules

#### BR-PRIV-001: User Data Isolation
- **Rule:** Users can only access their own account data
- **Implementation:** All queries filtered by user_id
- **Profile Access:** Users can only view their own profile information
- **Database Design:** Foreign key constraints enforce data isolation

#### BR-PRIV-002: Sensitive Information Protection
- **Rule:** Sensitive information never exposed in API responses or UI
- **Protected Fields:** password_hash, device_id, sync_version, internal timestamps
- **API Responses:** Only include id, email, username in user profile data
- **Logs:** Passwords and tokens never logged in plain text

#### BR-PRIV-003: Session Data Security
- **Rule:** Session tokens never exposed to JavaScript
- **HTTP-Only Cookies:** Prevents XSS attacks from accessing authentication tokens
- **Secure Transmission:** Tokens only transmitted over HTTPS in production
- **Storage:** No authentication credentials stored in localStorage or sessionStorage

---

## 4. Application Access Rules

### 4.1 Route Protection Rules

#### BR-ACCESS-001: Protected Route Authentication
- **Rule:** All routes except public pages require valid authentication
- **Public Routes:** `/login`, `/register`, public assets
- **Protected Routes:** `/dashboard`, `/api/auth/me`, future application features
- **Enforcement:** Authentication check on every protected route access
- **Redirection:** Unauthenticated users redirected to `/login`

#### BR-ACCESS-002: Authentication State Management
- **Rule:** Authentication state verified on application load and route navigation
- **Implementation:** Client-side auth check with server validation
- **Loading States:** Display loading indicator during auth verification
- **Error Handling:** Network errors redirect to login page
- **State Persistence:** Authentication state maintained across page refreshes

#### BR-ACCESS-003: API Endpoint Security
- **Rule:** All API endpoints require authentication except auth endpoints
- **Auth Endpoints:** `/api/auth/login`, `/api/auth/register` public
- **Protected Endpoints:** `/api/auth/me`, `/api/auth/logout`, future API routes
- **Token Validation:** Every protected API call validates JWT token
- **Response Codes:** 401 Unauthorized for authentication failures

### 4.2 User Interface Rules

#### BR-UI-001: Authentication Status Display
- **Rule:** User interface reflects current authentication status
- **Authenticated State:** Username displayed in navigation, logout button available
- **Unauthenticated State:** Login/register options displayed
- **Loading State:** Loading indicator during authentication verification
- **Error State:** Clear error messages for authentication failures

#### BR-UI-002: Navigation Rules
- **Rule:** Navigation options based on authentication status
- **Authenticated Navigation:** Dashboard, project management, settings, logout
- **Unauthenticated Navigation:** Login, register, public information
- **Dynamic Menu:** Menu items change based on authentication state
- **Breadcrumbs:** Current page context available to authenticated users

---

## 5. Data Integrity Rules

### 5.1 Database Consistency Rules

#### BR-DATA-001: User Account Integrity
- **Rule:** User records maintain referential integrity across all operations
- **Foreign Keys:** All user-related tables reference users.id
- **Cascade Rules:** User deletion cascades to all related records
- **Constraints:** Email uniqueness enforced at database level
- **Transactions:** Account creation operations are atomic

#### BR-DATA-002: Timestamp Management
- **Rule:** All records maintain accurate created_at and updated_at timestamps
- **Creation:** created_at set automatically on record creation
- **Updates:** updated_at updated automatically via database triggers
- **Timezone:** All timestamps stored in UTC
- **Audit Trail:** Timestamp changes provide operation audit trail

#### BR-DATA-003: Version Control and Synchronization
- **Rule:** Records include sync_version for future multi-device support
- **Increment:** sync_version incremented on every record modification
- **Initial Value:** New records created with sync_version = 1
- **Purpose:** Enables conflict resolution in future synchronization features
- **Implementation:** Automatic increment via application logic

### 5.2 Data Validation Rules

#### BR-VALID-001: Field Length Restrictions
- **Users Table:** 
  - email: 255 characters maximum
  - password_hash: 255 characters maximum
  - username: 100 characters maximum
  - device_id: 255 characters maximum
- **Rationale:** Prevents database overflow and ensures reasonable input limits
- **Validation:** Enforced at application and database levels

#### BR-VALID-002: Required Field Enforcement
- **Rule:** Essential fields cannot be null or empty
- **Required Fields:** email, password_hash, username
- **Optional Fields:** last_login_at, device_id, last_sync_at
- **Default Values:** is_active (true), sync_version (1), timestamps (current)
- **Validation:** Server-side validation before database insertion

---

## 6. Error Handling and Recovery Rules

### 6.1 Error Response Rules

#### BR-ERROR-001: Standardized Error Format
- **Rule:** All API errors follow consistent response format
- **Structure:** `{ success: false, error: { code, message }, timestamp }`
- **Error Codes:** Specific codes for different error types
- **Messages:** User-friendly messages in Chinese
- **Timestamp:** ISO format timestamp for all error responses

#### BR-ERROR-002: Client Error Handling
- **Rule:** Client applications must handle all possible error scenarios
- **Network Errors:** Display "网络错误，请稍后重试"
- **Validation Errors:** Display specific field validation messages
- **Authentication Errors:** Redirect to login page with appropriate message
- **Server Errors:** Display generic error message, log detailed information

### 6.2 Recovery and Resilience Rules

#### BR-RECOVERY-001: Session Recovery
- **Rule:** Users can recover from temporary authentication issues
- **Token Expiry:** Clear expired tokens and redirect to login
- **Network Issues:** Retry authentication validation after network recovery
- **Server Errors:** Graceful degradation with retry mechanisms
- **User Communication:** Clear messaging about recovery steps

#### BR-RECOVERY-002: Data Consistency Recovery
- **Rule:** System maintains data consistency during error conditions
- **Transaction Rollback:** Failed operations do not leave partial data
- **Duplicate Prevention:** Prevent duplicate accounts during concurrent registrations
- **State Recovery:** Application state recovers correctly after errors
- **Logging:** Comprehensive error logging for troubleshooting

---

## 7. Compliance and Audit Rules

### 7.1 Security Compliance Rules

#### BR-COMP-001: Industry Standard Compliance
- **Rule:** Authentication system follows security best practices
- **Password Storage:** OWASP recommendations for password hashing
- **Session Management:** Secure session handling practices
- **Token Security:** JWT best practices implementation
- **Data Protection:** Basic data privacy protection measures

#### BR-COMP-002: Audit Trail Requirements
- **Rule:** System maintains audit trail for security-relevant events
- **Login Events:** Successful and failed login attempts logged
- **Account Changes:** Account creation and status changes logged
- **Session Events:** Session creation and termination logged
- **Error Events:** Authentication and authorization errors logged

### 7.2 Data Retention Rules

#### BR-RETAIN-001: User Data Retention
- **Rule:** User account data retained while account is active
- **Inactive Accounts:** Data retained indefinitely until user requests deletion
- **Deleted Accounts:** Data permanently removed from system
- **Audit Logs:** Authentication logs retained for security analysis
- **Compliance:** Data retention supports future regulatory compliance

---

## 8. Performance and Scalability Rules

### 8.1 Performance Requirements

#### BR-PERF-001: Response Time Standards
- **Rule:** Authentication operations must meet performance benchmarks
- **Login/Register:** Maximum 500ms response time
- **Token Validation:** Maximum 100ms response time
- **Database Queries:** Optimized with proper indexing
- **Concurrent Users:** Support minimum 100 concurrent authentications

#### BR-PERF-002: Database Optimization Rules
- **Rule:** Database queries optimized for authentication performance
- **Indexes:** Required on email, user_id, and device_id fields
- **Query Patterns:** Use indexed fields in WHERE clauses
- **Connection Management:** Efficient database connection handling
- **Caching Strategy:** Consider caching for frequently accessed data

### 8.2 Scalability Considerations

#### BR-SCALE-001: Growth Accommodation
- **Rule:** System designed to accommodate user base growth
- **Database Design:** Schema supports future feature additions
- **API Design:** RESTful endpoints support horizontal scaling
- **Session Management:** Stateless JWT tokens support load balancing
- **Resource Usage:** Efficient resource utilization patterns

---

## Rule Enforcement Matrix

| Rule Category | Enforcement Level | Validation Point | Error Handling |
|---------------|------------------|-----------------|----------------|
| Registration Rules | Application + DB | Client + Server | Form Validation + API Error |
| Authentication Rules | Application | Server | API Error + Redirect |
| Session Rules | Application | Client + Server | Auto-logout + Redirect |
| Security Rules | Application + Infrastructure | Server | Error Response + Logging |
| Privacy Rules | Application + DB | Server | Access Denied + Audit |
| Access Rules | Application | Client + Server | Redirect + Error Message |
| Data Integrity | Database + Application | Server | Transaction Rollback + Error |
| Performance Rules | Infrastructure + Application | Server | Monitoring + Optimization |

---

## Business Impact Summary

### User Experience Impact
- Secure and trustworthy authentication system builds user confidence
- Clear error messages and validation improve usability
- Session persistence reduces friction in daily workflow
- Consistent interface behavior provides predictable user experience

### Security Impact
- Industry-standard security practices protect user data
- Generic error messages prevent security information disclosure
- HTTP-only cookies and JWT tokens provide secure session management
- Input validation prevents common security vulnerabilities

### Business Operations Impact
- Audit trail supports security monitoring and compliance
- User account management enables customer support and administration
- Data integrity rules ensure reliable system operation
- Performance standards ensure scalable user experience

### Technical Debt Considerations
- Current rules establish foundation for future feature development
- Security practices align with industry standards for easy enhancement
- Database design supports planned synchronization and reporting features
- API structure enables future mobile and integration capabilities

---

**Document Version:** 1.0  
**Next Review Date:** August 15, 2025  
**Compliance Officer:** [Pending Review]  
**Security Officer:** [Pending Review]  
**Development Team:** [Acknowledged]