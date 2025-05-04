import { GET_DB } from '~/config/mongodb'
import Joi from 'joi'

const CONTACT_COLLECTION_NAME = 'contacts'

const CONTACT_SCHEMA = Joi.object({
  userId: Joi.string().required(),
  contactId: Joi.string().required(),
  contactName: Joi.string().min(1).required(),
  avatar: Joi.string().uri().required(),
  lastMessage: Joi.string().optional()
})

// Hàm thêm một người vào danh sách liên lạc
export const addContact = async (userId, contactData) => {
  try {
    const db = await GET_DB()
    const collection = db.collection(CONTACT_COLLECTION_NAME)

    // Kiểm tra xem liên lạc đã tồn tại chưa
    const existingContact = await collection.findOne({
      userId,
      contactId: contactData.contactId
    })

    if (existingContact) {
      await collection.updateOne(
        { userId, contactId: contactData.contactId },
        { $set: { lastMessage: contactData.lastMessage } }
      )
      return { message: 'Contact already exists, updated last message' }
    }

    // Thêm liên lạc vào database
    const result = await collection.insertOne({
      ...contactData,
      userId
    })
    return result
  } catch (err) {
    console.error('Error adding contact:', err)
    throw err
  }
}

export const getContacts = async (userId) => {
  try {
    const db = await GET_DB()
    const collection = db.collection(CONTACT_COLLECTION_NAME)

    // Tìm các liên lạc của người dùng trong database
    const contacts = await collection.find({ userId }).toArray()

    return contacts
  } catch (err) {
    console.error('Error fetching contacts:', err)
    throw err
  }
}

export const contactModel = {
  CONTACT_COLLECTION_NAME,
  CONTACT_SCHEMA
}
