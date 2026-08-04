import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { CategoryService } from '../services/category.service';
import { CategoryController } from '../controllers/category.controller';
import { auth } from '../middleware/auth';

const prisma = new PrismaClient();
const categoryService = new CategoryService(prisma);
const categoryController = new CategoryController(categoryService);

const router = Router();

router.use(auth);

// GET /api/v1/categories?type=INCOME&bookId=1
router.get('/', categoryController.getList);

export { router as categoryRouter };
