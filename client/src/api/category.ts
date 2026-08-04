// 分类 API
import http from './request';
import type { ApiResponse } from '@/types/api';
import type { Category, RecordType } from '@/types/record';

export const categoryApi = {
  /** 获取分类列表，可选按类型和账本筛选 */
  getList(type?: RecordType, bookId?: number): Promise<ApiResponse<Category[]>> {
    return http.get('/categories', { params: { type, bookId } });
  },
};
