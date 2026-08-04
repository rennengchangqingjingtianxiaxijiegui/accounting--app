<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/store/auth';
import { useSafeArea } from '@/composables/useSafeArea';
import NavBar from '@/components/NavBar.vue';
import { userApi } from '@/api/user';

const authStore = useAuthStore();
const { headerHeight } = useSafeArea();

// ==================== 行内编辑状态 ====================
const editingNickname = ref(false);
const nicknameInput = ref('');
const saving = ref(false);

// ==================== 头像弹窗 ====================
const showAvatarPicker = ref(false);

const presetAvatars = [
  { icon: 'account', color: '#4A90D9' },
  { icon: 'account-fill', color: '#52C41A' },
  { icon: 'man', color: '#1677FF' },
  { icon: 'woman', color: '#FF4D4F' },
  { icon: 'star', color: '#FAAD14' },
  { icon: 'star-fill', color: '#722ED1' },
  { icon: 'heart', color: '#EB2F96' },
  { icon: 'thumb-up', color: '#13C2C2' },
];

// ==================== 常量 ====================
const genderOptions = [
  { label: '未知', value: 0 },
  { label: '男', value: 1 },
  { label: '女', value: 2 },
];

// ==================== 头像显示 ====================
interface ParsedAvatar {
  type: 'preset' | 'image' | 'default';
  icon?: string;
  color?: string;
  src?: string;
}

function parseAvatarUrl(url: string | null | undefined): ParsedAvatar {
  if (!url) return { type: 'default' };
  if (url.startsWith('preset:')) {
    const parts = url.split(':');
    return { type: 'preset', icon: parts[1], color: parts[2] };
  }
  return { type: 'image', src: url };
}

const avatarDisplay = computed<ParsedAvatar>(() => {
  return parseAvatarUrl(authStore.user?.avatarUrl);
});

// ==================== 昵称编辑 ====================
function toggleNickname() {
  if (editingNickname.value) {
    saveNickname();
  } else {
    nicknameInput.value = authStore.user?.nickname || '';
    editingNickname.value = true;
  }
}

