import express from 'express';
import { ordersController } from '~/controllers/ordersController';
import authMiddleware from '~/middlewares/authMiddlewares';

const Router = express.Router();

// Middleware để kiểm tra vai trò admin
// const restrictToAdmin = (req, res, next) => {
//   if (!req.user || req.user.role !== 'admin') {
//     return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
//   }
//   next();
// };

// Tạo đơn hàng và thanh toán
Router.route('/create')
  .post(authMiddleware, ordersController.createOrder);

// Lấy đơn hàng của người dùng
Router.route('/user')
  .get(authMiddleware, ordersController.getUserOrders);

// Lấy trạng thái đơn hàng (user)
Router.route('/status/:id')
  .get(authMiddleware, ordersController.getOrderStatus);

// Tìm kiếm đơn hàng bằng mã đơn hàng hoặc tên sản phẩm (user và admin)
Router.route('/search')
  .get(authMiddleware, ordersController.searchOrders);

// Xác nhận nhận hàng (user)
Router.route('/received/:id')
  .put(authMiddleware, ordersController.markOrderReceived);

// Lấy tất cả đơn hàng (bất kỳ người dùng đã đăng nhập)
Router.route('/admin')
  .get(authMiddleware, ordersController.getAllOrders);

// Xác nhận đơn hàng (admin)
Router.route('/admin/:id/accept')
  // .put(authMiddleware, restrictToAdmin, ordersController.acceptOrder);
  .put(authMiddleware, ordersController.acceptOrder);

// Cập nhật trạng thái đang giao (admin)
Router.route('/admin/:id/shipping')
  // .put(authMiddleware, restrictToAdmin, ordersController.markOrderShipping);
  .put(authMiddleware, ordersController.markOrderShipping);

// Từ chối đơn hàng (admin)
Router.route('/admin/:id/reject')
  // .put(authMiddleware, restrictToAdmin, ordersController.rejectOrder);
  .put(authMiddleware, ordersController.rejectOrder);

export const ordersRoute = Router;