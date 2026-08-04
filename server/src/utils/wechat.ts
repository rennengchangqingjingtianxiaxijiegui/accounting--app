import axios from 'axios';
import { config } from '../config';
import { WechatError } from './errors';

interface WechatSession {
  openid: string;
  session_key: string;
  unionid?: string;
}

/**
 * 调用微信 code2Session 接口，用 code 换取 openid 和 session_key
 */
export async function code2Session(code: string): Promise<WechatSession> {
  try {
    const url = 'https://api.weixin.qq.com/sns/jscode2session';
    const { data } = await axios.get(url, {
      params: {
        appid: config.WECHAT_APPID,
        secret: config.WECHAT_SECRET,
        js_code: code,
        grant_type: 'authorization_code',
      },
    });

    if (data.errcode) {
      throw new WechatError(`微信登录失败: ${data.errmsg || '未知错误'}`);
    }

    return {
      openid: data.openid,
      session_key: data.session_key,
      unionid: data.unionid || undefined,
    };
  } catch (error) {
    if (error instanceof WechatError) throw error;
    throw new WechatError('微信服务请求失败');
  }
}
