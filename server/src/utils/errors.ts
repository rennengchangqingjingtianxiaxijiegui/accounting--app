// 自定义错误类族

export class AppError extends Error {
  public statusCode: number;
  public code: number;

  constructor(message: string, code = 5000, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthError extends AppError {
  constructor(message = '未登录或Token已过期') {
    super(message, 1002, 401);
    this.name = 'AuthError';
  }
}

export class PermissionError extends AppError {
  constructor(message = '无权限执行此操作') {
    super(message, 1003, 403);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 1004, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 1005, 409);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends AppError {
  public errors: { field: string; message: string }[];

  constructor(errors: { field: string; message: string }[]) {
    super('参数校验失败', 1001, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class WechatError extends AppError {
  constructor(message = '微信登录失败') {
    super(message, 2001, 400);
    this.name = 'WechatError';
  }
}
