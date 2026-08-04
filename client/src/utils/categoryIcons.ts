// 分类图标 Emoji 映射 — 唯一真相源
// CategoryIcon.vue / CategoryPicker.vue / useRecord.ts / detail.vue 共享引用

export const CATEGORY_ICON_MAP: Record<string, string> = {
  // 支出
  food: '🍜', transport: '🚌', shopping: '🛒', clothing: '👗',
  housing: '🏠', beauty: '💄', sport: '⚽', travel: '✈️',
  medical: '💊', education: '📚', telecom: '📱', entertainment: '🎮',
  digital: '💻', pet: '🐶', social: '🎁',
  other: '📦', other_expense: '📦',
  // 收入
  salary: '💰', bonus: '🏆', invest: '📈', parttime: '🔧',
  redpacket: '🧧', reimburse: '💵', refund: '↩️',
  other_income: '📦',
};

export function getCategoryIcon(icon: string): string {
  return CATEGORY_ICON_MAP[icon] || '📌';
}
