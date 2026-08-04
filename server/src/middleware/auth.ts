// JWT 认证中间件
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { verifyAccessToken } from '../utils/jwt';
import { AuthError } from '../utils/errors';

export async function auth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('未提供认证Token');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // 验证用户是否存在
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      throw new AuthError('用户不存在');
    }

    req.user = { id: payload.id, phone: payload.phone };
    next();
  } catch (error) {
    if (error instanceof AuthError) {
      next(error);
    } else {
      next(new AuthError('Token无效或已过期'));
    }
  }
}
