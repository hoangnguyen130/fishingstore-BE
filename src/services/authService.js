/* eslint-disable no-console */
import bcrypt from 'bcryptjs';
import { authModel } from '~/models/authModel';

const register = async (data) => {
  try {
    const { userName, email, password, role = 'user' } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await authModel.create({
      userName,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('register: Tạo người dùng thành công:', { email, role });
    return user;
  } catch (error) {
    console.error('Error in register:', error.message, error.stack);
    throw new Error(error.message);
  }
};

export const authService = {
  register,
};