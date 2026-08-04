// 全局错误处理中间件
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { fail } from '../utils/response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[Error] ${err.name}: ${err.message}`);

  // 已知的业务错误 — 使用正确的 HTTP 状态码
  if (err instanceof AppError) {
    fail(res, err.code, err.message, null, err.statusCode);
    return;
  }

  // Zod 参数校验错误
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    fail(res, 1001, '参数校验失败', errors);
    return;
  }

  // Prisma 唯一约束冲突
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      fail(res, 1005, `${target.join(', ')} 已存在`);
      return;
    }
    if (err.code === 'P2025') {
      fail(res, 1004, '资源不存在');
      return;
    }
  }

  // 未知错误
  console.error('[Unhandled Error]', err);
  fail(res, 5000, process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message);
}
