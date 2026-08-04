// 扩展 Express Request 类型，注入认证信息
import { MemberRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        phone?: string | null;
      };
      memberRole?: MemberRole;
    }
  }
}

export {};
