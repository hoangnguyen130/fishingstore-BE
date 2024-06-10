import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { movieRoute } from './movieRoute'
import { authRoute } from './authRoute'

const Router = express.Router()

Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use' })
})

Router.use('/movies', movieRoute)

Router.use('/auth', authRoute)

export const APIs_V1 = Router
