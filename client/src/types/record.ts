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
  amount: string; // Decimal 用字符串传输
  note: string | null;
  recordDate: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // 关联字段
  category?: Category;
  userName?: string;
}

export interface CreateRecordParams {
  bookId: number;
  type: RecordType;
  amount: string;
  categoryId: number;
  note?: string;
  recordDate: string;
}

export interface UpdateRecordParams {
  type?: RecordType;
  amount?: string;
  categoryId?: number;
  note?: string;
  recordDate?: string;
}

export interface RecordFilter {
  bookId: number;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  type?: RecordType;
  categoryId?: number;
}
