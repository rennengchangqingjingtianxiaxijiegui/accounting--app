// 报表模块集成测试 — 汇总 / 趋势 / 分类占比

// --------------- Mock Prisma ---------------
let mockUserFindUnique: jest.Mock;
let mockBookMemberFindUnique: jest.Mock;
let mockRecordGroupBy: jest.Mock;
let mockRecordFindMany: jest.Mock;
let mockCategoryFindMany: jest.Mock;

jest.mock('@prisma/client', () => {
  const mocks = {
    user: {
      findUnique: (...args: any[]) => mockUserFindUnique(...args),
    },
    bookMember: {
      findUnique: (...args: any[]) => mockBookMemberFindUnique(...args),
    },
    record: {
      groupBy: (...args: any[]) => mockRecordGroupBy(...args),
      findMany: (...args: any[]) => mockRecordFindMany(...args),
    },
    category: {
      findMany: (...args: any[]) => mockCategoryFindMany(...args),
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
  mockRecordGroupBy = jest.fn();
  mockRecordFindMany = jest.fn();
  mockCategoryFindMany = jest.fn();
  jest.clearAllMocks();
});

// ==================== GET /api/v1/books/:bid/reports/summary ====================

describe('GET /api/v1/books/:bid/reports/summary', () => {
  it('返回收入/支出/结余', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'VIEWER',
    });
    mockRecordGroupBy.mockResolvedValue([
      { type: 'INCOME', _sum: { amount: 5000 } },
      { type: 'EXPENSE', _sum: { amount: 3200.5 } },
    ]);

    const res = await request
      .get('/api/v1/books/1/reports/summary?period=month&date=2026-08')
      .set(authHeader());

    expect(res.body.code).toBe(0);
    expect(res.body.data.income).toBe('5000.00');
    expect(res.body.data.expense).toBe('3200.50');
    expect(res.body.data.balance).toBe('1799.50');
  });

  it('缺少 date 参数应返回 1001', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'VIEWER',
    });

    const res = await request
      .get('/api/v1/books/1/reports/summary?period=month')
      .set(authHeader());

    expect(res.body.code).toBe(1001);
  });

  it('未登录应返回 1002', async () => {
    const res = await request.get(
      '/api/v1/books/1/reports/summary?period=month&date=2026-08',
    );

    expect(res.body.code).toBe(1002);
  });

  it('非成员应返回 1003', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue(null);

    const res = await request
      .get('/api/v1/books/1/reports/summary?period=month&date=2026-08')
      .set(authHeader());

    expect(res.body.code).toBe(1003);
  });
});

// ==================== GET /api/v1/books/:bid/reports/trend ====================

describe('GET /api/v1/books/:bid/reports/trend', () => {
  it('返回按日聚合的趋势数据', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'VIEWER',
    });
    mockRecordFindMany.mockResolvedValue([
      { type: 'EXPENSE', amount: 30, recordDate: new Date('2026-08-01') },
      { type: 'INCOME', amount: 100, recordDate: new Date('2026-08-01') },
      { type: 'EXPENSE', amount: 50, recordDate: new Date('2026-08-15') },
    ]);

    const res = await request
      .get('/api/v1/books/1/reports/trend?period=month&date=2026-08')
      .set(authHeader());

    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].date).toBe('2026-08-01');
    expect(res.body.data[0].expense).toBe('30.00');
    expect(res.body.data[0].income).toBe('100.00');
  });

  it('year 模式正确处理', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'VIEWER',
    });
    mockRecordFindMany.mockResolvedValue([]);

    const res = await request
      .get('/api/v1/books/1/reports/trend?period=year&date=2026')
      .set(authHeader());

    expect(res.body.code).toBe(0);
    expect(res.body.data).toEqual([]);
  });
});

// ==================== GET /api/v1/books/:bid/reports/category ====================

describe('GET /api/v1/books/:bid/reports/category', () => {
  it('返回分类占比（支出）', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'VIEWER',
    });
    mockRecordGroupBy.mockResolvedValue([
      { categoryId: 1, _sum: { amount: 600 } },
      { categoryId: 2, _sum: { amount: 400 } },
    ]);
    mockCategoryFindMany.mockResolvedValue([
      { id: 1, name: '餐饮', icon: 'food' },
      { id: 2, name: '交通', icon: 'transport' },
    ]);

    const res = await request
      .get(
        '/api/v1/books/1/reports/category?period=month&date=2026-08&type=EXPENSE',
      )
      .set(authHeader());

    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].categoryName).toBe('餐饮');
    expect(res.body.data[0].percent).toBe(60);
    expect(res.body.data[1].percent).toBe(40);
  });

  it('默认查询支出分类占比', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'VIEWER',
    });
    mockRecordGroupBy.mockResolvedValue([]);
    mockCategoryFindMany.mockResolvedValue([]);

    await request
      .get('/api/v1/books/1/reports/category?period=month&date=2026-08')
      .set(authHeader());

    expect(mockRecordGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'EXPENSE' }),
      }),
    );
  });
});

// ==================== 报表全链路 ====================

describe('报表全链路流程', () => {
  it('汇总 → 趋势 → 分类占比 数据一致性', async () => {
    // 1. 汇总
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'VIEWER',
    });
    mockRecordGroupBy.mockResolvedValue([
      { type: 'INCOME', _sum: { amount: 200 } },
      { type: 'EXPENSE', _sum: { amount: 150 } },
    ]);

    const summaryRes = await request
      .get('/api/v1/books/1/reports/summary?period=month&date=2026-08')
      .set(authHeader());

    expect(summaryRes.body.data.income).toBe('200.00');
    expect(summaryRes.body.data.expense).toBe('150.00');
    expect(summaryRes.body.data.balance).toBe('50.00');

    // 2. 趋势
    mockUserFindUnique.mockResolvedValue({ id: 1 });
    mockBookMemberFindUnique.mockResolvedValue({
      bookId: 1,
      userId: 1,
      role: 'VIEWER',
    });
    mockRecordFindMany.mockResolvedValue([
      { type: 'INCOME', amount: 200, recordDate: new Date('2026-08-01') },
      { type: 'EXPENSE', amount: 150, recordDate: new Date('2026-08-01') },
    ]);

    const trendRes = await request
      .get('/api/v1/books/1/reports/trend?period=month&date=2026-08')
      .set(authHeader());

    expect(trendRes.body.data).toHaveLength(1);
    expect(trendRes.body.data[0].income).toBe('200.00');
    expect(trendRes.body.data[0].expense).toBe('150.00');
  });
});
