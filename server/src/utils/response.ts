// 统一响应格式
import { Response } from 'express';

export function success(res: Response, data: unknown = null, message = 'ok') {
  return res.json({ code: 0, message, data });
}

export function fail(res: Response, code: number, message: string, data: unknown = null) {
  return res.status(code >= 1000 && code < 2000 ? 400 : code >= 2000 ? 401 : 500).json({
    code,
    message,
    data,
  });
}
