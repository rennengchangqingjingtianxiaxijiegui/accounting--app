import { PrismaClient } from '@prisma/client';
import { compare, hash } from '../utils/password';
import { AuthError, NotFoundError } from '../utils/errors';

export class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 获取个人资料
   */
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        wechatOpenId: true,
        nickname: true,
        avatarUrl: true,
        gender: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    return user;
  }

  /**
   * 修改个人资料
   */
  async updateProfile(userId: number, data: { nickname?: string; avatarUrl?: string; gender?: number }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        phone: true,
        wechatOpenId: true,
        nickname: true,
        avatarUrl: true,
        gender: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * 修改密码（需要旧密码验证）
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new NotFoundError('用户不存在或未设置密码');
    }

    // 验证旧密码
    const valid = await compare(oldPassword, user.passwordHash);
    if (!valid) {
      throw new AuthError('旧密码错误');
    }

    // bcrypt 哈希新密码
    const passwordHash = await hash(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
