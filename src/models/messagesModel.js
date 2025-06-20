import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'

const MESSAGE_COLLECTION_NAME = 'messages'
const USER_COLLECTION_NAME = 'users'

const MESSAGE_COLLECTION_SCHEMA = Joi.object({
  id_user1: Joi.string().trim().required(),
  id_user2: Joi.string().trim().required(),
  content: Joi.array().items(
    Joi.object({
      sender: Joi.string().required(),
      text: Joi.string().min(1).required(),
      timestamp: Joi.string().isoDate().required(),
      read: Joi.boolean().default(false)
    }).required()
  ).min(1).required(),
  lastUpdated: Joi.string().isoDate().required()
})

export const messengersModel = {
  MESSAGE_COLLECTION_NAME,
  MESSAGE_COLLECTION_SCHEMA
}

// Function to check if user is admin
export const isAdmin = async (userId) => {
  try {
    const db = await GET_DB()
    const user = await db.collection(USER_COLLECTION_NAME).findOne({ _id: new ObjectId(userId) })
    return user?.role === 'admin'
  } catch (err) {
    console.error('Error checking admin status:', err)
    throw err
  }
}

// Function to get admin ID
export const getAdminId = async () => {
  try {
    const db = await GET_DB()
    const admin = await db.collection(USER_COLLECTION_NAME).findOne({ role: 'admin' })
    return admin?._id.toString()
  } catch (err) {
    console.error('Error getting admin ID:', err)
    throw err
  }
}

export const insertMessage = async (message) => {
  try {
    // Check if sender is user and receiver is admin
    const isSenderAdmin = await isAdmin(message.id_user1)
    const isReceiverAdmin = await isAdmin(message.id_user2)

    if (!isSenderAdmin && !isReceiverAdmin) {
      throw new Error('Messages can only be sent between users and admin')
    }

    const messageWithTimestamp = {
      ...message,
      lastUpdated: new Date().toISOString()
    }
    
    const { error, value } = MESSAGE_COLLECTION_SCHEMA.validate(messageWithTimestamp)
    if (error) {
      throw new Error(`Validation failed: ${error.message}`)
    }

    const db = await GET_DB()
    const collection = db.collection(MESSAGE_COLLECTION_NAME)

    const result = await collection.insertOne(value)
    return { ...value, _id: result.insertedId }
  } catch (err) {
    console.error('Error inserting message:', err)
    throw err
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
    }).sort({ lastUpdated: -1 }).toArray()

    return messages
  } catch (err) {
    console.error('Error retrieving messages:', err)
    throw err
  }
}

export const markMessagesAsRead = async (userId1, userId2) => {
  try {
    const db = await GET_DB()
    const collection = db.collection(MESSAGE_COLLECTION_NAME)

    const result = await collection.updateMany(
      {
        id_user1: userId2,
        id_user2: userId1,
        'content.read': false
      },
      {
        $set: { 'content.$[].read': true }
      }
    )

    return result
  } catch (err) {
    console.error('Error marking messages as read:', err)
    throw err
  }
}

export const getUnreadMessageCount = async (userId) => {
  try {
    const db = await GET_DB()
    const collection = db.collection(MESSAGE_COLLECTION_NAME)

    const result = await collection.aggregate([
      {
        $match: {
          id_user2: userId,
          'content.read': false
        }
      },
      {
        $project: {
          unreadCount: {
            $size: {
              $filter: {
                input: '$content',
                as: 'msg',
                cond: { $eq: ['$$msg.read', false] }
              }
            }
          }
        }
      }
    ]).toArray()

    return result.reduce((total, item) => total + item.unreadCount, 0)
  } catch (err) {
    console.error('Error getting unread message count:', err)
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

// Get users who have chatted with admin
export const getUsersChattedWithAdmin = async (adminId) => {
  try {
    const db = await GET_DB()
    const messagesCollection = db.collection(MESSAGE_COLLECTION_NAME)
    const usersCollection = db.collection(USER_COLLECTION_NAME)

    // Get all messages where admin is either sender or receiver
    const messages = await messagesCollection.find({
      $or: [
        { id_user1: adminId },
        { id_user2: adminId }
      ]
    }).toArray()

    // Extract unique user IDs who have chatted with admin
    const userIds = new Set()
    messages.forEach(message => {
      if (message.id_user1 === adminId) {
        userIds.add(message.id_user2)
      } else {
        userIds.add(message.id_user1)
      }
    })

    // Get user details for each user ID
    const users = await usersCollection.find({
      _id: { $in: Array.from(userIds).map(id => new ObjectId(id)) }
    }).toArray()

    // Add last message and unread count for each user
    const usersWithChatInfo = await Promise.all(users.map(async (user) => {
      // Get the last message between admin and this user
      const lastMessage = await messagesCollection.findOne(
        {
          $or: [
            { id_user1: adminId, id_user2: user._id.toString() },
            { id_user1: user._id.toString(), id_user2: adminId }
          ]
        },
        { 
          sort: { lastUpdated: -1 }
        }
      )

      // Count unread messages from this user to admin
      const unreadCount = await messagesCollection.aggregate([
        {
          $match: {
            id_user1: user._id.toString(),
            id_user2: adminId
          }
        },
        {
          $unwind: '$content'
        },
        {
          $match: {
            'content.read': false
          }
        },
        {
          $count: 'count'
        }
      ]).toArray()

      return {
        _id: user._id.toString(),
        userName: user.userName,
        email: user.email,
        lastMessage: lastMessage?.content[lastMessage.content.length - 1] || null,
        unreadCount: unreadCount[0]?.count || 0
      }
    }))

    // Sort users by last message timestamp
    return usersWithChatInfo.sort((a, b) => {
      if (!a.lastMessage) return 1
      if (!b.lastMessage) return -1
      return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
    })
  } catch (err) {
    console.error('Error getting users who chatted with admin:', err)
    throw err
  }
}


