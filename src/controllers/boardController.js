/* eslint-disable no-console */
import { StatusCodes } from 'http-status-codes'

// import ApiError from '~/utils/ApiError'


const createNew = async (req, res, next) => {
  try {
    console.log('req.body: ', req.body)
    console.log('req.query: ', req.query)
    console.log('req.params: ', req.params)

    // throw new ApiError(StatusCodes.BAD_GATEWAY, 'test error')

    res.status(StatusCodes.CREATED).json({ message: 'POST from validation: API create new board' })
  } catch (error) { next(error) }
}

export const boardController = {
  createNew
}