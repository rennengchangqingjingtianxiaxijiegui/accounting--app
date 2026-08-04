<script setup lang="ts">
import { computed } from 'vue';
import { useSafeArea } from '@/composables/useSafeArea';

const props = withDefaults(defineProps<{
  title?: string;
  showBack?: boolean;
  backIcon?: string;
  bgColor?: string;
  titleColor?: string;
  transparent?: boolean;
  /** 右侧操作区插槽启用 */
  showRight?: boolean;
}>(), {
  title: '',
  showBack: true,
  backIcon: 'arrow-left',
  bgColor: '#ffffff',
  titleColor: '#333333',
  transparent: false,
  showRight: false,
});

const emit = defineEmits<{
  back: [];
}>();

const { headerHeight, statusBarHeight, navBarHeight } = useSafeArea();

// 获取当前页面栈长度，第一页不显示返回按钮
const pages = getCurrentPages();
const canGoBack = computed(() => props.showBack && pages.length > 1);

function handleBack() {
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/record/index' });
  }
  emit('back');
}

const headerStyle = computed(() => {
  if (props.transparent) {
    return {
      background: 'transparent',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
    };
  }
  return {
    background: props.bgColor,
  };
});
</script>

<template>
  <view class="custom-navbar" :style="{ height: headerHeight + 'px', ...headerStyle }">
    <!-- 状态栏占位 -->
    <view class="status-bar-placeholder" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 导航栏内容 -->
    <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
      <!-- 左侧返回按钮 -->
      <view class="navbar-left">
        <view v-if="canGoBack" class="back-btn" @click="handleBack">
          <u-icon
            :name="backIcon"
            size="36"
            :color="props.titleColor"
          />
        </view>
      </view>

      <!-- 标题 -->
      <view class="navbar-title" :style="{ color: props.titleColor }">
        <slot name="title">
          <text class="title-text">{{ title }}</text>
        </slot>
      </view>

      <!-- 右侧操作区 -->
      <view class="navbar-right">
        <slot v-if="showRight" name="right" />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.custom-navbar {
  position: relative;
  z-index: 999;
  box-sizing: border-box;
}

.status-bar-placeholder {
  width: 100%;
  flex-shrink: 0;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.navbar-left {
  position: absolute;
  left: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 100%;

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;

    &:active {
      background: rgba(0, 0, 0, 0.05);
    }
  }
}

.navbar-title {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 80rpx; // 留出两侧按钮空间
  overflow: hidden;

  .title-text {
    font-size: 34rpx;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.navbar-right {
  position: absolute;
  right: 24rpx;
  display: flex;
  align-items: center;
}
</style>
