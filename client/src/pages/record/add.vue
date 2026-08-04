<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRecord } from '@/composables/useRecord';
import { useCategoryStore } from '@/store/category';
import CategoryPicker from '@/components/CategoryPicker.vue';
import type { Category, RecordType } from '@/types/record';

const { addRecord, loading } = useRecord();
const categoryStore = useCategoryStore();

// 收支类型 Tab
const activeType = ref<RecordType>('EXPENSE');

// 表单字段
const amount = ref('');
const selectedCategory = ref<Category | null>(null);
const note = ref('');
const recordDate = ref(getToday());

// 日期选择器
const datePickerIndex = ref(0);

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 分类列表（根据当前类型）
const categories = computed(() =>
  activeType.value === 'INCOME'
    ? categoryStore.incomeCategories
    : categoryStore.expenseCategories,
);

// 切换类型时清空已选分类
function switchType(type: RecordType) {
  activeType.value = type;
  selectedCategory.value = null;
}

// 简易计算器：追加数字/小数点
function inputDigit(digit: string) {
  if (digit === '.' && amount.value.includes('.')) return;
  if (digit === '.' && amount.value === '') {
    amount.value = '0.';
    return;
  }
  // 限制两位小数
  if (amount.value.includes('.') && amount.value.split('.')[1].length >= 2) return;
  // 限制总长度
  if (amount.value.replace('.', '').length >= 12) return;
  amount.value += digit;
}

function inputDelete() {
  amount.value = amount.value.slice(0, -1);
}

function inputClear() {
  amount.value = '';
}

// 提交
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

  try {
    await addRecord({
      type: activeType.value,
      amount: amount.value,
      categoryId: selectedCategory.value.id,
      note: note.value.trim() || undefined,
      recordDate: recordDate.value,
    });
    uni.showToast({ title: '记账成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 600);
  } catch (e: any) {
    uni.showToast({ title: e?.message || '记账失败', icon: 'none' });
  }
}

// 数字键盘布局
const keypad = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '⌫'],
];

onMounted(() => {
  categoryStore.fetchCategories();
});
</script>

<template>
  <view class="page">
    <!-- 类型切换 -->
    <view class="type-tabs">
      <view
        class="type-tab"
        :class="{ active: activeType === 'EXPENSE', 'is-expense': activeType === 'EXPENSE' }"
        @click="switchType('EXPENSE')"
      >
        <text>支出</text>
      </view>
      <view
        class="type-tab"
        :class="{ active: activeType === 'INCOME', 'is-income': activeType === 'INCOME' }"
        @click="switchType('INCOME')"
      >
        <text>收入</text>
      </view>
    </view>

    <!-- 金额显示 -->
    <view class="amount-display">
      <text class="currency">¥</text>
      <text class="amount-value">{{ amount || '0' }}</text>
    </view>

    <!-- 分类选择 + 备注 + 日期 -->
    <view class="form-area">
      <CategoryPicker v-model="selectedCategory" :type="activeType" />

      <view class="form-row" style="margin-top: 24rpx;">
        <text class="form-label">备注</text>
        <u-input
          v-model="note"
          placeholder="选填"
          maxlength="200"
          border="bottom"
          clearable
          customStyle="font-size: 28rpx;"
        />
      </view>

      <view class="form-row" style="margin-top: 24rpx;">
        <text class="form-label">日期</text>
        <picker
          mode="date"
          :value="recordDate"
          :end="getToday()"
          @change="(e: any) => recordDate = e.detail.value"
        >
          <view class="date-picker">
            <text>{{ recordDate }}</text>
            <u-icon name="calendar" size="36" color="#999" />
          </view>
        </picker>
      </view>
    </view>

    <!-- 数字键盘 -->
    <view class="keypad-area">
      <view v-for="row in keypad" :key="row[0]" class="keypad-row">
        <view
          v-for="key in row"
          :key="key"
          class="keypad-key"
          :class="{
            'key-func': key === '⌫' || key === '.',
            'key-submit': key === '保存' ,
          }"
          @click="key === '⌫' ? inputDelete() : inputDigit(key)"
        >
          <text>{{ key === '⌫' ? '⌫' : key }}</text>
        </view>
      </view>

      <!-- 底部提交 -->
      <view class="keypad-row">
        <view class="keypad-key key-clear" @click="inputClear">
          <text>清空</text>
        </view>
        <view class="keypad-key key-submit" @click="handleSubmit">
          <text>保存</text>
        </view>
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

    &.active {
      background: $primary-color;
      color: #fff;
      font-weight: 600;

      // 支出红色，收入绿色
      :deep(&) when (activeType: 'EXPENSE') {
        background: $expense-color;
      }
    }
  }
}

.type-tab.active {
  &.is-expense { background: $expense-color; }
  &.is-income { background: $income-color; }
}

.amount-display {
  text-align: center;
  padding: $spacing-xl $spacing-md;

  .currency {
    font-size: 48rpx;
    font-weight: 300;
    color: $text-hint;
    margin-right: 4rpx;
  }

  .amount-value {
    font-size: 72rpx;
    font-weight: 700;
    color: $text-primary;
    min-width: 200rpx;
  }
}

.form-area {
  flex: 1;
  margin: 0 $spacing-sm;
  padding: $spacing-md;
  background: $bg-card;
  border-radius: $radius-md;

  .form-row {
    .form-label {
      font-size: $font-sm;
      color: $text-hint;
      margin-bottom: 4rpx;
      display: block;
    }
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

  .keypad-row {
    display: flex;
    gap: 4rpx;
    margin-bottom: 4rpx;
  }

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
    transition: background 0.1s;

    &:active {
      background: darken($bg-color, 5%);
    }

    &.key-clear {
      flex: 1;
      color: $text-secondary;
      font-size: $font-md;
    }

    &.key-submit {
      flex: 3;
      background: $primary-color;
      color: #fff;
      font-weight: 600;
      font-size: $font-md;

      &:active {
        opacity: 0.85;
      }
    }
  }
}
</style>
