// 账本相关类型

export type BookType = 'PERSONAL' | 'FAMILY' | 'TRAVEL' | 'BUSINESS' | 'OTHER';
export type MemberRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface Book {
  id: number;
  name: string;
  type: BookType;
  coverIcon: string;
  createdBy: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // 聚合字段（后端 list/detail 返回）
  memberCount?: number;
  recordCount?: number;
  myRole?: MemberRole;
}

export interface BookMember {
  id: number;
  bookId: number;
  userId: number;
  role: MemberRole;
  joinedAt: string;
  user?: {
    id: number;
    nickname: string;
    avatarUrl: string | null;
    phone?: string | null;
  };
}

export interface CreateBookParams {
  name: string;
  type: BookType;
  coverIcon?: string;
}

export interface UpdateBookParams {
  name?: string;
  type?: BookType;
  coverIcon?: string;
}

export interface AddMemberParams {
  userId: number;
  role: MemberRole;
}

export interface UpdateMemberParams {
  role: MemberRole;
}

// ==================== 中文标签映射 ====================

export const BookTypeLabels: Record<BookType, string> = {
  PERSONAL: '个人账本',
  FAMILY: '家庭账本',
  TRAVEL: '旅行账本',
  BUSINESS: '生意账本',
  OTHER: '其他',
};

export const MemberRoleLabels: Record<MemberRole, string> = {
  OWNER: '创建者',
  ADMIN: '管理员',
  EDITOR: '记账员',
  VIEWER: '观察者',
};
