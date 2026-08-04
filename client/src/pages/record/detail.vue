<script setup lang="ts">
import { ref } from 'vue';
import { recordApi } from '@/api/record';
import { useRecord } from '@/composables/useRecord';
import { useBookStore } from '@/store/book';
import CategoryIcon from '@/components/CategoryIcon.vue';
import { getCategoryIcon } from '@/utils/categoryIcons';
import type { RecordItem } from '@/types/record';

const { deleteRecord } = useRecord();
const bookStore = useBookStore();

const record = ref<RecordItem | null>(null);
const loading = ref(true);
const showDeleteModal = ref(false);

onLoad(async (options?: Record<string, string>) => {
  const id = parseInt(options?.id || '0', 10);
  if (!id) return;

  try {
    const res = await recordApi.getDetail(bookStore.activeBookId!, id);
    record.value = res.data;
  } catch (e: any) {
    uni.showToast({ title: '获取记录失败', icon: 'none' });
    setTimeout(() => uni.navigateBack(), 800);
  } finally {
    loading.value = false;
  }
});

function goToEdit() {
  if (!record.value) return;
  uni.navigateTo({ url: `/pages/record/edit?id=${record.value.id}` });
}

async function handleDelete() {
  if (!record.value) return;
  try {
    await deleteRecord(record.value.id);
    uni.showToast({ title: '已删除', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 600);
  } catch (e: any) {
    uni.showToast({ title: e?.message || '删除失败', icon: 'none' });
  } finally {
    showDeleteModal.value = false;
  }
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
}
</script>

<template>
  <view class="page">
    <template v-if="record">
      <!-- 金额 & 类型 -->
      <view class="detail-header" :class="record.type === 'INCOME' ? 'income' : 'expense'">
        <text class="detail-type">{{ record.type === 'INCOME' ? '收入' : '支出' }}</text>
        <text class="detail-amount">
          {{ record.type === 'INCOME' ? '+' : '-' }}¥{{ parseFloat(record.amount).toFixed(2) }}
        </text>
      </view>

      <!-- 明细卡片 -->
      <view class="detail-card">
        <view class="detail-row">
          <text class="d-label">分类</text>
          <view class="d-value category-row">
            <text class="cat-emoji">{{ getCategoryIcon(record.category?.icon || 'other') }}</text>
            <text>{{ record.category?.name || '未分类' }}</text>
          </view>
        </view>

        <view class="detail-row" v-if="record.note">
          <text class="d-label">备注</text>
          <text class="d-value">{{ record.note }}</text>
        </view>

        <view class="detail-row">
          <text class="d-label">日期</text>
          <text class="d-value">{{ fmtDate(record.recordDate) }}</text>
        </view>

        <view class="detail-row">
          <text class="d-label">记账人</text>
          <text class="d-value">{{ record.user?.nickname || '未知' }}</text>
        </view>

        <view class="detail-row">
          <text class="d-label">记账时间</text>
          <text class="d-value">{{ record.createdAt }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-area">
        <u-button type="primary" text="编辑" shape="circle" @click="goToEdit" />
        <u-button type="error" text="删除" shape="circle" plain @click="showDeleteModal = true" />
      </view>
    </template>

    <view v-else-if="!loading" class="empty-area">
      <u-empty text="记录不存在" mode="data" />
    </view>

    <!-- 删除确认弹窗 -->
    <u-modal
      :show="showDeleteModal"
      title="删除记录"
      content="确定删除这条记账记录吗？"
      showCancelButton
      confirmText="确定删除"
      confirmColor="#FF4D4F"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: $bg-color;
  padding: $spacing-md;
}

.detail-header {
  text-align: center;
  padding: $spacing-xl 0;

  &.income {
    .detail-amount { color: $income-color; }
  }
  &.expense {
    .detail-amount { color: $expense-color; }
  }

  .detail-type {
    display: block;
    font-size: $font-md;
    color: $text-hint;
    margin-bottom: $spacing-xs;
  }

  .detail-amount {
    font-size: 64rpx;
    font-weight: 700;
  }
}

.detail-card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: $spacing-sm $spacing-md;
  margin-bottom: $spacing-xl;

  .detail-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-md 0;
    border-bottom: 1px solid lighten($border-color, 2%);

    &:last-child { border-bottom: none; }

    .d-label {
      font-size: $font-md;
      color: $text-secondary;
      flex-shrink: 0;
      margin-right: $spacing-md;
    }

    .d-value {
      font-size: $font-md;
      color: $text-primary;
      text-align: right;
      word-break: break-all;
    }

    .category-row {
      display: flex;
      align-items: center;
      gap: $spacing-xs;

      .cat-emoji { font-size: 32rpx; }
    }
  }
}

.action-area {
  display: flex;
  gap: $spacing-md;
}

.empty-area {
  margin-top: 200rpx;
}
</style>
