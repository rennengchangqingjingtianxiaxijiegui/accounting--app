// 记账服务单元测试

import { RecordService } from '../../src/services/record.service';
import { PermissionError, NotFoundError, ValidationError } from '../../src/utils/errors';
import { MemberRole } from '@prisma/client';

function mockPrisma(overrides: Record<string, any> = {}) {
  return {
    record: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      ...overrides.record,
    },
    bookMember: {
      findUnique: jest.fn(),
      ...overrides.bookMember,
    },
    category: {
      findUnique: jest.fn(),
      ...overrides.category,
    },
    ...overrides,
  } as any;
}

function member(role: MemberRole) {
  return { id: 10, bookId: 1, userId: 1, role, joinedAt: new Date() };
}

function category(id = 1, bookId: number | null = null) {
  return { id, name: '餐饮', type: 'EXPENSE', icon: 'food', bookId, isDefault: bookId === null };
}

function record(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    bookId: 1,
    userId: 1,
    categoryId: 1,
    type: 'EXPENSE',
    amount: 50.0,
    note: '午餐',
    recordDate: new Date('2026-08-01'),
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 1, name: '餐饮', type: 'EXPENSE', icon: 'food', isDefault: true },
    user: { id: 1, nickname: '测试用户', avatarUrl: null },
    ...overrides,
  };
}

describe('RecordService', () => {
  describe('create()', () => {
    it('editor+ 可添加记录，金额以字符串返回', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member(MemberRole.EDITOR)),
        },
        category: {
          findUnique: jest.fn().mockResolvedValue(category(1)),
        },
        record: {
          create: jest.fn().mockResolvedValue(record()),
        },
      });
      const service = new RecordService(prisma);

      const result = await service.create(1, 1, {
        type: 'EXPENSE',
        amount: '50.00',
        categoryId: 1,
        note: '午餐',
        recordDate: '2026-08-01',
      });

      expect(result.amount).toBe('50');
      expect(prisma.record.create).toHaveBeenCalled();
    });

    it('viewer 不能添加记录', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member(MemberRole.VIEWER)),
        },
      });
      const service = new RecordService(prisma);

      await expect(
        service.create(1, 1, {
          type: 'EXPENSE',
          amount: '50',
          categoryId: 1,
          note: '',
          recordDate: '2026-08-01',
        }),
      ).rejects.toThrow(PermissionError);
    });

    it('不存在的分类应抛出 ValidationError', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member(MemberRole.EDITOR)),
        },
        category: { findUnique: jest.fn().mockResolvedValue(null) },
      });
      const service = new RecordService(prisma);

      await expect(
        service.create(1, 1, {
          type: 'EXPENSE',
          amount: '50',
          categoryId: 999,
          note: '',
          recordDate: '2026-08-01',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getList()', () => {
    it('返回游标分页记录（hasMore=false 时恰好 limit 条）', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member(MemberRole.EDITOR)),
        },
        record: {
          findMany: jest.fn().mockResolvedValue([record(), record({ id: 2 })]),
        },
      });
      const service = new RecordService(prisma);

      const result = await service.getList(1, 1, { limit: 20 });

      expect(result.list).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('hasMore=true 时返回 limit 条记录，nextCursor 指向最后一条 id', async () => {
      const records = Array.from({ length: 21 }, (_, i) => record({ id: i + 1 }));
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member(MemberRole.EDITOR)),
        },
        record: { findMany: jest.fn().mockResolvedValue(records) },
      });
      const service = new RecordService(prisma);

      const result = await service.getList(1, 1, { limit: 20 });

      expect(result.list).toHaveLength(20);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe(20);
    });

    it('按类型筛选', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member(MemberRole.EDITOR)),
        },
        record: { findMany: jest.fn().mockResolvedValue([]) },
      });
      const service = new RecordService(prisma);

      await service.getList(1, 1, { limit: 20, type: 'EXPENSE' });

      expect(prisma.record.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'EXPENSE' }),
        }),
      );
    });
  });

  describe('getDetail()', () => {
    it('成员可查看记录详情', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member(MemberRole.VIEWER)),
        },
        record: { findFirst: jest.fn().mockResolvedValue(record()) },
      });
      const service = new RecordService(prisma);

      const result = await service.getDetail(1, 1, 1);

      expect(result.amount).toBeDefined();
    });

    it('记录不存在应抛出 NotFoundError', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member(MemberRole.EDITOR)),
        },
        record: { findFirst: jest.fn().mockResolvedValue(null) },
      });
      const service = new RecordService(prisma);

      await expect(service.getDetail(999, 1, 1)).rejects.toThrow(NotFoundError);
    });
  });

  describe('update()', () => {
    it('本人可编辑自己的记录', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member(MemberRole.EDITOR)),
        },
        record: {
          findFirst: jest.fn().mockResolvedValue(record({ userId: 1 })),
          update: jest.fn().mockResolvedValue(record({ amount: 100.0 })),
        },
        category: { findUnique: jest.fn().mockResolvedValue(category(2)) },
      });
      const service = new RecordService(prisma);

      const result = await service.update(1, 1, 1, { amount: '100.00', categoryId: 2 });

      expect(prisma.record.update).toHaveBeenCalled();
    });

    it('admin 可编辑他人记录', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member(MemberRole.ADMIN)),
        },
        record: {
          findFirst: jest.fn().mockResolvedValue(record({ userId: 2 })),
          update: jest.fn().mockResolvedValue(record({ amount: 100.0 })),
        },
      });
      const service = new RecordService(prisma);

      await service.update(1, 1, 1, { amount: '100.00' });

      expect(prisma.record.update).toHaveBeenCalled();
    });

    it('editor 不能编辑他人记录', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member(MemberRole.EDITOR)),
        },
        record: {
          findFirst: jest.fn().mockResolvedValue(record({ userId: 2 })),
        },
      });
      const service = new RecordService(prisma);

      await expect(service.update(1, 1, 1, { amount: '100.00' })).rejects.toThrow(
        PermissionError,
      );
    });
  });

  describe('delete()', () => {
    it('软删除成功', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member(MemberRole.EDITOR)),
        },
        record: {
          findFirst: jest.fn().mockResolvedValue(record({ userId: 1 })),
          update: jest.fn().mockResolvedValue(record({ isDeleted: true })),
        },
      });
      const service = new RecordService(prisma);

      await service.delete(1, 1, 1);

      expect(prisma.record.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isDeleted: true } }),
      );
    });

    it('editor 不能删除他人记录', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(member(MemberRole.EDITOR)),
        },
        record: {
          findFirst: jest.fn().mockResolvedValue(record({ userId: 2 })),
        },
      });
      const service = new RecordService(prisma);

      await expect(service.delete(1, 1, 1)).rejects.toThrow(PermissionError);
    });
  });
});
