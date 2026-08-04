// 账本服务单元测试

import { BookService } from '../../src/services/book.service';
import { PermissionError, NotFoundError, ConflictError } from '../../src/utils/errors';
import { MemberRole } from '@prisma/client';

function mockPrisma(overrides: Record<string, any> = {}) {
  return {
    book: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      ...overrides.book,
    },
    bookMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      ...overrides.bookMember,
    },
    user: {
      findUnique: jest.fn(),
      ...overrides.user,
    },
    ...overrides,
  } as any;
}

// 辅助工厂
function memberEntry(bookId: number, userId: number, role: MemberRole, id = 1) {
  return { id, bookId, userId, role, joinedAt: new Date() };
}

function bookEntry(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    name: '我的账本',
    type: 'PERSONAL',
    coverIcon: 'wallet',
    createdBy: 1,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { members: 1, records: 0 },
    ...overrides,
  };
}

describe('BookService', () => {
  describe('getList()', () => {
    it('应返回用户的所有账本（含成职数和记录数）', async () => {
      const membership = {
        book: bookEntry({ _count: { members: 2, records: 5 } }),
        role: MemberRole.OWNER,
        joinedAt: new Date(),
      };
      const prisma = mockPrisma({
        bookMember: {
          findMany: jest.fn().mockResolvedValue([membership]),
        },
      });
      const service = new BookService(prisma);

      const result = await service.getList(1);

      expect(result).toHaveLength(1);
      expect(result[0].memberCount).toBe(2);
      expect(result[0].recordCount).toBe(5);
      expect(result[0].myRole).toBe('OWNER');
    });

    it('无账本时返回空数组', async () => {
      const prisma = mockPrisma({
        bookMember: { findMany: jest.fn().mockResolvedValue([]) },
      });
      const service = new BookService(prisma);

      const result = await service.getList(1);

      expect(result).toEqual([]);
    });
  });

  describe('create()', () => {
    it('创建账本并自动设置创建者为 owner', async () => {
      const createdBook = bookEntry({ _count: { members: 1, records: 0 } });
      const prisma = mockPrisma({
        book: {
          create: jest.fn().mockResolvedValue(createdBook),
        },
      });
      const service = new BookService(prisma);

      const result = await service.create(1, { name: '新账本', type: 'FAMILY' });

      expect(result.name).toBe('我的账本');
      expect(result.myRole).toBe('OWNER');
      expect(prisma.book.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdBy: 1,
            members: { create: { userId: 1, role: MemberRole.OWNER } },
          }),
        }),
      );
    });
  });

  describe('getDetail()', () => {
    it('成员可查看账本详情', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(memberEntry(1, 1, MemberRole.EDITOR)),
        },
        book: {
          findUnique: jest.fn().mockResolvedValue(bookEntry()),
        },
      });
      const service = new BookService(prisma);

      const result = await service.getDetail(1, 1);

      expect(result.myRole).toBe(MemberRole.EDITOR);
    });

    it('非成员查看应抛出 PermissionError', async () => {
      const prisma = mockPrisma({
        bookMember: { findUnique: jest.fn().mockResolvedValue(null) },
      });
      const service = new BookService(prisma);

      await expect(service.getDetail(1, 999)).rejects.toThrow(PermissionError);
    });

    it('已删除账本应抛出 NotFoundError', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(memberEntry(1, 1, MemberRole.EDITOR)),
        },
        book: {
          findUnique: jest.fn().mockResolvedValue(bookEntry({ isDeleted: true })),
        },
      });
      const service = new BookService(prisma);

      await expect(service.getDetail(1, 1)).rejects.toThrow(NotFoundError);
    });
  });

  describe('update()', () => {
    it('owner 可编辑账本', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(memberEntry(1, 1, MemberRole.OWNER)),
        },
        book: {
          findUnique: jest.fn().mockResolvedValue(bookEntry()),
          update: jest.fn().mockResolvedValue(bookEntry({ name: '新名称' })),
        },
      });
      const service = new BookService(prisma);

      await service.update(1, 1, { name: '新名称' });
      expect(prisma.book.update).toHaveBeenCalled();
    });

    it('editor 编辑应抛出 PermissionError', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(memberEntry(1, 1, MemberRole.EDITOR)),
        },
      });
      const service = new BookService(prisma);

      await expect(service.update(1, 1, { name: '改名' })).rejects.toThrow(
        PermissionError,
      );
    });
  });

  describe('delete()', () => {
    it('仅 owner 可删除（软删除）', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(memberEntry(1, 1, MemberRole.OWNER)),
        },
        book: {
          findUnique: jest.fn().mockResolvedValue(bookEntry()),
          update: jest.fn().mockResolvedValue(bookEntry({ isDeleted: true })),
        },
      });
      const service = new BookService(prisma);

      await service.delete(1, 1);

      expect(prisma.book.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isDeleted: true } }),
      );
    });

    it('非 owner 删除应抛出 PermissionError', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest.fn().mockResolvedValue(memberEntry(1, 1, MemberRole.ADMIN)),
        },
      });
      const service = new BookService(prisma);

      await expect(service.delete(1, 1)).rejects.toThrow(PermissionError);
    });
  });

  describe('addMember()', () => {
    it('admin 可添加成员', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce(memberEntry(1, 1, MemberRole.ADMIN)) // requireRole
            .mockResolvedValueOnce(null), // 检查是否已是成员
          create: jest.fn().mockResolvedValue({ id: 2 }),
        },
        book: { findUnique: jest.fn().mockResolvedValue(bookEntry()) },
        user: { findUnique: jest.fn().mockResolvedValue({ id: 2 }) },
      });
      const service = new BookService(prisma);

      await service.addMember(1, 1, 2, MemberRole.EDITOR);

      expect(prisma.bookMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { bookId: 1, userId: 2, role: MemberRole.EDITOR },
        }),
      );
    });

    it('重复添加成员应抛出 ConflictError', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce(memberEntry(1, 1, MemberRole.ADMIN)) // requireRole
            .mockResolvedValueOnce(memberEntry(1, 2, MemberRole.EDITOR)), // 已是成员
        },
        book: { findUnique: jest.fn().mockResolvedValue(bookEntry()) },
        user: { findUnique: jest.fn().mockResolvedValue({ id: 2 }) },
      });
      const service = new BookService(prisma);

      await expect(service.addMember(1, 1, 2, MemberRole.EDITOR)).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe('removeMember()', () => {
    it('不能移除 owner', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce(memberEntry(1, 1, MemberRole.ADMIN)) // 操作者
            .mockResolvedValueOnce(memberEntry(1, 2, MemberRole.OWNER, 2)), // 目标——owner
        },
      });
      const service = new BookService(prisma);

      await expect(service.removeMember(1, 1, 2)).rejects.toThrow(PermissionError);
    });

    it('不能移除自己', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce(memberEntry(1, 1, MemberRole.ADMIN))
            .mockResolvedValueOnce(memberEntry(1, 1, MemberRole.ADMIN)),
        },
      });
      const service = new BookService(prisma);

      await expect(service.removeMember(1, 1, 1)).rejects.toThrow(PermissionError);
    });
  });

  describe('updateMemberRole()', () => {
    it('不能修改 owner 的角色', async () => {
      const prisma = mockPrisma({
        bookMember: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce(memberEntry(1, 1, MemberRole.OWNER)) // 操作者
            .mockResolvedValueOnce(memberEntry(1, 2, MemberRole.OWNER, 2)), // 目标——owner
        },
      });
      const service = new BookService(prisma);

      await expect(
        service.updateMemberRole(1, 1, 2, MemberRole.EDITOR),
      ).rejects.toThrow(PermissionError);
    });
  });
});
