import express from 'express';
import { authController } from '~/controllers/authController';
import authMiddleware from '~/middlewares/authMiddlewares';

const Router = express.Router();

// Middleware để kiểm tra vai trò admin
const restrictToAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
  }
  next();
};

// Đăng ký người dùng thường
Router.route('/register')
  .post(authController.register);

// Đăng ký tài khoản admin
Router.route('/admin/register')
  .post(authMiddleware, restrictToAdmin, authController.registerAdmin);

// Đăng nhập
Router.route('/login')
  .post(authController.login);

// Đăng nhập Google
Router.route('/google-login')
  .post(authController.googleLogin);

// Lấy danh sách tất cả người dùng (admin)
Router.route('/')
  .get(authMiddleware, restrictToAdmin, authController.getAllUser);

export const authRoute = Router;