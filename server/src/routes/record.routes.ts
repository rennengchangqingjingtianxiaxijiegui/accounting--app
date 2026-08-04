import { Router } from 'express';
import { auth } from '../middleware/auth';

const router = Router();

// TODO: Phase 4 实现
// GET    /api/v1/books/:bid/records       — 记录列表（分页+筛选）
// POST   /api/v1/books/:bid/records       — 添加记录
// GET    /api/v1/books/:bid/records/:id   — 记录详情
// PUT    /api/v1/books/:bid/records/:id   — 编辑记录
// DELETE /api/v1/books/:bid/records/:id   — 删除记录

export { router as recordRouter };
