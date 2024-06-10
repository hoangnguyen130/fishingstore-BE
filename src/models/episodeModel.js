import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js'

const EPISODE_COLLECTION_NAME = 'episode'
const EPISODE_COLLECTION_SCHEMA = Joi.object({
  moviesId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  detailMovieId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),

  name: Joi.string().required().min(3).max(50).trim().strict(),
  videoUrl: Joi.string().required().min(3).max(255).trim().strict(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

export const movieModel = {
  EPISODE_COLLECTION_NAME,
  EPISODE_COLLECTION_SCHEMA
}