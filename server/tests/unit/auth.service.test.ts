// 认证服务单元测试 — mock Prisma，测试 AuthService 各方法

import { AuthService } from '../../src/services/auth.service';
import { AuthError, ConflictError } from '../../src/utils/errors';
import { hash } from '../../src/utils/password';

// Mock PrismaClient
function mockPrisma(overrides: Record<string, any> = {}) {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      ...overrides.user,
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      ...overrides.refreshToken,
    },
    ...overrides,
  } as any;
}

const mockUser = {
  id: 1,
  phone: '13800138000',
  passwordHash: '',
  nickname: '用户8000',
  avatarUrl: null,
  gender: 0,
  createdAt: new Date('2026-01-01'),
};

describe('AuthService', () => {
  // 预生成密码哈希供测试复用
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hash('Test123');
  });

  describe('register()', () => {
    it('新手机号注册成功，返回 user + 双 token', async () => {
      const prisma = mockPrisma({
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ ...mockUser, passwordHash }),
        },
        refreshToken: {
          create: jest.fn().mockResolvedValue({ id: 1 }),
        },
      });
      const service = new AuthService(prisma);

      const result = await service.register('13800138000', 'Test123');

      expect(result.user.phone).toBe('13800138000');
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('已注册手机号应抛出 ConflictError', async () => {
      const prisma = mockPrisma({
        user: {
          findUnique: jest.fn().mockResolvedValue({ id: 1, phone: '13800138000' }),
        },
      });
      const service = new AuthService(prisma);

      await expect(service.register('13800138000', 'Test123')).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe('login()', () => {
    it('正确手机号+密码应返回 token', async () => {
      const prisma = mockPrisma({
        user: {
          findUnique: jest.fn().mockResolvedValue({ ...mockUser, passwordHash }),
        },
        refreshToken: {
          create: jest.fn().mockResolvedValue({ id: 1 }),
        },
      });
      const service = new AuthService(prisma);

      const result = await service.login('13800138000', 'Test123');

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });

    it('不存在的手机号应抛出 AuthError', async () => {
      const prisma = mockPrisma({
        user: { findUnique: jest.fn().mockResolvedValue(null) },
      });
      const service = new AuthService(prisma);

      await expect(service.login('13800138000', 'Test123')).rejects.toThrow(
        AuthError,
      );
    });

    it('错误密码应抛出 AuthError', async () => {
      const prisma = mockPrisma({
        user: {
          findUnique: jest.fn().mockResolvedValue({ ...mockUser, passwordHash }),
        },
      });
      const service = new AuthService(prisma);

      await expect(service.login('13800138000', 'WrongPassword')).rejects.toThrow(
        AuthError,
      );
    });

    it('无 passwordHash 的用户（纯微信用户）应抛出 AuthError', async () => {
      const prisma = mockPrisma({
        user: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ ...mockUser, passwordHash: null }),
        },
      });
      const service = new AuthService(prisma);

      await expect(service.login('13800138000', 'Test123')).rejects.toThrow(
        AuthError,
      );
    });
  });

  describe('refreshToken()', () => {
    it('有效 refreshToken 应轮换返回新用户', async () => {
      const prisma = mockPrisma({
        refreshToken: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            token: 'valid-refresh-token',
            user: mockUser,
          }),
          delete: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockResolvedValue({ id: 2 }),
        },
      });

      const jwt = require('jsonwebtoken');
      const validRefreshToken = jwt.sign(
        { id: 1, phone: '13800138000' },
        'test-refresh-secret-at-least-32-chars!!',
        { expiresIn: '1h' },
      );

      const service = new AuthService(prisma);
      const result = await service.refreshToken(validRefreshToken);

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      // 旧 Token 已被删除
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('无效 token 应抛出 AuthError', async () => {
      const prisma = mockPrisma();
      const service = new AuthService(prisma);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        AuthError,
      );
    });
  });

  describe('logout()', () => {
    it('应调用 deleteMany 删除 refreshToken', async () => {
      const prisma = mockPrisma();
      const service = new AuthService(prisma);

      await service.logout('some-token');

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'some-token' },
      });
    });
  });
});
