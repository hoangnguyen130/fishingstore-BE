import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { productsRoute } from './productsRoute'
import { authRoute } from './authRoute'
import { messagesRoute } from './messagesRoute'
import { contactRoute } from './contactRoute'
import { ordersRoute } from './ordersRoute'

const Router = express.Router()

Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use' })
})

Router.use('/products', productsRoute)

Router.use('/auth', authRoute)

Router.use('/messages', messagesRoute)

Router.use('/contacts', contactRoute)

Router.use('/orders', ordersRoute)


export const APIs_V1 = Router
