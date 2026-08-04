<script setup lang="ts">
import { CATEGORY_ICON_MAP } from '@/utils/categoryIcons';

defineProps<{
  icon: string;
  size?: 'sm' | 'md' | 'lg';
}>();
</script>

<template>
  <view
    class="cat-icon"
    :class="[`size-${size || 'md'}`]"
  >
    <text class="emoji">{{ CATEGORY_ICON_MAP[icon] || '📌' }}</text>
  </view>
</template>

<style scoped lang="scss">
.cat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: $bg-color;

  &.size-sm {
    width: 48rpx;
    height: 48rpx;
    .emoji { font-size: 24rpx; }
  }
  &.size-md {
    width: 64rpx;
    height: 64rpx;
    .emoji { font-size: 32rpx; }
  }
  &.size-lg {
    width: 88rpx;
    height: 88rpx;
    .emoji { font-size: 44rpx; }
  }
}
</style>
