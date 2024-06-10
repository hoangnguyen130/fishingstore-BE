/* eslint-disable no-useless-catch */
import { authModel } from '~/models/authModel'

const register = async (reqBody) => {
  try {

    const createdUser = await authModel.register(reqBody)

    const getNewUser = await authModel.findOneById(createdUser.insertedId)

    return getNewUser

  } catch (error) {
    throw error
  }
}

const login = async (reqBody) => {
  try {

    const auths = await authModel.login(reqBody)

    return auths

  } catch (error) {
    throw error
  }
}
export const authService = {
  register,
  login
}