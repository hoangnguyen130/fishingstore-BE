/* eslint-disable no-useless-catch */
import { postModel } from '~/models/postModel'

const createNew = async (reqBody) => {
  try {

    const createdPost = await postModel.createNew(reqBody)

    const getNewPost = await postModel.findOneById(createdPost.insertedId)

    return getNewPost

  } catch (error) {
    throw error
  }
}

const getPosts = async (reqBody) => {
  try {

    const posts = await postModel.getPosts(reqBody)

    return posts

  } catch (error) {
    throw error
  }
}
export const postService = {
  createNew,
  getPosts
}