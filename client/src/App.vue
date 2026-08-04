<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

onLaunch((options?: App.LaunchShowOption) => {
  console.log('[App] 记账应用启动', options?.scene);

  // #ifdef MP-WEIXIN
  // 检查小程序更新
  const updateManager = uni.getUpdateManager();
  updateManager.onCheckForUpdate((res) => {
    if (res.hasUpdate) {
      updateManager.onUpdateReady(() => {
        uni.showModal({
          title: '更新提示',
          content: '新版本已就绪，是否重启应用？',
          success: (modalRes) => {
            if (modalRes.confirm) updateManager.applyUpdate();
          },
        });
      });
      updateManager.onUpdateFailed(() => {
        console.warn('[App] 小程序更新失败');
      });
    }
  });
  // #endif

  // #ifdef APP-PLUS
  // APP 端：配置状态栏
  plus.navigator.setStatusBarStyle('dark');
  plus.navigator.setStatusBarBackground('#ffffff');
  // #endif
});

onShow(() => {
  console.log('[App] 进入前台');
});

onHide(() => {
  console.log('[App] 进入后台');
});
</script>

<style lang="scss">
@import '@/uni.scss';

// 全局页面基础样式
page {
  background-color: #f5f6fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;
  font-size: 28rpx;
  color: #333;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// #ifdef MP-WEIXIN
// 小程序特定全局样式
page {
  --safe-area-bottom: constant(safe-area-inset-bottom);
  --safe-area-bottom: env(safe-area-inset-bottom);
}
// #endif

// #ifdef H5
// H5 端：滚动条优化
::-webkit-scrollbar {
  width: 0;
  height: 0;
}
// #endif
</style>
