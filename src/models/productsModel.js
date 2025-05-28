/* eslint-disable no-console */
import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'

const PRODUCT_COLLECTION_NAME = 'products'
const CART_COLLECTION_NAME = 'carts'

const PRODUCT_COLLECTION_SCHEMA = Joi.object({
  productName: Joi.string().trim().strict().required(),
  description: Joi.string().trim().strict().required(),
  type: Joi.string().trim().strict().required(),
  price: Joi.number().precision(2).required(),
  quantity: Joi.number().integer().min(0).required(),
  images: Joi.alternatives().try(
    Joi.string().min(3).max(255).trim().strict(),
    Joi.array().items(Joi.string().min(3).max(255).trim().strict())
  ).required(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const CART_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      productName: Joi.string().optional(),
      price: Joi.number().optional(),
      image: Joi.string().optional()
    })
  ).default([]),
  updatedAt: Joi.date().timestamp('javascript').default(Date.now)
})

const PRODUCT_TYPES_COLLECTION_NAME = 'productTypes'

const PRODUCT_TYPE_SCHEMA = Joi.object({
  typeName: Joi.string().trim().strict().required(),
  description: Joi.string().trim().strict().optional(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const createNew = async (req, res) => {
  try {
    const { error, value } = PRODUCT_COLLECTION_SCHEMA.validate(req.body)
    if (error) {
      console.error('Joi validation error:', error.details)
      return res.status(400).json({ message: error.details[0].message })
    }

    console.log('Inserting product:', value)
    const result = await GET_DB().collection(PRODUCT_COLLECTION_NAME).insertOne(value)
    console.log('Insert result:', result)

    const insertedProduct = await GET_DB().collection(PRODUCT_COLLECTION_NAME).findOne({ _id: result.insertedId })
    if (!insertedProduct) {
      console.error('Failed to find inserted product:', result.insertedId)
      return res.status(500).json({ message: 'Failed to retrieve inserted product' })
    }

    return res.status(201).json({ message: 'Product created successfully', data: insertedProduct })
  } catch (error) {
    console.error('Error in createNew:', error.message, error.stack)
    return res.status(500).json({ message: 'Server error. Failed to create product', error: error.message })
  }
}

const getProducts = async (req, res) => {
  try {
    const products = await GET_DB().collection(PRODUCT_COLLECTION_NAME).find({}).toArray()
    return res.status(200).json(products)
  } catch (error) {
    console.error('Error in getProducts:', error.message, error.stack)
    return res.status(500).json({ message: 'Failed to fetch products', error: error.message })
  }
}
const getProductById = async (productId) => {
  try {
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      console.error('getProductById: Invalid productId format:', productId)
      throw new Error('productId không hợp lệ')
    }
    console.log('getProductById: Truy vấn sản phẩm:', { productId })
    const db = await GET_DB()
    const product = await db.collection(PRODUCT_COLLECTION_NAME).findOne({
      _id: new ObjectId(productId)
    })
    if (!product) {
      console.error('getProductById: Product not found:', productId)
      throw new Error('Sản phẩm không tồn tại')
    }
    return product
  } catch (error) {
    console.error('Error in getProductById:', error.message, error.stack)
    throw new Error(error.message)
  }
}
const addToCart = async (userId, productId, quantity) => {
  try {
    // Validate input
    const { error } = Joi.object({
      userId: Joi.string().required(),
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required()
    }).validate({ userId, productId, quantity })
    if (error) {
      console.error('addToCart: Validation error:', error.details)
      throw new Error(error.details[0].message)
    }

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error('addToCart: userId không hợp lệ:', userId)
      throw new Error('userId không hợp lệ')
    }

    // Kiểm tra productId hợp lệ
    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
      console.error('addToCart: productId không hợp lệ:', productId)
      throw new Error('productId không hợp lệ')
    }

    // Kiểm tra sản phẩm tồn tại
    const db = await GET_DB()
    const product = await db.collection(PRODUCT_COLLECTION_NAME).findOne({ _id: new ObjectId(productId) })
    if (!product) {
      console.error('addToCart: Sản phẩm không tồn tại:', productId)
      throw new Error('Sản phẩm không tồn tại')
    }

    // Tìm giỏ hàng của người dùng
    const cart = await db.collection(CART_COLLECTION_NAME).findOne({ userId: userId.toString() })
    if (cart) {
      // Cập nhật giỏ hàng nếu đã tồn tại
      const existingItem = cart.items.find((item) => item.productId === productId)
      if (existingItem) {
        // Tăng số lượng
        await db.collection(CART_COLLECTION_NAME).updateOne(
          { userId: userId.toString(), 'items.productId': productId },
          { $inc: { 'items.$.quantity': quantity }, $set: { updatedAt: Date.now() } }
        )
      } else {
        // Thêm sản phẩm mới vào giỏ hàng
        await db.collection(CART_COLLECTION_NAME).updateOne(
          { userId: userId.toString() },
          {
            $push: {
              items: {
                productId,
                quantity,
                productName: product.productName,
                price: product.price,
                image: Array.isArray(product.images) ? product.images[0] : product.images
              }
            },
            $set: { updatedAt: Date.now() }
          }
        )
      }
    } else {
      // Tạo giỏ hàng mới
      const newCart = {
        userId: userId.toString(),
        items: [
          {
            productId,
            quantity,
            productName: product.productName,
            price: product.price,
            image: Array.isArray(product.images) ? product.images[0] : product.images
          }
        ],
        updatedAt: Date.now()
      }
      await db.collection(CART_COLLECTION_NAME).insertOne(newCart)
    }

    console.log('addToCart: Đã thêm sản phẩm vào giỏ hàng:', { userId, productId, quantity })
    return { message: 'Đã thêm sản phẩm vào giỏ hàng' }
  } catch (error) {
    console.error('Error in addToCart:', error.message, error.stack)
    throw new Error(error.message)
  }
}

