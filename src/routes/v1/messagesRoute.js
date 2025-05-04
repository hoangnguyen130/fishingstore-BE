import express from 'express'
import { postMessage, fetchMessages } from '~/controllers/messagesController'

const Router = express.Router()

// Route to post a message
Router.post('/', postMessage)

// Route to fetch messages between two users
Router.get('/:userId1/:userId2', fetchMessages)

export const messagesRoute = Router
