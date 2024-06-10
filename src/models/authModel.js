import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'

const AUTH_COLLECTION_NAME = 'auth'
const AUTH_COLLECTION_SCHEMA = Joi.object({
  email: Joi.string().required().min(3).max(50).trim().strict().email(),
  password: Joi.string().required().min(3).max(255).trim().strict(),
  userName: Joi.string().required().min(3).max(255).trim().strict(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const register = async (data) => {
  try {
    const createdUser = await GET_DB().collection(AUTH_COLLECTION_NAME).insertOne(data)
    return createdUser
  } catch (error) {
    throw new Error(error)
  }
}

const check = async ({ email }) => {
  try {
    const result = await GET_DB().collection(AUTH_COLLECTION_NAME).findOne({
      email: email
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}


export const authModel = {
  AUTH_COLLECTION_NAME,
  AUTH_COLLECTION_SCHEMA,
  register,
  check
}