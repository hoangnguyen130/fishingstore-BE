import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'

const MESSAGE_COLLECTION_NAME = 'messages'

const MESSAGE_COLLECTION_SCHEMA = Joi.object({
  id_user1: Joi.string().trim().required(),
  id_user2: Joi.string().trim().required(),
  content: Joi.array().items(
    Joi.object({
      sender: Joi.string().required(),
      text: Joi.string().min(1).required(),
      timestamp: Joi.string().isoDate().required()
    }).required()
  ).min(1).required()
})

export const messengersModel = {
  MESSAGE_COLLECTION_NAME,
  MESSAGE_COLLECTION_SCHEMA
}

export const insertMessage = async (message) => {
  try {
    // Validate the incoming message object
    const { error, value } = MESSAGE_COLLECTION_SCHEMA.validate(message)
    if (error) {
      throw new Error(`Validation failed: ${error.message}`)
    }

    // Get DB connection
    const db = await GET_DB()
    const collection = db.collection(MESSAGE_COLLECTION_NAME)

    // Insert the message into the database
    const result = await collection.insertOne(value)
    console.log('Message inserted successfully:', result)
    return result
  } catch (err) {
    console.error('Error inserting message:', err)
    throw err // Propagate error
  }
}

export const getMessages = async (userId1, userId2) => {
  try {
    const db = await GET_DB()
    const collection = db.collection(MESSAGE_COLLECTION_NAME)

    const messages = await collection.find({
      $or: [
        { id_user1: userId1, id_user2: userId2 },
        { id_user1: userId2, id_user2: userId1 }
      ]
    }).toArray()

    return messages
  } catch (err) {
    console.error('Error retrieving messages:', err)
    throw err
  }
}
export const getMessage = async (id) => {
  try {
    const result = await GET_DB().collection(MESSAGE_COLLECTION_NAME).findOne({
      _id: id
    })
    return result
  } catch (err) {
    console.log(err)
    throw err
  }
}


