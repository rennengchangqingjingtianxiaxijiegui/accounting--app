// 统一响应格式
import { Response } from 'express';

export function success(res: Response, data: unknown = null, message = 'ok') {
  return res.json({ code: 0, message, data });
}

/**
 * 返回业务错误响应
 * @param httpStatus HTTP 状态码，不传则根据业务码推断
 *   - 1000-1999 → 400 (参数校验、业务错误)
 *   - 2000-2999 → 401 (认证相关)
 *   - 其它 → 500
 */
export function fail(
  res: Response,
  code: number,
  message: string,
  data: unknown = null,
  httpStatus?: number,
) {
  const status =
    httpStatus ??
    (code >= 2000 && code < 3000 ? 401 : code >= 1000 && code < 2000 ? 400 : 500);
  return res.status(status).json({ code, message, data });
}
