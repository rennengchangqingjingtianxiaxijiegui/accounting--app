// 安全区域适配 — 动态获取状态栏/导航栏/底部安全区高度

interface SafeAreaInfo {
  /** 状态栏高度 (px) */
  statusBarHeight: number;
  /** 自定义导航栏内容区高度 (px)，不含状态栏 */
  navBarHeight: number;
  /** 导航栏总高度 (px)：状态栏 + 导航栏内容 */
  headerHeight: number;
  /** 底部安全区域高度 (px) */
  safeAreaBottom: number;
  /** 是否为异形屏 (iPhone X+) */
  isNotch: boolean;
}

let cachedInfo: SafeAreaInfo | null = null;

export function useSafeArea(): SafeAreaInfo {
  if (cachedInfo) return cachedInfo;

  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync();
  const statusBarHeight = systemInfo.statusBarHeight ?? 44;

  // iPhone X+ 刘海屏判定 (状态栏高度 > 30)
  const isNotch = statusBarHeight > 30;

  // 导航栏内容区默认 44px (H5: 50px)
  let navBarHeight = 44;
  // #ifdef H5
  navBarHeight = 50;
  // #endif

  // 底部安全区高度
  let safeAreaBottom = 0;
  // #ifdef MP-WEIXIN
  if (systemInfo.safeAreaInsets?.bottom) {
    safeAreaBottom = systemInfo.safeAreaInsets.bottom;
  }
  // #endif
  // #ifdef APP-PLUS
  if (systemInfo.safeAreaInsets?.bottom) {
    safeAreaBottom = systemInfo.safeAreaInsets.bottom;
  }
  // #endif

  cachedInfo = {
    statusBarHeight,
    navBarHeight,
    headerHeight: statusBarHeight + navBarHeight,
    safeAreaBottom,
    isNotch,
  };

  return cachedInfo;
}
