<script setup lang="ts">
// 报表首页 — Phase 5 实现
// 当前提供自定义导航栏，为后续图表展示准备
import NavBar from '@/components/NavBar.vue';
</script>

<template>
  <view class="page">
    <NavBar title="统计报表" :showBack="false" />
    <view class="placeholder">
      <u-empty text="报表功能即将上线" mode="data" />
      <text class="hint">Phase 5 — 趋势图 · 分类饼图 · 收支汇总</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: $bg-color;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 160rpx;
  gap: $spacing-md;

  .hint {
    font-size: $font-xs;
    color: $text-hint;
  }
}
</style>
