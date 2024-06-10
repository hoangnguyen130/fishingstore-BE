import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validator'

const MOVIE_COLLECTION_NAME = 'movies'
const MOVIE_COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  originName: Joi.string().required().min(3).max(255).trim().strict(),
  posterUrl: Joi.string().required().min(3).max(255).trim().strict(),

  detailMovieIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const createNew = async (data) => {
  try {
    const createdMovie = await GET_DB().collection(MOVIE_COLLECTION_NAME).insertOne(data)
    return createdMovie
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(MOVIE_COLLECTION_NAME).findOne({
      _id: id
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getMovies = async () => {
  try {
    // const result = await GET_DB().collection(MOVIE_COLLECTION_NAME).findOne({
    //   _id: id
    // })
    const result = await GET_DB().collection(MOVIE_COLLECTION_NAME).find({})
    console.log(result)
    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const movieModel = {
  MOVIE_COLLECTION_NAME,
  MOVIE_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getMovies
}