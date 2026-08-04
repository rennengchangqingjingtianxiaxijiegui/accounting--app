import dotenv from 'dotenv';
import path from 'path';

// 加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // 数据库
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // 微信
  WECHAT_APPID: process.env.WECHAT_APPID!,
  WECHAT_SECRET: process.env.WECHAT_SECRET!,

  // 短信
  SMS_ACCESS_KEY: process.env.SMS_ACCESS_KEY || '',
  SMS_SECRET: process.env.SMS_SECRET || '',
};

// 校验必需环境变量
const requiredKeys: (keyof typeof config)[] = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'WECHAT_APPID',
  'WECHAT_SECRET',
];

for (const key of requiredKeys) {
  if (!config[key]) {
    console.error(`[Config] 缺少必需的环境变量: ${key}`);
    process.exit(1);
  }
}
