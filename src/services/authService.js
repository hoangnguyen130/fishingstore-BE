/* eslint-disable no-useless-catch */
import { authModel } from '~/models/authModel'
import bcrypt from 'bcryptjs'


const register = async (reqBody) => {
  try {
    const hashPass = await bcrypt.hash(reqBody.password, 10)

    const createdUser = await authModel.register({ ...reqBody, password: hashPass })

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