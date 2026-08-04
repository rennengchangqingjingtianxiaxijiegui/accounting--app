// 收支记录相关类型

export type RecordType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: number;
  name: string;
  type: RecordType;
  icon: string;
  parentId: number | null;
  sortOrder: number;
  isDefault: boolean;
}

export interface RecordItem {
  id: number;
  bookId: number;
  userId: number;
  categoryId: number;
  type: RecordType;
  amount: string; // Decimal 字符串传输，避免浮点精度丢失
  note: string | null;
  recordDate: string; // YYYY-MM-DD
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // 关联字段
  category?: Pick<Category, 'id' | 'name' | 'type' | 'icon' | 'isDefault'>;
  user?: {
    id: number;
    nickname: string;
    avatarUrl: string | null;
  };
}

export interface CreateRecordParams {
  type: RecordType;
  amount: string;
  categoryId: number;
  note?: string;
  recordDate: string; // YYYY-MM-DD
}

export interface UpdateRecordParams {
  type?: RecordType;
  amount?: string;
  categoryId?: number;
  note?: string;
  recordDate?: string;
}

// 游标分页查询参数
export interface RecordFilter {
  cursor?: string;     // 复合游标：recordDate_id，如 "2024-06-15_123"
  limit?: number;      // 每页条数，默认 20
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  type?: RecordType;
  categoryId?: number;
}

// 游标分页响应
export interface PaginatedRecords {
  list: RecordItem[];
  nextCursor: string | null;
  hasMore: boolean;
}
