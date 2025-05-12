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
    return res.status(StatusCodes.OK).json(orders);
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
    const orders = await ordersModel.getAllOrders();
    const targetOrder = orders.find(o => o._id.toString() === id);
    if (!targetOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại' });
    }
    const updatedOrder = await ordersModel.updateOrderStatus(id, 'ordered', 'admin');
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
    const orders = await ordersModel.getAllOrders();
    const targetOrder = orders.find(o => o._id.toString() === id);
    if (!targetOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại' });
    }
    const updatedOrder = await ordersModel.updateOrderStatus(id, 'shipping', 'admin');
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
    console.log('Reject order request:', { userId, orderId: id });

    // Validate order ID
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'ID đơn hàng không hợp lệ' });
    }

    const orders = await ordersModel.getAllOrders();
    const targetOrder = orders.find(o => o._id.toString() === id);
    console.log('Target order:', targetOrder);
    
    if (!targetOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại' });
    }

    // Hoàn trả số lượng sản phẩm
    const db = await GET_DB();
    console.log('Restoring product quantities for order items:', targetOrder.items);
    
    // Kiểm tra và cập nhật số lượng sản phẩm
    for (const item of targetOrder.items) {
      if (!item.productId || !item.quantity) {
        console.error('Invalid item data:', item);
        continue;
      }

      try {
        // Kiểm tra sản phẩm tồn tại
        const existingProduct = await db.collection('products').findOne(
          { _id: new ObjectId(item.productId) }
        );

        if (!existingProduct) {
          console.error('Product not found:', item.productId);
          continue;
        }

        // Cập nhật số lượng
        const result = await db.collection('products').updateOne(
          { _id: new ObjectId(item.productId) },
          { $inc: { quantity: item.quantity } }
        );

        console.log('Update result for product:', {
          productId: item.productId,
          oldQuantity: existingProduct.quantity,
          addedQuantity: item.quantity,
          result: result
        });

        if (result.modifiedCount === 0) {
          console.error('Failed to update product quantity:', item.productId);
          throw new Error(`Không thể cập nhật số lượng sản phẩm ${item.productId}`);
        }
      } catch (error) {
        console.error('Error updating product quantity:', {
          productId: item.productId,
          error: error.message,
          stack: error.stack
        });
        throw new Error(`Lỗi khi cập nhật số lượng sản phẩm: ${error.message}`);
      }
    }

    const updatedOrder = await ordersModel.updateOrderStatus(id, 'canceled', 'admin');
    console.log('Order updated:', updatedOrder);

    return res.status(StatusCodes.OK).json({ 
      message: 'Đã từ chối đơn hàng thành công', 
      order: updatedOrder 
    });
  } catch (error) {
    console.error('Error in rejectOrder:', {
      message: error.message,
      stack: error.stack,
      userId: req.userId,
      orderId: req.params.id
    });

    if (error.message.includes('orderId không hợp lệ')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    if (error.message.includes('Đơn hàng không tồn tại')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại' });
    }
    if (error.message.includes('Lỗi khi cập nhật số lượng sản phẩm')) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
        message: error.message,
        details: 'Không thể hoàn trả số lượng sản phẩm'
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: 'Lỗi server khi từ chối đơn hàng', 
      error: error.message 
    });
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

const completeOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để hoàn thành đơn hàng' });
    }
    const { id } = req.params;
    const order = await ordersModel.getAllOrders();
    const targetOrder = order.find(o => o._id.toString() === id);
    if (!targetOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại' });
    }
    if (targetOrder.status !== 'shipping') {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Đơn hàng chưa ở trạng thái đang giao' });
    }
    const updatedOrder = await ordersModel.updateOrderStatus(id, 'completed', 'admin');
    return res.status(StatusCodes.OK).json({ message: 'Đã hoàn thành đơn hàng', order: updatedOrder });
  } catch (error) {
    console.error('Error in completeOrder:', error.message, error.stack);
    if (error.message.includes('orderId không hợp lệ')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    if (error.message.includes('Đơn hàng không tồn tại')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại' });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi hoàn thành đơn hàng', error: error.message });
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để hủy đơn hàng' });
    }
    const { id } = req.params;
    const { productsToRestore } = req.body;
    console.log('Cancel order request:', { userId, orderId: id, productsToRestore });

    // Validate order ID
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'ID đơn hàng không hợp lệ' });
    }

    // Validate products data
    if (!Array.isArray(productsToRestore) || productsToRestore.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Dữ liệu sản phẩm không hợp lệ' });
    }

    // Lấy thông tin đơn hàng
    const orders = await ordersModel.getUserOrders(userId);
    console.log('User orders:', orders);
    
    const targetOrder = orders.find(o => o._id.toString() === id);
    console.log('Target order:', targetOrder);
    
    if (!targetOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại hoặc không thuộc về bạn' });
    }

    if (targetOrder.status !== 'pending') {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Chỉ có thể hủy đơn hàng khi đang ở trạng thái chờ xử lý' });
    }

    // Hoàn trả số lượng sản phẩm
    const db = await GET_DB();
    console.log('Restoring product quantities:', productsToRestore);
    
    // Kiểm tra và cập nhật số lượng sản phẩm
    for (const product of productsToRestore) {
      if (!product.productId || typeof product.quantity !== 'number') {
        console.error('Invalid product data:', product);
        continue;
      }

      try {
        // Kiểm tra sản phẩm tồn tại
        const existingProduct = await db.collection('products').findOne(
          { _id: new ObjectId(product.productId) }
        );

        if (!existingProduct) {
          console.error('Product not found:', product.productId);
          continue;
        }

        // Cập nhật số lượng
        const result = await db.collection('products').updateOne(
          { _id: new ObjectId(product.productId) },
          { $inc: { quantity: product.quantity } }
        );

        console.log('Update result for product:', {
          productId: product.productId,
          oldQuantity: existingProduct.quantity,
          addedQuantity: product.quantity,
          result: result
        });

        if (result.modifiedCount === 0) {
          console.error('Failed to update product quantity:', product.productId);
          throw new Error(`Không thể cập nhật số lượng sản phẩm ${product.productId}`);
        }
      } catch (error) {
        console.error('Error updating product quantity:', {
          productId: product.productId,
          error: error.message,
          stack: error.stack
        });
        throw new Error(`Lỗi khi cập nhật số lượng sản phẩm: ${error.message}`);
      }
    }

    // Cập nhật trạng thái đơn hàng
    const updatedOrder = await ordersModel.updateOrderStatus(id, 'canceled', 'user');
    console.log('Order updated:', updatedOrder);

    return res.status(StatusCodes.OK).json({ 
      message: 'Đã hủy đơn hàng thành công', 
      order: updatedOrder 
    });
  } catch (error) {
    console.error('Error in cancelOrder:', {
      message: error.message,
      stack: error.stack,
      userId: req.userId,
      orderId: req.params.id
    });

    if (error.message.includes('orderId không hợp lệ')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    if (error.message.includes('Đơn hàng không tồn tại')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Đơn hàng không tồn tại' });
    }
    if (error.message.includes('Lỗi khi cập nhật số lượng sản phẩm')) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
        message: error.message,
        details: 'Không thể hoàn trả số lượng sản phẩm'
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: 'Lỗi server khi hủy đơn hàng', 
      error: error.message 
    });
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
  completeOrder,
  cancelOrder,
};