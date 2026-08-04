import { z } from 'zod';

// 手机号正则：1开头 + 3-9 + 9位数字
const PHONE_REG = /^1[3-9]\d{9}$/;

// 密码：6-20位，至少包含数字和字母
const PASSWORD_REG = /^(?=.*[A-Za-z])(?=.*\d).{6,20}$/;

export const registerSchema = z.object({
  phone: z
    .string()
    .regex(PHONE_REG, '手机号格式不正确'),
  password: z
    .string()
    .min(6, '密码至少6位')
    .max(20, '密码最多20位')
    .regex(PASSWORD_REG, '密码需包含数字和字母'),
  // 短信验证码（MVP阶段可选）
  code: z.string().optional(),
});

export const loginSchema = z.object({
  phone: z
    .string()
    .regex(PHONE_REG, '手机号格式不正确'),
  password: z
    .string()
    .min(1, '请输入密码'),
});

export const wechatLoginSchema = z.object({
  code: z.string().min(1, '缺少微信登录code'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '缺少刷新Token'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, '缺少刷新Token'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type WechatLoginInput = z.infer<typeof wechatLoginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
