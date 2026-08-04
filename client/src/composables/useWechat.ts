// 微信小程序专属登录组合式函数

import { ref } from 'vue';
import { useAuthStore } from '@/store/auth';

export function useWechat() {
  const authStore = useAuthStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  /** 检查当前环境是否支持微信登录 */
  function isWechatAvailable(): boolean {
    // #ifdef MP-WEIXIN
    return true;
    // #endif
    // #ifndef MP-WEIXIN
    return false;
    // #endif
  }

  /** 微信一键登录 */
  async function login(): Promise<boolean> {
    // #ifdef MP-WEIXIN
    loading.value = true;
    error.value = null;

    try {
      // 1. 调用 wx.login 获取 code
      const loginRes = await uni.login({ provider: 'weixin' });
      if (!loginRes || !loginRes.code) {
        error.value = '获取微信授权失败';
        return false;
      }

      // 2. code 发给后端换取 JWT
      await authStore.loginByWechat(loginRes.code);
      return true;
    } catch (e: any) {
      error.value = e?.message || '微信登录失败';
      return false;
    } finally {
      loading.value = false;
    }
    // #endif
    // #ifndef MP-WEIXIN
    error.value = '当前环境不支持微信登录';
    return false;
    // #endif
  }

  /**
   * 获取微信用户信息（头像/昵称）
   * 小程序需要 userInfo 隐私协议授权
   */
  async function getUserProfile(): Promise<WechatMiniprogram.GetUserProfileSuccessCallbackResult | null> {
    // #ifdef MP-WEIXIN
    try {
      const res = await uni.getUserProfile({ desc: '用于完善用户资料' });
      return res as any;
    } catch {
      // 用户拒绝授权
      return null;
    }
    // #endif
    // #ifndef MP-WEIXIN
    return null;
    // #endif
  }

  return {
    loading,
    error,
    isWechatAvailable,
    login,
    getUserProfile,
  };
}
