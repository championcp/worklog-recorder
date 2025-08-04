import { AuthService } from '../AuthService'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password123'),
  compare: jest.fn().mockResolvedValue(true),
}))

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token.{"userId":1,"email":"test@example.com","username":"testuser"}'),
  verify: jest.fn().mockImplementation((token) => {
    if (token.startsWith('mock.jwt.token.')) {
      const payload = token.replace('mock.jwt.token.', '')
      return JSON.parse(payload)
    }
    throw new Error('Invalid token')
  }),
}))

// Mock the database module
jest.mock('@/lib/db/client', () => ({
  getDatabase: jest.fn(() => mockDb)
}))

// Mock database instance
const mockDb = {
  prepare: jest.fn().mockReturnValue({
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    finalize: jest.fn(),
  }),
  exec: jest.fn(),
  close: jest.fn(),
  pragma: jest.fn(),
}

describe('AuthService', () => {
  let authService: AuthService;
  let mockStmt: any;

  beforeEach(() => {
    jest.clearAllMocks()
    authService = new AuthService()
    mockStmt = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      finalize: jest.fn(),
    }
    mockDb.prepare.mockReturnValue(mockStmt)
  })

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const email = 'test@example.com'
      const password = 'password123'
      const username = 'testuser'

      // Mock findUserByEmail to return null (user doesn't exist)
      mockStmt.get.mockReturnValueOnce(null)
      
      // Mock user creation
      mockStmt.run.mockReturnValueOnce({ lastInsertRowid: 1 })
      
      // Mock findUserById to return the created user
      const createdUser = {
        id: 1,
        email,
        username,
        password_hash: 'hashed_password123',
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      mockStmt.get.mockReturnValueOnce(createdUser)

      const result = await authService.register(email, password, username)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user.email).toBe(email)
      expect(result.user.username).toBe(username)
      expect(result.user.id).toBe(1)
      expect(typeof result.token).toBe('string')
      expect(result.token).toContain('mock.jwt.token.')
    })

    it('should throw error if user already exists', async () => {
      const email = 'existing@example.com'
      const password = 'password123'
      const username = 'existinguser'

      // Mock findUserByEmail to return existing user
      const existingUser = { id: 1, email, username }
      mockStmt.get.mockReturnValueOnce(existingUser)

      await expect(authService.register(email, password, username))
        .rejects.toThrow('邮箱已被注册')
    })

    it('should hash password before storing', async () => {
      const email = 'test@example.com'
      const password = 'password123'
      const username = 'testuser'

      // Mock findUserByEmail to return null
      mockStmt.get.mockReturnValueOnce(null)
      
      // Mock user creation and retrieval
      mockStmt.run.mockReturnValueOnce({ lastInsertRowid: 1 })
      const createdUser = {
        id: 1,
        email,
        username,
        password_hash: 'hashed_password123',
        is_active: 1
      }
      mockStmt.get.mockReturnValueOnce(createdUser)

      await authService.register(email, password, username)

      // Verify that bcrypt.hash was called
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12)
    })
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const email = 'test@example.com'
      const password = 'password123'
      const hashedPassword = 'hashed_password123'

      const user = {
        id: 1,
        email,
        username: 'testuser',
        password_hash: hashedPassword,
        is_active: 1
      }

      // Mock findUserByEmail
      mockStmt.get.mockReturnValueOnce(user)

      // Mock bcrypt.compare to return true
      ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true)

      // Mock updateLastLogin
      mockStmt.run.mockReturnValueOnce({})

      const result = await authService.login({ email, password })

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user.email).toBe(email)
      expect(result.user.id).toBe(1)
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
    })

    it('should throw error for non-existent user', async () => {
      const email = 'nonexistent@example.com'
      const password = 'password123'

      // Mock findUserByEmail to return null
      mockStmt.get.mockReturnValueOnce(null)

      await expect(authService.login({ email, password }))
        .rejects.toThrow('邮箱或密码错误')
    })

    it('should throw error for inactive user', async () => {
      const email = 'inactive@example.com'
      const password = 'password123'

      const user = {
        id: 1,
        email,
        username: 'inactiveuser',
        password_hash: 'hashed_password123',
        is_active: 0 // Inactive user
      }

      mockStmt.get.mockReturnValueOnce(user)

      await expect(authService.login({ email, password }))
        .rejects.toThrow('账户已被禁用')
    })

    it('should throw error for invalid password', async () => {
      const email = 'test@example.com'
      const password = 'wrongpassword'

      const user = {
        id: 1,
        email,
        username: 'testuser',
        password_hash: 'hashed_password123',
        is_active: 1
      }

      mockStmt.get.mockReturnValueOnce(user)
      ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false)

      await expect(authService.login({ email, password }))
        .rejects.toThrow('邮箱或密码错误')
    })
  })

  describe('verifyToken', () => {
    it('should return user for valid token', () => {
      const token = 'mock.jwt.token.{"userId":1,"email":"test@example.com","username":"testuser"}'
      
      const user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_active: 1
      }

      mockStmt.get.mockReturnValueOnce(user)

      const result = authService.verifyToken(token)

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        username: 'testuser'
      })
    })

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token'

      const result = authService.verifyToken(invalidToken)

      expect(result).toBeNull()
    })

    it('should return null for token of inactive user', () => {
      const token = 'mock.jwt.token.{"userId":1,"email":"test@example.com","username":"testuser"}'
      
      const inactiveUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_active: 0 // Inactive
      }

      mockStmt.get.mockReturnValueOnce(inactiveUser)

      const result = authService.verifyToken(token)

      expect(result).toBeNull()
    })

    it('should return null for token of non-existent user', () => {
      const token = 'mock.jwt.token.{"userId":999,"email":"test@example.com","username":"testuser"}'
      
      mockStmt.get.mockReturnValueOnce(null)

      const result = authService.verifyToken(token)

      expect(result).toBeNull()
    })
  })

  describe('findUserById', () => {
    it('should return user when found', () => {
      const userId = 1
      const user = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        is_active: 1
      }

      mockStmt.get.mockReturnValueOnce(user)

      const result = authService.findUserById(userId)

      expect(result).toEqual(user)
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ? AND is_active = 1')
      expect(mockStmt.get).toHaveBeenCalledWith(userId)
    })

    it('should return null when user not found', () => {
      const userId = 999

      mockStmt.get.mockReturnValueOnce(undefined)

      const result = authService.findUserById(userId)

      expect(result).toBeNull()
    })
  })

  describe('findUserByEmail', () => {
    it('should return user when found', () => {
      const email = 'test@example.com'
      const user = {
        id: 1,
        email,
        username: 'testuser',
        is_active: 1
      }

      mockStmt.get.mockReturnValueOnce(user)

      const result = authService.findUserByEmail(email)

      expect(result).toEqual(user)
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ? AND is_active = 1')
      expect(mockStmt.get).toHaveBeenCalledWith(email)
    })

    it('should return null when user not found', () => {
      const email = 'nonexistent@example.com'

      mockStmt.get.mockReturnValueOnce(undefined)

      const result = authService.findUserByEmail(email)

      expect(result).toBeNull()
    })
  })
})