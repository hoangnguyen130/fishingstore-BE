/* eslint-disable no-console */
import { insertMessage, getMessages, markMessagesAsRead, getUnreadMessageCount, getAdminId } from '~/models/messagesModel'

export const postMessage = async (req, res) => {
  try {
    const message = req.body
    const result = await insertMessage(message)
    res.status(201).json(result)
  } catch (error) {
    console.error('Error posting message:', error)
    res.status(400).json({ error: error.message })
  }
}

export const fetchMessages = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params
    const messages = await getMessages(userId1, userId2)
    
    // Mark messages as read when fetching
    await markMessagesAsRead(userId1, userId2)
    
    res.status(200).json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(400).json({ error: error.message })
  }
}

export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params
    const count = await getUnreadMessageCount(userId)
    res.status(200).json({ unreadCount: count })
  } catch (error) {
    console.error('Error getting unread count:', error)
    res.status(400).json({ error: error.message })
  }
}

// Get admin ID for messaging
export const getAdminInfo = async (req, res) => {
  try {
    const adminId = await getAdminId()
    if (!adminId) {
      return res.status(404).json({ error: 'Admin not found' })
    }
    res.status(200).json({ adminId })
  } catch (error) {
    console.error('Error getting admin info:', error)
    res.status(400).json({ error: error.message })
  }
}
