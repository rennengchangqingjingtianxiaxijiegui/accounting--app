// Axios 实例 + 拦截器（Token注入 + 401刷新队列）
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { storage, STORAGE_KEYS } from '@/utils/storage';

// 多平台 Base URL
function getBaseUrl(): string {
  // #ifdef H5
  // H5 开发模式使用代理，直接相对路径即可
  return '/api/v1';
  // #endif

  // #ifdef MP-WEIXIN || APP-PLUS
  // 小程序 / APP 端：连接后端服务器
  // 生产环境通过环境变量切换，开发环境默认 localhost:3000
  return 'http://localhost:3000/api/v1';
  // #endif
}

const BASE_URL = getBaseUrl();

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ========== Token 刷新队列 ==========
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// ========== 请求拦截器：注入 Token ==========
http.interceptors.request.use((config) => {
  const token = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========== 响应拦截器：处理 401 自动刷新 ==========
http.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    // 统一处理业务错误
    if (data.code !== undefined && data.code !== 0) {
      uni.showToast({ title: data.message || '请求失败', icon: 'none' });
      return Promise.reject(data);
    }
    return data;
  },
  async (error) => {
    const originalRequest: AxiosRequestConfig & { _retry?: boolean } = error.config;

    // HTTP 401，尝试刷新Token
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        // 无 refresh token，跳转登录
        uni.reLaunch({ url: '/pages/auth/login' });
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // 已有刷新在进行中，加入队列等待
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken: string) => {
            originalRequest.headers!.Authorization = `Bearer ${newToken}`;
            resolve(http(originalRequest));
          });
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;

        storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        storage.set(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        onRefreshed(accessToken);
        originalRequest.headers!.Authorization = `Bearer ${accessToken}`;

        return http(originalRequest);
      } catch (refreshError) {
        // 刷新失败，清除token跳登录
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
        uni.reLaunch({ url: '/pages/auth/login' });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 网络错误提示
    uni.showToast({ title: '网络请求失败，请重试', icon: 'none' });
    return Promise.reject(error);
  }
);

export default http;
