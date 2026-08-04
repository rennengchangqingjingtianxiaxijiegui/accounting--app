// 记账模块集成测试 — 完整 HTTP 链路

// --------------- Mock Prisma ---------------
let mockUserFindUnique: jest.Mock;
let mockBookMemberFindUnique: jest.Mock;
let mockRecordFindMany: jest.Mock;
let mockRecordFindFirst: jest.Mock;
let mockRecordCreate: jest.Mock;
let mockRecordUpdate: jest.Mock;
let mockCategoryFindUnique: jest.Mock;

jest.mock('@prisma/client', () => {
  const mocks = {
    user: {
      findUnique: (...args: any[]) => mockUserFindUnique(...args),
    },
    bookMember: {
      findUnique: (...args: any[]) => mockBookMemberFindUnique(...args),
    },
    record: {
      findMany: (...args: any[]) => mockRecordFindMany(...args),
      findFirst: (...args: any[]) => mockRecordFindFirst(...args),
      create: (...args: any[]) => mockRecordCreate(...args),
      update: (...args: any[]) => mockRecordUpdate(...args),
    },
    category: {
      findUnique: (...args: any[]) => mockCategoryFindUnique(...args),
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

function authHeader(userId = 1) {
  const token = jwt.sign(
    { id: userId, phone: '13800138000' },
    'test-access-secret-at-least-32-chars!!',
    { expiresIn: '15m' },
  );
  return { Authorization: `Bearer ${token}` };
}

beforeEach(() => {
  mockUserFindUnique = jest.fn();
  mockBookMemberFindUnique = jest.fn();
  mockRecordFindMany = jest.fn();
  mockRecordFindFirst = jest.fn();
  mockRecordCreate = jest.fn();
  mockRecordUpdate = jest.fn();
  mockCategoryFindUnique = jest.fn();
  jest.clearAllMocks();
});

// ==================== GET /api/v1/books/:bid/records ====================

describe('GET /api/v1/books/:bid/records', () => {
  it('返回分页记录列表', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'EDITOR',
    });
    mockRecordFindMany.mockResolvedValue([
      {
        id: 1,
        bookId: 1,
        userId: 1,
        categoryId: 1,
        type: 'EXPENSE',
        amount: 50,
        note: '午餐',
        recordDate: new Date('2026-08-01'),
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: { id: 1, name: '餐饮', type: 'EXPENSE', icon: 'food', isDefault: true },
        user: { id: 1, nickname: '测试用户', avatarUrl: null },
      },
    ]);

    const res = await request
      .get('/api/v1/books/1/records')
      .set(authHeader());

    expect(res.body.code).toBe(0);
    expect(res.body.data.list).toHaveLength(1);
    expect(res.body.data.list[0].amount).toBe('50');
  });

  it('未登录应返回 1002', async () => {
    const res = await request.get('/api/v1/books/1/records');
    expect(res.body.code).toBe(1002);
  });

  it('日期范围筛选', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'EDITOR',
    });
    mockRecordFindMany.mockResolvedValue([]);

    await request
      .get('/api/v1/books/1/records?startDate=2026-08-01&endDate=2026-08-31')
      .set(authHeader());

    expect(mockRecordFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recordDate: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    );
  });
});

// ==================== POST /api/v1/books/:bid/records ====================

describe('POST /api/v1/books/:bid/records', () => {
  it('添加记录成功', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'EDITOR',
    });
    mockCategoryFindUnique.mockResolvedValue({
      id: 1,
      name: '餐饮',
      bookId: null,
    });
    mockRecordCreate.mockResolvedValue({
      id: 1,
      bookId: 1,
      userId: 1,
      categoryId: 1,
      type: 'EXPENSE',
      amount: 50,
      note: '午餐',
      recordDate: new Date('2026-08-01'),
      category: { id: 1, name: '餐饮', type: 'EXPENSE', icon: 'food', isDefault: true },
      user: { id: 1, nickname: '测试用户', avatarUrl: null },
    });

    const res = await request
      .post('/api/v1/books/1/records')
      .set(authHeader())
      .send({
        type: 'EXPENSE',
        amount: '50.00',
        categoryId: 1,
        note: '午餐',
        recordDate: '2026-08-01',
      });

    expect(res.body.code).toBe(0);
    expect(res.body.data.amount).toBe('50');
  });

  it('缺少必填字段应返回 1001', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'EDITOR',
    });

    const res = await request
      .post('/api/v1/books/1/records')
      .set(authHeader())
      .send({ type: 'EXPENSE' });

    expect(res.body.code).toBe(1001);
  });

  it('viewer 无法添加应返回 1003', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'VIEWER',
    });

    const res = await request
      .post('/api/v1/books/1/records')
      .set(authHeader())
      .send({
        type: 'EXPENSE',
        amount: '50.00',
        categoryId: 1,
        note: '',
        recordDate: '2026-08-01',
      });

    expect(res.body.code).toBe(1003);
  });
});

