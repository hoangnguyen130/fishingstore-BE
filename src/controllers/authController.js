/* eslint-disable no-console */
import { StatusCodes } from 'http-status-codes';
import { authModel } from '~/models/authModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authService } from '~/services/authService';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res, next) => {
  try {
    const userExist = await authModel.check({ email: req.body.email });
    if (userExist) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Email đã được đăng ký',
      });
    }
    const createUser = await authService.register(req.body);
    const token = jwt.sign({ userId: createUser._id, role: createUser.role }, process.env.JWT_SECRET || 'hoangdeptrai');
    createUser.password = undefined;
    res.status(StatusCodes.CREATED).json({ user: createUser, token });
  } catch (error) {
    console.error('Error in register:', error.message, error.stack);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi đăng ký', error: error.message });
  }
};

const registerAdmin = async (req, res, next) => {
  try {
    // Optional: Secret key check for security (uncomment to enable)
    // const { secretKey } = req.body;
    // if (secretKey !== process.env.ADMIN_SECRET_KEY) {
    //   return res.status(StatusCodes.FORBIDDEN).json({ message: 'Khóa bí mật không hợp lệ' });
    // }

    const { userName, email, password } = req.body;
    if (!userName || !email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Vui lòng cung cấp đầy đủ tên, email và mật khẩu' });
    }

    const userExist = await authModel.check({ email });
    if (userExist) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Email đã được đăng ký' });
    }

    const createUser = await authService.register({ userName, email, password, role: 'admin' });
    const token = jwt.sign({ userId: createUser._id, role: createUser.role }, process.env.JWT_SECRET || 'hoangdeptrai');
    createUser.password = undefined;
    console.log('registerAdmin: Tạo tài khoản admin thành công:', { email });

    res.status(StatusCodes.CREATED).json({ user: createUser, token });
  } catch (error) {
    console.error('Error in registerAdmin:', error.message, error.stack);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi tạo tài khoản admin', error: error.message });
  }
};

const login = async (req, res, next) => {
  try {
    const userExist = await authModel.check({ email: req.body.email });
    if (!userExist) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Người dùng không tồn tại',
      });
    }
    const comparePass = await bcrypt.compare(req.body.password, userExist.password);
    if (!comparePass) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Mật khẩu sai!',
      });
    }
    const token = jwt.sign({ userId: userExist._id, role: userExist.role }, process.env.JWT_SECRET || 'hoangdeptrai');
    userExist.password = undefined;
    res.status(StatusCodes.OK).json({
      user: userExist,
      token,
    });
  } catch (error) {
    console.error('Error in login:', error.message, error.stack);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi đăng nhập', error: error.message });
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    // Kiểm tra hoặc tạo người dùng trong database
    let user = await authModel.check({ email });
    if (!user) {
      user = await authService.register({
        userName: name,
        email,
        password: 'google-auth-' + Math.random().toString(36).slice(-8),
        role: 'user',
      });
    }

    const jwtToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'hoangdeptrai');
    user.password = undefined;
    res.status(StatusCodes.OK).json({
      user,
      token: jwtToken,
    });
  } catch (error) {
    console.error('Error in googleLogin:', error.message, error.stack);
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Đăng nhập Google thất bại',
    });
  }
};

const getAllUser = async (req, res, next) => {
  try {
    const allUser = await authModel.findAll();
    res.status(StatusCodes.OK).json({ allUser });
  } catch (error) {
    console.error('Error in getAllUser:', error.message, error.stack);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi lấy danh sách người dùng', error: error.message });
  }
};

export const authController = {
  register,
  registerAdmin,
  login,
  googleLogin,
  getAllUser,
};