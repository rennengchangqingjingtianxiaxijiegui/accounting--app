// 分类服务单元测试

import { CategoryService } from '../../src/services/category.service';

function mockPrisma(categories: any[]) {
  return {
    category: {
      findMany: jest.fn().mockResolvedValue(categories),
    },
  } as any;
}

const defaultCategories = [
  { id: 1, name: '餐饮', type: 'EXPENSE', icon: 'food', isDefault: true, bookId: null, sortOrder: 0 },
  { id: 2, name: '交通', type: 'EXPENSE', icon: 'transport', isDefault: true, bookId: null, sortOrder: 1 },
  { id: 10, name: '工资', type: 'INCOME', icon: 'salary', isDefault: true, bookId: null, sortOrder: 0 },
];

const bookCategories = [
  { id: 100, name: '自定义支出', type: 'EXPENSE', icon: 'custom', isDefault: false, bookId: 5, sortOrder: 0 },
];

describe('CategoryService', () => {
  describe('getList()', () => {
    it('未指定 bookId 时仅返回全局默认分类', async () => {
      const prisma = mockPrisma(defaultCategories);
      const service = new CategoryService(prisma);

      const result = await service.getList();

      expect(result).toHaveLength(3);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { isDefault: true, bookId: null },
        orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
      });
    });

    it('type 筛选支出分类', async () => {
      const expenseOnly = defaultCategories.filter((c) => c.type === 'EXPENSE');
      const prisma = mockPrisma(expenseOnly);
      const service = new CategoryService(prisma);

      const result = await service.getList('EXPENSE');

      expect(result).toHaveLength(2);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'EXPENSE', isDefault: true, bookId: null },
        }),
      );
    });

    it('指定 bookId 时返回全局默认 + 该账本专属分类', async () => {
      const prisma = mockPrisma([...defaultCategories, ...bookCategories]);
      const service = new CategoryService(prisma);

      const result = await service.getList(undefined, 5);

      expect(result).toHaveLength(4);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: [{ bookId: 5 }, { bookId: null, isDefault: true }] },
        }),
      );
    });

    it('指定 bookId + type 筛选', async () => {
      const prisma = mockPrisma(bookCategories);
      const service = new CategoryService(prisma);

      await service.getList('EXPENSE', 5);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: 'EXPENSE',
            OR: [{ bookId: 5 }, { bookId: null, isDefault: true }],
          },
        }),
      );
    });
  });
});
