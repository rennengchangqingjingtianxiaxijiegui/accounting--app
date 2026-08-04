import { PrismaClient } from '@prisma/client';
import { hash, compare } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { code2Session } from '../utils/wechat';
import { AppError, AuthError, ConflictError, NotFoundError } from '../utils/errors';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 手机号注册
   */
  async register(phone: string, password: string) {
    // 检查手机号是否已注册
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictError('该手机号已注册');
    }

    // bcrypt 哈希（12轮）
    const passwordHash = await hash(password);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        phone,
        passwordHash,
        nickname: `用户${phone.slice(-4)}`,
      },
    });

    return this.generateTokenPair(user);
  }

  /**
   * 手机号+密码登录
   */
  async login(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user || !user.passwordHash) {
      throw new AuthError('手机号或密码错误');
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      throw new AuthError('手机号或密码错误');
    }

    return this.generateTokenPair(user);
  }

  /**
   * 微信小程序登录
   */
  async wechatLogin(code: string) {
    // code → openid / unionid
    const session = await code2Session(code);

    // 按 openid 查找已有用户
    let user = await this.prisma.user.findUnique({
      where: { wechatOpenId: session.openid },
    });

    if (!user) {
      // 新用户：自动注册
      user = await this.prisma.user.create({
        data: {
          wechatOpenId: session.openid,
          wechatUnionId: session.unionid,
          nickname: '微信用户',
        },
      });
    } else if (session.unionid && user.wechatUnionId !== session.unionid) {
      // 补全或更新 unionid
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { wechatUnionId: session.unionid },
      });
    }

    return this.generateTokenPair(user);
  }

  /**
   * 刷新 Token（轮换策略：删除旧Token → 生成新Token对）
   */
  async refreshToken(token: string) {
    // 1. 验证 JWT 签名和过期
    let payload: { id: number };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      // Token 已过期，清理 DB 中的记录
      await this.prisma.refreshToken.deleteMany({ where: { token } });
      throw new AuthError('Refresh Token已过期，请重新登录');
    }

    // 2. 查找 DB 中的 RefreshToken
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AuthError('Token已被使用或已撤销');
    }

    // 3. 删除旧 Token（实现轮换）
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // 4. 生成新 Token 对
    return this.generateTokenPair(storedToken.user);
  }

  /**
   * 登出：删除 RefreshToken
   */
  async logout(token: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
  }

  /**
   * 生成 access + refresh Token 对，持久化 refresh
   */
  private async generateTokenPair(user: {
    id: number;
    phone: string | null;
    nickname: string;
    avatarUrl: string | null;
    gender: number;
    createdAt: Date;
  }) {
    const payload = {
      id: user.id,
      phone: user.phone,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // 解析 refreshToken 的过期时间并存入 DB
    const decoded = verifyRefreshToken(refreshToken) as unknown as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }
}