async function saveNickname() {
  const trimmed = nicknameInput.value.trim();
  if (!trimmed) {
    uni.showToast({ title: '昵称不能为空', icon: 'none' });
    return;
  }
  if (trimmed === (authStore.user?.nickname || '')) {
    editingNickname.value = false;
    return;
  }
  saving.value = true;
  try {
    await userApi.updateProfile({ nickname: trimmed });
    await authStore.fetchProfile();
    editingNickname.value = false;
    uni.showToast({ title: '昵称已更新', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

// ==================== 性别选择 ====================
async function onGenderChange(e: { detail: { value: number } }) {
  const newValue = genderOptions[e.detail.value].value;
  if (newValue === (authStore.user?.gender || 0)) return;
  saving.value = true;
  try {
    await userApi.updateProfile({ gender: newValue });
    await authStore.fetchProfile();
    uni.showToast({ title: '性别已更新', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

// ==================== 头像选择 ====================
async function selectPresetAvatar(icon: string, color: string) {
  const key = `preset:${icon}:${color}`;
  if (key === authStore.user?.avatarUrl) {
    showAvatarPicker.value = false;
    return;
  }
  saving.value = true;
  try {
    await userApi.updateProfile({ avatarUrl: key });
    await authStore.fetchProfile();
    showAvatarPicker.value = false;
    uni.showToast({ title: '头像已更新', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

async function chooseFromAlbum() {
  try {
    const res = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
    });
    const tempPath = res.tempFilePaths[0];
    // 压缩为小尺寸缩略图
    const compressRes = await uni.compressImage({
      src: tempPath,
      quality: 30,
      compressedWidth: 80,
      compressedHeight: 80,
    });
    // 读取为 base64
    const fs = uni.getFileSystemManager();
    const base64Data = fs.readFileSync(compressRes.tempFilePath, 'base64') as string;
    const ext = (compressRes.tempFilePath || tempPath).split('.').pop()?.toLowerCase() || 'jpeg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    const dataUri = `data:${mime};base64,${base64Data}`;

    saving.value = true;
    await userApi.updateProfile({ avatarUrl: dataUri });
    await authStore.fetchProfile();
    showAvatarPicker.value = false;
    uni.showToast({ title: '头像已更新', icon: 'success' });
  } catch (e: any) {
    if (e?.errMsg?.includes('cancel')) return;
    uni.showToast({ title: e?.message || '图片选择失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

// ==================== 工具函数 ====================
function getGenderLabel(gender: number): string {
  const item = genderOptions.find((g) => g.value === gender);
  return item?.label || '未知';
}

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '未绑定';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
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
</script>

<template>
  <view class="page">
    <!-- 用户头像卡片 -->
    <view class="user-card" :style="{ paddingTop: headerHeight + 40 + 'rpx' }">
      <NavBar transparent titleColor="#ffffff" :showBack="false" />
      <view class="avatar" @click="showAvatarPicker = true">
        <image
          v-if="avatarDisplay.type === 'image'"
          class="avatar-img"
          :src="avatarDisplay.src"
          mode="aspectFill"
        />
        <view
          v-else-if="avatarDisplay.type === 'preset'"
          class="avatar-preset"
          :style="{ background: avatarDisplay.color }"
        >
          <u-icon :name="avatarDisplay.icon" size="80" color="#fff" />
        </view>
        <u-icon v-else name="account" size="80" color="#fff" />
        <view class="avatar-badge">
          <u-icon name="camera" size="20" color="#fff" />
        </view>
      </view>
      <text class="user-name">{{ authStore.user?.nickname || '未设置昵称' }}</text>
      <text class="user-phone">{{ formatPhone(authStore.user?.phone) }}</text>
    </view>

    <!-- 资料信息行 -->
    <view class="info-section">
      <!-- 昵称行 -->
      <view class="info-row">
        <text class="info-label">昵称</text>
        <view class="info-value">
          <u-input
            v-if="editingNickname"
            v-model="nicknameInput"
            :maxlength="20"
            :focus="true"
            placeholder="请输入昵称"
            border="none"
            inputAlign="right"
            customStyle="flex:1; font-size: 28rpx;"
            @blur="editingNickname = false"
          />
          <text v-else class="info-text">{{ authStore.user?.nickname || '未设置' }}</text>
        </view>
        <text
          class="info-action"
          :class="{ 'is-saving': saving && editingNickname }"
          @click="toggleNickname"
        >
          {{ saving && editingNickname ? '保存中...' : (editingNickname ? '完成' : '编辑') }}
        </text>
      </view>

      <!-- 性别行 -->
      <picker
        mode="selector"
        :range="genderOptions.map(g => g.label)"
        :value="authStore.user?.gender || 0"
        @change="onGenderChange"
      >
        <view class="info-row">
          <text class="info-label">性别</text>
          <view class="info-value">
            <text class="info-text">{{ getGenderLabel(authStore.user?.gender || 0) }}</text>
          </view>
          <u-icon name="arrow-down" size="20" color="#999" />
        </view>
      </picker>

      <!-- 手机号行（只读） -->
      <view class="info-row">
        <text class="info-label">手机号</text>
        <view class="info-value">
          <text class="info-text">{{ formatPhone(authStore.user?.phone) }}</text>
        </view>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="info-section menu-section">
      <view class="info-row" @click="goToChangePassword">
        <text class="info-label">修改密码</text>
        <u-icon name="arrow-right" size="28" color="#999" />
      </view>
    </view>

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

    <!-- 头像选择弹窗 -->
    <u-popup
      :show="showAvatarPicker"
      mode="bottom"
      :round="16"
      @close="showAvatarPicker = false"
    >
      <view class="avatar-picker">
        <text class="picker-title">选择头像</text>
        <view class="preset-grid">
          <view
            v-for="(preset, idx) in presetAvatars"
            :key="idx"
            class="preset-item"
            :class="{ 'preset-item--active': authStore.user?.avatarUrl === `preset:${preset.icon}:${preset.color}` }"
            @click="selectPresetAvatar(preset.icon, preset.color)"
          >
            <view class="preset-circle" :style="{ background: preset.color }">
              <u-icon :name="preset.icon" size="44" color="#fff" />
            </view>
          </view>
        </view>
        <view class="album-btn" @click="chooseFromAlbum">
          <u-icon name="camera" size="32" color="#4A90D9" />
          <text class="album-text">从手机相册选择</text>
        </view>
        <u-button
          text="取消"
          shape="circle"
          customStyle="margin-top: 24rpx;"
          @click="showAvatarPicker = false"
        />
      </view>
    </u-popup>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: $bg-color;
}

// ==================== 头像卡片 ====================
.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 40rpx;
  background: linear-gradient(135deg, $primary-color, $primary-light);
  margin-bottom: $spacing-sm;
  position: relative;

  .avatar {
    position: relative;
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $spacing-sm;
    overflow: visible;

    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }

    .avatar-preset {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-badge {
      position: absolute;
      right: -4rpx;
      bottom: -4rpx;
      width: 44rpx;
      height: 44rpx;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .user-name {
    font-size: $font-xl;
    font-weight: 600;
    color: $text-white;
    margin-bottom: $spacing-xs;
  }

  .user-phone {
    font-size: $font-sm;
    color: rgba(255, 255, 255, 0.8);
  }
}

// ==================== 资料行 ====================
.info-section {
  background: $bg-white;
  margin-bottom: $spacing-sm;
}

.menu-section {
  margin-top: 0;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1px solid $border-color;
  min-height: 88rpx;

  &:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: $font-md;
    color: $text-primary;
    flex-shrink: 0;
    width: 120rpx;
  }

  .info-value {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
    margin-left: $spacing-sm;
  }

  .info-text {
    font-size: $font-md;
    color: $text-secondary;
  }

  .info-action {
    font-size: 24rpx;
    color: $primary-color;
    flex-shrink: 0;
    margin-left: $spacing-sm;

    &.is-saving {
      color: $text-hint;
    }
  }

  // u-input 行内样式修正
  :deep(.u-input) {
    padding: 0 !important;
    background: transparent !important;
  }
  :deep(.u-input__content__field) {
    font-size: $font-md !important;
    color: $text-primary !important;
  }
}

// ==================== 头像选择弹窗 ====================
.avatar-picker {
  padding: $spacing-xl $spacing-md;
  padding-bottom: calc($spacing-xl + env(safe-area-inset-bottom, 20rpx));

  .picker-title {
    font-size: $font-xl;
    font-weight: 600;
    color: $text-primary;
    text-align: center;
    display: block;
    margin-bottom: $spacing-lg;
  }
}

.preset-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24rpx;
  margin-bottom: $spacing-md;

  .preset-item {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4rpx solid transparent;
    transition: border-color 0.2s;

    &--active {
      border-color: $primary-color;
    }
  }

  .preset-circle {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.album-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 24rpx;
  background: $bg-color;
  border-radius: $radius-md;

  .album-text {
    font-size: $font-md;
    color: $primary-color;
  }
}

// ==================== 退出登录 ====================
.logout-section {
  padding: 60rpx 48rpx;
}
</style>
