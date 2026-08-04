import { z } from 'zod';

// 账本类型枚举值
const BOOK_TYPES = ['PERSONAL', 'FAMILY', 'TRAVEL', 'BUSINESS', 'OTHER'] as const;

// 成员角色枚举值（owner 不允许通过 API 设置）
const MEMBER_ROLES = ['ADMIN', 'EDITOR', 'VIEWER'] as const;

export const createBookSchema = z.object({
  name: z
    .string()
    .min(1, '请输入账本名称')
    .max(50, '账本名称最多50字'),
  type: z
    .enum(BOOK_TYPES, { errorMap: () => ({ message: '账本类型无效' }) })
    .default('PERSONAL'),
  coverIcon: z
    .string()
    .max(50, '图标标识过长')
    .optional()
    .default('wallet'),
});

export const updateBookSchema = z.object({
  name: z
    .string()
    .min(1, '请输入账本名称')
    .max(50, '账本名称最多50字')
    .optional(),
  type: z
    .enum(BOOK_TYPES, { errorMap: () => ({ message: '账本类型无效' }) })
    .optional(),
  coverIcon: z
    .string()
    .max(50, '图标标识过长')
    .optional(),
});

export const addMemberSchema = z.object({
  userId: z
    .number()
    .int()
    .positive('用户ID必须为正整数'),
  role: z
    .enum(MEMBER_ROLES, { errorMap: () => ({ message: '角色无效' }) })
    .default('EDITOR'),
});

export const updateMemberSchema = z.object({
  role: z.enum(MEMBER_ROLES, { errorMap: () => ({ message: '角色无效' }) }),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
