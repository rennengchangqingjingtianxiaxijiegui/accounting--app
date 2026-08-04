<script setup lang="ts">
import { ref, onShow } from 'vue';
import { useBook } from '@/composables/useBook';
import { BookTypeLabels, MemberRoleLabels } from '@/types/book';
import type { Book, MemberRole } from '@/types/book';

const { books, loading, fetchBooks, switchBook, deleteBook, getRoleLabel } = useBook();
const showDeleteModal = ref(false);
const deleteTarget = ref<Book | null>(null);

onShow(() => {
  fetchBooks().catch(() => {});
});

function goToCreate() {
  uni.navigateTo({ url: '/pages/book/create' });
}

function goToEdit(book: Book) {
  uni.navigateTo({
    url: `/pages/book/create?id=${book.id}&name=${encodeURIComponent(book.name)}&type=${book.type}`,
  });
}

function goToMembers(book: Book) {
  uni.navigateTo({ url: `/pages/book/members?id=${book.id}&name=${encodeURIComponent(book.name)}` });
}

function enterBook(book: Book) {
  switchBook(book.id);
  uni.switchTab({ url: '/pages/record/index' });
}

function confirmDelete(book: Book) {
  deleteTarget.value = book;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!deleteTarget.value) return;
  try {
    await deleteBook(deleteTarget.value.id);
    uni.showToast({ title: '已删除', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || '删除失败', icon: 'none' });
  } finally {
    showDeleteModal.value = false;
    deleteTarget.value = null;
  }
}

function getTypeLabel(type: string): string {
  return BookTypeLabels[type as keyof typeof BookTypeLabels] || type;
}

function canManage(book: Book): boolean {
  return book.myRole === 'OWNER' || book.myRole === 'ADMIN';
}
</script>

<template>
  <view class="page">
    <!-- 下拉刷新区域 -->
    <scroll-view
      class="scroll-area"
      scroll-y
      refresher-enabled
      :refresher-triggered="loading"
      @refresherrefresh="fetchBooks"
    >
      <!-- 空状态 -->
      <view v-if="!loading && books.length === 0" class="empty-area">
        <u-empty text="还没有账本" mode="list" />
        <text class="empty-hint">点击下方按钮创建第一个账本</text>
      </view>

      <!-- 账本列表 -->
      <view v-for="book in books" :key="book.id" class="book-card" @click="enterBook(book)">
        <view class="card-left">
          <view class="book-icon">{{ book.coverIcon === 'wallet' ? '📒' : '📔' }}</view>
        </view>

        <view class="card-center">
          <view class="book-name-row">
            <text class="book-name">{{ book.name }}</text>
            <u-tag
              :text="getTypeLabel(book.type)"
              type="primary"
              size="mini"
              plain
              shape="circle"
            />
          </view>
          <view class="book-meta">
            <text class="meta-item">{{ book.memberCount ?? 0 }} 人</text>
            <text class="meta-divider">·</text>
            <text class="meta-item">{{ book.recordCount ?? 0 }} 笔</text>
            <text class="meta-divider">·</text>
            <u-tag
              :text="getRoleLabel(book.myRole as MemberRole)"
              size="mini"
              :type="book.myRole === 'OWNER' ? 'warning' : 'info'"
            />
          </view>
        </view>

        <view class="card-right" @click.stop>
          <u-icon
            name="more-dot-fill"
            size="36"
            color="#999"
            @click.stop=""
          />
          <!-- 操作菜单通过长按或点击更多触发 -->
          <view class="card-actions">
            <text
              v-if="canManage(book)"
              class="action-btn"
              @click.stop="goToEdit(book)"
            >编辑</text>
            <text
              v-if="canManage(book)"
              class="action-btn"
              @click.stop="goToMembers(book)"
            >成员</text>
            <text
              v-if="book.myRole === 'OWNER'"
              class="action-btn danger"
              @click.stop="confirmDelete(book)"
            >删除</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 创建按钮 -->
    <view class="fab-area">
      <u-button
        type="primary"
        icon="plus"
        shape="circle"
        customStyle="width: 112rpx; height: 112rpx;"
        @click="goToCreate"
      />
    </view>

    <!-- 删除确认弹窗 -->
    <u-modal
      :show="showDeleteModal"
      title="删除账本"
      content="删除后所有成员将无法访问，确定删除？"
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
  display: flex;
  flex-direction: column;
}

.scroll-area {
  flex: 1;
  padding: $spacing-sm;
}

.empty-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 200rpx;

  .empty-hint {
    color: $text-hint;
    font-size: $font-sm;
    margin-top: $spacing-sm;
  }
}

.book-card {
  display: flex;
  align-items: center;
  background: $bg-card;
  border-radius: $radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-sm;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  .card-left {
    .book-icon {
      font-size: 48rpx;
      width: 80rpx;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $bg-color;
      border-radius: $radius-md;
    }
  }

  .card-center {
    flex: 1;
    margin-left: $spacing-md;
    min-width: 0;

    .book-name-row {
      display: flex;
      align-items: center;
      gap: $spacing-xs;

      .book-name {
        font-size: $font-lg;
        font-weight: 600;
        color: $text-primary;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .book-meta {
      display: flex;
      align-items: center;
      gap: 6rpx;
      margin-top: 6rpx;

      .meta-item {
        font-size: $font-xs;
        color: $text-hint;
      }

      .meta-divider {
        color: $border-color;
        font-size: $font-xs;
      }
    }
  }

  .card-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $spacing-xs;

    .card-actions {
      display: flex;
      gap: $spacing-xs;

      .action-btn {
        font-size: $font-xs;
        color: $primary-color;
        padding: 2rpx 8rpx;

        &.danger {
          color: $expense-color;
        }
      }
    }
  }
}

.fab-area {
  position: fixed;
  right: 40rpx;
  bottom: 80rpx;
  z-index: 100;
}
</style>
