/* eslint-disable no-useless-catch */
import { typeModel } from '~/models/typeModel'

const createNew = async (reqBody) => {
  try {

    const createdMovie = await typeModel.createNew(reqBody)

    const getNewMovie = await typeModel.findOneById(createdMovie.insertedId)

    return getNewMovie

  } catch (error) {
    throw error
  }
}

const getPosts = async (reqBody) => {
  try {

    const types = await typeModel.getPosts(reqBody)

    return types

  } catch (error) {
    throw error
  }
}
export const typeService = {
  createNew,
  getPosts
}