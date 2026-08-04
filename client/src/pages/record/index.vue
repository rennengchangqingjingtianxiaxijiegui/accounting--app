<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useRecord } from '@/composables/useRecord';
import { useBookStore } from '@/store/book';
import { useCategoryStore } from '@/store/category';
import { useSafeArea } from '@/composables/useSafeArea';
import NavBar from '@/components/NavBar.vue';
import CategoryIcon from '@/components/CategoryIcon.vue';

const { headerHeight } = useSafeArea();

const bookStore = useBookStore();
const categoryStore = useCategoryStore();
const {
  records,
  loading,
  hasMore,
  groupedRecords,
  monthlySummary,
  fetchRecords,
  loadMore,
  getCategoryIcon,
} = useRecord();

const showMonthPicker = ref(false);
const currentYearMonth = ref(getYearMonthStr(new Date()));

function getYearMonthStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function loadData() {
  try {
    await Promise.all([
      fetchRecords(),
      categoryStore.fetchCategories(),
    ]);
  } catch {
    // 静默失败，页面显示空列表
  }
}

onShow(async () => {
  // 确保账本列表已加载并选中
  if (bookStore.books.length === 0) {
    await bookStore.fetchBooks().catch(() => {});
  }
  if (bookStore.activeBookId) await loadData();
});

function onRefresh() {
  fetchRecords().finally(() => {
    // scroll-view refresher 自动关闭
  });
}

function onScrollToLower() {
  loadMore();
}

function goToAdd() {
  uni.navigateTo({ url: '/pages/record/add' });
}

function goToDetail(id: number) {
  uni.navigateTo({ url: `/pages/record/detail?id=${id}` });
}

function goToBookList() {
  uni.navigateTo({ url: '/pages/book/list' });
}

// 金额格式化
function fmtAmount(amount: string, type: string): string {
  const prefix = type === 'INCOME' ? '+' : '-';
  return `${prefix}¥${parseFloat(amount).toFixed(2)}`;
}

// 日期格式化显示
function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = dateStr;
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (dateOnly === todayStr) return '今天';
  if (dateOnly === yesterdayStr) return '昨天';

  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${mm}月${dd}日 ${weekDays[d.getDay()]}`;
}
</script>

<template>
  <view class="page">
    <!-- 顶部导航栏 -->
    <NavBar :showBack="false" bgColor="#ffffff">
      <template #title>
        <view class="book-switcher" @click="goToBookList">
          <text class="book-name">{{ bookStore.activeBook?.name || '选择账本' }}</text>
          <u-icon name="arrow-down" size="24" color="#666" />
        </view>
      </template>
    </NavBar>

    <!-- 本月汇总卡片 -->
    <view class="summary-card">
      <view class="summary-row">
        <view class="summary-item income">
          <text class="s-label">收入</text>
          <text class="s-value">¥{{ monthlySummary.income }}</text>
        </view>
        <view class="summary-item expense">
          <text class="s-label">支出</text>
          <text class="s-value">¥{{ monthlySummary.expense }}</text>
        </view>
        <view class="summary-item balance">
          <text class="s-label">结余</text>
          <text class="s-value">¥{{ monthlySummary.balance }}</text>
        </view>
      </view>
    </view>

    <!-- 记录列表 -->
    <scroll-view
      class="record-area"
      scroll-y
      refresher-enabled
      :refresher-triggered="loading"
      @refresherrefresh="onRefresh"
      @scrolltolower="onScrollToLower"
    >
      <!-- 空状态 -->
      <view v-if="!loading && records.length === 0" class="empty-area">
        <u-empty text="还没有记账记录" mode="list" />
        <text class="empty-hint">点击下方 + 按钮开始记账</text>
      </view>

      <!-- 按日期分组 -->
      <view v-for="group in groupedRecords" :key="group.date" class="date-group">
        <!-- 日期头部 -->
        <view class="date-header">
          <text class="date-text">{{ fmtDate(group.date) }}</text>
          <text class="date-total">
            支 ¥{{ group.dayTotal }}
          </text>
        </view>

        <!-- 当日记录 -->
        <view
          v-for="item in group.items"
          :key="item.id"
          class="record-item"
          @click="goToDetail(item.id)"
        >
          <CategoryIcon :icon="item.category?.icon || 'other'" size="md" />

          <view class="item-info">
            <text class="item-category">{{ item.category?.name || '未分类' }}</text>
            <text v-if="item.note" class="item-note">{{ item.note }}</text>
          </view>

          <text
            class="item-amount"
            :class="item.type === 'INCOME' ? 'income' : 'expense'"
          >
            {{ fmtAmount(item.amount, item.type) }}
          </text>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="records.length > 0" class="load-more">
        <text v-if="hasMore" class="load-text">上拉加载更多</text>
        <text v-else class="load-text">— 没有更多了 —</text>
      </view>
    </scroll-view>

    <!-- 添加按钮 FAB -->
    <view class="fab-btn" @click="goToAdd">
      <text class="fab-icon">+</text>
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

.book-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;

  .book-name {
    font-size: 34rpx;
    font-weight: 600;
    color: $text-primary;
    max-width: 300rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.summary-card {
  margin: $spacing-sm;
  padding: $spacing-md;
  background: $bg-card;
  border-radius: $radius-md;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);

  .summary-row {
    display: flex;
    justify-content: space-around;

    .summary-item {
      text-align: center;

      .s-label {
        display: block;
        font-size: $font-sm;
        color: $text-hint;
        margin-bottom: 6rpx;
      }

      .s-value {
        font-size: $font-xl;
        font-weight: 700;

        .income & { color: $income-color; }
        .expense & { color: $expense-color; }
        .balance & { color: $text-primary; }
      }
    }
  }
}

.record-area {
  flex: 1;
  padding: 0 $spacing-sm;
  padding-bottom: 140rpx;
}

.empty-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 160rpx;

  .empty-hint {
    color: $text-hint;
    font-size: $font-sm;
    margin-top: $spacing-sm;
  }
}

.date-group {
  margin-bottom: $spacing-md;
}

.date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm $spacing-sm;

  .date-text {
    font-size: $font-md;
    font-weight: 600;
    color: $text-primary;
  }

  .date-total {
    font-size: $font-xs;
    color: $text-hint;
  }
}

.record-item {
  display: flex;
  align-items: center;
  background: $bg-card;
  border-radius: $radius-md;
  padding: $spacing-sm $spacing-md;
  margin-bottom: 4rpx;

  .item-info {
    flex: 1;
    margin-left: $spacing-sm;
    min-width: 0;

    .item-category {
      font-size: $font-md;
      color: $text-primary;
      display: block;
    }

    .item-note {
      font-size: $font-xs;
      color: $text-hint;
      margin-top: 2rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }
  }

  .item-amount {
    font-size: $font-md;
    font-weight: 500;
    white-space: nowrap;

    &.income { color: $income-color; }
    &.expense { color: $expense-color; }
  }
}

.load-more {
  text-align: center;
  padding: $spacing-md 0;

  .load-text {
    font-size: $font-xs;
    color: $text-hint;
  }
}

.fab-btn {
  position: fixed;
  bottom: calc(100rpx + $safe-area-bottom);
  left: 50%;
  transform: translateX(-50%);
  width: 112rpx;
  height: 112rpx;
  background: $primary-color;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(74, 144, 217, 0.35);
  z-index: 100;

  .fab-icon {
    font-size: 56rpx;
    color: #fff;
    line-height: 1;
  }
}
</style>
