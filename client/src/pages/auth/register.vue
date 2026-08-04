<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/store/auth';
import { isPhone, isPassword } from '@/utils/validator';

const authStore = useAuthStore();
const form = ref({ phone: '', password: '', confirmPassword: '', code: '' });
const loading = ref(false);
const errors = ref({ phone: '', password: '', confirmPassword: '' });

function validate(): boolean {
  errors.value = { phone: '', password: '', confirmPassword: '' };

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
  if (!isPassword(form.value.password)) {
    errors.value.password = '密码需6-20位，包含数字和字母';
    return false;
  }
  if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = '两次输入的密码不一致';
    return false;
  }

  return true;
}

async function handleRegister() {
  if (!validate()) return;

  loading.value = true;
  try {
    await authStore.register({
      phone: form.value.phone,
      password: form.value.password,
      code: form.value.code || '000000',
    });
    uni.showToast({ title: '注册成功', icon: 'success' });
    setTimeout(() => {
      uni.switchTab({ url: '/pages/record/index' });
    }, 500);
  } catch (e: any) {
    const message = e?.message || '注册失败，请重试';
    uni.showToast({ title: message, icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function goToLogin() {
  uni.navigateBack();
}
</script>

<template>
  <view class="page">
    <view class="form-area">
      <u-form labelWidth="0" errorType="toast">
        <u-form-item :error="errors.phone">
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
        <u-form-item :error="errors.password">
          <u-input
            v-model="form.password"
            type="password"
            maxlength="20"
            placeholder="请设置密码（6-20位，含数字和字母）"
            prefixIcon="lock"
            prefixIconStyle="font-size: 40rpx;"
            clearable
          />
        </u-form-item>
        <u-form-item :error="errors.confirmPassword">
          <u-input
            v-model="form.confirmPassword"
            type="password"
            maxlength="20"
            placeholder="请确认密码"
            prefixIcon="lock"
            prefixIconStyle="font-size: 40rpx;"
            clearable
          />
        </u-form-item>
      </u-form>

      <u-button
        type="primary"
        :loading="loading"
        :disabled="loading"
        shape="circle"
        customStyle="margin-top: 48rpx; height: 88rpx;"
        @click="handleRegister"
      >
        注册
      </u-button>

      <view class="bottom-actions">
        <text class="link" @click="goToLogin">已有账号？返回登录</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 60rpx 48rpx 0;
  background: $bg-white;
}

.form-area {
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
</style>
