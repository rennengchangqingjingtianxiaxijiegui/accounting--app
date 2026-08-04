// 收支分类 — 前端直接使用 shared/constants 定义，无需后端请求

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ALL_DEFAULT_CATEGORIES } from '../../../shared/constants/categories';
import type { Category } from '@/types/record';

/** 将 shared 常量映射为 Category 类型 */
function toCategory(def: typeof ALL_DEFAULT_CATEGORIES[number]): Category {
  return {
    id: def.id,
    name: def.name,
    type: def.type,
    icon: def.icon,
    parentId: null,
    sortOrder: def.sortOrder,
    isDefault: true,
  };
}

// 初始化时直接从常量构建，零网络开销
const BUILTIN_CATEGORIES: Category[] = ALL_DEFAULT_CATEGORIES.map(toCategory);

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([...BUILTIN_CATEGORIES]);
  const loaded = ref(true);

  /** 兼容旧接口：直接 resolve，分类已内置 */
  async function fetchCategories(_force = false): Promise<void> {
    // 无需网络请求，分类数据已在常量中
    if (!loaded.value) {
      categories.value = [...BUILTIN_CATEGORIES];
      loaded.value = true;
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
    expenseCategories,
    incomeCategories,
    fetchCategories,
    getCategoryById,
  };
});
