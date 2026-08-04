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
  // 聚合字段
  memberCount?: number;
  recordCount?: number;
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
