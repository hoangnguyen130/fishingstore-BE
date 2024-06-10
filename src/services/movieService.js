/* eslint-disable no-useless-catch */
import { movieModel } from '~/models/movieModel'

const createNew = async (reqBody) => {
  try {

    const createdMovie = await movieModel.createNew(reqBody)

    const getNewMovie = await movieModel.findOneById(createdMovie.insertedId)

    return getNewMovie

  } catch (error) {
    throw error
  }
}

const getMovies = async (reqBody) => {
  try {

    const movies = await movieModel.getMovies(reqBody)

    return movies

  } catch (error) {
    throw error
  }
}
export const movieService = {
  createNew,
  getMovies
}