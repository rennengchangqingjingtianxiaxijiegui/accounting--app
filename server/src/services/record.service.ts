import { PrismaClient, MemberRole, Prisma } from '@prisma/client';
import { NotFoundError, PermissionError, ValidationError } from '../utils/errors';
import type { CreateRecordInput, UpdateRecordInput, RecordQueryInput } from '../validators/record.validator';

// 复合游标：recordDate_id
// Prisma Date-only 字段在 JS 中是 Date 类型，用 toISOString 截取日期部分
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseCursor(cursor: string): { recordDate: Date; id: number } | null {
  const idx = cursor.lastIndexOf('_');
  if (idx < 0) return null;
  const dateStr = cursor.slice(0, idx);
  const idStr = cursor.slice(idx + 1);
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return { recordDate: date, id: parseInt(idStr, 10) };
}

export class RecordService {
  constructor(private prisma: PrismaClient) {}

  // ==================== 记录查询 ====================

  /**
   * 复合键游标分页查询记录列表
   * 排序：(recordDate DESC, id DESC)
   * 游标格式：`recordDate_id`（如 "2024-06-15_123"）
   * 使用 keyset 分页避免回填/未来日期记录漂移
   */
  async getList(bookId: number, userId: number, query: RecordQueryInput) {
    await this.requireMembership(bookId, userId);

    const { cursor, limit, startDate, endDate, type, categoryId } = query;

    // 构建筛选条件
    const where: Prisma.RecordWhereInput = {
      bookId,
      isDeleted: false,
    };

    // 复合游标 keyset：`(recordDate < cursorDate) OR (recordDate = cursorDate AND id < cursorId)`
    if (cursor) {
      const parsed = parseCursor(cursor as string);
      if (parsed) {
        where.OR = [
          { recordDate: { lt: parsed.recordDate } },
          { recordDate: parsed.recordDate, id: { lt: parsed.id } },
        ];
      }
    }

    // 日期范围
    if (startDate || endDate) {
      (where as any).recordDate = {};
      if (startDate) (where as any).recordDate.gte = new Date(startDate);
      if (endDate) (where as any).recordDate.lte = new Date(endDate);
    }

    if (type) where.type = type as any;
    if (categoryId) where.categoryId = categoryId;

    const records = await this.prisma.record.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, type: true, icon: true, isDefault: true },
        },
        user: {
          select: { id: true, nickname: true, avatarUrl: true },
        },
      },
      orderBy: [{ recordDate: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = records.length > limit;
    const list = hasMore ? records.slice(0, limit) : records;
    const last = list[list.length - 1];
    const nextCursor = hasMore && last ? `${toDateStr(last.recordDate)}_${last.id}` : null;

    return {
      list: list.map((r) => ({
        ...r,
        amount: r.amount.toString(),
      })),
      nextCursor,
      hasMore,
    };
  }

  // ==================== 记录 CRUD ====================

  /**
   * 添加记录 — 需 EDITOR+
   */
  async create(bookId: number, userId: number, data: CreateRecordInput) {
    await this.requireRole(bookId, userId, MemberRole.EDITOR);
    await this.validateCategory(data.categoryId, bookId);

    const record = await this.prisma.record.create({
      data: {
        bookId,
        userId,
        type: data.type as any,
        amount: data.amount,
        categoryId: data.categoryId,
        note: data.note || null,
        recordDate: new Date(data.recordDate),
      },
      include: {
        category: {
          select: { id: true, name: true, type: true, icon: true, isDefault: true },
        },
        user: {
          select: { id: true, nickname: true, avatarUrl: true },
        },
      },
    });

    return { ...record, amount: record.amount.toString() };
  }

  /**
   * 记录详情 — 需为成员
   */
  async getDetail(recordId: number, bookId: number, userId: number) {
    await this.requireMembership(bookId, userId);

    const record = await this.prisma.record.findFirst({
      where: { id: recordId, bookId, isDeleted: false },
      include: {
        category: {
          select: { id: true, name: true, type: true, icon: true, isDefault: true },
        },
        user: {
          select: { id: true, nickname: true, avatarUrl: true },
        },
      },
    });

    if (!record) throw new NotFoundError('记录不存在');
    return { ...record, amount: record.amount.toString() };
  }

  /**
   * 编辑记录 — 需 EDITOR+，仅本人或 ADMIN/OWNER 可编辑他人记录
   */
  async update(recordId: number, bookId: number, userId: number, data: UpdateRecordInput) {
    const membership = await this.requireMembership(bookId, userId);

    const record = await this.prisma.record.findFirst({
      where: { id: recordId, bookId, isDeleted: false },
    });

    if (!record) throw new NotFoundError('记录不存在');

    const isAdmin = membership.role === MemberRole.ADMIN || membership.role === MemberRole.OWNER;
    if (record.userId !== userId && !isAdmin) {
      throw new PermissionError('只能编辑自己的记录');
    }

    if (data.categoryId) {
      await this.validateCategory(data.categoryId, bookId);
    }

    const updated = await this.prisma.record.update({
      where: { id: recordId },
      data: {
        ...(data.type !== undefined && { type: data.type as any }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.recordDate !== undefined && { recordDate: new Date(data.recordDate) }),
      },
      include: {
        category: {
          select: { id: true, name: true, type: true, icon: true, isDefault: true },
        },
        user: {
          select: { id: true, nickname: true, avatarUrl: true },
        },
      },
    });

    return { ...updated, amount: updated.amount.toString() };
  }

  /**
   * 删除记录（软删除）— 需 EDITOR+，仅本人或 ADMIN/OWNER 可删除他人记录
   */
  async delete(recordId: number, bookId: number, userId: number) {
    const membership = await this.requireMembership(bookId, userId);

    const record = await this.prisma.record.findFirst({
      where: { id: recordId, bookId, isDeleted: false },
    });

    if (!record) throw new NotFoundError('记录不存在');

    const isAdmin = membership.role === MemberRole.ADMIN || membership.role === MemberRole.OWNER;
    if (record.userId !== userId && !isAdmin) {
      throw new PermissionError('只能删除自己的记录');
    }

    await this.prisma.record.update({
      where: { id: recordId },
      data: { isDeleted: true },
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

  private async requireRole(bookId: number, userId: number, ...roles: MemberRole[]) {
    const member = await this.requireMembership(bookId, userId);
    if (!roles.includes(member.role)) throw new PermissionError('无权限执行此操作');
    return member;
  }

  /**
   * 校验分类属于该账本或为默认全局分类
   */
  private async validateCategory(categoryId: number, bookId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new ValidationError([{ field: 'categoryId', message: '分类不存在' }]);
    }

    // 分类必须属于该账本，或者是全局默认分类
    if (category.bookId !== null && category.bookId !== bookId) {
      throw new ValidationError([{ field: 'categoryId', message: '分类不属于该账本' }]);
    }
  }
}
