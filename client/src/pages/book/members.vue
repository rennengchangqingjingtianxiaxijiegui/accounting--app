<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useBook } from '@/composables/useBook';
import { MemberRoleLabels } from '@/types/book';
import type { BookMember, MemberRole } from '@/types/book';

const {
  getMembers,
  addMember,
  updateMember,
  removeMember,
  getRoleLabel,
  loading,
} = useBook();

const bookId = ref<number>(0);
const bookName = ref('');
const members = ref<BookMember[]>([]);

// 添加成员弹窗
const showAddModal = ref(false);
const addForm = ref({ userId: '', role: 'EDITOR' as MemberRole });

// 角色选择
const roleOptions = Object.entries(MemberRoleLabels)
  .filter(([key]) => key !== 'OWNER') // 不能通过 API 设置 owner
  .map(([value, label]) => ({ value, label }));

const roleIndex = ref(1); // 默认 EDITOR

// 移除确认
const showRemoveModal = ref(false);
const removeTarget = ref<BookMember | null>(null);

onLoad((options?: Record<string, string>) => {
  bookId.value = parseInt(options?.id || '0', 10);
  bookName.value = decodeURIComponent(options?.name || '');
  uni.setNavigationBarTitle({ title: `${bookName.value} - 成员` });
  loadMembers();
});

async function loadMembers() {
  try {
    members.value = await getMembers(bookId.value);
  } catch (e: any) {
    uni.showToast({ title: e?.message || '获取成员列表失败', icon: 'none' });
  }
}

function openAddModal() {
  addForm.value = { userId: '', role: 'EDITOR' };
  roleIndex.value = 1;
  showAddModal.value = true;
}

function onRoleChange(e: { detail: { value: number } }) {
  roleIndex.value = e.detail.value;
  addForm.value.role = roleOptions[e.detail.value].value as MemberRole;
}

async function handleAddMember() {
  const userId = parseInt(addForm.value.userId, 10);
  if (!userId || userId <= 0) {
    uni.showToast({ title: '请输入有效的用户ID', icon: 'none' });
    return;
  }

  try {
    const member = await addMember(bookId.value, {
      userId,
      role: addForm.value.role,
    });
    members.value.push(member);
    showAddModal.value = false;
    uni.showToast({ title: '成员添加成功', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || '添加失败', icon: 'none' });
  }
}

async function handleChangeRole(member: BookMember, newRole: MemberRole) {
  try {
    const updated = await updateMember(bookId.value, member.id, { role: newRole });
    const idx = members.value.findIndex((m) => m.id === member.id);
    if (idx >= 0) {
      members.value[idx] = updated;
    }
    uni.showToast({ title: '角色已更新', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || '更新失败', icon: 'none' });
  }
}

function confirmRemove(member: BookMember) {
  removeTarget.value = member;
  showRemoveModal.value = true;
}

async function handleRemove() {
  if (!removeTarget.value) return;
  try {
    await removeMember(bookId.value, removeTarget.value.id);
    members.value = members.value.filter((m) => m.id !== removeTarget.value!.id);
    uni.showToast({ title: '已移除', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || '移除失败', icon: 'none' });
  } finally {
    showRemoveModal.value = false;
    removeTarget.value = null;
  }
}

function showRolePicker(member: BookMember) {
  const labels = roleOptions.map((r) => r.label);
  uni.showActionSheet({
    itemList: labels,
    success: (res) => {
      const selectedRole = roleOptions[res.tapIndex].value as MemberRole;
      if (selectedRole !== member.role) {
        handleChangeRole(member, selectedRole);
      }
    },
  });
}

function getRoleBadgeType(role: string): 'warning' | 'primary' | 'success' | 'info' {
  const map: Record<string, 'warning' | 'primary' | 'success' | 'info'> = {
    OWNER: 'warning',
    ADMIN: 'primary',
    EDITOR: 'success',
    VIEWER: 'info',
  };
  return map[role] || 'info';
}
</script>

