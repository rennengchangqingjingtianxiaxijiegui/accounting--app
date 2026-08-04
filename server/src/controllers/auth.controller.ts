import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { success } from '../utils/response';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, password } = req.body;
      const result = await this.authService.register(phone, password);
      success(res, result, '注册成功');
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, password } = req.body;
      const result = await this.authService.login(phone, password);
      success(res, result, '登录成功');
    } catch (error) {
      next(error);
    }
  };

  wechatLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.body;
      const result = await this.authService.wechatLogin(code);
      success(res, result, '微信登录成功');
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);
      success(res, result, 'Token刷新成功');
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      await this.authService.logout(refreshToken);
      success(res, null, '已退出登录');
    } catch (error) {
      next(error);
    }
  };
}