const getCart = async (userId) => {
  try {
    // if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    //   console.error('getCart: userId không hợp lệ:', userId);
    //   throw new Error('userId không hợp lệ');
    // }

    const db = await GET_DB()
    const cart = await db.collection(CART_COLLECTION_NAME).findOne({ userId: userId.toString() })
    return cart
  } catch (error) {
    console.error('Error in getCart:', error.message, error.stack)
    throw new Error(error.message)
  }

  // if (!cart) {
  //   console.log('getCart: Không tìm thấy giỏ hàng, trả về mảng rỗng cho userId:', userId);
  //   return [];
  // }

  //   // Kiểm tra và làm sạch items
  //   let validItems = [];
  //   if (!Array.isArray(cart.items)) {
  //     console.warn('getCart: Dữ liệu items không hợp lệ, đặt lại thành mảng rỗng:', cart.items);
  //     validItems = [];
  //   } else {
  //     for (const item of cart.items) {
  //       if (!item.productId || typeof item.productId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(item.productId)) {
  //         console.warn('getCart: Bỏ qua productId không hợp lệ:', item.productId);
  //         continue;
  //       }
  //       try {
  //         const product = await db.collection(PRODUCT_COLLECTION_NAME).findOne({ _id: new ObjectId(item.productId) });
  //         if (product) {
  //           validItems.push({
  //             productId: item.productId,
  //             quantity: item.quantity,
  //             productName: product.productName || item.productName || 'Unknown Product',
  //             price: product.price || item.price || 0,
  //             image: Array.isArray(product.images) ? product.images[0] : (product.images || item.image || 'https://via.placeholder.com/150'),
  //           });
  //         } else {
  //           console.warn('getCart: Sản phẩm không tồn tại trong products, bỏ qua:', item.productId);
  //         }
  //       } catch (error) {
  //         console.error('getCart: Lỗi khi lấy chi tiết sản phẩm:', error.message, { productId: item.productId });
  //       }
  //     }
  //   }

  //   // Cập nhật giỏ hàng với items hợp lệ
  //   await db.collection(CART_COLLECTION_NAME).updateOne(
  //     { userId: userId.toString() },
  //     { $set: { items: validItems, updatedAt: Date.now() } }
  //   );

  //   console.log('getCart: Trả về mảng items:', validItems);
  //   return validItems;
  // } catch (error) {
  //   console.error('Error in getCart:', error.message, error.stack);
  //   throw new Error(error.message);
  // }
}

const updateCartItem = async (userId, productId, quantity) => {
  try {
    const { error } = Joi.object({
      userId: Joi.string().required(),
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required()
    }).validate({ userId, productId, quantity })
    if (error) {
      console.error('updateCartItem: Validation error:', error.details)
      throw new Error(error.details[0].message)
    }

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error('updateCartItem: userId không hợp lệ:', userId)
      throw new Error('userId không hợp lệ')
    }

    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
      console.error('updateCartItem: productId không hợp lệ:', productId)
      throw new Error('productId không hợp lệ')
    }

    const db = await GET_DB()
    const product = await db.collection(PRODUCT_COLLECTION_NAME).findOne({ _id: new ObjectId(productId) })
    if (!product) {
      console.error('updateCartItem: Sản phẩm không tồn tại:', productId)
      throw new Error('Sản phẩm không tồn tại')
    }

    const result = await db.collection(CART_COLLECTION_NAME).updateOne(
      { userId: userId.toString(), 'items.productId': productId },
      {
        $set: {
          'items.$.quantity': quantity,
          'items.$.productName': product.productName,
          'items.$.price': product.price,
          'items.$.image': Array.isArray(product.images) ? product.images[0] : product.images,
          updatedAt: Date.now()
        }
      }
    )

    if (result.matchedCount === 0) {
      throw new Error('Sản phẩm không có trong giỏ hàng')
    }

    console.log('updateCartItem: Đã cập nhật số lượng:', { userId, productId, quantity })
    return { message: 'Đã cập nhật số lượng sản phẩm' }
  } catch (error) {
    console.error('Error in updateCartItem:', error.message, error.stack)
    throw new Error(error.message)
  }
}

