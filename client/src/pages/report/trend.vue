<script setup lang="ts">
// 收支趋势 — 按日展示收入/支出柱状对比
import { ref, computed } from 'vue';
import { reportApi } from '@/api/report';
import { useBookStore } from '@/store/book';
import type { TrendItem } from '@/types/report';

const bookStore = useBookStore();
const loading = ref(true);
const trendList = ref<TrendItem[]>([]);
const currentDate = ref('');

// 切换类型高亮
const highlightType = ref<'income' | 'expense'>('expense');

onLoad(async (options?: Record<string, string>) => {
  currentDate.value = options?.date || getCurrentMonth();
  uni.setNavigationBarTitle({ title: '收支趋势' });
  await loadData();
});

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function loadData() {
  if (!bookStore.activeBookId) return;
  loading.value = true;
  try {
    const res = await reportApi.getTrend(bookStore.activeBookId, 'month', currentDate.value);
    trendList.value = res.data;
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function fmtAmount(val: string): string {
  return parseFloat(val).toFixed(2);
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function fmtWeekDay(dateStr: string): string {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekDays[new Date(dateStr).getDay()];
}

// 计算柱状图最大值用于比例缩放
const maxAmount = computed(() => {
  let max = 0;
  for (const item of trendList.value) {
    const income = parseFloat(item.income);
    const expense = parseFloat(item.expense);
    if (income > max) max = income;
    if (expense > max) max = expense;
  }
  return max || 1;
});

function barHeight(amount: string): string {
  const val = parseFloat(amount);
  return `${Math.max((val / maxAmount.value) * 120, 2)}rpx`;
}
</script>

<template>
  <view class="page">
    <!-- 图例切换 -->
    <view class="legend-row">
      <view class="legend-item" :class="{ active: highlightType === 'expense' }" @click="highlightType = 'expense'">
        <view class="dot expense" />
        <text>支出</text>
      </view>
      <view class="legend-item" :class="{ active: highlightType === 'income' }" @click="highlightType = 'income'">
        <view class="dot income" />
        <text>收入</text>
      </view>
    </view>

    <!-- 柱状图区域 -->
    <view v-if="!loading && trendList.length > 0" class="chart-area">
      <scroll-view scroll-x class="bar-scroll">
        <view class="bar-container">
          <view v-for="item in trendList" :key="item.date" class="bar-group">
            <view class="bar-values">
              <view
                class="bar expense-bar"
                :style="{ height: barHeight(item.expense), opacity: highlightType === 'expense' ? 1 : 0.35 }"
              />
              <view
                class="bar income-bar"
                :style="{ height: barHeight(item.income), opacity: highlightType === 'income' ? 1 : 0.35 }"
              />
            </view>
            <text class="bar-date">{{ fmtDate(item.date) }}</text>
            <text class="bar-weekday">{{ fmtWeekDay(item.date) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 数据列表 -->
    <scroll-view scroll-y class="list-area">
      <view v-if="loading" class="loading-area">
        <u-loading-icon />
        <text>加载中...</text>
      </view>

      <view v-else-if="trendList.length === 0" class="empty-area">
        <u-empty text="暂无数据" mode="list" />
      </view>

      <view v-for="item in trendList" :key="item.date" class="trend-row">
        <view class="row-date">
          <text class="r-date">{{ fmtDate(item.date) }}</text>
          <text class="r-weekday">{{ fmtWeekDay(item.date) }}</text>
        </view>
        <view class="row-amounts">
          <text class="r-expense">支 ¥{{ fmtAmount(item.expense) }}</text>
          <text class="r-income">收 ¥{{ fmtAmount(item.income) }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: $bg-color;
  display: flex;
  flex-direction: column;
}

.legend-row {
  display: flex;
  justify-content: center;
  gap: $spacing-lg;
  padding: $spacing-md;
  background: $bg-card;
  margin-bottom: $spacing-sm;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: $font-sm;
    color: $text-hint;
    padding: 8rpx 24rpx;
    border-radius: 24rpx;

    &.active {
      background: $bg-color;
      color: $text-primary;
      font-weight: 500;
    }

    .dot {
      width: 16rpx;
      height: 16rpx;
      border-radius: 4rpx;

      &.expense { background: $expense-color; }
      &.income { background: $income-color; }
    }
  }
}

.chart-area {
  background: $bg-card;
  padding: $spacing-md 0;
  margin-bottom: $spacing-sm;
}

.bar-scroll {
  width: 100%;
}

.bar-container {
  display: flex;
  align-items: flex-end;
  padding: 0 $spacing-sm;
  min-width: max-content;
  height: 220rpx;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80rpx;
  margin: 0 8rpx;

  .bar-values {
    display: flex;
    align-items: flex-end;
    gap: 4rpx;
    height: 140rpx;
  }

  .bar {
    width: 24rpx;
    border-radius: 6rpx 6rpx 0 0;
    min-height: 2rpx;
    transition: opacity 0.2s;
  }

  .expense-bar { background: $expense-color; }
  .income-bar { background: $income-color; }

  .bar-date {
    font-size: $font-xs;
    color: $text-secondary;
    margin-top: 8rpx;
  }

  .bar-weekday {
    font-size: 20rpx;
    color: $text-hint;
  }
}

.list-area {
  flex: 1;
  padding: 0 $spacing-sm;
}

.loading-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 120rpx;
  gap: $spacing-sm;
  color: $text-hint;
  font-size: $font-sm;
}

.empty-area {
  margin-top: 100rpx;
}

.trend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $bg-card;
  border-radius: $radius-md;
  padding: $spacing-md;
  margin-bottom: 4rpx;

  .row-date {
    .r-date {
      font-size: $font-md;
      color: $text-primary;
      display: block;
    }
    .r-weekday {
      font-size: $font-xs;
      color: $text-hint;
    }
  }

  .row-amounts {
    text-align: right;

    .r-expense {
      font-size: $font-md;
      color: $expense-color;
      margin-right: $spacing-md;
    }
    .r-income {
      font-size: $font-md;
      color: $income-color;
    }
  }
}
</style>
