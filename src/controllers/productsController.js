/* eslint-disable no-unused-vars */
/* eslint-disable comma-dangle */
/* eslint-disable no-console */
import { StatusCodes } from 'http-status-codes'
import { productsModel } from '~/models/productsModel'

const createNew = async (req, res, _next) => {
  try {
    const { productName, description, type, price, quantity } = req.body

    if (!productName || !description || !type || !price || !quantity) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' })
    }

    if (!req.files || req.files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Vui lòng upload ít nhất một ảnh' })
    }

    const images = req.files.map((file) => `http://localhost:3001/uploads/${file.filename}`)

    const productData = {
      productName,
      description,
      type,
      price: Number(price),
      quantity: Number(quantity),
      images
    }

    const modifiedReq = { ...req, body: productData }
    const result = await productsModel.createNew(modifiedReq, res)

    return result
  } catch (error) {
    console.error('Error in createNew:', error.message, error.stack)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi tạo sản phẩm', error: error.message })
  }
}

const getProducts = async (req, res, _next) => {
  try {
    const products = await productsModel.getProducts()
    
    // Thêm thông tin giá, ảnh và tên sản phẩm
    const productsWithPrices = products.map(product => {
      const originalPrice = product.price
      const discountPercentage = product.discountPercentage || 0
      const discountedPrice = discountPercentage > 0 
        ? originalPrice * (1 - discountPercentage / 100) 
        : originalPrice

      return {
        ...product,
        productId: product._id,
        productName: product.productName,
        originalPrice,
        discountPercentage,
        discountedPrice,
        image: Array.isArray(product.images) ? product.images[0] : product.images,
        images: product.images
      }
    })

    return res.status(200).json(productsWithPrices)
  } catch (error) {
    console.error('Error in getProducts:', error)
    return res.status(500).json({ message: error.message })
  }
}

const getProductById = async (req, res, _next) => {
  try {
    const { id } = req.params
    const product = await productsModel.getProductById(id)
    
    // Thêm thông tin giá, ảnh và tên sản phẩm
    const originalPrice = product.price
    const discountPercentage = product.discountPercentage || 0
    const discountedPrice = discountPercentage > 0 
      ? originalPrice * (1 - discountPercentage / 100) 
      : originalPrice

    const productWithPrices = {
      ...product,
      productId: product._id,
      productName: product.productName,
      originalPrice,
      discountPercentage,
      discountedPrice,
      image: Array.isArray(product.images) ? product.images[0] : product.images,
      images: product.images
    }

    return res.status(200).json({ product: productWithPrices })
  } catch (error) {
    console.error('Error in getProductById:', error)
    return res.status(500).json({ message: error.message })
  }
}

const addToCart = async (req, res, _next) => {
  try {
    const { productId, quantity } = req.body

    if (!productId || !quantity || quantity < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Vui lòng cung cấp productId và quantity hợp lệ' })
    }

    const userId = req.userId
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để thêm vào giỏ hàng' })
    }

    const result = await productsModel.addToCart(userId, productId, quantity)
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    if (error.message.includes('productId không hợp lệ') || error.message.includes('Sản phẩm không tồn tại')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi thêm vào giỏ hàng', error: error.message })
  }
}

const getCart = async (req, res, _next) => {
  try {
    const userId = req.userId
    if (!userId) {
      console.error('productsController.getCart: Thiếu userId trong yêu cầu')
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để xem giỏ hàng' })
    }
    console.log('productsController.getCart: Gọi getCart với userId:', userId)
    const cart = await productsModel.getCart(userId)
    return res.status(StatusCodes.OK).json(cart)
  } catch (error) {
    console.error('Error in getCart:', error.message, error.stack)
    if (error.message.includes('userId không hợp lệ')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'userId không hợp lệ trong yêu cầu' })
    }
    if (error.message.includes('Dữ liệu giỏ hàng không hợp lệ')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Dữ liệu giỏ hàng không hợp lệ, đã làm sạch giỏ hàng' })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi lấy giỏ hàng', error: error.message })
  }
}

