// 用户 API
import http from './request';
import type { ApiResponse } from '@/types/api';
import type { User, UpdateProfileParams, ChangePasswordParams } from '@/types/user';

export const userApi = {
  /** 获取个人资料 */
  getProfile(): Promise<ApiResponse<User>> {
    return http.get('/user/profile');
  },

  /** 修改个人资料 */
  updateProfile(data: UpdateProfileParams): Promise<ApiResponse<User>> {
    return http.put('/user/profile', data);
  },

  /** 修改密码 */
  changePassword(data: ChangePasswordParams): Promise<ApiResponse<null>> {
    return http.put('/user/password', data);
  },
};
