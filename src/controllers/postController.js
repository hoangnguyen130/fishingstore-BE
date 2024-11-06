/* eslint-disable no-console */
import { StatusCodes } from 'http-status-codes'
import { postService } from '~/services/postService'

// import ApiError from '~/utils/ApiError'


const createNew = async (req, res, next) => {
  try {

    const createPost = await postService.createNew(req.body)

    res.status(StatusCodes.CREATED).json({ createPost })
  } catch (error) { next(error) }
}

const getPosts = async (req, res, next) => {
  try {

    const movies = await postService.getPosts(req.body)

    res.status(StatusCodes.OK).json({ movies })
  } catch (error) { next(error) }
}

export const postController = {
  createNew,
  getPosts
}