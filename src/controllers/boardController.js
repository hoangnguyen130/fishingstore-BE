/* eslint-disable no-console */
import { StatusCodes } from 'http-status-codes'
import { boardService } from '~/services/boardService'

// import ApiError from '~/utils/ApiError'


const createNew = async (req, res, next) => {
  try {
    console.log('req.body: ', req.body)
    console.log('req.query: ', req.query)
    console.log('req.params: ', req.params)

    const createBoard = await boardService.createNew(req.body)

    res.status(StatusCodes.CREATED).json({ createBoard })
  } catch (error) { next(error) }
}

export const boardController = {
  createNew
}