// 密码工具单元测试 — bcryptjs hash / compare
// 纯函数测试，无需 mock

import { hash, compare } from '../../src/utils/password';

describe('password utils', () => {
  describe('hash()', () => {
    it('应返回 60 字符的 bcrypt 哈希字符串', async () => {
      const result = await hash('Test123');

      expect(result).toBeDefined();
      expect(result.length).toBe(60);
      expect(result.startsWith('$2')).toBe(true);
    });

    it('相同密码应产生不同哈希（salt 随机）', async () => {
      const h1 = await hash('SamePassword');
      const h2 = await hash('SamePassword');

      expect(h1).not.toBe(h2);
    });

    it('空密码也能正常哈希', async () => {
      const result = await hash('');

      expect(result).toBeDefined();
      expect(result.startsWith('$2')).toBe(true);
    });
  });

  describe('compare()', () => {
    it('正确密码应返回 true', async () => {
      const hashed = await hash('MyPass123');
      const result = await compare('MyPass123', hashed);

      expect(result).toBe(true);
    });

    it('错误密码应返回 false', async () => {
      const hashed = await hash('MyPass123');
      const result = await compare('WrongPassword', hashed);

      expect(result).toBe(false);
    });

    it('空字符串与哈希比较应返回 false', async () => {
      const hashed = await hash('MyPass123');
      const result = await compare('', hashed);

      expect(result).toBe(false);
    });
  });
});
