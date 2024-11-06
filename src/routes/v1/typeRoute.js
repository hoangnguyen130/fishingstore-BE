import express from 'express'
// import { StatusCodes } from 'http-status-codes'
import { typeController } from '~/controllers/typeController'
import { typeValidation } from '~/validations/typeValidation'


const Router = express.Router()

Router.route('/')
//   .get((req, res) => {
//     res.status(StatusCodes.OK)
//   })

  .get(typeController.getPosts)
  .post(typeValidation.createNew, typeController.createNew)

export const typeRoute = Router