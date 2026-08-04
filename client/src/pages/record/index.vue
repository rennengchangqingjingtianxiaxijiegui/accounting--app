<script setup lang="ts">
// 记账首页 — 当月收支概览 + 记录时间线（Phase 4 实现）
import { useAuthStore } from '@/store/auth';
import { useBookStore } from '@/store/book';

const authStore = useAuthStore();
const bookStore = useBookStore();
</script>

<template>
  <view class="page">
    <!-- 账本切换 -->
    <view class="book-switcher" @click="uni.navigateTo({ url: '/pages/book/list' })">
      <text class="book-name">{{ bookStore.activeBook?.name || '选择账本' }}</text>
      <text class="arrow">▾</text>
    </view>

    <!-- 本月汇总卡片 -->
    <view class="summary-card">
      <view class="summary-row">
        <view class="summary-item income">
          <text class="label">收入</text>
          <text class="value">¥0.00</text>
        </view>
        <view class="summary-item expense">
          <text class="label">支出</text>
          <text class="value">¥0.00</text>
        </view>
        <view class="summary-item balance">
          <text class="label">结余</text>
          <text class="value">¥0.00</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state">
      <text class="empty-text">还没有记账记录</text>
      <text class="empty-hint">点击下方按钮开始记账</text>
    </view>

    <!-- 添加按钮 -->
    <view class="add-btn" @click="uni.navigateTo({ url: '/pages/record/add' })">
      <text class="add-icon">+</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding-bottom: 120rpx;
}
.book-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  background: $bg-white;
  .book-name { font-size: $font-lg; font-weight: 600; margin-right: 8rpx; }
  .arrow { font-size: $font-sm; color: $text-hint; }
}
.summary-card {
  margin: $spacing-sm;
  padding: $spacing-md;
  background: $bg-white;
  border-radius: $radius-md;
  .summary-row { display: flex; justify-content: space-around; }
  .summary-item {
    text-align: center;
    .label { display: block; font-size: $font-sm; color: $text-hint; margin-bottom: 8rpx; }
    .value { font-size: $font-xl; font-weight: 700; }
    &.income .value { color: $income-color; }
    &.expense .value { color: $expense-color; }
  }
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 200rpx;
  .empty-text { font-size: $font-md; color: $text-hint; }
  .empty-hint { font-size: $font-sm; color: $text-hint; margin-top: 12rpx; }
}
.add-btn {
  position: fixed;
  bottom: 120rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 120rpx;
  height: 120rpx;
  background: $primary-color;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(74, 144, 217, 0.3);
  .add-icon { font-size: 56rpx; color: #fff; line-height: 1; }
}
</style>
