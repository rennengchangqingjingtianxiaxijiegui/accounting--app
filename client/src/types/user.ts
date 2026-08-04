// 用户相关类型

export interface User {
  id: number;
  phone: string | null;
  wechatOpenId: string | null;
  nickname: string;
  avatarUrl: string | null;
  gender: number;
  createdAt: string;
}

export interface LoginParams {
  phone: string;
  password: string;
}

export interface RegisterParams {
  phone: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileParams {
  nickname?: string;
  avatarUrl?: string;
  gender?: number;
}

export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}
