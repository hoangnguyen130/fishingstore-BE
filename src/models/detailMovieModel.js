import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js'

const DETAIL_MOVIE_COLLECTION_NAME = 'detailMovie'
const DETAIL_MOVIE_COLLECTION_SCHEMA = Joi.object({
  moviesId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  name: Joi.string().required().min(3).max(50).trim().strict(),
  originName: Joi.string().required().min(3).max(255).trim().strict(),
  content: Joi.string().required().min(3).max(255).trim().strict(),
  thumbUrl: Joi.string().required().min(3).max(255).trim().strict(),
  type: Joi.string().required().min(3).max(255).trim().strict(),
  category: Joi.string().required().min(3).max(255).trim().strict(),


  episodeIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

export const columnModel = {
  DETAIL_MOVIE_COLLECTION_NAME,
  DETAIL_MOVIE_COLLECTION_SCHEMA
}