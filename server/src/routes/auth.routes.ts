import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { auth } from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
  wechatLoginSchema,
  refreshTokenSchema,
  logoutSchema,
} from '../validators/auth.validator';

const prisma = new PrismaClient();
const authService = new AuthService(prisma);
const authController = new AuthController(authService);

const router = Router();

// POST /api/v1/auth/register — 手机号注册
router.post('/register', validate(registerSchema), authController.register);

// POST /api/v1/auth/login — 手机号+密码登录
router.post('/login', validate(loginSchema), authController.login);

// POST /api/v1/auth/wechat-login — 微信小程序登录
router.post('/wechat-login', validate(wechatLoginSchema), authController.wechatLogin);

// POST /api/v1/auth/refresh — 刷新AccessToken
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

// POST /api/v1/auth/logout — 注销RefreshToken（需登录）
router.post('/logout', auth, validate(logoutSchema), authController.logout);

export { router as authRouter };
