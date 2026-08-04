// 路由汇总 — 所有子路由挂载到 /api/v1
import { Router } from 'express';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';
import { bookRouter } from './book.routes';
import { recordRouter } from './record.routes';
import { categoryRouter } from './category.routes';
import { reportRouter } from './report.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/books', bookRouter);
router.use('/categories', categoryRouter);
router.use('/books', recordRouter);
router.use('/books', reportRouter);

export { router as apiRouter };
