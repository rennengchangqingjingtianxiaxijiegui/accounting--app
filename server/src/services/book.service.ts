import { PrismaClient, MemberRole } from '@prisma/client';
import {
  NotFoundError,
  PermissionError,
  ConflictError,
} from '../utils/errors';

export class BookService {
  constructor(private prisma: PrismaClient) {}

  // ==================== 账本 CRUD ====================

  /**
   * 获取当前用户参与的所有账本（含成员数和记录数）
   */
  async getList(userId: number) {
    const memberships = await this.prisma.bookMember.findMany({
      where: { userId },
      include: {
        book: {
          include: {
            _count: {
              select: { members: true, records: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      id: m.book.id,
      name: m.book.name,
      type: m.book.type,
      coverIcon: m.book.coverIcon,
      createdBy: m.book.createdBy,
      isDeleted: m.book.isDeleted,
      createdAt: m.book.createdAt,
      updatedAt: m.book.updatedAt,
      memberCount: m.book._count.members,
      recordCount: m.book._count.records,
      myRole: m.role as string,
    }));
  }

  /**
   * 创建账本，自动将创建者设为 owner
   */
  async create(
    userId: number,
    data: { name: string; type: string; coverIcon?: string }
  ) {
    const book = await this.prisma.book.create({
      data: {
        name: data.name,
        type: data.type as any,
        coverIcon: data.coverIcon || 'wallet',
        createdBy: userId,
        members: {
          create: {
            userId,
            role: MemberRole.OWNER,
          },
        },
      },
      include: {
        _count: {
          select: { members: true, records: true },
        },
      },
    });

    return {
      ...book,
      memberCount: book._count.members,
      recordCount: book._count.records,
      myRole: 'OWNER',
    };
  }

  /**
   * 账本详情 — 需为成员
   */
  async getDetail(bookId: number, userId: number) {
    const membership = await this.prisma.bookMember.findUnique({
      where: { bookId_userId: { bookId, userId } },
    });

    if (!membership) {
      throw new PermissionError('你不是该账本的成员');
    }

    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        _count: {
          select: { members: true, records: true },
        },
      },
    });

    if (!book || book.isDeleted) {
      throw new NotFoundError('账本不存在');
    }

    return {
      ...book,
      memberCount: book._count.members,
      recordCount: book._count.records,
      myRole: membership.role,
    };
  }

  /**
   * 编辑账本 — 需 owner 或 admin
   */
  async update(
    bookId: number,
    userId: number,
    data: { name?: string; type?: string; coverIcon?: string }
  ) {
    await this.requireRole(bookId, userId, MemberRole.OWNER, MemberRole.ADMIN);

    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.isDeleted) {
      throw new NotFoundError('账本不存在');
    }

    return this.prisma.book.update({
      where: { id: bookId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type as any }),
        ...(data.coverIcon !== undefined && { coverIcon: data.coverIcon }),
      },
    });
  }

  /**
   * 删除账本（软删除）— 仅 owner
   */
  async delete(bookId: number, userId: number) {
    await this.requireRole(bookId, userId, MemberRole.OWNER);

    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.isDeleted) {
      throw new NotFoundError('账本不存在');
    }

    return this.prisma.book.update({
      where: { id: bookId },
      data: { isDeleted: true },
    });
  }

  // ==================== 成员管理 ====================

  /**
   * 成员列表 — 需为成员
   */
  async getMembers(bookId: number, userId: number) {
    await this.requireMembership(bookId, userId);

    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.isDeleted) {
      throw new NotFoundError('账本不存在');
    }

    return this.prisma.bookMember.findMany({
      where: { bookId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            phone: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * 添加成员 — 需 owner 或 admin
   */
  async addMember(
    bookId: number,
    operatorId: number,
    targetUserId: number,
    role: MemberRole
  ) {
    await this.requireRole(bookId, operatorId, MemberRole.OWNER, MemberRole.ADMIN);

    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.isDeleted) {
      throw new NotFoundError('账本不存在');
    }

    // 验证目标用户存在
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundError('用户不存在');
    }

    // 检查是否已是成员
    const existing = await this.prisma.bookMember.findUnique({
      where: { bookId_userId: { bookId, userId: targetUserId } },
    });
    if (existing) {
      throw new ConflictError('该用户已是账本成员');
    }

    return this.prisma.bookMember.create({
      data: {
        bookId,
        userId: targetUserId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * 修改成员角色 — 需 owner 或 admin
   */
  async updateMemberRole(
    bookId: number,
    operatorId: number,
    memberId: number,
    role: MemberRole
  ) {
    await this.requireRole(bookId, operatorId, MemberRole.OWNER, MemberRole.ADMIN);

    const member = await this.prisma.bookMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.bookId !== bookId) {
      throw new NotFoundError('成员不存在');
    }

    // 不能修改 owner 的角色
    if (member.role === MemberRole.OWNER) {
      throw new PermissionError('不能修改创建者的角色');
    }

    // admin 不能操作其他 admin 或 owner
    const operatorMembership = await this.prisma.bookMember.findUnique({
      where: { bookId_userId: { bookId, userId: operatorId } },
    });

    if (
      operatorMembership?.role === MemberRole.ADMIN &&
      member.role === MemberRole.ADMIN
    ) {
      throw new PermissionError('管理员不能修改其他管理员的角色');
    }

    return this.prisma.bookMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * 移除成员 — 需 owner 或 admin
   */
  async removeMember(bookId: number, operatorId: number, memberId: number) {
    await this.requireRole(bookId, operatorId, MemberRole.OWNER, MemberRole.ADMIN);

    const member = await this.prisma.bookMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.bookId !== bookId) {
      throw new NotFoundError('成员不存在');
    }

    // 不能移除 owner
    if (member.role === MemberRole.OWNER) {
      throw new PermissionError('不能移除创建者');
    }

    // 不能移除自己
    if (member.userId === operatorId) {
      throw new PermissionError('不能移除自己，请使用退出账本功能');
    }

    // admin 不能移除其他 admin
    const operatorMembership = await this.prisma.bookMember.findUnique({
      where: { bookId_userId: { bookId, userId: operatorId } },
    });

    if (
      operatorMembership?.role === MemberRole.ADMIN &&
      member.role === MemberRole.ADMIN
    ) {
      throw new PermissionError('管理员不能移除其他管理员');
    }

    return this.prisma.bookMember.delete({ where: { id: memberId } });
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 校验当前用户是指定账本的成员（任意角色）
   */
  private async requireMembership(bookId: number, userId: number) {
    const member = await this.prisma.bookMember.findUnique({
      where: { bookId_userId: { bookId, userId } },
    });
    if (!member) {
      throw new PermissionError('你不是该账本的成员');
    }
    return member;
  }

  /**
   * 校验当前用户拥有指定角色之一
   */
  private async requireRole(
    bookId: number,
    userId: number,
    ...roles: MemberRole[]
  ) {
    const member = await this.prisma.bookMember.findUnique({
      where: { bookId_userId: { bookId, userId } },
    });

    if (!member) {
      throw new PermissionError('你不是该账本的成员');
    }

    if (!roles.includes(member.role)) {
      throw new PermissionError('无权限执行此操作');
    }

    return member;
  }
}
