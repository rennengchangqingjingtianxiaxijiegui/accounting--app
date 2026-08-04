import { Router } from 'express';
import { auth } from '../middleware/auth';

const router = Router();

// TODO: Phase 5 实现
// GET /api/v1/books/:bid/reports/summary   — 汇总
// GET /api/v1/books/:bid/reports/trend     — 趋势数据
// GET /api/v1/books/:bid/reports/category  — 分类占比

export { router as reportRouter };
