// 记账记录 API
import http from './request';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { RecordItem, CreateRecordParams, UpdateRecordParams, RecordFilter } from '@/types/record';

export const recordApi = {
  /** 记录列表（分页+筛选） */
  getList(filter: RecordFilter): Promise<ApiResponse<PaginatedData<RecordItem>>> {
    return http.get(`/books/${filter.bookId}/records`, { params: filter });
  },

  /** 添加记录 */
  create(data: CreateRecordParams): Promise<ApiResponse<RecordItem>> {
    return http.post(`/books/${data.bookId}/records`, data);
  },

  /** 记录详情 */
  getDetail(bookId: number, id: number): Promise<ApiResponse<RecordItem>> {
    return http.get(`/books/${bookId}/records/${id}`);
  },

  /** 编辑记录 */
  update(bookId: number, id: number, data: UpdateRecordParams): Promise<ApiResponse<RecordItem>> {
    return http.put(`/books/${bookId}/records/${id}`, data);
  },

  /** 删除记录 */
  remove(bookId: number, id: number): Promise<ApiResponse<null>> {
    return http.delete(`/books/${bookId}/records/${id}`);
  },
};
