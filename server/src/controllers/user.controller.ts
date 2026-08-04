import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { success } from '../utils/response';

export class UserController {
  constructor(private userService: UserService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.getProfile(req.user!.id);
      success(res, user);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.updateProfile(req.user!.id, req.body);
      success(res, user, '资料更新成功');
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body;
      await this.userService.changePassword(req.user!.id, oldPassword, newPassword);
      success(res, null, '密码修改成功');
    } catch (error) {
      next(error);
    }
  };
}
