// 认证 Store 单元测试 — 状态流转（登录/登出/Token刷新）

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Mock storage 模块 — 在 store 导入前执行（注意：vi.mock hoist 到顶部）
const mockStorage: Record<string, unknown> = {};
vi.mock('@/utils/storage', () => ({
  storage: {
    get: vi.fn((key: string) => mockStorage[key] ?? null),
    set: vi.fn((key: string, value: unknown) => { mockStorage[key] = value; }),
    remove: vi.fn((key: string) => { delete mockStorage[key]; }),
    clear: vi.fn(() => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); }),
  },
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_INFO: 'user_info',
    ACTIVE_BOOK_ID: 'active_book_id',
    CATEGORY_CACHE: 'category_cache',
  },
}));

// Mock auth API
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockWechatLogin = vi.fn();
const mockRefresh = vi.fn();
const mockLogout = vi.fn();
const mockGetProfile = vi.fn();

vi.mock('@/api/auth', () => ({
  authApi: {
    login: (...args: any[]) => mockLogin(...args),
    register: (...args: any[]) => mockRegister(...args),
    wechatLogin: (...args: any[]) => mockWechatLogin(...args),
    refreshToken: (...args: any[]) => mockRefresh(...args),
    logout: (...args: any[]) => mockLogout(...args),
    getProfile: (...args: any[]) => mockGetProfile(...args),
  },
}));

import { useAuthStore } from '@/store/auth';

const mockUser = {
  id: 1,
  phone: '13800138000',
  wechatOpenId: null,
  nickname: '测试用户',
  avatarUrl: null,
  gender: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockLoginResult = {
  user: mockUser,
  accessToken: 'access-token-xxx',
  refreshToken: 'refresh-token-xxx',
};

describe('AuthStore', () => {
  beforeEach(() => {
    // 重置 mock storage，避免跨测试状态泄漏
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    vi.resetAllMocks();
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('初始状态未登录', () => {
      const store = useAuthStore();

      expect(store.user).toBeNull();
      expect(store.accessToken).toBeNull();
      expect(store.refreshToken).toBeNull();
      expect(store.isLoggedIn).toBe(false);
    });
  });

  describe('setAuth()', () => {
    it('设置认证信息后 isLoggedIn 为 true', () => {
      const store = useAuthStore();

      store.setAuth(mockUser, 'at', 'rt');

      expect(store.user).toEqual(mockUser);
      expect(store.accessToken).toBe('at');
      expect(store.refreshToken).toBe('rt');
      expect(store.isLoggedIn).toBe(true);
    });
  });

  describe('clearAuth()', () => {
    it('清除后所有状态重置为 null', () => {
      const store = useAuthStore();
      store.setAuth(mockUser, 'at', 'rt');

      store.clearAuth();

      expect(store.user).toBeNull();
      expect(store.accessToken).toBeNull();
      expect(store.refreshToken).toBeNull();
      expect(store.isLoggedIn).toBe(false);
    });
  });

  describe('login()', () => {
    it('成功登录后设置 user + token + 获取 profile', async () => {
      mockLogin.mockResolvedValueOnce({ data: mockLoginResult });
      mockGetProfile.mockResolvedValueOnce({ data: mockUser });

      const store = useAuthStore();
      await store.login({ phone: '13800138000', password: 'Test123' });

      expect(store.isLoggedIn).toBe(true);
      expect(store.accessToken).toBe('access-token-xxx');
      expect(store.refreshToken).toBe('refresh-token-xxx');
      expect(mockLogin).toHaveBeenCalledWith({
        phone: '13800138000',
        password: 'Test123',
      });
      expect(mockGetProfile).toHaveBeenCalled();
    });

    it('登录失败不改变登录状态', async () => {
      mockLogin.mockRejectedValueOnce(new Error('手机号或密码错误'));

      const store = useAuthStore();
      await expect(
        store.login({ phone: '13800138000', password: 'Wrong' }),
      ).rejects.toThrow('手机号或密码错误');

      expect(store.isLoggedIn).toBe(false);
    });
  });

  describe('register()', () => {
    it('注册成功后设置认证信息', async () => {
      mockRegister.mockResolvedValueOnce({ data: mockLoginResult });

      const store = useAuthStore();
      await store.register({ phone: '13800138000', password: 'Test123', code: '1234' });

      expect(store.isLoggedIn).toBe(true);
      expect(mockRegister).toHaveBeenCalledWith({
        phone: '13800138000',
        password: 'Test123',
        code: '1234',
      });
    });
  });

  describe('logout()', () => {
    it('登出后清除状态并调用 API', async () => {
      mockLogout.mockResolvedValueOnce({ data: null });
      const store = useAuthStore();
      store.setAuth(mockUser, 'at', 'rt');

      await store.logout();

      expect(store.isLoggedIn).toBe(false);
      expect(mockLogout).toHaveBeenCalledWith('rt');
    });

    it('即使 API 调用失败也应清除本地状态', async () => {
      mockLogout.mockRejectedValueOnce(new Error('Network error'));
      const store = useAuthStore();
      store.setAuth(mockUser, 'at', 'rt');

      await store.logout();

      expect(store.isLoggedIn).toBe(false); // 仍然清除
    });
  });

  describe('refreshAccessToken()', () => {
    it('刷新后更新 token', async () => {
      mockRefresh.mockResolvedValueOnce({
        data: { accessToken: 'new-at', refreshToken: 'new-rt' },
      });
      const store = useAuthStore();
      store.setAuth(mockUser, 'old-at', 'old-rt');

      await store.refreshAccessToken();

      expect(store.accessToken).toBe('new-at');
      expect(store.refreshToken).toBe('new-rt');
    });

    it('无 refreshToken 时抛出异常', async () => {
      const store = useAuthStore();

      await expect(store.refreshAccessToken()).rejects.toThrow('无刷新Token');
    });
  });

  describe('isLoggedIn', () => {
    it('只有 accessToken 无 user 时为 false', () => {
      const store = useAuthStore();
      store.setAuth({ ...mockUser, id: 0 }, 'at', 'rt');
      store.user = null; // 手动清除 user

      expect(store.isLoggedIn).toBe(false);
    });
  });
});
