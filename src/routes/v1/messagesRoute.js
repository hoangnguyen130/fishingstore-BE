import express from 'express'
import { postMessage, fetchMessages, getUnreadCount, getAdminInfo } from '~/controllers/messagesController'

const Router = express.Router()

// Route to get admin info
Router.get('/admin', getAdminInfo)

// Route to post a message
Router.post('/', postMessage)

// Route to fetch messages between two users
Router.get('/:userId1/:userId2', fetchMessages)

// Route to get unread message count for a user
Router.get('/unread/:userId', getUnreadCount)

export const messagesRoute = Router
