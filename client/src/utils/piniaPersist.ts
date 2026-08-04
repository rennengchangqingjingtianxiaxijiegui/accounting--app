// Pinia 持久化插件 — 按 key 自动存储/恢复，支持版本号

import type { PiniaPluginContext } from 'pinia';
import { storage } from './storage';
import { STORAGE_KEYS } from './storage';

/** 需要持久化的 store 配置 */
interface PersistConfig {
  /** store ID，对应 STORAGE_KEYS 中的 key */
  key: string;
  /** 需要持久化的 state 字段（默认全部） */
  pick?: string[];
  /** 版本号，结构变更时递增以清空旧缓存 */
  version?: number;
}

const persistConfigs: Map<string, PersistConfig> = new Map();

/** 注册 store 持久化 */
export function registerPersist(storeId: string, config: PersistConfig) {
  persistConfigs.set(storeId, config);
}

const CACHE_TTL = 30 * 60 * 1000; // 30 分钟缓存有效期

export function createPersistPlugin() {
  return function piniaPersist(context: PiniaPluginContext) {
    const config = persistConfigs.get(context.store.$id);
    if (!config) return;

    // 从 storage 恢复初始状态
    try {
      const raw = storage.get<string>(config.key);
      if (raw) {
        const parsed = JSON.parse(raw);

        // 版本号校验：版本不匹配则丢弃旧缓存
        if (config.version && parsed.__version !== config.version) {
          storage.remove(config.key);
        } else if (parsed.__ts && Date.now() - parsed.__ts > CACHE_TTL) {
          // 缓存过期，仅对 categoryStore 这类失效成本低的做清理
          storage.remove(config.key);
        } else {
          const stateData = parsed.__data || parsed;
          if (config.pick) {
            config.pick.forEach((field) => {
              if (field in stateData) {
                (context.store as any)[field] = stateData[field];
              }
            });
          } else {
            // 全量恢复（排除元字段）
            Object.keys(stateData).forEach((field) => {
              if (field in context.store.$state) {
                (context.store.$state as any)[field] = stateData[field];
              }
            });
          }
        }
      }
    } catch {
      // 解析失败，清理
      storage.remove(config.key);
    }

    // 监听变化，自动写入
    context.store.$subscribe((_mutation, state) => {
      try {
        const toPersist: Record<string, unknown> = { __version: config.version, __ts: Date.now() };
        if (config.pick) {
          config.pick.forEach((field) => {
            toPersist[field] = (state as any)[field];
          });
        } else {
          toPersist.__data = { ...state };
        }
        storage.set(config.key, JSON.stringify(toPersist));
      } catch {
        // 静默失败 — 持久化不是关键路径
      }
    }, { detached: true });
  };
}

// ========== 预定义持久化配置 ==========

export function setupPersistConfigs() {
  registerPersist('auth', {
    key: STORAGE_KEYS.AUTH_PERSIST,
    pick: ['accessToken', 'refreshToken', 'user'],
    version: 1,
  });

  registerPersist('book', {
    key: STORAGE_KEYS.BOOK_PERSIST,
    pick: ['activeBookId'],
    version: 1,
  });

  registerPersist('category', {
    key: STORAGE_KEYS.CATEGORY_CACHE,
    pick: ['categories', 'loaded'],
    version: 1,
  });
}
