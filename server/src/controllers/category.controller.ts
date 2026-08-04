import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { success } from '../utils/response';

export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  /** GET /categories?type=EXPENSE&bookId=1 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, bookId } = req.query;
      const categories = await this.categoryService.getList(
        type as string | undefined,
        bookId ? parseInt(bookId as string, 10) : undefined,
      );
      success(res, categories);
    } catch (error) {
      next(error);
    }
  };
}
