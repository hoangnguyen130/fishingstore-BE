import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { authController } from '~/controllers/authController'
import { authValidation } from '~/validations/authValidation'


const Router = express.Router()

Router.route('/register')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({ message: 'GET: API get list auths' })
  })
//   .get(authController.getMovies)
  .post(authValidation.register, authController.register)
Router.route('/login')
  .post(authValidation.login, authController.login)
export const authRoute = Router