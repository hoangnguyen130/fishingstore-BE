/* eslint-disable no-console */
import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
import { productsModel } from './productsModel';

const ORDER_COLLECTION_NAME = 'orders';

const ORDER_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      productName: Joi.string().optional(),
      price: Joi.number().optional(),
      originalPrice: Joi.number().required(),
      discountedPrice: Joi.number().optional(),
      discountPercentage: Joi.number().optional(),
      image: Joi.string().optional(),
    })
  ).required(),
  total: Joi.number().precision(2).required(),
  status: Joi.string().valid('pending', 'ordered', 'shipping', 'completed', 'canceled').default('pending'),
  statusHistory: Joi.array().items(
    Joi.object({
      status: Joi.string().valid('pending', 'ordered', 'shipping', 'completed', 'canceled').required(),
      timestamp: Joi.date().timestamp('javascript').default(Date.now),
    })
  ).default([{ status: 'pending', timestamp: Date.now }]),
  paymentMethod: Joi.string().valid('cod').default('cod'),
  fullName: Joi.string().trim().required(),
  phone: Joi.string().pattern(/^\d{10}$/).required(),
  address: Joi.string().trim().required(),
  note: Joi.string().trim().allow('').optional(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(Date.now),
});

const createOrder = async (userId, cartItems, total, shippingInfo) => {
  try {
    const db = await GET_DB();
    const { error, value } = ORDER_COLLECTION_SCHEMA.validate({
      userId: userId.toString(),
      items: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        productName: item.productName || '',
        originalPrice: item.originalPrice,
        discountedPrice: item.discountPercentage > 0 ? item.discountedPrice : item.originalPrice,
        discountPercentage: item.discountPercentage || 0,
        image: item.image || '',
      })),
      total: cartItems.reduce((sum, item) => 
        sum + (item.discountPercentage > 0 ? item.discountedPrice : item.originalPrice) * item.quantity, 0),
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: Date.now() }],
      paymentMethod: 'cod',
      fullName: shippingInfo.fullName,
      phone: shippingInfo.phone,
      address: shippingInfo.address,
      note: shippingInfo.note,
    });
    if (error) {
      console.error('createOrder: Validation error:', error.details);
      throw new Error(error.details[0].message);
    }

    // 1. Kiểm tra số lượng sản phẩm trước khi tạo đơn hàng
    for (const item of cartItems) {
      const product = await db.collection(productsModel.PRODUCT_COLLECTION_NAME).findOne(
        { _id: new ObjectId(item.productId) }
      );

      if (!product) {
        throw new Error(`Không tìm thấy sản phẩm với ID: ${item.productId}`);
      }

      if (product.quantity < item.quantity) {
        throw new Error(`Sản phẩm ${product.productName} chỉ còn ${product.quantity} sản phẩm`);
      }
    }

    // 2. Tạo đơn hàng
    console.log('createOrder: Tạo đơn hàng:', { userId: value.userId, total: value.total });
    const result = await db.collection(ORDER_COLLECTION_NAME).insertOne(value);
    const order = await db.collection(ORDER_COLLECTION_NAME).findOne({ _id: result.insertedId });

    // 3. Cập nhật số lượng sản phẩm
    for (const item of cartItems) {
      const updateResult = await db.collection(productsModel.PRODUCT_COLLECTION_NAME).updateOne(
        { 
          _id: new ObjectId(item.productId),
          quantity: { $gte: item.quantity } // Đảm bảo số lượng vẫn đủ sau khi kiểm tra
        },
        { $inc: { quantity: -item.quantity } }
      );

      if (updateResult.matchedCount === 0) {
        // Nếu không cập nhật được (số lượng không đủ), xóa đơn hàng và throw error
        await db.collection(ORDER_COLLECTION_NAME).deleteOne({ _id: result.insertedId });
        throw new Error('Sản phẩm đã hết hàng hoặc số lượng không đủ');
      }
    }

    return order;
  } catch (error) {
    console.error('Error in createOrder:', error.message, error.stack);
    throw new Error(error.message);
  }
};

