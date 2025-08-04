import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '@/lib/db/client';
import type { User, CreateUserInput, LoginCredentials, AuthUser, JWTPayload } from '@/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token有效期7天

export class AuthService {
  private db = getDatabase();

  /**
   * 创建新用户
   */
  async createUser(input: CreateUserInput): Promise<User> {
    const { email, password_hash, username, device_id } = input;
    
    // 检查邮箱是否已存在
    const existingUser = this.findUserByEmail(email);
    if (existingUser) {
      throw new Error('邮箱已被注册');
    }

    const stmt = this.db.prepare(`
      INSERT INTO users (email, password_hash, username, device_id)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(email, password_hash, username, device_id);
    const userId = result.lastInsertRowid as number;

    const newUser = this.findUserById(userId);
    if (!newUser) {
      throw new Error('用户创建失败');
    }

    return newUser;
  }

  /**
   * 用户注册
   */
  async register(email: string, password: string, username: string): Promise<{ user: AuthUser; token: string }> {
    // 密码加密
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const user = await this.createUser({
      email,
      password_hash,
      username,
      device_id: this.generateDeviceId()
    });

    // 生成JWT token
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      username: user.username
    };

    const token = this.generateToken(authUser);

    return { user: authUser, token };
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    const { email, password } = credentials;

    // 查找用户
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new Error('邮箱或密码错误');
    }

    if (!user.is_active) {
      throw new Error('账户已被禁用');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('邮箱或密码错误');
    }

    // 更新最后登录时间
    this.updateLastLogin(user.id);

    // 生成JWT token
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      username: user.username
    };

    const token = this.generateToken(authUser);

    return { user: authUser, token };
  }

  /**
   * 验证JWT token
   */
  verifyToken(token: string): AuthUser | null {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      // 验证用户是否仍然存在且活跃
      const user = this.findUserById(payload.userId);
      if (!user || !user.is_active) {
        return null;
      }

      return {
        id: payload.userId,
        email: payload.email,
        username: payload.username
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 根据ID查找用户
   */
  findUserById(id: number): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1');
    return stmt.get(id) as User | undefined || null;
  }

  /**
   * 根据邮箱查找用户
   */
  findUserByEmail(email: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
    return stmt.get(email) as User | undefined || null;
  }

  /**
   * 生成JWT token
   */
  private generateToken(user: AuthUser): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      username: user.username
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * 更新最后登录时间
   */
  private updateLastLogin(userId: number): void {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET last_login_at = CURRENT_TIMESTAMP, sync_version = sync_version + 1
      WHERE id = ?
    `);
    stmt.run(userId);
  }

  /**
   * 生成设备ID
   */
  private generateDeviceId(): string {
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}