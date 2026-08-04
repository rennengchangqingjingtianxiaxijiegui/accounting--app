// JWT 工具单元测试
// 使用 setup.ts 中预置的测试密钥

import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/utils/jwt';

describe('jwt utils', () => {
  const payload = { id: 1, phone: '13800138000' };

  describe('signAccessToken()', () => {
    it('应返回有效 JWT 字符串', () => {
      const token = signAccessToken(payload);

      expect(typeof token).toBe('string');
      // JWT 格式：header.payload.signature
      expect(token.split('.')).toHaveLength(3);
    });

    it('包含的 payload 可通过 verifyAccessToken 还原', () => {
      const token = signAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded.id).toBe(1);
      expect(decoded.phone).toBe('13800138000');
    });

    it('不同 payload 生成不同 token', () => {
      const t1 = signAccessToken({ id: 1, phone: '13800138000' });
      const t2 = signAccessToken({ id: 2, phone: '13900139000' });

      expect(t1).not.toBe(t2);
    });
  });

  describe('signRefreshToken()', () => {
    it('应返回有效 JWT 字符串（access 和 refresh 密钥不同，签名不同）', () => {
      const accessToken = signAccessToken(payload);
      const refreshToken = signRefreshToken(payload);

      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('verifyAccessToken()', () => {
    it('有效 token 应返回 payload', () => {
      const token = signAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded.id).toBe(1);
    });

    it('无效 token（篡改）应抛出异常', () => {
      const token = signAccessToken(payload);
      const tampered = token.slice(0, -5) + 'xxxxx';

      expect(() => verifyAccessToken(tampered)).toThrow();
    });

    it('空字符串应抛出异常', () => {
      expect(() => verifyAccessToken('')).toThrow();
    });

    it('用 refresh secret 签发的 token 在 access verify 中应失败', () => {
      const refreshToken = signRefreshToken(payload);
      // 用 refresh 的 secret 签发的 token，access 的 secret 验证应失败
      expect(() => verifyAccessToken(refreshToken)).toThrow();
    });
  });

  describe('verifyRefreshToken()', () => {
    it('有效 refresh token 应返回 payload', () => {
      const token = signRefreshToken(payload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.id).toBe(1);
    });

    it('access token 不应被 refresh 验证通过', () => {
      const accessToken = signAccessToken(payload);
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
  });

  describe('过期 token', () => {
    it('过期的 access token 应抛出 TokenExpiredError', () => {
      // 签发明文 payload，手动用 jsonwebtoken 签发一个已过期的
      const jwt = require('jsonwebtoken');
      const expired = jwt.sign(payload, 'test-access-secret-at-least-32-chars!!', {
        expiresIn: '0s',
      });

      expect(() => verifyAccessToken(expired)).toThrow();
    });
  });
});