const getUserOrders = async (userId) => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId không hợp lệ');
    }
    console.log('getUserOrders: Truy vấn đơn hàng cho userId:', userId);
    const db = await GET_DB();
    const orders = await db.collection(ORDER_COLLECTION_NAME).find({ userId: userId.toString() }).toArray();
    return orders;
  } catch (error) {
    console.error('Error in getUserOrders:', error.message, error.stack);
    throw new Error(error.message);
  }
};

const getAllOrders = async () => {
  try {
    console.log('getAllOrders: Truy vấn tất cả đơn hàng');
    const db = await GET_DB();
    const orders = await db.collection(ORDER_COLLECTION_NAME).find({}).toArray();
    return orders;
  } catch (error) {
    console.error('Error in getAllOrders:', error.message, error.stack);
    throw new Error(error.message);
  }
};

const getOrderStatus = async (orderId, userId) => {
  try {
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      throw new Error('orderId không hợp lệ');
    }
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId không hợp lệ');
    }
    console.log('getOrderStatus: Truy vấn trạng thái đơn hàng:', { orderId, userId });
    const db = await GET_DB();
    const order = await db.collection(ORDER_COLLECTION_NAME).findOne({
      _id: new ObjectId(orderId),
      userId: userId.toString(),
    });
    if (!order) {
      throw new Error('Đơn hàng không tồn tại hoặc không thuộc về bạn');
    }
    return {
      orderId: order._id,
      status: order.status,
      statusHistory: order.statusHistory,
    };
  } catch (error) {
    console.error('Error in getOrderStatus:', error.message, error.stack);
    throw new Error(error.message);
  }
};

const searchOrders = async (query, userId, userRole) => {
  try {
    if (!query || typeof query !== 'string') {
      throw new Error('Query tìm kiếm không hợp lệ');
    }
    console.log('searchOrders: Tìm kiếm đơn hàng:', { query, userId, userRole });
    const db = await GET_DB();
    const searchCriteria = [];

    // Tìm theo orderId
    if (/^[0-9a-fA-F]{24}$/.test(query)) {
      searchCriteria.push({ _id: new ObjectId(query) });
    }

    // Tìm theo productName
    searchCriteria.push({ 'items.productName': { $regex: query, $options: 'i' } });

    // Kết hợp các tiêu chí tìm kiếm
    const filter = { $or: searchCriteria }; // Allow all orders for any user

    const orders = await db.collection(ORDER_COLLECTION_NAME).find(filter).toArray();
    console.log('searchOrders: Kết quả:', orders.length);
    return orders;
  } catch (error) {
    console.error('Error in searchOrders:', error.message, error.stack);
    throw new Error(error.message);
  }
};

const updateOrderStatus = async (orderId, status, userRole) => {
  try {
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      throw new Error('orderId không hợp lệ');
    }
    const validStatuses = ['pending', 'ordered', 'shipping', 'completed', 'canceled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Trạng thái đơn hàng không hợp lệ');
    }
    console.log('updateOrderStatus: Cập nhật trạng thái đơn hàng:', { orderId, status });
    const db = await GET_DB();
    const result = await db.collection(ORDER_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      {
        $set: { status, updatedAt: Date.now() },
        $push: { statusHistory: { status, timestamp: Date.now() } },
      },
      { returnDocument: 'after' }
    );
    if (!result) {
      throw new Error('Đơn hàng không tồn tại');
    }
    console.log('updateOrderStatus: Kết quả:', result);
    return result.value;
  } catch (error) {
    console.error('Error in updateOrderStatus:', error.message, error.stack);
    throw new Error(error.message);
  }
};

export const ordersModel = {
  ORDER_COLLECTION_NAME,
  ORDER_COLLECTION_SCHEMA,
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderStatus,
  searchOrders,
  updateOrderStatus,
};