// 报表 API
import http from './request';
import type { ApiResponse } from '@/types/api';
import type { SummaryData, TrendItem, CategoryBreakdown } from '@/types/report';

export const reportApi = {
  /** 收支汇总 */
  getSummary(bookId: number, period: string, date: string): Promise<ApiResponse<SummaryData>> {
    return http.get(`/books/${bookId}/reports/summary`, { params: { period, date } });
  },

  /** 趋势数据 */
  getTrend(bookId: number, period: string, date: string): Promise<ApiResponse<TrendItem[]>> {
    return http.get(`/books/${bookId}/reports/trend`, { params: { period, date } });
  },

  /** 分类占比 */
  getCategoryBreakdown(
    bookId: number,
    period: string,
    date: string,
    type: 'INCOME' | 'EXPENSE' = 'EXPENSE'
  ): Promise<ApiResponse<CategoryBreakdown[]>> {
    return http.get(`/books/${bookId}/reports/category`, { params: { period, date, type } });
  },
};
