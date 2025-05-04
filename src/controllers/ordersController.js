/* eslint-disable no-console */
import { StatusCodes } from 'http-status-codes';
import { ordersModel } from '~/models/ordersModel';
import { productsModel } from '~/models/productsModel';
import { GET_DB } from '~/config/mongodb';
import { ObjectId } from 'mongodb';

const createOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để tạo đơn hàng' });
    }

    const { fullName, phone, address, note } = req.body;
    if (!fullName || !phone || !address) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng' });
    }

    const cart = await productsModel.getCart(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Giỏ hàng trống' });
    }

    const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await ordersModel.createOrder(userId, cart.items, total, { fullName, phone, address, note });

    await GET_DB().collection(productsModel.CART_COLLECTION_NAME).updateOne(
      { userId: userId.toString() },
      { $set: { items: [], updatedAt: Date.now() } }
    );

    console.log('createOrder: Tạo đơn hàng COD thành công:', { orderId: order._id, total: order.total });
    return res.status(StatusCodes.OK).json({
      message: 'Đơn hàng đã được tạo thành công, thanh toán khi nhận hàng',
      orderId: order._id,
      order,
    });
  } catch (error) {
    console.error('Error in createOrder:', error.message, error.stack);
    if (error.message.includes('Validation error') || error.message.includes('không hợp lệ')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi tạo đơn hàng', error: error.message });
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để xem đơn hàng' });
    }
    const orders = await ordersModel.getUserOrders(userId);
    return res.status(StatusCodes.OK).json(orders);
  } catch (error) {
    console.error('Error in getUserOrders:', error.message, error.stack);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi lấy đơn hàng', error: error.message });
  }
};

const getOrderStatus = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để xem trạng thái đơn hàng' });
    }
    const { id } = req.params;
    const orderStatus = await ordersModel.getOrderStatus(id, userId);
    return res.status(StatusCodes.OK).json(orderStatus);
  } catch (error) {
    console.error('Error in getOrderStatus:', error.message, error.stack);
    if (error.message.includes('orderId không hợp lệ')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    if (error.message.includes('Đơn hàng không tồn tại')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại hoặc không thuộc về bạn' });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi lấy trạng thái đơn hàng', error: error.message });
  }
};

const searchOrders = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userRole = req.user?.role || 'user';
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để tìm kiếm đơn hàng' });
    }
    const { query } = req.query;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Query tìm kiếm không hợp lệ' });
    }
    const orders = await ordersModel.searchOrders(query.trim(), userId, userRole);
    return res.status(StatusCodes.OK).json(orders);
  } catch (error) {
    console.error('Error in searchOrders:', error.message, error.stack);
    if (error.message.includes('Query tìm kiếm không hợp lệ')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi tìm kiếm đơn hàng', error: error.message });
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để xem tất cả đơn hàng' });
    }
    const orders = await ordersModel.getAllOrders();
    const filteredOrders = orders.map(order => ({
      _id: order._id,
      userId: order.userId,
      items: order.items,
      total: order.total,
      status: order.status,
      statusHistory: order.statusHistory,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      fullName: order.userId === userId ? order.fullName : undefined,
      phone: order.userId === userId ? order.phone : undefined,
      address: order.userId === userId ? order.address : undefined,
      note: order.userId === userId ? order.note : undefined,
    }));
    return res.status(StatusCodes.OK).json(filteredOrders);
  } catch (error) {
    console.error('Error in getAllOrders:', error.message, error.stack);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi lấy tất cả đơn hàng', error: error.message });
  }
};

const acceptOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để xác nhận đơn hàng' });
    }
    const { id } = req.params;
    const order = await ordersModel.getUserOrders(userId);
    const targetOrder = order.find(o => o._id.toString() === id);
    if (!targetOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại hoặc không thuộc về bạn' });
    }
    const updatedOrder = await ordersModel.updateOrderStatus(id, 'ordered', 'user');
    return res.status(StatusCodes.OK).json({ message: 'Đã xác nhận đơn hàng', order: updatedOrder });
  } catch (error) {
    console.error('Error in acceptOrder:', error.message, error.stack);
    if (error.message.includes('orderId không hợp lệ')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    if (error.message.includes('Đơn hàng không tồn tại')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại' });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi chấp nhận đơn hàng', error: error.message });
  }
};

const markOrderShipping = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để cập nhật trạng thái giao hàng' });
    }
    const { id } = req.params;
    const order = await ordersModel.getUserOrders(userId);
    const targetOrder = order.find(o => o._id.toString() === id);
    if (!targetOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại hoặc không thuộc về bạn' });
    }
    const updatedOrder = await ordersModel.updateOrderStatus(id, 'shipping', 'user');
    return res.status(StatusCodes.OK).json({ message: 'Đơn hàng đang được giao', order: updatedOrder });
  } catch (error) {
    console.error('Error in markOrderShipping:', error.message, error.stack);
    if (error.message.includes('orderId không hợp lệ')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    if (error.message.includes('Đơn hàng không tồn tại')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại' });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi cập nhật trạng thái giao hàng', error: error.message });
  }
};

const rejectOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để từ chối đơn hàng' });
    }
    const { id } = req.params;
    const order = await ordersModel.getUserOrders(userId);
    const targetOrder = order.find(o => o._id.toString() === id);
    if (!targetOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại hoặc không thuộc về bạn' });
    }
    const updatedOrder = await ordersModel.updateOrderStatus(id, 'canceled', 'user');
    return res.status(StatusCodes.OK).json({ message: 'Đã từ chối đơn hàng', order: updatedOrder });
  } catch (error) {
    console.error('Error in rejectOrder:', error.message, error.stack);
    if (error.message.includes('orderId không hợp lệ')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    if (error.message.includes('Đơn hàng không tồn tại')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại' });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi từ chối đơn hàng', error: error.message });
  }
};

const markOrderReceived = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userRole = req.user?.role || 'user';
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để xác nhận nhận hàng' });
    }
    const { id } = req.params;
    const order = await ordersModel.getUserOrders(userId);
    const targetOrder = order.find(o => o._id.toString() === id);
    if (!targetOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại hoặc không thuộc về bạn' });
    }
    if (targetOrder.status !== 'shipping') {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Đơn hàng chưa ở trạng thái đang giao' });
    }
    const updatedOrder = await ordersModel.updateOrderStatus(id, 'completed', userRole);
    return res.status(StatusCodes.OK).json({ message: 'Đã xác nhận nhận hàng', order: updatedOrder });
  } catch (error) {
    console.error('Error in markOrderReceived:', error.message, error.stack);
    if (error.message.includes('orderId không hợp lệ')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    if (error.message.includes('Đơn hàng không tồn tại')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại' });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi xác nhận nhận hàng', error: error.message });
  }
};

export const ordersController = {
  createOrder,
  getUserOrders,
  getOrderStatus,
  searchOrders,
  getAllOrders,
  acceptOrder,
  markOrderShipping,
  rejectOrder,
  markOrderReceived,
};