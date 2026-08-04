// 记账记录 API
import http from './request';
import type { ApiResponse } from '@/types/api';
import type { RecordItem, CreateRecordParams, UpdateRecordParams, RecordFilter, PaginatedRecords } from '@/types/record';

export const recordApi = {
  /** 记录列表（游标分页+筛选） */
  getList(bookId: number, filter: Omit<RecordFilter, 'bookId'> = {}): Promise<ApiResponse<PaginatedRecords>> {
    return http.get(`/books/${bookId}/records`, { params: filter });
  },

  /** 添加记录 */
  create(bookId: number, data: CreateRecordParams): Promise<ApiResponse<RecordItem>> {
    return http.post(`/books/${bookId}/records`, data);
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
