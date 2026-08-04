import { PrismaClient, Prisma } from '@prisma/client';
import { PermissionError, NotFoundError } from '../utils/errors';

export interface ReportQuery {
  period: 'month' | 'year';
  date: string; // YYYY-MM 或 YYYY
  type?: 'INCOME' | 'EXPENSE';
}

export interface SummaryData {
  income: string;
  expense: string;
  balance: string;
}

export interface TrendItem {
  date: string;
  income: string;
  expense: string;
}

export interface CategoryItem {
  categoryId: number;
  categoryName: string;
  icon: string;
  amount: string;
  percent: number;
}

export class ReportService {
  constructor(private prisma: PrismaClient) {}

  /** 收支汇总：给定账本/时间段，返回 收入/支出/结余 */
  async getSummary(bookId: number, userId: number, query: ReportQuery): Promise<SummaryData> {
    await this.requireMembership(bookId, userId);
    const { startDate, endDate } = this.resolveDateRange(query);

    const result = await this.prisma.record.groupBy({
      by: ['type'],
      where: {
        bookId,
        isDeleted: false,
        recordDate: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    let income = 0;
    let expense = 0;
    for (const row of result) {
      const sum = Number(row._sum.amount ?? 0);
      if (row.type === 'INCOME') income = sum;
      else expense = sum;
    }

    return {
      income: income.toFixed(2),
      expense: expense.toFixed(2),
      balance: (income - expense).toFixed(2),
    };
  }

  /** 收支趋势：按日聚合，返回每一天的收入/支出 */
  async getTrend(bookId: number, userId: number, query: ReportQuery): Promise<TrendItem[]> {
    await this.requireMembership(bookId, userId);
    const { startDate, endDate } = this.resolveDateRange(query);

    const records = await this.prisma.record.findMany({
      where: {
        bookId,
        isDeleted: false,
        recordDate: { gte: startDate, lte: endDate },
      },
      select: { type: true, amount: true, recordDate: true },
      orderBy: { recordDate: 'asc' },
    });

    // 按日期聚合
    const map = new Map<string, { income: number; expense: number }>();
    for (const r of records) {
      const key = r.recordDate.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
      const entry = map.get(key)!;
      if (r.type === 'INCOME') entry.income += Number(r.amount);
      else entry.expense += Number(r.amount);
    }

    return Array.from(map.entries()).map(([date, val]) => ({
      date,
      income: val.income.toFixed(2),
      expense: val.expense.toFixed(2),
    }));
  }

  /** 分类占比：按分类聚合金额，计算百分比 */
  async getCategory(bookId: number, userId: number, query: ReportQuery): Promise<CategoryItem[]> {
    await this.requireMembership(bookId, userId);
    const recordType: 'INCOME' | 'EXPENSE' = query.type || 'EXPENSE';
    const { startDate, endDate } = this.resolveDateRange(query);

    const result = await this.prisma.record.groupBy({
      by: ['categoryId'],
      where: {
        bookId,
        isDeleted: false,
        type: recordType as any,
        recordDate: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const total = result.reduce((acc, r) => acc + Number(r._sum.amount ?? 0), 0);

    // 查询分类名称和图标
    const categoryIds = result.map((r) => r.categoryId);
    const categories =
      categoryIds.length > 0
        ? await this.prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, icon: true },
          })
        : [];

    const catMap = new Map(categories.map((c) => [c.id, c]));

    return result.map((r) => {
      const amount = Number(r._sum.amount ?? 0);
      const cat = catMap.get(r.categoryId);
      return {
        categoryId: r.categoryId,
        categoryName: cat?.name ?? '未知',
        icon: cat?.icon ?? '',
        amount: amount.toFixed(2),
        percent: total > 0 ? Math.round((amount / total) * 10000) / 100 : 0,
      };
    });
  }

  // ==================== 私有辅助 ====================

  private async requireMembership(bookId: number, userId: number) {
    const member = await this.prisma.bookMember.findUnique({
      where: { bookId_userId: { bookId, userId } },
    });
    if (!member) throw new PermissionError('你不是该账本的成员');
    return member;
  }

  private resolveDateRange(query: ReportQuery): { startDate: Date; endDate: Date } {
    let startDate: Date;
    let endDate: Date;

    if (query.period === 'year') {
      const year = parseInt(query.date, 10);
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    } else {
      const [y, m] = query.date.split('-').map(Number);
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0, 23, 59, 59);
    }

    return { startDate, endDate };
  }
}
