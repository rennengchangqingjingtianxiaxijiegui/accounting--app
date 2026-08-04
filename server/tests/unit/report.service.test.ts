// 报表服务单元测试

import { ReportService } from '../../src/services/report.service';
import { PermissionError } from '../../src/utils/errors';

function mockPrisma(overrides: Record<string, any> = {}) {
  return {
    record: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
      ...overrides.record,
    },
    bookMember: {
      findUnique: jest.fn(),
      ...overrides.bookMember,
    },
    category: {
      findMany: jest.fn(),
      ...overrides.category,
    },
    ...overrides,
  } as any;
}

function member() {
  return { id: 10, bookId: 1, userId: 1, role: 'EDITOR', joinedAt: new Date() };
}

describe('ReportService', () => {
  describe('getSummary()', () => {
    it('应返回 income/expense/balance', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member()),
        },
        record: {
          groupBy: jest.fn().mockResolvedValue([
            { type: 'INCOME', _sum: { amount: 1000.5 } },
            { type: 'EXPENSE', _sum: { amount: 300.25 } },
          ]),
        },
      });
      const service = new ReportService(prisma);

      const result = await service.getSummary(1, 1, {
        period: 'month',
        date: '2026-08',
      });

      expect(result.income).toBe('1000.50');
      expect(result.expense).toBe('300.25');
      expect(result.balance).toBe('700.25');
    });

    it('无记录时应返回 0', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member()),
        },
        record: {
          groupBy: jest.fn().mockResolvedValue([]),
        },
      });
      const service = new ReportService(prisma);

      const result = await service.getSummary(1, 1, {
        period: 'month',
        date: '2026-08',
      });

      expect(result.income).toBe('0.00');
      expect(result.expense).toBe('0.00');
      expect(result.balance).toBe('0.00');
    });

    it('非成员应抛出 PermissionError', async () => {
      const prisma = mockPrisma({
        bookMember: { findUnique: jest.fn().mockResolvedValue(null) },
      });
      const service = new ReportService(prisma);

      await expect(
        service.getSummary(1, 999, { period: 'month', date: '2026-08' }),
      ).rejects.toThrow(PermissionError);
    });
  });

  describe('getTrend()', () => {
    it('按日期聚合返回趋势数据', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member()),
        },
        record: {
          findMany: jest.fn().mockResolvedValue([
            { type: 'EXPENSE', amount: 50, recordDate: new Date('2026-08-01') },
            { type: 'EXPENSE', amount: 30, recordDate: new Date('2026-08-01') },
            { type: 'INCOME', amount: 200, recordDate: new Date('2026-08-02') },
          ]),
        },
      });
      const service = new ReportService(prisma);

      const result = await service.getTrend(1, 1, {
        period: 'month',
        date: '2026-08',
      });

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-08-01');
      expect(result[0].expense).toBe('80.00');
      expect(result[1].income).toBe('200.00');
    });

    it('year 模式正确处理全年', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member()),
        },
        record: { findMany: jest.fn().mockResolvedValue([]) },
      });
      const service = new ReportService(prisma);

      await service.getTrend(1, 1, { period: 'year', date: '2026' });

      expect(prisma.record.findMany).toHaveBeenCalledWith(
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

  describe('getCategory()', () => {
    it('按分类聚合金额并计算百分比', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member()),
        },
        record: {
          groupBy: jest.fn().mockResolvedValue([
            { categoryId: 1, _sum: { amount: 60 } },
            { categoryId: 2, _sum: { amount: 40 } },
          ]),
        },
        category: {
          findMany: jest.fn().mockResolvedValue([
            { id: 1, name: '餐饮', icon: 'food' },
            { id: 2, name: '交通', icon: 'transport' },
          ]),
        },
      });
      const service = new ReportService(prisma);

      const result = await service.getCategory(1, 1, {
        period: 'month',
        date: '2026-08',
        type: 'EXPENSE',
      });

      expect(result).toHaveLength(2);
      expect(result[0].categoryName).toBe('餐饮');
      expect(result[0].percent).toBe(60);
      expect(result[1].percent).toBe(40);
    });

    it('默认 type 为 EXPENSE', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member()),
        },
        record: {
          groupBy: jest.fn().mockResolvedValue([]),
        },
        category: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      });
      const service = new ReportService(prisma);

      await service.getCategory(1, 1, {
        period: 'month',
        date: '2026-08',
      });

      expect(prisma.record.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'EXPENSE' }),
        }),
      );
    });
  });
});
