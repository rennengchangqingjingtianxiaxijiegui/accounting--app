import { Request, Response, NextFunction } from 'express';
import { BookService } from '../services/book.service';
import { success } from '../utils/response';

export class BookController {
  constructor(private bookService: BookService) {}

  // ==================== 账本 CRUD ====================

  /** GET /books — 我的账本列表 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const books = await this.bookService.getList(req.user!.id);
      success(res, books);
    } catch (error) {
      next(error);
    }
  };

  /** POST /books — 创建账本 */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const book = await this.bookService.create(req.user!.id, req.body);
      success(res, book, '账本创建成功');
    } catch (error) {
      next(error);
    }
  };

  /** GET /books/:id — 账本详情 */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.id, 10);
      const book = await this.bookService.getDetail(bookId, req.user!.id);
      success(res, book);
    } catch (error) {
      next(error);
    }
  };

  /** PUT /books/:id — 编辑账本 */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.id, 10);
      const book = await this.bookService.update(bookId, req.user!.id, req.body);
      success(res, book, '账本更新成功');
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /books/:id — 删除账本 */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.id, 10);
      await this.bookService.delete(bookId, req.user!.id);
      success(res, null, '账本已删除');
    } catch (error) {
      next(error);
    }
  };

  // ==================== 成员管理 ====================

  /** GET /books/:id/members — 成员列表 */
  getMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.id, 10);
      const members = await this.bookService.getMembers(bookId, req.user!.id);
      success(res, members);
    } catch (error) {
      next(error);
    }
  };

  /** POST /books/:id/members — 添加成员 */
  addMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.id, 10);
      const { userId, role } = req.body;
      const member = await this.bookService.addMember(
        bookId,
        req.user!.id,
        userId,
        role
      );
      success(res, member, '成员添加成功');
    } catch (error) {
      next(error);
    }
  };

  /** PUT /books/:id/members/:mid — 修改成员角色 */
  updateMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.id, 10);
      const memberId = parseInt(req.params.mid, 10);
      const { role } = req.body;
      const member = await this.bookService.updateMemberRole(
        bookId,
        req.user!.id,
        memberId,
        role
      );
      success(res, member, '角色更新成功');
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /books/:id/members/:mid — 移除成员 */
  removeMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookId = parseInt(req.params.id, 10);
      const memberId = parseInt(req.params.mid, 10);
      await this.bookService.removeMember(bookId, req.user!.id, memberId);
      success(res, null, '成员已移除');
    } catch (error) {
      next(error);
    }
  };
}
