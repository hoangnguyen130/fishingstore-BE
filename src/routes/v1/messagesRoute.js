import express from 'express'
import { 
  postMessage, 
  fetchMessages, 
  getUnreadCount, 
  getAdminInfo,
  getAdminChatUsers 
} from '~/controllers/messagesController'

const Router = express.Router()

// Admin routes
Router.get('/admin', getAdminInfo)
Router.get('/admin-chat/:adminId', getAdminChatUsers)

// Message routes
Router.post('/', postMessage)
Router.get('/:userId1/:userId2', fetchMessages)
Router.get('/unread/:userId', getUnreadCount)

export const messagesRoute = Router
