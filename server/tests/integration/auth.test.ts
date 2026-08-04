// 认证接口集成测试
import request from 'supertest';
import { createApp } from '../../src/app';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockUser = {
    id: 1,
    phone: '13800138000',
    passwordHash: '$2a$12$LJ3m4ys3GZfnYMzf4kWDcOqXKEPQFxHyOQYqNHDvQHDFMlSxFRvGm',
    wechatOpenId: null,
    wechatUnionId: null,
    nickname: '测试用户',
    avatarUrl: null,
    gender: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    MemberRole: { OWNER: 'OWNER', ADMIN: 'ADMIN', EDITOR: 'EDITOR', VIEWER: 'VIEWER' },
    TransactionType: { INCOME: 'INCOME', EXPENSE: 'EXPENSE' },
    BookType: { PERSONAL: 'PERSONAL', FAMILY: 'FAMILY', TRAVEL: 'TRAVEL', BUSINESS: 'BUSINESS', OTHER: 'OTHER' },
    Prisma: { PrismaClientKnownRequestError: class extends Error { code: string; meta: any; constructor(msg: string, opts: any) { super(msg); this.code = opts.code; this.meta = opts.meta; } } },
  };
});

const app = createApp();

describe('POST /api/v1/auth/register', () => {
  it('参数缺失返回 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ phone: '', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(1001);
  });

  it('手机号格式不正确返回 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ phone: '12345', password: 'abc123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('缺少参数返回 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '', password: '' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('缺少 refreshToken 返回 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: '' });
    expect(res.status).toBe(400);
  });
});

describe('GET /health', () => {
  it('健康检查返回 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
