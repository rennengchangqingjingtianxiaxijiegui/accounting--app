// 通用类型定义

export interface PaginationQuery {
  page?: string;
  pageSize?: string;
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}