const removeCartItem = async (userId, productId) => {
  try {
    const { error } = Joi.object({
      userId: Joi.string().required(),
      productId: Joi.string().required()
    }).validate({ userId, productId })
    if (error) {
      console.error('removeCartItem: Validation error:', error.details)
      throw new Error(error.details[0].message)
    }

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error('removeCartItem: userId không hợp lệ:', userId)
      throw new Error('userId không hợp lệ')
    }

    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
      console.error('removeCartItem: productId không hợp lệ:', productId)
      throw new Error('productId không hợp lệ')
    }

    const db = await GET_DB()
    const result = await db.collection(CART_COLLECTION_NAME).updateOne(
      { userId: userId.toString() },
      { $pull: { items: { productId } }, $set: { updatedAt: Date.now() } }
    )

    if (result.matchedCount === 0) {
      throw new Error('Sản phẩm không có trong giỏ hàng')
    }

    console.log('removeCartItem: Đã xóa sản phẩm:', { userId, productId })
    return { message: 'Đã xóa sản phẩm khỏi giỏ hàng' }
  } catch (error) {
    console.error('Error in removeCartItem:', error.message, error.stack)
    throw new Error(error.message)
  }
}
const searchProducts = async (searchTerm) => {
  try {
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
      console.error('searchProducts: Invalid search term:', searchTerm)
      throw new Error('Từ khóa tìm kiếm không hợp lệ')
    }

    const regex = new RegExp(searchTerm.trim(), 'i') // Case-insensitive regex
    const products = await GET_DB()
      .collection(PRODUCT_COLLECTION_NAME)
      .find({
        $or: [
          { productName: { $regex: regex } },
          { type: { $regex: regex } }
        ],
        _destroy: false // Exclude deleted products
      })
      .toArray()

    console.log('searchProducts: Found products:', products)
    return products
  } catch (error) {
    console.error('Error in searchProducts:', error.message, error.stack)
    throw new Error(error.message)
  }
}

const updateProduct = async (productId, updateData) => {
  try {
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      throw new Error('productId không hợp lệ')
    }

    const db = await GET_DB()
    const product = await db.collection(PRODUCT_COLLECTION_NAME).findOne({
      _id: new ObjectId(productId)
    })

    if (!product) {
      throw new Error('Sản phẩm không tồn tại')
    }

    // Create validation object without _id
    const validationObject = {
      productName: updateData.productName,
      description: updateData.description,
      type: updateData.type,
      price: Number(updateData.price),
      quantity: Number(updateData.quantity),
      images: updateData.images || product.images,
      createdAt: product.createdAt,
      updatedAt: new Date(),
      _destroy: product._destroy
    }

    console.log('Validation object:', validationObject)

    // Validate update data
    const { error } = PRODUCT_COLLECTION_SCHEMA.validate(validationObject)

    if (error) {
      console.error('Validation error:', error.details)
      throw new Error(`Validation failed: ${error.details[0].message}`)
    }

    // Prepare update data
    const updateFields = {
      productName: updateData.productName,
      description: updateData.description,
      type: updateData.type,
      price: Number(updateData.price),
      quantity: Number(updateData.quantity),
      updatedAt: new Date()
    }

    // Only update images if new ones are provided
    if (updateData.images) {
      updateFields.images = updateData.images
    }

    console.log('Update fields:', updateFields)

    // Update the product
    const result = await db.collection(PRODUCT_COLLECTION_NAME).updateOne(
      { _id: new ObjectId(productId) },
      { $set: updateFields }
    )

    console.log('Update result:', result)

    if (result.matchedCount === 0) {
      throw new Error('Không tìm thấy sản phẩm để cập nhật')
    }

    if (result.modifiedCount === 0) {
      throw new Error('Không có thay đổi nào được thực hiện')
    }

    // Fetch and return the updated product
    const updatedProduct = await db.collection(PRODUCT_COLLECTION_NAME).findOne({
      _id: new ObjectId(productId)
    })

    if (!updatedProduct) {
      throw new Error('Không thể lấy thông tin sản phẩm sau khi cập nhật')
    }

    return updatedProduct
  } catch (error) {
    console.error('Error in updateProduct:', error.message, error.stack)
    throw error
  }
}

