<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCategoryStore } from '@/store/category';
import { getCategoryIcon } from '@/utils/categoryIcons';
import type { Category, RecordType } from '@/types/record';

const props = defineProps<{
  modelValue: Category | null;
  type: RecordType;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Category): void;
}>();

const store = useCategoryStore();
const show = ref(false);

const categories = computed(() =>
  props.type === 'INCOME' ? store.incomeCategories : store.expenseCategories,
);

function select(cat: Category) {
  emit('update:modelValue', cat);
  show.value = false;
}

function open() {
  store.fetchCategories();
  show.value = true;
}
</script>

<template>
  <view>
    <view class="trigger" @click="open">
      <template v-if="modelValue">
        <text class="trigger-emoji">{{ getCategoryIcon(modelValue.icon) }}</text>
        <text class="trigger-name">{{ modelValue.name }}</text>
      </template>
      <template v-else>
        <text class="trigger-placeholder">选择分类</text>
      </template>
      <u-icon name="arrow-right" size="28" color="#999" />
    </view>

    <u-popup
      :show="show"
      mode="bottom"
      :round="16"
      @close="show = false"
    >
      <view class="picker-panel">
        <text class="picker-title">选择分类</text>
        <view class="picker-grid">
          <view
            v-for="cat in categories"
            :key="cat.id"
            class="picker-item"
            :class="{ active: modelValue?.id === cat.id }"
            @click="select(cat)"
          >
            <view class="picker-icon">
              <text class="picker-emoji">{{ getCategoryIcon(cat.icon) }}</text>
            </view>
            <text class="picker-label">{{ cat.name }}</text>
          </view>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<style scoped lang="scss">
.trigger {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm 0;
  border-bottom: 1px solid $border-color;

  .trigger-emoji { font-size: 36rpx; }
  .trigger-name { font-size: $font-md; color: $text-primary; flex: 1; }
  .trigger-placeholder { font-size: $font-md; color: $text-hint; flex: 1; }
}

.picker-panel {
  padding: $spacing-lg $spacing-md $spacing-xl;
  max-height: 60vh;

  .picker-title {
    font-size: $font-xl;
    font-weight: 600;
    color: $text-primary;
    text-align: center;
    display: block;
    margin-bottom: $spacing-lg;
  }
}

.picker-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;

  .picker-item {
    width: calc(25% - 18rpx);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $spacing-sm 0;
    border-radius: $radius-md;
    background: $bg-color;
    transition: background 0.2s;

    &.active {
      background: rgba($primary-color, 0.1);
    }

    .picker-icon {
      width: 72rpx;
      height: 72rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .picker-emoji { font-size: 40rpx; }

    .picker-label {
      font-size: $font-xs;
      color: $text-secondary;
      margin-top: 4rpx;
    }
  }
}
</style>
