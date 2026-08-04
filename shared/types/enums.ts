// 前后端共享枚举定义 — 唯一真相源

export enum BookType {
  PERSONAL = 'PERSONAL',
  FAMILY = 'FAMILY',
  TRAVEL = 'TRAVEL',
  BUSINESS = 'BUSINESS',
  OTHER = 'OTHER',
}

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum RecordType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export const BookTypeLabels: Record<BookType, string> = {
  [BookType.PERSONAL]: '个人账本',
  [BookType.FAMILY]: '家庭账本',
  [BookType.TRAVEL]: '旅行账本',
  [BookType.BUSINESS]: '生意账本',
  [BookType.OTHER]: '其他',
};

export const MemberRoleLabels: Record<MemberRole, string> = {
  [MemberRole.OWNER]: '创建者',
  [MemberRole.ADMIN]: '管理员',
  [MemberRole.EDITOR]: '记账员',
  [MemberRole.VIEWER]: '观察者',
};
