/* eslint-disable no-console */
import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import ApiError from '~/utils/ApiError'

const register = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().required().min(3).max(50).trim().strict().email(),
    password: Joi.string().required().min(3).max(255).trim().strict(),
    userName: Joi.string().required().min(3).max(255).trim().strict()
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}
const login = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().required().min(3).max(50).trim().strict().email(),
    password: Joi.string().required().min(3).max(255).trim().strict()
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}
export const authValidation = {
  register,
  login
}