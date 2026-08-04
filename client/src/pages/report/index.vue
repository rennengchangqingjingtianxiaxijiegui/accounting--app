<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { reportApi } from '@/api/report';
import { useBookStore } from '@/store/book';
import NavBar from '@/components/NavBar.vue';
import { useSafeArea } from '@/composables/useSafeArea';
import type { SummaryData } from '@/types/report';

const bookStore = useBookStore();
const { headerHeight } = useSafeArea();
const loading = ref(false);
const summary = ref<SummaryData>({ income: '0.00', expense: '0.00', balance: '0.00' });

const now = new Date();
const currentYearMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

function getDateLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${y}年${m}月`;
}

async function loadSummary() {
  if (!bookStore.activeBookId) return;
  loading.value = true;
  try {
    const res = await reportApi.getSummary(bookStore.activeBookId, 'month', currentYearMonth.value);
    summary.value = res.data;
  } catch {
    // 静默失败
  } finally {
    loading.value = false;
  }
}

function goToTrend() {
  uni.navigateTo({ url: `/pages/report/trend?date=${currentYearMonth.value}` });
}

function goToCategory() {
  uni.navigateTo({ url: `/pages/report/category?date=${currentYearMonth.value}` });
}

function prevMonth() {
  const [y, m] = currentYearMonth.value.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  currentYearMonth.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  loadSummary();
}

function nextMonth() {
  const [y, m] = currentYearMonth.value.split('-').map(Number);
  const d = new Date(y, m, 1);
  currentYearMonth.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  loadSummary();
}

onShow(() => {
  if (bookStore.books.length === 0) {
    bookStore.fetchBooks().catch(() => {});
  }
  loadSummary();
});

function fmtAmount(val: string): string {
  return parseFloat(val).toFixed(2);
}
</script>

<template>
  <view class="page">
    <!-- 顶部导航栏 -->
    <NavBar title="统计报表" :showBack="false" />

    <!-- 月份选择器 -->
    <view class="month-bar">
      <view class="month-btn" @click="prevMonth">
        <u-icon name="arrow-left" size="32" color="#999" />
      </view>
      <text class="month-label">{{ getDateLabel(currentYearMonth) }}</text>
      <view class="month-btn" @click="nextMonth">
        <u-icon name="arrow-right" size="32" color="#999" />
      </view>
    </view>

    <!-- 收支汇总卡片 -->
    <view class="summary-row">
      <view class="summary-card">
        <text class="s-label">收入</text>
        <text class="s-value income">¥{{ fmtAmount(summary.income) }}</text>
      </view>
      <view class="summary-card">
        <text class="s-label">支出</text>
        <text class="s-value expense">¥{{ fmtAmount(summary.expense) }}</text>
      </view>
      <view class="summary-card">
        <text class="s-label">结余</text>
        <text class="s-value balance">¥{{ fmtAmount(summary.balance) }}</text>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="feature-area">
      <view class="feature-card" @click="goToTrend">
        <view class="feature-icon">
          <text class="emoji">📈</text>
        </view>
        <view class="feature-info">
          <text class="feature-title">收支趋势</text>
          <text class="feature-desc">按日查看收入支出变化</text>
        </view>
        <u-icon name="arrow-right" size="28" color="#ccc" />
      </view>

      <view class="feature-card" @click="goToCategory">
        <view class="feature-icon">
          <text class="emoji">🍩</text>
        </view>
        <view class="feature-info">
          <text class="feature-title">分类占比</text>
          <text class="feature-desc">支出/收入分类比例分析</text>
        </view>
        <u-icon name="arrow-right" size="28" color="#ccc" />
      </view>
    </view>

    <view v-if="!bookStore.activeBookId && !loading" class="empty-area">
      <u-empty text="请先选择或创建账本" mode="list" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: $bg-color;
}

.month-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-card;
  margin-bottom: $spacing-sm;

  .month-label {
    font-size: $font-lg;
    font-weight: 600;
    color: $text-primary;
    min-width: 160rpx;
    text-align: center;
  }

  .month-btn {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: $bg-color;

    &:active { opacity: 0.7; }
  }
}

.summary-row {
  display: flex;
  gap: $spacing-sm;
  padding: 0 $spacing-sm;
  margin-bottom: $spacing-sm;

  .summary-card {
    flex: 1;
    background: $bg-card;
    border-radius: $radius-md;
    padding: $spacing-md;
    text-align: center;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);

    .s-label {
      display: block;
      font-size: $font-sm;
      color: $text-hint;
      margin-bottom: 8rpx;
    }

    .s-value {
      font-size: $font-lg;
      font-weight: 700;

      &.income { color: $income-color; }
      &.expense { color: $expense-color; }
      &.balance { color: $text-primary; }
    }
  }
}

.feature-area {
  padding: 0 $spacing-sm;

  .feature-card {
    display: flex;
    align-items: center;
    background: $bg-card;
    border-radius: $radius-md;
    padding: $spacing-md;
    margin-bottom: $spacing-sm;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);

    .feature-icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: $radius-md;
      background: $bg-color;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: $spacing-md;

      .emoji { font-size: 36rpx; }
    }

    .feature-info {
      flex: 1;

      .feature-title {
        font-size: $font-md;
        font-weight: 600;
        color: $text-primary;
        display: block;
      }

      .feature-desc {
        font-size: $font-xs;
        color: $text-hint;
        margin-top: 4rpx;
        display: block;
      }
    }
  }
}

.empty-area {
  margin-top: 120rpx;
}
</style>
