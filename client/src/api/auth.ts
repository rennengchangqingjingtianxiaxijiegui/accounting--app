// 认证 API
import http from './request';
import type { ApiResponse } from '@/types/api';
import type { LoginParams, RegisterParams, LoginResult, User } from '@/types/user';

export const authApi = {
  /** 手机号+密码登录 */
  login(data: LoginParams): Promise<ApiResponse<LoginResult>> {
    return http.post('/auth/login', data);
  },

  /** 手机号注册 */
  register(data: RegisterParams): Promise<ApiResponse<LoginResult>> {
    return http.post('/auth/register', data);
  },

  /** 微信小程序登录 */
  wechatLogin(code: string): Promise<ApiResponse<LoginResult>> {
    return http.post('/auth/wechat-login', { code });
  },

  /** 刷新Token */
  refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    return http.post('/auth/refresh', { refreshToken });
  },

  /** 登出 */
  logout(refreshToken: string): Promise<ApiResponse<null>> {
    return http.post('/auth/logout', { refreshToken });
  },

  /** 获取当前用户信息 */
  getProfile(): Promise<ApiResponse<User>> {
    return http.get('/user/profile');
  },
};
