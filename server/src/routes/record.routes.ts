import { Router } from 'express';
import { MemberRole } from '@prisma/client';
import { prisma } from '../db';
import { RecordService } from '../services/record.service';
import { RecordController } from '../controllers/record.controller';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/bookAccess';
import { validate } from '../middleware/validate';
import { createRecordSchema, updateRecordSchema, recordQuerySchema } from '../validators/record.validator';
const recordService = new RecordService(prisma);
const recordController = new RecordController(recordService);

const router = Router();

router.use(auth);

// GET  /api/v1/books/:bid/records         — 记录列表（游标分页+筛选）
router.get(
  '/:bid/records',
  requireRole(), // 成员即可查看
  validate(recordQuerySchema, 'query'),
  recordController.getList,
);

// POST /api/v1/books/:bid/records         — 添加记录
router.post(
  '/:bid/records',
  requireRole(MemberRole.EDITOR, MemberRole.ADMIN, MemberRole.OWNER),
  validate(createRecordSchema),
  recordController.create,
);

// GET  /api/v1/books/:bid/records/:id     — 记录详情
router.get(
  '/:bid/records/:id',
  requireRole(),
  recordController.getDetail,
);

// PUT  /api/v1/books/:bid/records/:id     — 编辑记录
router.put(
  '/:bid/records/:id',
  requireRole(MemberRole.EDITOR, MemberRole.ADMIN, MemberRole.OWNER),
  validate(updateRecordSchema),
  recordController.update,
);

// DELETE /api/v1/books/:bid/records/:id   — 删除记录
router.delete(
  '/:bid/records/:id',
  requireRole(MemberRole.EDITOR, MemberRole.ADMIN, MemberRole.OWNER),
  recordController.delete,
);

export { router as recordRouter };
