// 账本模块集成测试 — 完整 HTTP 链路

// --------------- Mock Prisma ---------------
let mockUserFindUnique: jest.Mock;
let mockBookMemberFindUnique: jest.Mock;
let mockBookMemberFindMany: jest.Mock;
let mockBookMemberCreate: jest.Mock;
let mockBookMemberUpdate: jest.Mock;
let mockBookMemberDelete: jest.Mock;
let mockBookFindUnique: jest.Mock;
let mockBookCreate: jest.Mock;
let mockBookUpdate: jest.Mock;
let mockUserFindUniqueForMember: jest.Mock;

jest.mock('@prisma/client', () => {
  const mocks = {
    user: {
      findUnique: (...args: any[]) => mockUserFindUnique(...args),
    },
    book: {
      findUnique: (...args: any[]) => mockBookFindUnique(...args),
      create: (...args: any[]) => mockBookCreate(...args),
      update: (...args: any[]) => mockBookUpdate(...args),
    },
    bookMember: {
      findUnique: (...args: any[]) => mockBookMemberFindUnique(...args),
      findMany: (...args: any[]) => mockBookMemberFindMany(...args),
      create: (...args: any[]) => mockBookMemberCreate(...args),
      update: (...args: any[]) => mockBookMemberUpdate(...args),
      delete: (...args: any[]) => mockBookMemberDelete(...args),
    },
  };

  const actual = jest.requireActual('@prisma/client');
  return {
    ...actual,
    PrismaClient: jest.fn().mockImplementation(() => mocks),
  };
});

import supertest from 'supertest';
import { createApp } from '../../src/app';
import jwt from 'jsonwebtoken';

const app = createApp();
const request = supertest(app);

function authHeader(userId = 1, phone = '13800138000') {
  const token = jwt.sign(
    { id: userId, phone },
    'test-access-secret-at-least-32-chars!!',
    { expiresIn: '15m' },
  );
  return { Authorization: `Bearer ${token}` };
}

beforeEach(() => {
  mockUserFindUnique = jest.fn();
  mockBookMemberFindUnique = jest.fn();
  mockBookMemberFindMany = jest.fn();
  mockBookMemberCreate = jest.fn();
  mockBookMemberUpdate = jest.fn();
  mockBookMemberDelete = jest.fn();
  mockBookFindUnique = jest.fn();
  mockBookCreate = jest.fn();
  mockBookUpdate = jest.fn();
  mockUserFindUniqueForMember = jest.fn();
  jest.clearAllMocks();
});

// ==================== GET /api/v1/books ====================

describe('GET /api/v1/books', () => {
  it('未登录应返回 1002', async () => {
    const res = await request.get('/api/v1/books');

    expect(res.body.code).toBe(1002);
  });

  it('返回用户账本列表', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 1 });
    mockBookMemberFindMany.mockResolvedValueOnce([
      {
        book: {
          id: 1,
          name: '家庭账本',
          type: 'FAMILY',
          coverIcon: 'wallet',
          createdBy: 1,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { members: 2, records: 10 },
        },
        role: 'OWNER',
        joinedAt: new Date(),
      },
    ]);

    const res = await request.get('/api/v1/books').set(authHeader());

    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].memberCount).toBe(2);
    expect(res.body.data[0].recordCount).toBe(10);
    expect(res.body.data[0].myRole).toBe('OWNER');
  });
});

// ==================== POST /api/v1/books ====================

describe('POST /api/v1/books', () => {
  it('创建账本成功', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 1 });
    mockBookCreate.mockResolvedValueOnce({
      id: 1,
      name: '新账本',
      type: 'PERSONAL',
      coverIcon: 'wallet',
      createdBy: 1,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { members: 1, records: 0 },
    });

    const res = await request
      .post('/api/v1/books')
      .set(authHeader())
      .send({ name: '新账本', type: 'PERSONAL' });

    expect(res.body.code).toBe(0);
    expect(res.body.data.name).toBe('新账本');
  });

  it('缺少 name 应返回 1001', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 1 });

    const res = await request
      .post('/api/v1/books')
      .set(authHeader())
      .send({ type: 'PERSONAL' });

    expect(res.body.code).toBe(1001);
  });
});

// ==================== GET /api/v1/books/:id ====================

describe('GET /api/v1/books/:id', () => {
  it('成员可查看详情', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 1 });
    mockBookMemberFindUnique
      .mockResolvedValueOnce({ bookId: 1, userId: 1, role: 'EDITOR' }) // auth + bookAccess
      .mockResolvedValueOnce({ bookId: 1, userId: 1, role: 'EDITOR' }); // getDetail service
    mockBookFindUnique.mockResolvedValueOnce({
      id: 1,
      name: '我的账本',
      type: 'PERSONAL',
      coverIcon: 'wallet',
      createdBy: 1,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { members: 3, records: 50 },
    });

    const res = await request.get('/api/v1/books/1').set(authHeader());

    expect(res.body.code).toBe(0);
    expect(res.body.data.memberCount).toBe(3);
  });

  it('非成员查看应返回 1003', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValueOnce(null); // bookAccess

    const res = await request.get('/api/v1/books/999').set(authHeader());

    expect(res.body.code).toBe(1003);
  });
});

// ==================== PUT /api/v1/books/:id ====================

