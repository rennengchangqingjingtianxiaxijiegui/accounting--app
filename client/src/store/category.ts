// 收支分类缓存
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { categoryApi } from '@/api/category';
import type { Category, RecordType } from '@/types/record';

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([]);
  const loaded = ref(false);

  async function fetchCategories(type?: RecordType) {
    const res = await categoryApi.getList(type);
    categories.value = res.data;
    loaded.value = true;
  }

  const expenseCategories = computed(() =>
    categories.value.filter((c) => c.type === 'EXPENSE')
  );
  const incomeCategories = computed(() =>
    categories.value.filter((c) => c.type === 'INCOME')
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
