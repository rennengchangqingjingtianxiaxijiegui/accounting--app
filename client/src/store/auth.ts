// 认证状态管理
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { authApi } from '@/api/auth';
import type { User, LoginParams, RegisterParams } from '@/types/user';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(storage.get<User>(STORAGE_KEYS.USER_INFO));
  const accessToken = ref<string | null>(storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN));
  const refreshToken = ref<string | null>(storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN));

  // Getters
  const isLoggedIn = computed(() => !!accessToken.value && !!user.value);

  // Actions
  function setAuth(userData: User, access: string, refresh: string) {
    user.value = userData;
    accessToken.value = access;
    refreshToken.value = refresh;

    storage.set(STORAGE_KEYS.USER_INFO, userData);
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, access);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  }

  function clearAuth() {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;

    storage.remove(STORAGE_KEYS.USER_INFO);
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async function login(params: LoginParams) {
    const res = await authApi.login(params);
    setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
    await fetchProfile();
    return res.data;
  }

  async function register(params: RegisterParams) {
    const res = await authApi.register(params);
    setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
    return res.data;
  }

  async function loginByWechat(code: string) {
    const res = await authApi.wechatLogin(code);
    setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
    await fetchProfile();
    return res.data;
  }

  async function fetchProfile() {
    const res = await authApi.getProfile();
    user.value = res.data;
    storage.set(STORAGE_KEYS.USER_INFO, res.data);
  }

  async function logout() {
    try {
      if (refreshToken.value) {
        await authApi.logout(refreshToken.value);
      }
    } catch {
      // ignore
    } finally {
      clearAuth();
    }
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) throw new Error('无刷新Token');
    const res = await authApi.refreshToken(refreshToken.value);
    accessToken.value = res.data.accessToken;
    refreshToken.value = res.data.refreshToken;
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, res.data.accessToken);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, res.data.refreshToken);
  }

  return {
    user,
    accessToken,
    refreshToken,
    isLoggedIn,
    setAuth,
    clearAuth,
    login,
    register,
    loginByWechat,
    fetchProfile,
    logout,
    refreshAccessToken,
  };
});
