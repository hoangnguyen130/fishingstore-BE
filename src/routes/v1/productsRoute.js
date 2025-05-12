import express from 'express'
import { productsController } from '~/controllers/productsController'
import upload from '~/middlewares/multerMiddleware'
import authMiddleware from '~/middlewares/authMiddlewares'

const Router = express.Router()

Router.route('/create')
  .post(upload.array('images', 5), productsController.createNew)

Router.route('/get')
  .get(productsController.getProducts)

Router.route('/get/:id')
  .get(productsController.getProductById)

Router.route('/update/:id')
  .put(authMiddleware, upload.array('images', 5), productsController.updateProduct)

Router.route('/delete/:id')
  .delete(authMiddleware, productsController.deleteProduct)

Router.route('/cart/add')
  .post(authMiddleware, productsController.addToCart)

Router.route('/cart')
  .get(authMiddleware, productsController.getCart)

Router.route('/cart/update')
  .put(authMiddleware, productsController.updateCartItem)

Router.route('/cart/remove')
  .delete(authMiddleware, productsController.removeCartItem)

Router.route('/search')
  .get(productsController.searchProducts)

export const productsRoute = Router