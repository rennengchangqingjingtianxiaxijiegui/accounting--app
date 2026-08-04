import { PrismaClient, MemberRole, Prisma } from '@prisma/client';
import { NotFoundError, PermissionError, ValidationError } from '../utils/errors';
import type { CreateRecordInput, UpdateRecordInput, RecordQueryInput } from '../validators/record.validator';

export class RecordService {
  constructor(private prisma: PrismaClient) {}

  // ==================== 记录查询 ====================

  /**
   * 游标分页查询记录列表，支持日期范围/类型/分类筛选
   * 按 recordDate DESC + id DESC 排序，limit+1 判断 hasMore
   */
  async getList(bookId: number, userId: number, query: RecordQueryInput) {
    await this.requireMembership(bookId, userId);

    const { cursor, limit, startDate, endDate, type, categoryId } = query;

    // 构建筛选条件
    const where: Prisma.RecordWhereInput = {
      bookId,
      isDeleted: false,
    };

    // 游标：id 小于上次最后一条的 id
    if (cursor) {
      where.id = { lt: cursor };
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
    const nextCursor = hasMore ? list[list.length - 1].id : null;

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
    const membership = await this.requireRole(bookId, userId, MemberRole.EDITOR);

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
    const membership = await this.requireRole(bookId, userId, MemberRole.EDITOR);

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
