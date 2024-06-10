/* eslint-disable no-console */
import { StatusCodes } from 'http-status-codes'
import { authModel } from '~/models/authModel'

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'


const register = async (req, res, next) => {
  try {
    const userExist = await authModel.check({ email: req.body.email })
    if (userExist) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Email da duoc dang ky'
      })
    }
    const hashPass = await bcrypt.hash(req.body.password, 10)
    const createUser = await authModel.register({ ...req.body, password: hashPass })

    req.body.password = undefined
    res.status(StatusCodes.CREATED).json({ createUser })
  } catch (error) { next(error) }
}

const login = async (req, res, next) => {
  try {
    const userExist = await authModel.check({ email: req.body.email })
    if (!userExist) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Nguoi dung khong ton tai'
      })
    }
    const comparePass = await bcrypt.compare(req.body.password, userExist.password)

    if (!comparePass) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Mat khau sai!'
      })
    }
    const token = jwt.sign({ _id: userExist._id }, 'hoangdeptrai')
    userExist.password = undefined
    res.status(StatusCodes.OK).json({
      user: userExist,
      token
    })
  } catch (error) { next(error) }
}

export const authController = {
  register,
  login
}