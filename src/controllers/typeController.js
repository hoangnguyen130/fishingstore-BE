/* eslint-disable no-console */
import { StatusCodes } from 'http-status-codes'
import { typeService } from '~/services/typeService'

// import ApiError from '~/utils/ApiError'


const createNew = async (req, res, next) => {
  try {

    const createPost = await typeService.createNew(req.body)

    res.status(StatusCodes.CREATED).json({ createPost })
  } catch (error) { next(error) }
}

const getPosts = async (req, res, next) => {
  try {

    const posts = await typeService.getPosts(req.body)

    res.status(StatusCodes.OK).json(posts)
  } catch (error) { next(error) }
}

export const typeController = {
  createNew,
  getPosts
}