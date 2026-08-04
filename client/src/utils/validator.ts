// 表单校验规则

/** 手机号正则 */
const PHONE_REG = /^1[3-9]\d{9}$/;

/** 密码：6-20位，至少包含数字和字母 */
const PASSWORD_REG = /^(?=.*[A-Za-z])(?=.*\d).{6,20}$/;

export function isPhone(phone: string): boolean {
  return PHONE_REG.test(phone);
}

export function isPassword(password: string): boolean {
  return PASSWORD_REG.test(password);
}

export function isPositiveAmount(value: string | number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0 && /^\d+(\.\d{1,2})?$/.test(String(value));
}

export const rules = {
  phone: {
    required: true,
    validator: (_rule: unknown, value: string) => {
      if (!value) return '请输入手机号';
      if (!isPhone(value)) return '手机号格式不正确';
      return true;
    },
    errMsg: '请输入正确的手机号',
  },
  password: {
    required: true,
    validator: (_rule: unknown, value: string) => {
      if (!value) return '请输入密码';
      if (!isPassword(value)) return '密码需6-20位，包含数字和字母';
      return true;
    },
    errMsg: '密码需6-20位，包含数字和字母',
  },
  amount: {
    required: true,
    validator: (_rule: unknown, value: string) => {
      if (!value) return '请输入金额';
      if (!isPositiveAmount(value)) return '请输入正确的金额';
      return true;
    },
    errMsg: '请输入正确的金额',
  },
};
