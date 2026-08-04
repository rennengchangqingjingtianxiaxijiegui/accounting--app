// 收支分类缓存 — 支持持久化 + TTL，减少重复请求

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { categoryApi } from '@/api/category';
import type { Category, RecordType } from '@/types/record';

const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([]);
  const loaded = ref(false);
  const lastFetchAt = ref<number>(0);

  /** 检查缓存是否仍有效 */
  function isCacheValid(): boolean {
    return loaded.value && (Date.now() - lastFetchAt.value < CACHE_TTL);
  }

  /** 获取分类列表（带缓存） */
  async function fetchCategories(type?: RecordType, force = false): Promise<void> {
    if (!force && isCacheValid()) return;

    try {
      const res = await categoryApi.getList(type);
      categories.value = res.data;
      loaded.value = true;
      lastFetchAt.value = Date.now();
    } catch {
      // 网络失败时如有旧缓存则继续使用
      if (!loaded.value) throw new Error('获取分类失败');
    }
  }

  const expenseCategories = computed(() =>
    categories.value.filter((c) => c.type === 'EXPENSE'),
  );
  const incomeCategories = computed(() =>
    categories.value.filter((c) => c.type === 'INCOME'),
  );

  function getCategoryById(id: number): Category | undefined {
    return categories.value.find((c) => c.id === id);
  }

  return {
    categories,
    loaded,
    lastFetchAt,
    expenseCategories,
    incomeCategories,
    fetchCategories,
    getCategoryById,
  };
});
