// 记账组合式函数 — 封装记录列表、CRUD、分页加载、乐观更新
import { ref, computed } from 'vue';
import { recordApi } from '@/api/record';
import { useBookStore } from '@/store/book';
import type { RecordItem, CreateRecordParams, UpdateRecordParams, RecordFilter } from '@/types/record';

export function useRecord() {
  const bookStore = useBookStore();
  const records = ref<RecordItem[]>([]);
  const loading = ref(false);
  const hasMore = ref(true);
  const nextCursor = ref<number | null>(null);
  const error = ref<string | null>(null);

  const activeBookId = computed(() => bookStore.activeBookId);

  /** 首屏加载 / 下拉刷新 */
  async function fetchRecords(filter?: Omit<RecordFilter, 'bookId'>): Promise<void> {
    if (!activeBookId.value) return;

    loading.value = true;
    error.value = null;
    try {
      const res = await recordApi.getList(activeBookId.value, { ...filter, limit: 20 });
      records.value = res.data.list;
      nextCursor.value = res.data.nextCursor;
      hasMore.value = res.data.hasMore;
    } catch (e: any) {
      error.value = e?.message || '获取记录失败';
    } finally {
      loading.value = false;
    }
  }

  /** 加载更多（上拉触底） */
  async function loadMore(filter?: Omit<RecordFilter, 'bookId' | 'cursor'>): Promise<void> {
    if (!activeBookId.value || !hasMore.value || loading.value) return;

    loading.value = true;
    try {
      const res = await recordApi.getList(activeBookId.value, {
        ...filter,
        cursor: nextCursor.value!,
        limit: 20,
      });
      records.value.push(...res.data.list);
      nextCursor.value = res.data.nextCursor;
      hasMore.value = res.data.hasMore;
    } catch (e: any) {
      uni.showToast({ title: e?.message || '加载失败', icon: 'none' });
    } finally {
      loading.value = false;
    }
  }

  /** 添加记录（乐观更新） */
  async function addRecord(data: CreateRecordParams): Promise<RecordItem> {
    const res = await recordApi.create(activeBookId.value!, data);
    // 插入到列表头部（列表按日期降序，新记录通常日期最新）
    records.value.unshift(res.data);
    return res.data;
  }

  /** 更新记录 */
  async function updateRecord(recordId: number, data: UpdateRecordParams): Promise<RecordItem> {
    const res = await recordApi.update(activeBookId.value!, recordId, data);
    // 原地更新列表中的记录
    const idx = records.value.findIndex((r) => r.id === recordId);
    if (idx >= 0) records.value[idx] = res.data;
    return res.data;
  }

  /** 删除记录 */
  async function deleteRecord(recordId: number): Promise<void> {
    await recordApi.remove(activeBookId.value!, recordId);
    records.value = records.value.filter((r) => r.id !== recordId);
  }

  /** 按日期分组记录 */
  const groupedRecords = computed(() => {
    const groups: { date: string; items: RecordItem[]; dayTotal: string }[] = [];
    let currentDate = '';
    let currentGroup: RecordItem[] = [];

    for (const record of records.value) {
      if (record.recordDate !== currentDate) {
        if (currentGroup.length > 0) {
          const dayTotal = currentGroup.reduce((sum, r) => {
            const amt = parseFloat(r.amount);
            return r.type === 'EXPENSE' ? sum + amt : sum - amt;
          }, 0);
          groups.push({
            date: currentDate,
            items: [...currentGroup],
            dayTotal: Math.abs(dayTotal).toFixed(2),
          });
        }
        currentDate = record.recordDate;
        currentGroup = [record];
      } else {
        currentGroup.push(record);
      }
    }

    if (currentGroup.length > 0) {
      const dayTotal = currentGroup.reduce((sum, r) => {
        const amt = parseFloat(r.amount);
        return r.type === 'EXPENSE' ? sum + amt : sum - amt;
      }, 0);
      groups.push({
        date: currentDate,
        items: [...currentGroup],
        dayTotal: Math.abs(dayTotal).toFixed(2),
      });
    }

    return groups;
  });

  /** 本月汇总（从记录列表计算） */
  const monthlySummary = computed(() => {
    let income = 0;
    let expense = 0;

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    for (const r of records.value) {
      if (r.recordDate.startsWith(yearMonth)) {
        const amt = parseFloat(r.amount);
        if (r.type === 'INCOME') income += amt;
        else expense += amt;
      }
    }

    return {
      income: income.toFixed(2),
      expense: expense.toFixed(2),
      balance: (income - expense).toFixed(2),
    };
  });

  /** 根据分类 icon 名称查找 emoji */
  function getCategoryIcon(icon: string): string {
    const map: Record<string, string> = {
      food: '🍜', transport: '🚌', shopping: '🛒', clothing: '👗',
      housing: '🏠', beauty: '💄', sport: '⚽', travel: '✈️',
      medical: '💊', education: '📚', telecom: '📱', entertainment: '🎮',
      digital: '💻', pet: '🐶', social: '🎁', other: '📦',
      salary: '💰', bonus: '🏆', invest: '📈', parttime: '🔧',
      redpacket: '🧧', reimburse: '💵', refund: '↩️',
    };
    return map[icon] || '📌';
  }

  return {
    // 状态
    records,
    loading,
    hasMore,
    error,
    groupedRecords,
    monthlySummary,

    // 方法
    fetchRecords,
    loadMore,
    addRecord,
    updateRecord,
    deleteRecord,
    getCategoryIcon,
  };
}
