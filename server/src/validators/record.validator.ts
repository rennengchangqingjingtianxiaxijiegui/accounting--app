import { z } from 'zod';

const TRANSACTION_TYPES = ['INCOME', 'EXPENSE'] as const;

// 金额：最多12位整数 + 2位小数，字符串传输避免浮点精度丢失
const AMOUNT_REG = /^\d{1,12}(\.\d{1,2})?$/;

export const createRecordSchema = z.object({
  type: z.enum(TRANSACTION_TYPES, {
    errorMap: () => ({ message: '类型无效，须为 INCOME 或 EXPENSE' }),
  }),
  amount: z.string().regex(AMOUNT_REG, '金额格式不正确（最多2位小数）'),
  categoryId: z.number().int().positive('请选择分类'),
  note: z.string().max(200, '备注最多200字').optional().default(''),
  recordDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
});

export const updateRecordSchema = z.object({
  type: z
    .enum(TRANSACTION_TYPES, { errorMap: () => ({ message: '类型无效' }) })
    .optional(),
  amount: z.string().regex(AMOUNT_REG, '金额格式不正确（最多2位小数）').optional(),
  categoryId: z.number().int().positive('请选择分类').optional(),
  note: z.string().max(200, '备注最多200字').optional(),
  recordDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD').optional(),
});

// 游标分页 + 筛选查询参数（query string 均为 string）
// cursor 为复合键：recordDate_id，如 "2024-06-15_123"
const CURSOR_REG = /^\d{4}-\d{2}-\d{2}_\d+$/;

export const recordQuerySchema = z.object({
  cursor: z.string().regex(CURSOR_REG, '分页游标格式无效').optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type RecordQueryInput = z.infer<typeof recordQuerySchema>;
