// /* eslint-disable no-useless-catch */
// import { productsModel } from '~/models/productsModel'

// const createNew = async (req) => {
//   try {

//     const createdProduct = await productsModel.createNew(req)

//     const getNewProduct = await productsModel.findOneById(createdProduct.insertedId)

//     return getNewProduct

//   } catch (error) {
//     throw error
//   }
// }

// const getProducts = async () => {
//   try {

//     const products = await productsModel.getProducts()

//     return products

//   } catch (error) {
//     throw error
//   }
// }
// export const productsService = {
//   createNew,
//   getProducts
// }