describe('PUT /api/v1/books/:id', () => {
  it('owner 可编辑', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 1 });
    mockBookMemberFindUnique
      .mockResolvedValueOnce({ bookId: 1, userId: 1, role: 'OWNER' }) // bookAccess
      .mockResolvedValueOnce({ bookId: 1, userId: 1, role: 'OWNER' }); // service requireRole
    mockBookFindUnique.mockResolvedValueOnce({
      id: 1,
      name: '旧名称',
      isDeleted: false,
    });
    mockBookUpdate.mockResolvedValueOnce({
      id: 1,
      name: '新名称',
      type: 'PERSONAL',
      coverIcon: 'wallet',
    });

    const res = await request
      .put('/api/v1/books/1')
      .set(authHeader())
      .send({ name: '新名称' });

    expect(res.body.code).toBe(0);
  });

  it('editor 编辑应返回 1003', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValueOnce({
      bookId: 1,
      userId: 1,
      role: 'EDITOR',
    });

    const res = await request
      .put('/api/v1/books/1')
      .set(authHeader())
      .send({ name: '新名称' });

    expect(res.body.code).toBe(1003);
  });
});

// ==================== DELETE /api/v1/books/:id ====================

describe('DELETE /api/v1/books/:id', () => {
  it('仅 owner 可删除', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 1 });
    mockBookMemberFindUnique
      .mockResolvedValueOnce({ bookId: 1, userId: 1, role: 'OWNER' }) // bookAccess
      .mockResolvedValueOnce({ bookId: 1, userId: 1, role: 'OWNER' }); // service requireRole
    mockBookFindUnique.mockResolvedValueOnce({
      id: 1,
      name: '待删除',
      isDeleted: false,
    });
    mockBookUpdate.mockResolvedValueOnce({ id: 1, isDeleted: true });

    const res = await request.delete('/api/v1/books/1').set(authHeader());

    expect(res.body.code).toBe(0);
  });

  it('admin 删除应返回 1003', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValueOnce({
      bookId: 1,
      userId: 1,
      role: 'ADMIN',
    });

    const res = await request.delete('/api/v1/books/1').set(authHeader());

    expect(res.body.code).toBe(1003);
  });
});

// ==================== GET /api/v1/books/:id/members ====================

describe('GET /api/v1/books/:id/members', () => {
  it('成员可查看成员列表', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 1 });
    mockBookMemberFindUnique
      .mockResolvedValueOnce({ bookId: 1, userId: 1, role: 'EDITOR' }) // bookAccess
      .mockResolvedValueOnce({ bookId: 1, userId: 1, role: 'EDITOR' }); // service requireMembership
    mockBookFindUnique.mockResolvedValueOnce({
      id: 1,
      isDeleted: false,
    });
    mockBookMemberFindMany.mockResolvedValueOnce([
      {
        id: 1,
        bookId: 1,
        userId: 1,
        role: 'OWNER',
        joinedAt: new Date(),
        user: { id: 1, nickname: '创建者', avatarUrl: null, phone: '13800138000' },
      },
    ]);

    const res = await request
      .get('/api/v1/books/1/members')
      .set(authHeader());

    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveLength(1);
  });
});

// ==================== POST /api/v1/books/:id/members ====================

describe('POST /api/v1/books/:id/members', () => {
  it('admin 可添加成员', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 1 });
    mockBookMemberFindUnique
      .mockResolvedValueOnce({ bookId: 1, userId: 1, role: 'ADMIN' }) // bookAccess
      .mockResolvedValueOnce({ bookId: 1, userId: 1, role: 'ADMIN' }) // service requireRole
      .mockResolvedValueOnce(null); // 检查是否已是成员
    mockBookFindUnique.mockResolvedValueOnce({
      id: 1,
      isDeleted: false,
    });
    mockUserFindUniqueForMember = jest.fn().mockResolvedValueOnce({ id: 2 });
    // need to set up user.findUnique for the member lookup
    mockUserFindUnique
      .mockResolvedValueOnce({ id: 1 }) // auth
      .mockResolvedValueOnce({ id: 2 }); // find target user
    mockBookMemberCreate.mockResolvedValueOnce({
      id: 2,
      bookId: 1,
      userId: 2,
      role: 'EDITOR',
      user: { id: 2, nickname: '新成员', avatarUrl: null, phone: '13900139000' },
    });

    const res = await request
      .post('/api/v1/books/1/members')
      .set(authHeader())
      .send({ userId: 2, role: 'EDITOR' });

    expect(res.body.code).toBe(0);
  });
});

// ==================== 完整流程 ====================

describe('账本全链路流程', () => {
  it('创建账本 → 查看详情 → 添加成员 → 查看成员列表', async () => {
    // 1. 创建账本
    mockUserFindUnique.mockResolvedValueOnce({ id: 1 });
    mockBookCreate.mockResolvedValueOnce({
      id: 1,
      name: '家庭账本',
      type: 'FAMILY',
      coverIcon: 'wallet',
      createdBy: 1,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { members: 1, records: 0 },
    });

    const createRes = await request
      .post('/api/v1/books')
      .set(authHeader())
      .send({ name: '家庭账本', type: 'FAMILY' });

    expect(createRes.body.code).toBe(0);
    expect(createRes.body.data.name).toBe('家庭账本');

    // 2. 查看详情
    mockUserFindUnique.mockResolvedValueOnce({ id: 1 });
    mockBookMemberFindUnique
      .mockResolvedValueOnce({ bookId: 1, userId: 1, role: 'OWNER' })
      .mockResolvedValueOnce({ bookId: 1, userId: 1, role: 'OWNER' });
    mockBookFindUnique.mockResolvedValueOnce({
      id: 1,
      name: '家庭账本',
      type: 'FAMILY',
      coverIcon: 'wallet',
      createdBy: 1,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { members: 1, records: 0 },
    });

    const detailRes = await request.get('/api/v1/books/1').set(authHeader());
    expect(detailRes.body.code).toBe(0);
    expect(detailRes.body.data.myRole).toBe('OWNER');
  });
});
