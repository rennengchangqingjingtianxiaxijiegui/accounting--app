import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { success } from '../utils/response';

export class ReportController {
  constructor(private reportService: ReportService) {}

  /** GET /books/:bid/reports/summary */
  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.bid, 10);
      const data = await this.reportService.getSummary(bookId, req.user!.id, {
        period: req.query.period as 'month' | 'year',
        date: req.query.date as string,
      });
      success(res, data);
    } catch (error) {
      next(error);
    }
  };

  /** GET /books/:bid/reports/trend */
  getTrend = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.bid, 10);
      const data = await this.reportService.getTrend(bookId, req.user!.id, {
        period: req.query.period as 'month' | 'year',
        date: req.query.date as string,
      });
      success(res, data);
    } catch (error) {
      next(error);
    }
  };

  /** GET /books/:bid/reports/category */
  getCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.bid, 10);
      const data = await this.reportService.getCategory(bookId, req.user!.id, {
        period: req.query.period as 'month' | 'year',
        date: req.query.date as string,
        type: req.query.type as 'INCOME' | 'EXPENSE' | undefined,
      });
      success(res, data);
    } catch (error) {
      next(error);
    }
  };
}
