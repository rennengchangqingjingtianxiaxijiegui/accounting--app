// 报表相关类型

export interface SummaryData {
  income: string;
  expense: string;
  balance: string;
  recordCount: number;
}

export interface TrendItem {
  date: string;
  income: string;
  expense: string;
}

export interface CategoryBreakdown {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  amount: string;
  percent: number;
  count: number;
}

export interface ReportQuery {
  bookId: number;
  period: 'month' | 'year';
  date: string;
  type?: 'INCOME' | 'EXPENSE';
}
