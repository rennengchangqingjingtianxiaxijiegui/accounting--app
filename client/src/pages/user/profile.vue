<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import { useSafeArea } from '@/composables/useSafeArea';
import NavBar from '@/components/NavBar.vue';
import { userApi } from '@/api/user';

const authStore = useAuthStore();
const { headerHeight } = useSafeArea();
const editing = ref(false);
const form = ref({ nickname: '', gender: 0 });
const saving = ref(false);

const genderOptions = [
  { label: '未知', value: 0 },
  { label: '男', value: 1 },
  { label: '女', value: 2 },
];

onMounted(() => {
  form.value.nickname = authStore.user?.nickname || '';
  form.value.gender = authStore.user?.gender || 0;
});

function startEdit() {
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
  form.value.nickname = authStore.user?.nickname || '';
  form.value.gender = authStore.user?.gender || 0;
}

async function saveProfile() {
  saving.value = true;
  try {
    await userApi.updateProfile({
      nickname: form.value.nickname,
      gender: form.value.gender,
    });
    await authStore.fetchProfile();
    editing.value = false;
    uni.showToast({ title: '保存成功', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

function goToChangePassword() {
  uni.navigateTo({ url: '/pages/user/change-password' });
}

async function handleLogout() {
  const { confirm } = await uni.showModal({
    title: '提示',
    content: '确定退出登录？',
  });
  if (!confirm) return;

  await authStore.logout();
  uni.reLaunch({ url: '/pages/auth/login' });
}

function getGenderLabel(gender: number): string {
  const item = genderOptions.find((g) => g.value === gender);
  return item?.label || '未知';
}

function formatPhone(phone: string | null): string {
  if (!phone) return '未绑定';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}
</script>

<template>
  <view class="page">
    <!-- 用户头像卡片 -->
    <view class="user-card" :style="{ paddingTop: headerHeight + 40 + 'rpx' }">
      <NavBar transparent titleColor="#ffffff" :showBack="false" />
      <view class="avatar">
        <u-icon name="account" size="80" color="#fff" />
      </view>
      <text class="nickname">{{ authStore.user?.nickname || '未设置昵称' }}</text>
      <text class="phone">{{ formatPhone(authStore.user?.phone) }}</text>
    </view>

    <!-- 编辑资料模式 -->
    <view v-if="editing" class="form-area">
      <u-form labelWidth="120" errorType="toast">
        <u-form-item label="昵称">
          <u-input v-model="form.nickname" maxlength="50" placeholder="请输入昵称" />
        </u-form-item>
        <u-form-item label="性别">
          <u-radio-group v-model="form.gender" placement="row">
            <u-radio v-for="g in genderOptions" :key="g.value" :label="g.value" :name="g.value">
              {{ g.label }}
            </u-radio>
          </u-radio-group>
        </u-form-item>
      </u-form>
      <view class="edit-actions">
        <u-button type="default" plain shape="circle" size="small" @click="cancelEdit">取消</u-button>
        <u-button type="primary" shape="circle" size="small" :loading="saving" @click="saveProfile">保存</u-button>
      </view>
    </view>

    <!-- 展示模式 -->
    <u-cell-group v-else>
      <u-cell title="昵称" :value="authStore.user?.nickname || '未设置'" />
      <u-cell title="性别" :value="getGenderLabel(authStore.user?.gender || 0)" />
      <u-cell title="手机号" :value="formatPhone(authStore.user?.phone)" />
      <u-cell title="编辑资料" is-link @click="startEdit" />
    </u-cell-group>

    <!-- 功能入口 -->
    <u-cell-group customStyle="margin-top: 16rpx;">
      <u-cell title="修改密码" is-link @click="goToChangePassword" />
    </u-cell-group>

    <!-- 退出登录 -->
    <view class="logout-section">
      <u-button
        type="error"
        plain
        shape="circle"
        customStyle="height: 88rpx;"
        @click="handleLogout"
      >
        退出登录
      </u-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: $bg-color;
}

.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 40rpx;
  background: linear-gradient(135deg, $primary-color, $primary-light);
  margin-bottom: $spacing-sm;
  position: relative;

  .avatar {
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $spacing-sm;
  }

  .nickname {
    font-size: $font-xl;
    font-weight: 600;
    color: $text-white;
    margin-bottom: $spacing-xs;
  }

  .phone {
    font-size: $font-sm;
    color: rgba(255, 255, 255, 0.8);
  }
}

.form-area {
  background: $bg-white;
  padding: $spacing-md;
  margin-bottom: $spacing-sm;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  margin-top: $spacing-md;
}

.logout-section {
  padding: 60rpx 48rpx;
}
</style>