const updateCartItem = async (req, res, _next) => {
  try {
    const { productId, quantity } = req.body

    if (!productId || !quantity || quantity < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Vui lòng cung cấp productId và quantity hợp lệ' })
    }

    const userId = req.userId
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để cập nhật giỏ hàng' })
    }

    console.log('productsController.updateCartItem: Gọi updateCartItem:', { userId, productId, quantity })
    const result = await productsModel.updateCartItem(userId, productId, quantity)
    console.log('productsController.updateCartItem: Kết quả:', result)
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    console.error('Error in updateCartItem:', error.message, error.stack)
    if (error.message.includes('productId không hợp lệ') || error.message.includes('Sản phẩm không tồn tại')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi cập nhật giỏ hàng', error: error.message })
  }
}

const removeCartItem = async (req, res, _next) => {
  try {
    const { productId } = req.body

    if (!productId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Vui lòng cung cấp productId hợp lệ' })
    }

    const userId = req.userId
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng' })
    }

    console.log('productsController.removeCartItem: Gọi removeCartItem:', { userId, productId })
    const result = await productsModel.removeCartItem(userId, productId)
    console.log('productsController.removeCartItem: Kết quả:', result)
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    console.error('Error in removeCartItem:', error.message, error.stack)
    if (error.message.includes('productId không hợp lệ') || error.message.includes('Sản phẩm không tồn tại')) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server khi xóa sản phẩm khỏi giỏ hàng', error: error.message })
  }
}

const searchProducts = async (req, res, _next) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        message: 'Vui lòng nhập từ khóa tìm kiếm' 
      });
    }

    const searchTerm = q.trim();
    
    // Kiểm tra độ dài từ khóa

    if (searchTerm.length > 50) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        message: 'Từ khóa tìm kiếm không được vượt quá 50 ký tự' 
      });
    }

    // Kiểm tra nếu là mã sản phẩm (ObjectId)
    let products;
    if (/^[0-9a-fA-F]{24}$/.test(searchTerm)) {
      try {
        const product = await productsModel.getProductById(searchTerm);
        products = product ? [product] : [];
      } catch (error) {
        products = [];
      }
    } else {
      // Tìm kiếm theo tên hoặc loại sản phẩm
      products = await productsModel.searchProducts(searchTerm);
    }
    
    // Thêm thông tin giá, ảnh và tên sản phẩm
    const productsWithPrices = products.map(product => {
      const originalPrice = product.price;
      const discountPercentage = product.discountPercentage || 0;
      const discountedPrice = discountPercentage > 0 
        ? originalPrice * (1 - discountPercentage / 100) 
        : originalPrice;

      return {
        ...product,
        productId: product._id,
        productName: product.productName,
        originalPrice,
        discountPercentage,
        discountedPrice,
        image: Array.isArray(product.images) ? product.images[0] : product.images,
        images: product.images
      };
    });

    if (productsWithPrices.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        message: 'Không tìm thấy sản phẩm phù hợp',
        data: [] 
      });
    }

    return res.status(StatusCodes.OK).json({ 
      message: 'Tìm kiếm thành công',
      data: productsWithPrices 
    });
  } catch (error) {
    console.error('Error in searchProducts:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: 'Lỗi server khi tìm kiếm sản phẩm', 
      error: error.message 
    });
  }
}

const updateProduct = async (req, res, _next) => {
  try {
    const { id } = req.params
    const updateData = req.body
    const updatedProduct = await productsModel.updateProduct(id, updateData)
    
    // Thêm thông tin giá, ảnh và tên sản phẩm
    const originalPrice = updatedProduct.price
    const discountPercentage = updatedProduct.discountPercentage || 0
    const discountedPrice = discountPercentage > 0 
      ? originalPrice * (1 - discountPercentage / 100) 
      : originalPrice

    const productWithPrices = {
      ...updatedProduct,
      productId: updatedProduct._id,
      productName: updatedProduct.productName,
      originalPrice,
      discountPercentage,
      discountedPrice,
      image: Array.isArray(updatedProduct.images) ? updatedProduct.images[0] : updatedProduct.images,
      images: updatedProduct.images
    }

    return res.status(200).json({ 
      message: 'Cập nhật sản phẩm thành công',
      product: productWithPrices 
    })
  } catch (error) {
    console.error('Error in updateProduct:', error)
    return res.status(500).json({ message: error.message })
  }
}

