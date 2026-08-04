// 前后端共享默认收支分类定义 — server seed 和 client 选择器共同引用

export interface CategoryDefinition {
  id: number;        // 显式 ID，前后端一致
  key: string;
  name: string;
  icon: string;
  type: 'INCOME' | 'EXPENSE';
  sortOrder: number;
}

// ID 分配：支出 1-16，收入 17-24
export const DEFAULT_EXPENSE_CATEGORIES: CategoryDefinition[] = [
  { id: 1,  key: 'food',       name: '餐饮',   icon: 'food',          type: 'EXPENSE', sortOrder: 1 },
  { id: 2,  key: 'transport',  name: '交通',   icon: 'car',           type: 'EXPENSE', sortOrder: 2 },
  { id: 3,  key: 'shopping',   name: '购物',   icon: 'cart',          type: 'EXPENSE', sortOrder: 3 },
  { id: 4,  key: 'clothing',   name: '衣物',   icon: 'clothing',      type: 'EXPENSE', sortOrder: 4 },
  { id: 5,  key: 'housing',    name: '居住',   icon: 'home',          type: 'EXPENSE', sortOrder: 5 },
  { id: 6,  key: 'beauty',     name: '美容',   icon: 'beauty',        type: 'EXPENSE', sortOrder: 6 },
  { id: 7,  key: 'sport',      name: '运动',   icon: 'sport',         type: 'EXPENSE', sortOrder: 7 },
  { id: 8,  key: 'travel',     name: '旅行',   icon: 'travel',        type: 'EXPENSE', sortOrder: 8 },
  { id: 9,  key: 'medical',    name: '医疗',   icon: 'medical',       type: 'EXPENSE', sortOrder: 9 },
  { id: 10, key: 'education',  name: '教育',   icon: 'education',     type: 'EXPENSE', sortOrder: 10 },
  { id: 11, key: 'telecom',    name: '通讯',   icon: 'phone',         type: 'EXPENSE', sortOrder: 11 },
  { id: 12, key: 'entertainment', name: '娱乐', icon: 'entertainment',  type: 'EXPENSE', sortOrder: 12 },
  { id: 13, key: 'digital',    name: '数码',   icon: 'digital',       type: 'EXPENSE', sortOrder: 13 },
  { id: 14, key: 'pet',        name: '宠物',   icon: 'pet',           type: 'EXPENSE', sortOrder: 14 },
  { id: 15, key: 'social',     name: '社交',   icon: 'social',        type: 'EXPENSE', sortOrder: 15 },
  { id: 16, key: 'other_expense', name: '其他', icon: 'other',       type: 'EXPENSE', sortOrder: 99 },
];

export const DEFAULT_INCOME_CATEGORIES: CategoryDefinition[] = [
  { id: 17, key: 'salary',     name: '工资',   icon: 'salary',        type: 'INCOME', sortOrder: 1 },
  { id: 18, key: 'bonus',      name: '奖金',   icon: 'bonus',         type: 'INCOME', sortOrder: 2 },
  { id: 19, key: 'invest',     name: '投资',   icon: 'invest',        type: 'INCOME', sortOrder: 3 },
  { id: 20, key: 'parttime',   name: '兼职',   icon: 'parttime',      type: 'INCOME', sortOrder: 4 },
  { id: 21, key: 'redpacket',  name: '红包',   icon: 'redpacket',     type: 'INCOME', sortOrder: 5 },
  { id: 22, key: 'reimburse',  name: '报销',   icon: 'reimburse',     type: 'INCOME', sortOrder: 6 },
  { id: 23, key: 'refund',     name: '退款',   icon: 'refund',        type: 'INCOME', sortOrder: 7 },
  { id: 24, key: 'other_income', name: '其他收入', icon: 'other',    type: 'INCOME', sortOrder: 99 },
];

export const ALL_DEFAULT_CATEGORIES: CategoryDefinition[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];
