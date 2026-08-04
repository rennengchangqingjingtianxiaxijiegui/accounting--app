<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useBook } from '@/composables/useBook';
import { BookTypeLabels } from '@/types/book';
import type { BookType } from '@/types/book';

const { createBook, updateBook, loading } = useBook();

const isEdit = ref(false);
const editBookId = ref<number | null>(null);
const form = ref({
  name: '',
  type: 'PERSONAL' as string,
  coverIcon: 'wallet',
});

const typeOptions = Object.entries(BookTypeLabels).map(([value, label]) => ({
  label,
  value,
}));

const typeIndex = ref(0);

// 图标列表
const iconList = [
  { name: 'wallet', emoji: '👛' },
  { name: 'home', emoji: '🏠' },
  { name: 'travel', emoji: '✈️' },
  { name: 'business', emoji: '💼' },
  { name: 'food', emoji: '🍽️' },
  { name: 'car', emoji: '🚗' },
  { name: 'cart', emoji: '🛒' },
  { name: 'sport', emoji: '⚽' },
];

onLoad((options?: Record<string, string>) => {
  if (options?.id) {
    isEdit.value = true;
    editBookId.value = parseInt(options.id, 10);
    form.value.name = decodeURIComponent(options.name || '');
    form.value.type = options.type || 'PERSONAL';
    form.value.coverIcon = options.coverIcon || 'wallet';

    const idx = typeOptions.findIndex((t) => t.value === form.value.type);
    if (idx >= 0) typeIndex.value = idx;

    uni.setNavigationBarTitle({ title: '编辑账本' });
  }
});

function onTypeChange(e: { detail: { value: number } }) {
  typeIndex.value = e.detail.value;
  form.value.type = typeOptions[e.detail.value].value;
}

function selectIcon(icon: string) {
  form.value.coverIcon = icon;
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请输入账本名称', icon: 'none' });
    return;
  }

  try {
    if (isEdit.value && editBookId.value) {
      await updateBook(editBookId.value, {
        name: form.value.name.trim(),
        type: form.value.type as BookType,
        coverIcon: form.value.coverIcon,
      });
      uni.showToast({ title: '账本已更新', icon: 'success' });
    } else {
      await createBook({
        name: form.value.name.trim(),
        type: form.value.type as BookType,
        coverIcon: form.value.coverIcon,
      });
      uni.showToast({ title: '账本创建成功', icon: 'success' });
    }
    setTimeout(() => uni.navigateBack(), 800);
  } catch (e: any) {
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' });
  }
}
</script>

<template>
  <view class="page">
    <view class="form-area">
      <!-- 账本名称 -->
      <view class="section">
        <text class="section-label">账本名称</text>
        <u-input
          v-model="form.name"
          placeholder="请输入账本名称"
          maxlength="50"
          border="bottom"
          clearable
          customStyle="font-size: 32rpx; padding: 16rpx 0;"
        />
      </view>

      <!-- 账本类型 -->
      <view class="section">
        <text class="section-label">账本类型</text>
        <picker
          :value="typeIndex"
          :range="typeOptions"
          range-key="label"
          @change="onTypeChange"
        >
          <view class="picker-display">
            <text>{{ typeOptions[typeIndex]?.label || '请选择' }}</text>
            <u-icon name="arrow-right" size="28" color="#999" />
          </view>
        </picker>
      </view>

      <!-- 封面图标 -->
      <view class="section">
        <text class="section-label">封面图标</text>
        <view class="icon-grid">
          <view
            v-for="icon in iconList"
            :key="icon.name"
            class="icon-item"
            :class="{ active: form.coverIcon === icon.name }"
            @click="selectIcon(icon.name)"
          >
            <text class="icon-emoji">{{ icon.emoji }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-area">
      <u-button
        type="primary"
        :loading="loading"
        :disabled="loading"
        shape="circle"
        customStyle="height: 88rpx; font-size: 32rpx;"
        @click="handleSubmit"
      >
        {{ isEdit ? '保存修改' : '创建账本' }}
      </u-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: $bg-color;
  padding: $spacing-md;
}

.form-area {
  background: $bg-card;
  border-radius: $radius-md;
  padding: $spacing-md;
}

.section {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }

  .section-label {
    font-size: $font-md;
    font-weight: 500;
    color: $text-primary;
    margin-bottom: $spacing-sm;
    display: block;
  }
}

.picker-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm 0;
  border-bottom: 1px solid $border-color;
  font-size: $font-md;
  color: $text-primary;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;

  .icon-item {
    width: 100rpx;
    height: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $bg-color;
    border-radius: $radius-md;
    border: 3rpx solid transparent;
    transition: border-color 0.2s;

    &.active {
      border-color: $primary-color;
      background: rgba($primary-color, 0.08);
    }

    .icon-emoji {
      font-size: 40rpx;
    }
  }
}

.submit-area {
  padding: $spacing-xl $spacing-md;
}
</style>
