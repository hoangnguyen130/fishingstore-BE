/* eslint-disable no-console */
import { StatusCodes } from 'http-status-codes'
import { typeService } from '~/services/typeService'

// import ApiError from '~/utils/ApiError'


const createNew = async (req, res, next) => {
  try {

    const createMovie = await typeService.createNew(req.body)

    res.status(StatusCodes.CREATED).json({ createMovie })
  } catch (error) { next(error) }
}

const getMovies = async (req, res, next) => {
  try {

    const movies = await typeService.getMovies(req.body)

    res.status(StatusCodes.OK).json(movies)
  } catch (error) { next(error) }
}

export const typeController = {
  createNew,
  getMovies
}