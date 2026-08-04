import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * 对明文密码进行 bcrypt 哈希（12轮salt）
 * 返回 60 字符的哈希字符串
 */
export async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * 常量时间比较明文与哈希，防止时序攻击
 */
export async function compare(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
