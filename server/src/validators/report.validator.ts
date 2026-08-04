import { z } from 'zod';

export const reportQuerySchema = z.object({
  period: z.enum(['month', 'year'], {
    errorMap: () => ({ message: 'period 须为 month 或 year' }),
  }),
  date: z.string().regex(/^\d{4}(-\d{2})?$/, '日期格式应为 YYYY 或 YYYY-MM'),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
});
