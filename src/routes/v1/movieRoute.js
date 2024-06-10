import express from 'express'
// import { StatusCodes } from 'http-status-codes'
import { movieController } from '~/controllers/movieController'
import { movieValidation } from '~/validations/movieValidation'


const Router = express.Router()

Router.route('/')
  // .get((req, res) => {
  //   res.status(StatusCodes.OK).json({ message: 'GET: API get list movies' })
  // })
  .get(movieController.getMovies)
  .post(movieValidation.createNew, movieController.createNew)

export const movieRoute = Router