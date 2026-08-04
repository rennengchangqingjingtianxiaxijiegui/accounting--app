<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useRecord } from '@/composables/useRecord';
import { useCategoryStore } from '@/store/category';
import { recordApi } from '@/api/record';
import { useBookStore } from '@/store/book';
import CategoryPicker from '@/components/CategoryPicker.vue';
import type { Category, RecordType, RecordItem } from '@/types/record';

const { updateRecord } = useRecord();
const categoryStore = useCategoryStore();
const bookStore = useBookStore();

const recordId = ref<number>(0);
const activeType = ref<RecordType>('EXPENSE');
const amount = ref('');
const selectedCategory = ref<Category | null>(null);
const note = ref('');
const recordDate = ref('');
const loading = ref(false);

onLoad(async (options?: Record<string, string>) => {
  const id = parseInt(options?.id || '0', 10);
  recordId.value = id;
  if (!id) return;

  try {
    const res = await recordApi.getDetail(bookStore.activeBookId!, id);
    const r = res.data;
    activeType.value = r.type;
    amount.value = parseFloat(r.amount).toString(); // 去除末尾多余的0
    note.value = r.note || '';
    recordDate.value = r.recordDate;

    if (r.category) {
      selectedCategory.value = {
        id: r.category.id,
        name: r.category.name,
        type: r.category.type,
        icon: r.category.icon,
        parentId: null,
        sortOrder: 0,
        isDefault: r.category.isDefault,
      };
    }
  } catch (e: any) {
    uni.showToast({ title: '获取记录失败', icon: 'none' });
    setTimeout(() => uni.navigateBack(), 800);
  }

  categoryStore.fetchCategories();
});

// 数字键盘
const keypad = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '⌫'],
];

function inputDigit(digit: string) {
  if (digit === '.' && amount.value.includes('.')) return;
  if (digit === '.' && amount.value === '') { amount.value = '0.'; return; }
  if (amount.value.includes('.') && amount.value.split('.')[1].length >= 2) return;
  if (amount.value.replace('.', '').length >= 12) return;
  amount.value += digit;
}

function inputDelete() { amount.value = amount.value.slice(0, -1); }
function inputClear() { amount.value = ''; }

function switchType(type: RecordType) {
  activeType.value = type;
  selectedCategory.value = null;
}

async function handleSubmit() {
  const amt = parseFloat(amount.value);
  if (!amt || amt <= 0) {
    uni.showToast({ title: '请输入金额', icon: 'none' });
    return;
  }
  if (!selectedCategory.value) {
    uni.showToast({ title: '请选择分类', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    await updateRecord(recordId.value, {
      type: activeType.value,
      amount: amount.value,
      categoryId: selectedCategory.value.id,
      note: note.value.trim() || undefined,
      recordDate: recordDate.value,
    });
    uni.showToast({ title: '已更新', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 600);
  } catch (e: any) {
    uni.showToast({ title: e?.message || '更新失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function onDateChange(e: { detail: { value: string } }) {
  recordDate.value = e.detail.value;
}
</script>

<template>
  <view class="page">
    <view class="type-tabs">
      <view
        class="type-tab"
        :class="{ active: activeType === 'EXPENSE', 'is-expense': activeType === 'EXPENSE' }"
        @click="switchType('EXPENSE')"
      ><text>支出</text></view>
      <view
        class="type-tab"
        :class="{ active: activeType === 'INCOME', 'is-income': activeType === 'INCOME' }"
        @click="switchType('INCOME')"
      ><text>收入</text></view>
    </view>

    <view class="amount-display">
      <text class="currency">¥</text>
      <text class="amount-value">{{ amount || '0' }}</text>
    </view>

    <view class="form-area">
      <CategoryPicker v-model="selectedCategory" :type="activeType" />

      <view class="form-row" style="margin-top: 24rpx;">
        <text class="form-label">备注</text>
        <u-input v-model="note" placeholder="选填" maxlength="200" border="bottom" clearable />
      </view>

      <view class="form-row" style="margin-top: 24rpx;">
        <text class="form-label">日期</text>
        <picker mode="date" :value="recordDate" :end="getToday()" @change="onDateChange">
          <view class="date-picker">
            <text>{{ recordDate }}</text>
            <u-icon name="calendar" size="36" color="#999" />
          </view>
        </picker>
      </view>
    </view>

    <view class="keypad-area">
      <view v-for="row in keypad" :key="row[0]" class="keypad-row">
        <view
          v-for="key in row" :key="key"
          class="keypad-key"
          @click="key === '⌫' ? inputDelete() : inputDigit(key)"
        ><text>{{ key === '⌫' ? '⌫' : key }}</text></view>
      </view>
      <view class="keypad-row">
        <view class="keypad-key key-clear" @click="inputClear"><text>清空</text></view>
        <view class="keypad-key key-submit" @click="handleSubmit"><text>{{ loading ? '保存中...' : '保存' }}</text></view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: $bg-color;
  display: flex;
  flex-direction: column;
}

.type-tabs {
  display: flex;
  padding: $spacing-sm $spacing-md;
  gap: $spacing-sm;

  .type-tab {
    flex: 1;
    text-align: center;
    padding: 16rpx 0;
    border-radius: $radius-md;
    font-size: $font-md;
    color: $text-secondary;
    background: $bg-card;
    transition: all 0.2s;

    &.active.is-expense { background: $expense-color; color: #fff; font-weight: 600; }
    &.active.is-income { background: $income-color; color: #fff; font-weight: 600; }
  }
}

.amount-display {
  text-align: center;
  padding: $spacing-xl $spacing-md;

  .currency { font-size: 48rpx; font-weight: 300; color: $text-hint; margin-right: 4rpx; }
  .amount-value { font-size: 72rpx; font-weight: 700; color: $text-primary; min-width: 200rpx; }
}

.form-area {
  flex: 1;
  margin: 0 $spacing-sm;
  padding: $spacing-md;
  background: $bg-card;
  border-radius: $radius-md;

  .form-row {
    .form-label { font-size: $font-sm; color: $text-hint; margin-bottom: 4rpx; display: block; }
  }

  .date-picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-sm 0;
    border-bottom: 1px solid $border-color;
    font-size: $font-md;
    color: $text-primary;
  }
}

.keypad-area {
  background: $bg-card;
  padding: $spacing-sm $spacing-sm $spacing-lg;
  padding-bottom: calc($spacing-lg + $safe-area-bottom);

  .keypad-row { display: flex; gap: 4rpx; margin-bottom: 4rpx; }

  .keypad-key {
    flex: 1;
    height: 96rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $font-xl;
    color: $text-primary;
    background: $bg-color;
    border-radius: $radius-sm;

    &:active { opacity: 0.7; }

    &.key-clear { flex: 1; color: $text-secondary; font-size: $font-md; }
    &.key-submit { flex: 3; background: $primary-color; color: #fff; font-weight: 600; font-size: $font-md; }
  }
}
</style>
