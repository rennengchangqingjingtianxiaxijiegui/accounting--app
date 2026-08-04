// 平台检测工具 — 条件编译的运行时补充

/** 当前运行平台 */
export type Platform = 'mp-weixin' | 'app-plus' | 'h5' | 'unknown';

let _platform: Platform | null = null;

export function getPlatform(): Platform {
  if (_platform) return _platform;

  // #ifdef MP-WEIXIN
  _platform = 'mp-weixin';
  // #endif
  // #ifdef APP-PLUS
  _platform = 'app-plus';
  // #endif
  // #ifdef H5
  _platform = 'h5';
  // #endif

  return _platform || 'unknown';
}

/** 是否为微信小程序 */
export function isMpWeixin(): boolean {
  return getPlatform() === 'mp-weixin';
}

/** 是否为 APP */
export function isAppPlus(): boolean {
  return getPlatform() === 'app-plus';
}

/** 是否为 H5 浏览器 */
export function isH5(): boolean {
  return getPlatform() === 'h5';
}

/** 是否支持微信登录 */
export function supportsWechatLogin(): boolean {
  return isMpWeixin();
}

/** 获取 API 基础 URL */
export function getApiBaseUrl(): string {
  if (isH5()) return '/api/v1';
  // 小程序/APP：生产环境通过 manifest.json 配置 domain
  return 'http://localhost:3000/api/v1';
}
