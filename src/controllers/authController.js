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

const getProfile = async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query params
    
    if (!userId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Vui lòng cung cấp ID người dùng',
      });
    }

    const user = await authModel.findById(userId);
    
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Không tìm thấy thông tin người dùng',
      });
    }

    // Remove sensitive information
    user.password = undefined;
    
    res.status(StatusCodes.OK).json({
      user: {
        userName: user.userName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || '',
        role: user.role || 'user'
      }
    });
  } catch (error) {
    console.error('Error in getProfile:', error.message, error.stack);
    
    if (error.message === 'Invalid user ID format') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'ID người dùng không hợp lệ',
      });
    }
    
    if (error.message === 'User not found') {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Không tìm thấy thông tin người dùng',
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: 'Lỗi server khi lấy thông tin người dùng', 
      error: error.message 
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId } = req.query;
    const { userName, email, phone, address } = req.body;
    const avatar = req.file;

    console.log('Update Profile Request:', {
      userId,
      body: req.body,
      file: req.file
    });

    if (!userId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Vui lòng cung cấp ID người dùng',
      });
    }

    try {
      // Check if user exists
      const existingUser = await authModel.findById(userId);
      console.log('Existing user:', existingUser);

      if (!existingUser) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Không tìm thấy người dùng',
        });
      }

      // Prepare update data
      const updateData = {};
      if (userName) updateData.userName = userName;
      if (email) {
        // Check if email is already taken by another user
        if (email !== existingUser.email) {
          const userWithEmail = await authModel.check({ email });
          if (userWithEmail && userWithEmail._id.toString() !== userId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              message: 'Email đã được sử dụng bởi người dùng khác',
            });
          }
        }
        updateData.email = email;
      }
      if (phone) updateData.phone = phone;
      if (address) updateData.address = address;
      if (avatar) {
        // Handle avatar path
        const avatarPath = `http://localhost:3001/uploads/avatars/${avatar.filename}`;
        updateData.avatar = avatarPath;
      }

      console.log('Update Data:', updateData);

      // Update user profile
      const updatedUser = await authModel.update(userId, updateData);
      console.log('Updated User:', updatedUser);

      // Remove sensitive information
      updatedUser.password = undefined;

      // Ensure we have all required fields
      const responseData = {
        message: 'Cập nhật thông tin thành công',
        user: {
          userName: updatedUser.userName || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone || '',
          address: updatedUser.address || '',
          avatar: updatedUser.avatar || '',
          role: updatedUser.role || 'user'
        }
      };

      console.log('Sending response:', responseData);
      res.status(StatusCodes.OK).json(responseData);
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      
      if (dbError.message === 'User ID không hợp lệ') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'ID người dùng không hợp lệ',
        });
      }
      
      if (dbError.message === 'Không tìm thấy người dùng để cập nhật') {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Không tìm thấy người dùng',
        });
      }

      if (dbError.message.startsWith('Dữ liệu cập nhật không hợp lệ:')) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: dbError.message,
        });
      }

      if (dbError.message === 'Cập nhật thông tin thất bại') {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Cập nhật thông tin thất bại',
        });
      }

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Lỗi khi thao tác với cơ sở dữ liệu',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Error in updateProfile:', error.message, error.stack);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: 'Lỗi server khi cập nhật thông tin', 
      error: error.message 
    });
  }
};

const changePassword = async (req, res) => {
  try {
    // Get userId from token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Không tìm thấy token xác thực',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hoangdeptrai');
    const userId = decoded.userId;

    if (!userId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Không tìm thấy thông tin người dùng',
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới',
      });
    }

    // Get user to verify current password
    const user = await authModel.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Không tìm thấy người dùng',
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Mật khẩu hiện tại không đúng',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await authModel.changePassword(userId, user.password, hashedPassword);

    res.status(StatusCodes.OK).json({
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error) {
    console.error('Error in changePassword:', error.message, error.stack);
    if (error.name === 'JsonWebTokenError') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Token không hợp lệ',
      });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi server khi đổi mật khẩu',
      error: error.message,
    });
  }
};

export const authController = {
  register,
  registerAdmin,
  login,
  googleLogin,
  getAllUser,
  getProfile,
  updateProfile,
  changePassword,
};