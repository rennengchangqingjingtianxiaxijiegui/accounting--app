import { z } from 'zod';

export const updateProfileSchema = z.object({
  nickname: z
    .string()
    .max(50, '昵称最多50个字符')
    .optional(),
  avatarUrl: z
    .string()
    .max(5000, '头像URL过长')
    .optional(),
  gender: z
    .number()
    .int()
    .min(0)
    .max(2)
    .optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '请输入旧密码'),
  newPassword: z
    .string()
    .min(6, '新密码至少6位')
    .max(20, '新密码最多20位')
    .regex(/^(?=.*[A-Za-z])(?=.*\d).{6,20}$/, '新密码需包含数字和字母'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
