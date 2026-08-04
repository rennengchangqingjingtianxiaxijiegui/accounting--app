<script setup lang="ts">
// 分类占比 — 支出/收入分类饼图替代方案（百分比条形图）
import { ref } from 'vue';
import { reportApi } from '@/api/report';
import { useBookStore } from '@/store/book';
import { getCategoryIcon } from '@/utils/categoryIcons';
import type { CategoryBreakdown } from '@/types/report';

const bookStore = useBookStore();
const loading = ref(true);
const categoryList = ref<CategoryBreakdown[]>([]);
const currentDate = ref('');
const activeTab = ref<'EXPENSE' | 'INCOME'>('EXPENSE');
const colors = ['#FF4D4F', '#FF7A45', '#FFA940', '#FFC53D', '#FFEC3D',
  '#B7EB8F', '#73D13D', '#52C41A', '#36CFC9', '#5CDBD3',
  '#69C0FF', '#4096FF', '#597EF7', '#9254DE', '#B37FEB'];

onLoad(async (options?: Record<string, string>) => {
  currentDate.value = options?.date || getCurrentMonth();
  uni.setNavigationBarTitle({ title: '分类占比' });
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
    const res = await reportApi.getCategoryBreakdown(
      bookStore.activeBookId,
      'month',
      currentDate.value,
      activeTab.value,
    );
    categoryList.value = res.data;
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function switchTab(type: 'EXPENSE' | 'INCOME') {
  activeTab.value = type;
  loadData();
}

function fmtAmount(val: string): string {
  return parseFloat(val).toFixed(2);
}

function barWidth(percent: number): string {
  return `${Math.max(percent, 2)}%`;
}

function getColor(index: number): string {
  return colors[index % colors.length];
}
</script>

<template>
  <view class="page">
    <!-- 类型切换 -->
    <view class="tab-row">
      <view
        class="tab-btn"
        :class="{ active: activeTab === 'EXPENSE', 'is-expense': activeTab === 'EXPENSE' }"
        @click="switchTab('EXPENSE')"
      >
        <text>支出</text>
      </view>
      <view
        class="tab-btn"
        :class="{ active: activeTab === 'INCOME', 'is-income': activeTab === 'INCOME' }"
        @click="switchTab('INCOME')"
      >
        <text>收入</text>
      </view>
    </view>

    <!-- 加载态 -->
    <view v-if="loading" class="loading-area">
      <u-loading-icon />
      <text>加载中...</text>
    </view>

    <!-- 空数据 -->
    <view v-else-if="categoryList.length === 0" class="empty-area">
      <u-empty text="暂无数据" mode="list" />
    </view>

    <!-- 百分比条形图 -->
    <scroll-view v-else scroll-y class="list-area">
      <view v-for="(item, idx) in categoryList" :key="item.categoryId" class="cat-row">
        <view class="cat-info">
          <text class="cat-emoji">{{ getCategoryIcon(item.icon) }}</text>
          <view class="cat-text">
            <text class="cat-name">{{ item.categoryName }}</text>
            <text class="cat-amount">¥{{ fmtAmount(item.amount) }}</text>
          </view>
        </view>

        <view class="cat-bar-wrap">
          <view
            class="cat-bar"
            :style="{
              width: barWidth(item.percent),
              background: getColor(idx),
            }"
          />
        </view>

        <text class="cat-percent">{{ item.percent }}%</text>
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

.tab-row {
  display: flex;
  padding: $spacing-sm $spacing-md;
  gap: $spacing-sm;
  background: $bg-card;
  margin-bottom: $spacing-sm;

  .tab-btn {
    flex: 1;
    text-align: center;
    padding: 16rpx 0;
    border-radius: $radius-md;
    font-size: $font-md;
    color: $text-secondary;
    background: $bg-color;
    transition: all 0.2s;

    &.active {
      color: #fff;
      font-weight: 600;
    }

    &.is-expense.active { background: $expense-color; }
    &.is-income.active { background: $income-color; }
  }
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

.list-area {
  flex: 1;
  padding: 0 $spacing-sm;
}

.cat-row {
  background: $bg-card;
  border-radius: $radius-md;
  padding: $spacing-md;
  margin-bottom: 4rpx;

  .cat-info {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-sm;

    .cat-emoji {
      font-size: 36rpx;
      margin-right: $spacing-sm;
    }

    .cat-text {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .cat-name {
        font-size: $font-md;
        color: $text-primary;
        font-weight: 500;
      }

      .cat-amount {
        font-size: $font-md;
        color: $text-primary;
        font-weight: 600;
      }
    }
  }

  .cat-bar-wrap {
    height: 12rpx;
    background: $bg-color;
    border-radius: 6rpx;
    overflow: hidden;
    margin-bottom: 6rpx;

    .cat-bar {
      height: 100%;
      border-radius: 6rpx;
      transition: width 0.3s;
      min-width: 4rpx;
    }
  }

  .cat-percent {
    font-size: $font-xs;
    color: $text-hint;
    text-align: right;
    display: block;
  }
}
</style>
