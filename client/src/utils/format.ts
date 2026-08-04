// 格式化工具函数

/**
 * 金额格式化 — ¥1,234.56
 * @param amount 金额（数字或字符串）
 * @param symbol 货币符号
 */
export function formatAmount(amount: number | string | null | undefined, symbol = '¥'): string {
  if (amount === null || amount === undefined || amount === '') return `${symbol}0.00`;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${symbol}0.00`;
  const formatted = Math.abs(num).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${num < 0 ? '-' : ''}${symbol}${formatted}`;
}

/**
 * 日期格式化
 */
export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute);
}

/**
 * 获取本月第一天和最后一天
 */
export function getMonthRange(date?: Date): { startDate: string; endDate: string } {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}
