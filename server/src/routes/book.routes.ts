import { Router } from 'express';
import { auth } from '../middleware/auth';

const router = Router();

// TODO: Phase 3 实现
// GET    /api/v1/books          — 我的账本列表
// POST   /api/v1/books          — 创建账本
// GET    /api/v1/books/:id      — 账本详情
// PUT    /api/v1/books/:id      — 编辑账本
// DELETE /api/v1/books/:id      — 删除账本
// GET    /api/v1/books/:id/members        — 成员列表
// POST   /api/v1/books/:id/members        — 添加成员
// PUT    /api/v1/books/:id/members/:mid   — 修改角色
// DELETE /api/v1/books/:id/members/:mid   — 移除成员

export { router as bookRouter };
