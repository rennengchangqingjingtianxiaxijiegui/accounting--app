import { Router } from 'express';
import { MemberRole } from '@prisma/client';
import { prisma } from '../db';
import { BookService } from '../services/book.service';
import { BookController } from '../controllers/book.controller';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/bookAccess';
import { validate } from '../middleware/validate';
import {
  createBookSchema,
  updateBookSchema,
  addMemberSchema,
  updateMemberSchema,
} from '../validators/book.validator';
const bookService = new BookService(prisma);
const bookController = new BookController(bookService);

const router = Router();

// 以下接口均需登录
router.use(auth);

// ==================== 账本 CRUD ====================

// GET  /api/v1/books       — 我的账本列表
router.get('/', bookController.getList);

// POST /api/v1/books       — 创建账本
router.post('/', validate(createBookSchema), bookController.create);

// GET  /api/v1/books/:id   — 账本详情（需为成员）
router.get(
  '/:id',
  requireRole(),
  bookController.getDetail
);

// PUT  /api/v1/books/:id   — 编辑账本（需 owner/admin）
router.put(
  '/:id',
  requireRole(MemberRole.OWNER, MemberRole.ADMIN),
  validate(updateBookSchema),
  bookController.update
);

// DELETE /api/v1/books/:id — 删除账本（仅 owner）
router.delete(
  '/:id',
  requireRole(MemberRole.OWNER),
  bookController.delete
);

// ==================== 成员管理 ====================

// GET  /api/v1/books/:id/members        — 成员列表（需为成员）
router.get(
  '/:id/members',
  requireRole(),
  bookController.getMembers
);

// POST /api/v1/books/:id/members        — 添加成员（需 owner/admin）
router.post(
  '/:id/members',
  requireRole(MemberRole.OWNER, MemberRole.ADMIN),
  validate(addMemberSchema),
  bookController.addMember
);

// PUT  /api/v1/books/:id/members/:mid   — 修改角色（需 owner/admin）
router.put(
  '/:id/members/:mid',
  requireRole(MemberRole.OWNER, MemberRole.ADMIN),
  validate(updateMemberSchema),
  bookController.updateMember
);

// DELETE /api/v1/books/:id/members/:mid — 移除成员（需 owner/admin）
router.delete(
  '/:id/members/:mid',
  requireRole(MemberRole.OWNER, MemberRole.ADMIN),
  bookController.removeMember
);

export { router as bookRouter };
