<script setup lang="ts">
import { ref } from 'vue';
import { userApi } from '@/api/user';
import { isPassword } from '@/utils/validator';

const form = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });
const loading = ref(false);
const errors = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });

function validate(): boolean {
  errors.value = { oldPassword: '', newPassword: '', confirmPassword: '' };

  if (!form.value.oldPassword) {
    errors.value.oldPassword = '请输入旧密码';
    return false;
  }
  if (!form.value.newPassword) {
    errors.value.newPassword = '请输入新密码';
    return false;
  }
  if (!isPassword(form.value.newPassword)) {
    errors.value.newPassword = '新密码需6-20位，包含数字和字母';
    return false;
  }
  if (form.value.newPassword === form.value.oldPassword) {
    errors.value.newPassword = '新密码不能与旧密码相同';
    return false;
  }
  if (form.value.newPassword !== form.value.confirmPassword) {
    errors.value.confirmPassword = '两次输入的密码不一致';
    return false;
  }

  return true;
}

async function handleSubmit() {
  if (!validate()) return;

  loading.value = true;
  try {
    await userApi.changePassword({
      oldPassword: form.value.oldPassword,
      newPassword: form.value.newPassword,
    });
    uni.showToast({ title: '密码修改成功', icon: 'success' });
    setTimeout(() => {
      uni.navigateBack();
    }, 1000);
  } catch (e: any) {
    uni.showToast({ title: e?.message || '修改失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <view class="page">
    <u-form labelWidth="0" errorType="toast">
      <u-form-item :error="errors.oldPassword">
        <u-input
          v-model="form.oldPassword"
          type="password"
          maxlength="20"
          placeholder="请输入旧密码"
          prefixIcon="lock"
          prefixIconStyle="font-size: 40rpx;"
          clearable
        />
      </u-form-item>
      <u-form-item :error="errors.newPassword">
        <u-input
          v-model="form.newPassword"
          type="password"
          maxlength="20"
          placeholder="新密码（6-20位，含数字和字母）"
          prefixIcon="lock-fill"
          prefixIconStyle="font-size: 40rpx;"
          clearable
        />
      </u-form-item>
      <u-form-item :error="errors.confirmPassword">
        <u-input
          v-model="form.confirmPassword"
          type="password"
          maxlength="20"
          placeholder="请确认新密码"
          prefixIcon="lock-fill"
          prefixIconStyle="font-size: 40rpx;"
          clearable
          @confirm="handleSubmit"
        />
      </u-form-item>
    </u-form>

    <view class="tips">
      <text class="tip-title">密码要求：</text>
      <text class="tip-item">• 长度 6-20 位</text>
      <text class="tip-item">• 至少包含一个数字和一个字母</text>
    </view>

    <u-button
      type="primary"
      :loading="loading"
      :disabled="loading"
      shape="circle"
      customStyle="margin-top: 48rpx; height: 88rpx;"
      @click="handleSubmit"
    >
      保存
    </u-button>
  </view>
</template>

<style scoped lang="scss">
.page {
  padding: 40rpx 48rpx;
  background: $bg-white;
  min-height: 100vh;

  :deep(.u-form-item__body) {
    background: $bg-color;
    border-radius: $radius-md;
    padding: 0 $spacing-md;
    margin-bottom: $spacing-sm;
  }
}

.tips {
  padding: $spacing-md;
  background: $bg-color;
  border-radius: $radius-md;

  .tip-title {
    font-size: $font-sm;
    color: $text-secondary;
    font-weight: 500;
    display: block;
    margin-bottom: $spacing-xs;
  }

  .tip-item {
    font-size: $font-xs;
    color: $text-hint;
    display: block;
    line-height: 1.8;
  }
}
</style>
