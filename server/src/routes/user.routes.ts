import { Router } from 'express';
import { prisma } from '../db';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/user.validator';
const userService = new UserService(prisma);
const userController = new UserController(userService);

const router = Router();

// 以下接口均需登录
router.use(auth);

// GET /api/v1/user/profile — 获取个人资料
router.get('/profile', userController.getProfile);

// PUT /api/v1/user/profile — 修改个人资料
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

// PUT /api/v1/user/password — 修改密码
router.put('/password', validate(changePasswordSchema), userController.changePassword);

export { router as userRouter };
