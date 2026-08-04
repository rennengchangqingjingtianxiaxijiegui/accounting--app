// uni.storage 类型化封装

const PREFIX = 'acc_';

export const storage = {
  get<T = string>(key: string): T | null {
    try {
      const raw = uni.getStorageSync(PREFIX + key);
      return raw !== '' && raw !== undefined && raw !== null ? (raw as T) : null;
    } catch {
      return null;
    }
  },

  set(key: string, value: unknown): void {
    try {
      uni.setStorageSync(PREFIX + key, value);
    } catch (e) {
      console.error(`[Storage] 写入失败: ${key}`, e);
    }
  },

  remove(key: string): void {
    try {
      uni.removeStorageSync(PREFIX + key);
    } catch (e) {
      console.error(`[Storage] 删除失败: ${key}`, e);
    }
  },

  clear(): void {
    try {
      uni.clearStorageSync();
    } catch (e) {
      console.error('[Storage] 清除失败', e);
    }
  },
};

// 常用 key 常量
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  ACTIVE_BOOK_ID: 'active_book_id',
  CATEGORY_CACHE: 'category_cache',
  AUTH_PERSIST: 'auth_persist',
  BOOK_PERSIST: 'book_persist',
} as const;