const deleteProduct = async (productId) => {
  try {
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      throw new Error('productId không hợp lệ')
    }

    const db = await GET_DB()
    const product = await db.collection(PRODUCT_COLLECTION_NAME).findOne({
      _id: new ObjectId(productId)
    })

    if (!product) {
      throw new Error('Sản phẩm không tồn tại')
    }

    // Soft delete by setting _destroy flag
    const result = await db.collection(PRODUCT_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(productId) },
      { $set: { _destroy: true, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )

    if (!result.value) {
      throw new Error('Không thể xóa sản phẩm')
    }

    return result.value
  } catch (error) {
    console.error('Error in deleteProduct:', error.message, error.stack)
    throw error
  }
}

const addProductType = async (typeData) => {
  try {
    const { error, value } = PRODUCT_TYPE_SCHEMA.validate(typeData)
    if (error) {
      console.error('Joi validation error:', error.details)
      throw new Error(error.details[0].message)
    }

    const db = await GET_DB()
    
    // Check if type already exists
    const existingType = await db.collection(PRODUCT_TYPES_COLLECTION_NAME).findOne({
      typeName: value.typeName,
      _destroy: false
    })

    if (existingType) {
      throw new Error('Loại sản phẩm đã tồn tại')
    }

    const result = await db.collection(PRODUCT_TYPES_COLLECTION_NAME).insertOne(value)
    return result
  } catch (error) {
    console.error('Error in addProductType:', error.message, error.stack)
    throw error
  }
}

const getProductTypes = async () => {
  try {
    const db = await GET_DB()
    const types = await db.collection(PRODUCT_TYPES_COLLECTION_NAME)
      .find({ _destroy: false })
      .toArray()
    return types
  } catch (error) {
    console.error('Error in getProductTypes:', error.message, error.stack)
    throw error
  }
}

const applyDiscount = async (productId, discountPercentage) => {
  try {
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      throw new Error('productId không hợp lệ')
    }

    if (!discountPercentage || discountPercentage < 1 || discountPercentage > 100) {
      throw new Error('Phần trăm giảm giá phải từ 1 đến 100')
    }

    const db = await GET_DB()
    const product = await db.collection(PRODUCT_COLLECTION_NAME).findOne({
      _id: new ObjectId(productId)
    })

    if (!product) {
      throw new Error('Sản phẩm không tồn tại')
    }

    // Calculate discounted price
    const originalPrice = product.price
    const discountedPrice = originalPrice * (1 - discountPercentage / 100)

    // Update product with discount
    const result = await db.collection(PRODUCT_COLLECTION_NAME).updateOne(
      { _id: new ObjectId(productId) },
      { 
        $set: { 
          discountPercentage,
          discountedPrice,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      throw new Error('Không tìm thấy sản phẩm để cập nhật')
    }

    // Fetch and return the updated product
    const updatedProduct = await db.collection(PRODUCT_COLLECTION_NAME).findOne({
      _id: new ObjectId(productId)
    })

    if (!updatedProduct) {
      throw new Error('Không thể lấy thông tin sản phẩm sau khi cập nhật')
    }

    return updatedProduct
  } catch (error) {
    console.error('Error in applyDiscount:', error.message, error.stack)
    throw error
  }
}

const removeDiscount = async (productId) => {
  try {
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      throw new Error('productId không hợp lệ');
    }

    const db = await GET_DB();
    const product = await db.collection(PRODUCT_COLLECTION_NAME).findOne({
      _id: new ObjectId(productId)
    });

    if (!product) {
      throw new Error('Sản phẩm không tồn tại');
    }

    const result = await db.collection(PRODUCT_COLLECTION_NAME).updateOne(
      { _id: new ObjectId(productId) },
      { 
        $set: { 
          discountPercentage: 0,
          discountedPrice: product.price, // Reset to original price
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      throw new Error('Không tìm thấy sản phẩm để cập nhật');
    }

    // Fetch and return the updated product
    const updatedProduct = await db.collection(PRODUCT_COLLECTION_NAME).findOne({
      _id: new ObjectId(productId)
    });

    if (!updatedProduct) {
      throw new Error('Không thể lấy thông tin sản phẩm sau khi cập nhật');
    }

    return updatedProduct;
  } catch (error) {
    console.error('Error in removeDiscount:', error.message, error.stack);
    throw new Error(error.message || 'Lỗi khi xóa giảm giá');
  }
};

export const productsModel = {
  PRODUCT_COLLECTION_NAME,
  PRODUCT_COLLECTION_SCHEMA,
  CART_COLLECTION_NAME,
  CART_COLLECTION_SCHEMA,
  PRODUCT_TYPES_COLLECTION_NAME,
  PRODUCT_TYPE_SCHEMA,
  createNew,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  searchProducts,
  addProductType,
  getProductTypes,
  applyDiscount,
  removeDiscount
}