// ==================== GET /api/v1/books/:bid/records/:id ====================

describe('GET /api/v1/books/:bid/records/:id', () => {
  it('成员可查看记录详情', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'VIEWER',
    });
    mockRecordFindFirst.mockResolvedValue({
      id: 1,
      bookId: 1,
      userId: 1,
      categoryId: 1,
      type: 'EXPENSE',
      amount: 50,
      note: '午餐',
      recordDate: new Date('2026-08-01'),
      isDeleted: false,
      category: { id: 1, name: '餐饮', type: 'EXPENSE', icon: 'food', isDefault: true },
      user: { id: 1, nickname: '测试用户', avatarUrl: null },
    });

    const res = await request
      .get('/api/v1/books/1/records/1')
      .set(authHeader());

    expect(res.body.code).toBe(0);
    expect(res.body.data.amount).toBe('50');
  });

  it('记录不存在应返回 1004', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'EDITOR',
    });
    mockRecordFindFirst.mockResolvedValue(null);

    const res = await request
      .get('/api/v1/books/1/records/999')
      .set(authHeader());

    expect(res.body.code).toBe(1004);
  });
});

// ==================== PUT /api/v1/books/:bid/records/:id ====================

describe('PUT /api/v1/books/:bid/records/:id', () => {
  it('编辑自己的记录成功', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'EDITOR',
    });
    mockRecordFindFirst.mockResolvedValue({
      id: 1,
      bookId: 1,
      userId: 1,
      isDeleted: false,
    });
    mockRecordUpdate.mockResolvedValue({
      id: 1,
      bookId: 1,
      userId: 1,
      categoryId: 1,
      type: 'EXPENSE',
      amount: 100,
      note: '修改后',
      recordDate: new Date('2026-08-01'),
      category: { id: 1, name: '餐饮', type: 'EXPENSE', icon: 'food', isDefault: true },
      user: { id: 1, nickname: '测试用户', avatarUrl: null },
    });

    const res = await request
      .put('/api/v1/books/1/records/1')
      .set(authHeader())
      .send({ amount: '100.00', note: '修改后' });

    expect(res.body.code).toBe(0);
  });

  it('非本人编辑他人记录应返回 1003（editor）', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'EDITOR',
    });
    mockRecordFindFirst.mockResolvedValue({
      id: 1,
      bookId: 1,
      userId: 2,
      isDeleted: false,
    });

    const res = await request
      .put('/api/v1/books/1/records/1')
      .set(authHeader())
      .send({ amount: '100.00' });

    expect(res.body.code).toBe(1003);
  });
});

// ==================== DELETE /api/v1/books/:bid/records/:id ====================

describe('DELETE /api/v1/books/:bid/records/:id', () => {
  it('删除自己的记录（软删除）成功', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'EDITOR',
    });
    mockRecordFindFirst.mockResolvedValue({
      id: 1,
      bookId: 1,
      userId: 1,
      isDeleted: false,
    });
    mockRecordUpdate.mockResolvedValue({ id: 1, isDeleted: true });

    const res = await request
      .delete('/api/v1/books/1/records/1')
      .set(authHeader());

    expect(res.body.code).toBe(0);
  });

  it('viewer 删除应返回 1003', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'VIEWER',
    });

    const res = await request
      .delete('/api/v1/books/1/records/1')
      .set(authHeader());

    expect(res.body.code).toBe(1003);
  });
});
