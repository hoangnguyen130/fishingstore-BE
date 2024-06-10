/* eslint-disable no-console */
import { StatusCodes } from 'http-status-codes'
import { movieService } from '~/services/movieService'

// import ApiError from '~/utils/ApiError'


const createNew = async (req, res, next) => {
  try {

    const createMovie = await movieService.createNew(req.body)

    res.status(StatusCodes.CREATED).json({ createMovie })
  } catch (error) { next(error) }
}

const getMovies = async (req, res, next) => {
  try {

    const movies = await movieService.getMovies(req.body)

    res.status(StatusCodes.OK).json({ movies })
  } catch (error) { next(error) }
}

export const movieController = {
  createNew,
  getMovies
}