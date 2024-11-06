import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validator'

const POST_COLLECTION_NAME = 'posts'
const POST_COLLECTION_SCHEMA = Joi.object({
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
    const createdPost = await GET_DB().collection(POST_COLLECTION_NAME).insertOne(data)
    return createdPost
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(POST_COLLECTION_NAME).findOne({
      _id: id
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getPosts = async () => {
  try {
    // const result = await GET_DB().collection(MOVIE_COLLECTION_NAME).findOne({
    //   _id: id
    // })
    const result = await GET_DB().collection(POST_COLLECTION_NAME).find({})
    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const postModel = {
  POST_COLLECTION_NAME,
  POST_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getPosts
}