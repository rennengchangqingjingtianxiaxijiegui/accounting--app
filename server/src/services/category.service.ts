import { PrismaClient } from '@prisma/client';

export class CategoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 获取分类列表
   * - type 可选筛选 INCOME/EXPENSE
   * - bookId 可选获取该账本专属分类 + 全局默认分类
   */
  async getList(type?: string, bookId?: number) {
    const where: any = {};

    if (type) where.type = type;

    // 该账本的专属分类 + 全局默认分类
    if (bookId) {
      where.OR = [{ bookId }, { bookId: null, isDefault: true }];
    } else {
      // 未指定账本时只返回全局默认分类
      where.isDefault = true;
      where.bookId = null;
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
    });

    return categories;
  }
}
