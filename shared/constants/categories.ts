// 前后端共享默认收支分类定义 — server seed 和 client 选择器共同引用

export interface CategoryDefinition {
  key: string;
  name: string;
  icon: string;
  type: 'INCOME' | 'EXPENSE';
  sortOrder: number;
}

export const DEFAULT_EXPENSE_CATEGORIES: CategoryDefinition[] = [
  { key: 'food',       name: '餐饮',   icon: 'food',          type: 'EXPENSE', sortOrder: 1 },
  { key: 'transport',  name: '交通',   icon: 'car',           type: 'EXPENSE', sortOrder: 2 },
  { key: 'shopping',   name: '购物',   icon: 'cart',          type: 'EXPENSE', sortOrder: 3 },
  { key: 'clothing',   name: '衣物',   icon: 'clothing',      type: 'EXPENSE', sortOrder: 4 },
  { key: 'housing',    name: '居住',   icon: 'home',          type: 'EXPENSE', sortOrder: 5 },
  { key: 'beauty',     name: '美容',   icon: 'beauty',        type: 'EXPENSE', sortOrder: 6 },
  { key: 'sport',      name: '运动',   icon: 'sport',         type: 'EXPENSE', sortOrder: 7 },
  { key: 'travel',     name: '旅行',   icon: 'travel',        type: 'EXPENSE', sortOrder: 8 },
  { key: 'medical',    name: '医疗',   icon: 'medical',       type: 'EXPENSE', sortOrder: 9 },
  { key: 'education',  name: '教育',   icon: 'education',     type: 'EXPENSE', sortOrder: 10 },
  { key: 'telecom',    name: '通讯',   icon: 'phone',         type: 'EXPENSE', sortOrder: 11 },
  { key: 'entertainment', name: '娱乐', icon: 'entertainment',  type: 'EXPENSE', sortOrder: 12 },
  { key: 'digital',    name: '数码',   icon: 'digital',       type: 'EXPENSE', sortOrder: 13 },
  { key: 'pet',        name: '宠物',   icon: 'pet',           type: 'EXPENSE', sortOrder: 14 },
  { key: 'social',     name: '社交',   icon: 'social',        type: 'EXPENSE', sortOrder: 15 },
  { key: 'other_expense', name: '其他', icon: 'other',       type: 'EXPENSE', sortOrder: 99 },
];

export const DEFAULT_INCOME_CATEGORIES: CategoryDefinition[] = [
  { key: 'salary',     name: '工资',   icon: 'salary',        type: 'INCOME', sortOrder: 1 },
  { key: 'bonus',      name: '奖金',   icon: 'bonus',         type: 'INCOME', sortOrder: 2 },
  { key: 'invest',     name: '投资',   icon: 'invest',        type: 'INCOME', sortOrder: 3 },
  { key: 'parttime',   name: '兼职',   icon: 'parttime',      type: 'INCOME', sortOrder: 4 },
  { key: 'redpacket',  name: '红包',   icon: 'redpacket',     type: 'INCOME', sortOrder: 5 },
  { key: 'reimburse',  name: '报销',   icon: 'reimburse',     type: 'INCOME', sortOrder: 6 },
  { key: 'refund',     name: '退款',   icon: 'refund',        type: 'INCOME', sortOrder: 7 },
  { key: 'other_income', name: '其他收入', icon: 'other',    type: 'INCOME', sortOrder: 99 },
];

export const ALL_DEFAULT_CATEGORIES: CategoryDefinition[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];
