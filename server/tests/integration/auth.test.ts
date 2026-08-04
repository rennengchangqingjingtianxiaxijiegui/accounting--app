// 认证模块集成测试 — 验证 auth 全链路（路由 → validate → controller → errorHandler）

import supertest from 'supertest';

// --------------- Mock Prisma ---------------
// jest.mock 被 hoist 到顶部执行，工厂内不能引用外部 const
// 解决方案：在工厂函数内直接创建 jest.fn()，通过闭包暴露

let mockUserFindUnique: jest.Mock;
let mockUserCreate: jest.Mock;
let mockUserUpdate: jest.Mock;
let mockRTFindUnique: jest.Mock;
let mockRTCreate: jest.Mock;
let mockRTDelete: jest.Mock;
let mockRTDeleteMany: jest.Mock;

jest.mock('@prisma/client', () => {
  // jest.mock 在模块作用域顶部执行，此时 mock 变量已声明但未赋值
  // 使用引用类型间接访问
  const mocks = {
    user: {
      findUnique: (...args: any[]) => mockUserFindUnique(...args),
      findFirst: jest.fn(),
      create: (...args: any[]) => mockUserCreate(...args),
      update: (...args: any[]) => mockUserUpdate(...args),
      delete: jest.fn(),
    },
    refreshToken: {
      findUnique: (...args: any[]) => mockRTFindUnique(...args),
      create: (...args: any[]) => mockRTCreate(...args),
      delete: (...args: any[]) => mockRTDelete(...args),
      deleteMany: (...args: any[]) => mockRTDeleteMany(...args),
    },
  };

  const actual = jest.requireActual('@prisma/client');
  return {
    ...actual,
    PrismaClient: jest.fn().mockImplementation(() => mocks),
  };
});

// 必须在 jest.mock 之后导入，否则 PrismaClient 不会被 mock
import { createApp } from '../../src/app';

const app = createApp();
const request = supertest(app);

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

beforeEach(() => {
  mockUserFindUnique = jest.fn();
  mockUserCreate = jest.fn();
  mockUserUpdate = jest.fn();
  mockRTFindUnique = jest.fn();
  mockRTCreate = jest.fn();
  mockRTDelete = jest.fn();
  mockRTDeleteMany = jest.fn();
  jest.clearAllMocks();
});

// ==================== POST /api/v1/auth/register ====================

describe('POST /api/v1/auth/register', () => {
  it('手机号格式错误应返回 1001', async () => {
    const res = await request
      .post('/api/v1/auth/register')
      .send({ phone: '123', password: 'Test123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe(1001);
  });

  it('密码格式不符应返回 1001', async () => {
    const res = await request
      .post('/api/v1/auth/register')
      .send({ phone: '13800138000', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe(1001);
  });

  it('手机号已注册应返回 1005', async () => {
    mockUserFindUnique.mockResolvedValueOnce({
      id: 1,
      phone: '13800138000',
    });

    const res = await request
      .post('/api/v1/auth/register')
      .send({ phone: '13800138000', password: 'Test123' });

    expect(res.body.code).toBe(1005);
    expect(res.body.message).toContain('已注册');
  });

  it('注册成功应返回用户 + token', async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValueOnce({
      id: 1,
      phone: '13800138000',
      nickname: '用户8000',
      avatarUrl: null,
      gender: 0,
      createdAt: new Date('2026-01-01'),
    });
    mockRTCreate.mockResolvedValueOnce({ id: 1 });

    const res = await request
      .post('/api/v1/auth/register')
      .send({ phone: '13800138000', password: 'Test123' });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user).toBeDefined();
  });
});

// ==================== POST /api/v1/auth/login ====================

describe('POST /api/v1/auth/login', () => {
  it('缺少参数应返回 1001', async () => {
    const res = await request
      .post('/api/v1/auth/login')
      .send({ phone: '', password: '' });

    expect(res.body.code).toBe(1001);
  });

  it('手机号不存在应返回 1002', async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);

    const res = await request
      .post('/api/v1/auth/login')
      .send({ phone: '13800138000', password: 'Test123' });

    expect(res.body.code).toBe(1002);
  });

  it('密码错误应返回 1002', async () => {
    mockUserFindUnique.mockResolvedValueOnce({
      id: 1,
      phone: '13800138000',
      passwordHash: '$2a$12$L9XmJvT8kQ3wR5yN7pZ1uOabcdefghijklmnopqrstuv',
      nickname: '用户',
      avatarUrl: null,
      gender: 0,
      createdAt: new Date(),
    });

    const res = await request
      .post('/api/v1/auth/login')
      .send({ phone: '13800138000', password: 'WrongPassword' });

    expect(res.body.code).toBe(1002);
  });
});

// ==================== POST /api/v1/auth/refresh ====================

describe('POST /api/v1/auth/refresh', () => {
  it('缺少 refreshToken 应返回 1001', async () => {
    const res = await request.post('/api/v1/auth/refresh').send({});

    expect(res.body.code).toBe(1001);
  });

  it('无效 refreshToken 应返回 1002', async () => {
    const res = await request
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid-token' });

    expect(res.body.code).toBe(1002);
  });
});

// ==================== POST /api/v1/auth/logout ====================

describe('POST /api/v1/auth/logout', () => {
  it('未登录应返回 1002', async () => {
    const res = await request
      .post('/api/v1/auth/logout')
      .send({ refreshToken: 'some-token' });

    expect(res.body.code).toBe(1002);
  });
});

// ==================== GET /api/v1/user/profile ====================

describe('GET /api/v1/user/profile', () => {
  it('未登录应返回 1002', async () => {
    const res = await request.get('/api/v1/user/profile');

    expect(res.body.code).toBe(1002);
  });
});

// ==================== 完整流程测试 ====================

describe('认证全链路流程', () => {
  let accessToken: string;
  let refreshToken: string;

  it('1. 注册 → 得到双 Token', async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValueOnce({
      id: 1,
      phone: '13900139000',
      nickname: '用户9000',
      avatarUrl: null,
      gender: 0,
      createdAt: new Date(),
    });
    mockRTCreate.mockResolvedValueOnce({ id: 1 });

    const res = await request
      .post('/api/v1/auth/register')
      .send({ phone: '13900139000', password: 'Test123' });

    expect(res.body.code).toBe(0);
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
  });

  it('2. 获取个人资料（需登录）', async () => {
    // auth middleware → user.service getProfile
    mockUserFindUnique
      .mockResolvedValueOnce({ id: 1, phone: '13900139000' }) // auth
      .mockResolvedValueOnce({
        // getProfile
        id: 1,
        phone: '13900139000',
        wechatOpenId: null,
        nickname: '用户9000',
        avatarUrl: null,
        gender: 0,
        createdAt: new Date(),
      });

    const res = await request
      .get('/api/v1/user/profile')
      .set(authHeader(accessToken));

    expect(res.body.code).toBe(0);
    expect(res.body.data.nickname).toBe('用户9000');
  });

  it('3. Token 过期应返回 1002', async () => {
    // 一个明显已过期的JWT
    const expiredJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJpZCI6MSwicGhvbmUiOiIxMzkwMDEzOTAwMCIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIyfQ.' +
      'signature';

    const res = await request
      .get('/api/v1/user/profile')
      .set(authHeader(expiredJwt));

    expect(res.body.code).toBe(1002);
  });
});