const deleteProduct = async (req, res, _next) => {
  try {
    const { id } = req.params

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'ID sản phẩm không hợp lệ' })
    }

    const result = await productsModel.deleteProduct(id)
    return res.status(StatusCodes.OK).json({
      message: 'Xóa sản phẩm thành công',
      data: result
    })
  } catch (error) {
    console.error('Error in deleteProduct:', error.message, error.stack)
    if (error.message.includes('Sản phẩm không tồn tại')) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Sản phẩm không tồn tại' })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi server khi xóa sản phẩm',
      error: error.message
    })
  }
}

const addProductType = async (req, res, _next) => {
  try {
    const { typeName, description } = req.body

    if (!typeName) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Vui lòng cung cấp tên loại sản phẩm' })
    }

    const typeData = {
      typeName,
      description: description || ''
    }

    const result = await productsModel.addProductType(typeData)
    return res.status(StatusCodes.CREATED).json({
      message: 'Thêm loại sản phẩm thành công',
      data: result
    })
  } catch (error) {
    console.error('Error in addProductType:', error.message, error.stack)
    if (error.message.includes('Loại sản phẩm đã tồn tại')) {
      return res.status(StatusCodes.CONFLICT).json({ message: error.message })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: 'Lỗi server khi thêm loại sản phẩm', 
      error: error.message 
    })
  }
}

const getProductTypes = async (req, res, _next) => {
  try {
    const types = await productsModel.getProductTypes()
    return res.status(StatusCodes.OK).json({
      message: 'Lấy danh sách loại sản phẩm thành công',
      data: types
    })
  } catch (error) {
    console.error('Error in getProductTypes:', error.message, error.stack)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: 'Lỗi server khi lấy danh sách loại sản phẩm', 
      error: error.message 
    })
  }
}

const applyDiscount = async (req, res) => {
  try {
    const { id } = req.params
    const { discountPercentage } = req.body
    const updatedProduct = await productsModel.applyDiscount(id, discountPercentage)
    
    // Thêm thông tin giá, ảnh và tên sản phẩm
    const originalPrice = updatedProduct.price
    const discountedPrice = originalPrice * (1 - discountPercentage / 100)

    const productWithPrices = {
      ...updatedProduct,
      productId: updatedProduct._id,
      productName: updatedProduct.productName,
      originalPrice,
      discountPercentage,
      discountedPrice,
      image: Array.isArray(updatedProduct.images) ? updatedProduct.images[0] : updatedProduct.images,
      images: updatedProduct.images
    }

    return res.status(200).json({ 
      message: 'Áp dụng giảm giá thành công',
      product: productWithPrices 
    })
  } catch (error) {
    console.error('Error in applyDiscount:', error)
    return res.status(500).json({ message: error.message })
  }
}

const removeDiscount = async (req, res) => {
  try {
    const { id } = req.params
    const updatedProduct = await productsModel.removeDiscount(id)
    
    // Thêm thông tin giá, ảnh và tên sản phẩm
    const originalPrice = updatedProduct.price
    const discountPercentage = 0
    const discountedPrice = originalPrice

    const productWithPrices = {
      ...updatedProduct,
      productId: updatedProduct._id,
      productName: updatedProduct.productName,
      originalPrice,
      discountPercentage,
      discountedPrice,
      image: Array.isArray(updatedProduct.images) ? updatedProduct.images[0] : updatedProduct.images,
      images: updatedProduct.images
    }

    return res.status(200).json({ 
      message: 'Xóa giảm giá thành công',
      product: productWithPrices 
    })
  } catch (error) {
    console.error('Error in removeDiscount:', error)
    return res.status(500).json({ message: error.message })
  }
}

export const productsController = {
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