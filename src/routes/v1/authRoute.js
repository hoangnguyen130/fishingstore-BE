import express from 'express';
import { authController } from '~/controllers/authController';
import authMiddleware from '~/middlewares/authMiddlewares';
import multer from 'multer';
import path from 'path';

const Router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file ảnh!'));
  }
});

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

// Lấy thông tin profile người dùng
Router.route('/profile')
  .get(authMiddleware, authController.getProfile);

// Cập nhật thông tin profile người dùng
Router.route('/profile/update')
  .put(authMiddleware, upload.single('avatar'), authController.updateProfile);

// Đổi mật khẩu
Router.route('/change-password')
  .put(authMiddleware, authController.changePassword);

export const authRoute = Router;