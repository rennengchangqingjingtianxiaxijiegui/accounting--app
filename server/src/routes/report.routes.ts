import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReportService } from '../services/report.service';
import { ReportController } from '../controllers/report.controller';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/bookAccess';
import { validate } from '../middleware/validate';
import { reportQuerySchema } from '../validators/report.validator';

const prisma = new PrismaClient();
const reportService = new ReportService(prisma);
const reportController = new ReportController(reportService);

const router = Router({ mergeParams: true });

// 所有报表接口均需登录
router.use(auth);

// GET /api/v1/books/:bid/reports/summary   — 收支汇总（注意：requireRole 必须内联，否则 route params 未解析）
router.get('/:bid/reports/summary', requireRole(), validate(reportQuerySchema, 'query'), reportController.getSummary);

// GET /api/v1/books/:bid/reports/trend     — 趋势数据
router.get('/:bid/reports/trend', requireRole(), validate(reportQuerySchema, 'query'), reportController.getTrend);

// GET /api/v1/books/:bid/reports/category  — 分类占比
router.get('/:bid/reports/category', requireRole(), validate(reportQuerySchema, 'query'), reportController.getCategory);

export { router as reportRouter };
