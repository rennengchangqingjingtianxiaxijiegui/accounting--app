<script setup lang="ts">
// 分类图标 — 根据 icon 名称映射 emoji
defineProps<{
  icon: string;
  size?: 'sm' | 'md' | 'lg';
}>();

const iconMap: Record<string, string> = {
  food: '🍜', transport: '🚌', shopping: '🛒', clothing: '👗',
  housing: '🏠', beauty: '💄', sport: '⚽', travel: '✈️',
  medical: '💊', education: '📚', telecom: '📱', entertainment: '🎮',
  digital: '💻', pet: '🐶', social: '🎁', other: '📦',
  other_expense: '📦',
  salary: '💰', bonus: '🏆', invest: '📈', parttime: '🔧',
  redpacket: '🧧', reimburse: '💵', refund: '↩️',
  other_income: '📦',
};
</script>

<template>
  <view
    class="cat-icon"
    :class="[`size-${size || 'md'}`]"
  >
    <text class="emoji">{{ iconMap[icon] || '📌' }}</text>
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
