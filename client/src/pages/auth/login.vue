<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/store/auth';
import { isPhone } from '@/utils/validator';

const authStore = useAuthStore();
const form = ref({ phone: '', password: '' });
const loading = ref(false);
const errors = ref({ phone: '', password: '' });

function validate(): boolean {
  errors.value = { phone: '', password: '' };

  if (!form.value.phone) {
    errors.value.phone = '请输入手机号';
    return false;
  }
  if (!isPhone(form.value.phone)) {
    errors.value.phone = '手机号格式不正确';
    return false;
  }
  if (!form.value.password) {
    errors.value.password = '请输入密码';
    return false;
  }

  return true;
}

async function handleLogin() {
  if (!validate()) return;

  loading.value = true;
  try {
    await authStore.login({
      phone: form.value.phone,
      password: form.value.password,
    });
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      uni.switchTab({ url: '/pages/record/index' });
    }, 500);
  } catch (e: any) {
    const message = e?.message || '登录失败，请重试';
    uni.showToast({ title: message, icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function goToRegister() {
  uni.navigateTo({ url: '/pages/auth/register' });
}

// #ifdef MP-WEIXIN
async function handleWechatLogin() {
  loading.value = true;
  try {
    const [err, res] = await uni.login({ provider: 'weixin' });
    if (err) {
      uni.showToast({ title: '微信登录失败', icon: 'none' });
      return;
    }
    await authStore.loginByWechat(res.code);
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      uni.switchTab({ url: '/pages/record/index' });
    }, 500);
  } catch (e: any) {
    const message = e?.message || '微信登录失败，请重试';
    uni.showToast({ title: message, icon: 'none' });
  } finally {
    loading.value = false;
  }
}
// #endif
</script>

<template>
  <view class="page">
    <view class="logo-area">
      <text class="app-name">记账</text>
      <text class="slogan">轻松记账，掌握每一分钱</text>
    </view>

    <view class="form-area">
      <u-form labelWidth="0" errorType="toast">
        <u-form-item>
          <u-input
            v-model="form.phone"
            type="number"
            maxlength="11"
            placeholder="请输入手机号"
            prefixIcon="phone"
            prefixIconStyle="font-size: 40rpx;"
            clearable
          />
        </u-form-item>
        <u-form-item>
          <u-input
            v-model="form.password"
            type="password"
            maxlength="20"
            placeholder="请输入密码"
            prefixIcon="lock"
            prefixIconStyle="font-size: 40rpx;"
            clearable
            @confirm="handleLogin"
          />
        </u-form-item>
      </u-form>

      <u-button
        type="primary"
        :loading="loading"
        :disabled="loading"
        shape="circle"
        customStyle="margin-top: 48rpx; height: 88rpx;"
        @click="handleLogin"
      >
        登录
      </u-button>

      <view class="bottom-actions">
        <text class="link" @click="goToRegister">没有账号？立即注册</text>
      </view>

      <!-- 微信登录（仅小程序端） -->
      <!-- #ifdef MP-WEIXIN -->
      <view class="wechat-section">
        <view class="divider">
          <view class="divider-line" />
          <text class="divider-text">其他登录方式</text>
          <view class="divider-line" />
        </view>
        <view class="wechat-btn" @click="handleWechatLogin">
          <text class="wechat-icon">📱</text>
          <text class="wechat-text">微信登录</text>
        </view>
      </view>
      <!-- #endif -->
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx 0;
  background: $bg-white;
}

.logo-area {
  text-align: center;
  margin-bottom: 80rpx;

  .app-name {
    font-size: 64rpx;
    font-weight: 700;
    color: $primary-color;
    display: block;
  }

  .slogan {
    font-size: $font-md;
    color: $text-hint;
    margin-top: $spacing-sm;
    display: block;
  }
}

.form-area {
  width: 100%;

  :deep(.u-form-item__body) {
    background: $bg-color;
    border-radius: $radius-md;
    padding: 0 $spacing-md;
    margin-bottom: $spacing-sm;
  }
}

.bottom-actions {
  text-align: center;
  margin-top: $spacing-lg;

  .link {
    color: $primary-color;
    font-size: $font-sm;
  }
}

.wechat-section {
  margin-top: 80rpx;

  .divider {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-lg;

    .divider-line {
      flex: 1;
      height: 1px;
      background: $border-color;
    }

    .divider-text {
      padding: 0 $spacing-md;
      color: $text-hint;
      font-size: $font-sm;
    }
  }

  .wechat-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xs;

    .wechat-icon {
      font-size: 64rpx;
    }

    .wechat-text {
      font-size: $font-sm;
      color: $text-secondary;
    }
  }
}
</style>
