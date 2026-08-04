// 账本 API
import http from './request';
import type { ApiResponse } from '@/types/api';
import type {
  Book,
  BookMember,
  CreateBookParams,
  UpdateBookParams,
  AddMemberParams,
  UpdateMemberParams,
} from '@/types/book';

export const bookApi = {
  /** 我的账本列表 */
  getList(): Promise<ApiResponse<Book[]>> {
    return http.get('/books');
  },

  /** 创建账本 */
  create(data: CreateBookParams): Promise<ApiResponse<Book>> {
    return http.post('/books', data);
  },

  /** 账本详情 */
  getDetail(id: number): Promise<ApiResponse<Book>> {
    return http.get(`/books/${id}`);
  },

  /** 编辑账本 */
  update(id: number, data: UpdateBookParams): Promise<ApiResponse<Book>> {
    return http.put(`/books/${id}`, data);
  },

  /** 删除账本 */
  remove(id: number): Promise<ApiResponse<null>> {
    return http.delete(`/books/${id}`);
  },

  /** 成员列表 */
  getMembers(bookId: number): Promise<ApiResponse<BookMember[]>> {
    return http.get(`/books/${bookId}/members`);
  },

  /** 添加成员 */
  addMember(bookId: number, data: AddMemberParams): Promise<ApiResponse<BookMember>> {
    return http.post(`/books/${bookId}/members`, data);
  },

  /** 修改成员角色 */
  updateMember(bookId: number, memberId: number, data: UpdateMemberParams): Promise<ApiResponse<BookMember>> {
    return http.put(`/books/${bookId}/members/${memberId}`, data);
  },

  /** 移除成员 */
  removeMember(bookId: number, memberId: number): Promise<ApiResponse<null>> {
    return http.delete(`/books/${bookId}/members/${memberId}`);
  },
};