<template>
  <view class="page">
    <!-- 成员列表 -->
    <scroll-view
      class="scroll-area"
      scroll-y
      refresher-enabled
      :refresher-triggered="loading"
      @refresherrefresh="loadMembers"
    >
      <view v-if="members.length === 0 && !loading" class="empty-area">
        <u-empty text="暂无成员" mode="list" />
      </view>

      <view v-for="member in members" :key="member.id" class="member-card">
        <view class="member-avatar">
          <u-avatar
            :src="member.user?.avatarUrl || ''"
            :text="(member.user?.nickname || '?').charAt(0)"
            size="44"
          />
        </view>

        <view class="member-info">
          <text class="member-name">{{ member.user?.nickname || '未设置昵称' }}</text>
          <text class="member-phone">{{ member.user?.phone || '' }}</text>
        </view>

        <view class="member-role" @click="showRolePicker(member)">
          <u-tag
            :text="getRoleLabel(member.role as MemberRole)"
            :type="getRoleBadgeType(member.role)"
            size="small"
            plain
          />
          <u-icon
            v-if="member.role !== 'OWNER'"
            name="arrow-down"
            size="20"
            color="#999"
          />
        </view>

        <view v-if="member.role !== 'OWNER'" class="member-action">
          <text class="remove-btn" @click="confirmRemove(member)">移除</text>
        </view>
      </view>
    </scroll-view>

    <!-- 添加成员按钮 -->
    <view class="bottom-bar">
      <u-button
        type="primary"
        icon="plus"
        shape="circle"
        customStyle="width: 100%; height: 88rpx;"
        @click="openAddModal"
      >
        添加成员
      </u-button>
    </view>

    <!-- 添加成员弹窗 -->
    <u-popup
      :show="showAddModal"
      mode="bottom"
      :round="16"
      @close="showAddModal = false"
    >
      <view class="popup-content">
        <text class="popup-title">添加成员</text>

        <view class="popup-form">
          <text class="form-label">用户ID</text>
          <u-input
            v-model="addForm.userId"
            type="number"
            placeholder="请输入要添加的用户ID"
            border="bottom"
            clearable
          />

          <text class="form-label" style="margin-top: 32rpx;">角色</text>
          <picker
            :value="roleIndex"
            :range="roleOptions"
            range-key="label"
            @change="onRoleChange"
          >
            <view class="picker-display">
              <text>{{ roleOptions[roleIndex]?.label || '选择角色' }}</text>
              <u-icon name="arrow-right" size="28" color="#999" />
            </view>
          </picker>
        </view>

        <view class="popup-actions">
          <u-button
            text="取消"
            shape="circle"
            customStyle="flex: 1; margin-right: 16rpx;"
            @click="showAddModal = false"
          />
          <u-button
            type="primary"
            text="确认添加"
            shape="circle"
            customStyle="flex: 1;"
            @click="handleAddMember"
          />
        </view>
      </view>
    </u-popup>

    <!-- 移除确认弹窗 -->
    <u-modal
      :show="showRemoveModal"
      title="移除成员"
      :content="`确定移除成员 ${removeTarget?.user?.nickname || ''} 吗？`"
      showCancelButton
      confirmText="确定移除"
      confirmColor="#FF4D4F"
      @confirm="handleRemove"
      @cancel="showRemoveModal = false"
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
  padding-bottom: 120rpx;
}

.empty-area {
  margin-top: 200rpx;
}

.member-card {
  display: flex;
  align-items: center;
  background: $bg-card;
  border-radius: $radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-sm;

  .member-avatar {
    margin-right: $spacing-md;
  }

  .member-info {
    flex: 1;
    min-width: 0;

    .member-name {
      font-size: $font-md;
      font-weight: 500;
      color: $text-primary;
      display: block;
    }

    .member-phone {
      font-size: $font-xs;
      color: $text-hint;
      margin-top: 4rpx;
      display: block;
    }
  }

  .member-role {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }

  .member-action {
    margin-left: $spacing-sm;

    .remove-btn {
      font-size: $font-xs;
      color: $expense-color;
      padding: 4rpx;
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: $spacing-md;
  padding-bottom: calc($spacing-md + $safe-area-bottom);
  background: $bg-card;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.popup-content {
  padding: $spacing-lg $spacing-md $spacing-xl;

  .popup-title {
    font-size: $font-xl;
    font-weight: 600;
    color: $text-primary;
    text-align: center;
    display: block;
    margin-bottom: $spacing-lg;
  }

  .popup-form {
    .form-label {
      font-size: $font-md;
      color: $text-secondary;
      margin-bottom: $spacing-xs;
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

  .popup-actions {
    display: flex;
    margin-top: $spacing-xl;
  }
}
</style>
