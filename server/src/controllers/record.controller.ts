import { Request, Response, NextFunction } from 'express';
import { RecordService } from '../services/record.service';
import { success } from '../utils/response';

export class RecordController {
  constructor(private recordService: RecordService) {}

  /** GET /books/:bid/records — 记录列表（游标分页+筛选） */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.bid, 10);
      const data = await this.recordService.getList(bookId, req.user!.id, req.query as any);
      success(res, data);
    } catch (error) {
      next(error);
    }
  };

  /** POST /books/:bid/records — 添加记录 */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.bid, 10);
      const record = await this.recordService.create(bookId, req.user!.id, req.body);
      success(res, record, '记录添加成功');
    } catch (error) {
      next(error);
    }
  };

  /** GET /books/:bid/records/:id — 记录详情 */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.bid, 10);
      const recordId = parseInt(req.params.id, 10);
      const record = await this.recordService.getDetail(recordId, bookId, req.user!.id);
      success(res, record);
    } catch (error) {
      next(error);
    }
  };

  /** PUT /books/:bid/records/:id — 编辑记录 */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.bid, 10);
      const recordId = parseInt(req.params.id, 10);
      const record = await this.recordService.update(recordId, bookId, req.user!.id, req.body);
      success(res, record, '记录更新成功');
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /books/:bid/records/:id — 删除记录 */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.bid, 10);
      const recordId = parseInt(req.params.id, 10);
      await this.recordService.delete(recordId, bookId, req.user!.id);
      success(res, null, '记录已删除');
    } catch (error) {
      next(error);
    }
  };
}
