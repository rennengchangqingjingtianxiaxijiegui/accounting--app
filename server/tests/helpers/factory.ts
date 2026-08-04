// 测试数据工厂 — 创建可预测的 mock 数据

import type { User, RefreshToken } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * 模拟用户对象
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    phone: '13800138000',
    passwordHash: null,
    wechatOpenId: null,
    wechatUnionId: null,
    nickname: '测试用户',
    avatarUrl: null,
    gender: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

/**
 * 创建带密码哈希的模拟用户
 */
export async function createMockUserWithPassword(): Promise<User> {
  const passwordHash = await bcrypt.hash('Test123', 12);
  return createMockUser({ passwordHash });
}

/**
 * 模拟 RefreshToken
 */
export function createMockRefreshToken(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return {
    id: 1,
    token: 'mock-refresh-token-jwt',
    userId: 1,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7天后
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * 注册请求体
 */
export const validRegisterBody = {
  phone: '13800138000',
  password: 'Test123',
};

/**
 * 登录请求体
 */
export const validLoginBody = {
  phone: '13800138000',
  password: 'Test123',
};
