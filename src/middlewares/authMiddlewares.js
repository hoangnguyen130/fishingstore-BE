import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('authMiddleware: Thiếu hoặc sai định dạng header Authorization:', authHeader);
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Token không hợp lệ hoặc thiếu' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('authMiddleware: Token rỗng');
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Token không hợp lệ' });
    }

    console.log('authMiddleware: Xác thực token:', token.slice(0, 20) + '...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hoangdeptrai');
    if (!decoded.userId) {
      console.error('authMiddleware: Token không chứa userId:', decoded);
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Token không hợp lệ: thiếu userId' });
    }

    console.log('authMiddleware: Token hợp lệ, userId:', decoded.userId);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('authMiddleware: Lỗi xác thực token:', error.message, error.stack);
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

export default authMiddleware;