import { Router } from 'express';
import { auth } from '../middleware/auth';

const router = Router();

// TODO: Phase 4 实现
// GET /api/v1/categories — 分类列表 ?type=expense

export { router as categoryRouter };
