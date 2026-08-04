// 账本成员角色权限校验中间件工厂
import { Request, Response, NextFunction } from 'express';
import { MemberRole } from '@prisma/client';
import { prisma } from '../db';
import { PermissionError, NotFoundError } from '../utils/errors';

/**
 * 校验当前用户是指定账本的成员，且角色在允许列表中
 * @param roles 允许的角色列表，不传则只校验是否为成员
 */
export function requireRole(...roles: MemberRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new PermissionError('请先登录');
      }

      // 从路由参数或请求体中获取 bookId
      const bookId = parseInt(req.params.id || req.params.bid || req.body.bookId, 10);
      if (!bookId) {
        throw new PermissionError('缺少账本ID');
      }

      const membership = await prisma.bookMember.findUnique({
        where: {
          bookId_userId: {
            bookId,
            userId: req.user.id,
          },
        },
      });

      if (!membership) {
        throw new PermissionError('你不是该账本的成员');
      }

      // 如果指定了角色限制，检查是否符合
      if (roles.length > 0 && !roles.includes(membership.role)) {
        throw new PermissionError(`需要 ${roles.join('/')} 权限`);
      }

      req.memberRole = membership.role;
      next();
    } catch (error) {
      if (error instanceof PermissionError || error instanceof NotFoundError) {
        next(error);
      } else {
        next(new PermissionError());
      }
    }
  };
}
