import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { postRoute } from './postRoute'
import { authRoute } from './authRoute'
import { typeRoute } from './typeRoute'

const Router = express.Router()

Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use' })
})

Router.use('/posts', postRoute)

Router.use('/auth', authRoute)

Router.use('/types', typeRoute)

export const APIs_V1 = Router
