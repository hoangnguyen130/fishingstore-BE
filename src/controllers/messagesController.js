/* eslint-disable no-console */
import { 
  insertMessage, 
  getMessages, 
  markMessagesAsRead, 
  getUnreadMessageCount, 
  getAdminId,
  getUsersChattedWithAdmin 
} from '~/models/messagesModel'

export const postMessage = async (req, res) => {
  try {
    const message = req.body
    const result = await insertMessage(message)
    res.status(201).json({
      success: true,
      message: 'Tin nhắn đã được gửi thành công',
      data: result
    })
  } catch (error) {
    console.error('Error posting message:', error)
    res.status(400).json({ 
      success: false,
      message: 'Không thể gửi tin nhắn',
      error: error.message 
    })
  }
}

export const fetchMessages = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params
    const messages = await getMessages(userId1, userId2)
    
    // Mark messages as read when fetching
    await markMessagesAsRead(userId1, userId2)
    
    res.status(200).json({
      success: true,
      data: {
        messages: messages.map(msg => ({
          id: msg._id,
          sender: msg.id_user1,
          receiver: msg.id_user2,
          content: msg.content,
          lastUpdated: msg.lastUpdated
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(400).json({ 
      success: false,
      message: 'Không thể lấy tin nhắn',
      error: error.message 
    })
  }
}

export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params
    const count = await getUnreadMessageCount(userId)
    res.status(200).json({ 
      success: true,
      data: { unreadCount: count }
    })
  } catch (error) {
    console.error('Error getting unread count:', error)
    res.status(400).json({ 
      success: false,
      message: 'Không thể lấy số tin nhắn chưa đọc',
      error: error.message 
    })
  }
}

// Get admin ID for messaging
export const getAdminInfo = async (req, res) => {
  try {
    const adminId = await getAdminId()
    if (!adminId) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy admin'
      })
    }
    res.status(200).json({ 
      success: true,
      data: { adminId }
    })
  } catch (error) {
    console.error('Error getting admin info:', error)
    res.status(400).json({ 
      success: false,
      message: 'Không thể lấy thông tin admin',
      error: error.message 
    })
  }
}

// Get users who have chatted with admin
export const getAdminChatUsers = async (req, res) => {
  try {
    const { adminId } = req.params
    const users = await getUsersChattedWithAdmin(adminId)
    
    res.status(200).json({
      success: true,
      data: { users }
    })
  } catch (error) {
    console.error('Error getting admin chat users:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách người dùng đã chat',
      error: error.message
    })
  }
}
