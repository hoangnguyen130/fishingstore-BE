import express from 'express'
import http from 'http'
import socketIo from 'socket.io'
import exitHook from 'async-exit-hook'
import { CLOSE_DB, CONNECT_DB } from './config/mongodb'
import { env } from './config/environment'
import { APIs_V1 } from './routes/v1'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import cors from 'cors'
import path from 'path'
import { getMessage, insertMessage } from './models/messagesModel'

const START_SERVER = () => {
  const app = express()

  const server = http.createServer(app)

  const io = socketIo(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }
  })

  app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))

  app.use(express.json())

  app.use('/v1', APIs_V1)

  app.use('/uploads', express.static(path.join('src/uploads')))

  app.use(errorHandlingMiddleware)

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id)

    // Join a chat room
    socket.on('join_chat', (userId) => {
      socket.join(userId)
      console.log(`User ${userId} joined their chat room`)
    })

    socket.on('send_message', async (data) => {
      try {
        const { senderId, receiverId, message } = data
        
        // Save message to database
        const messageData = {
          id_user1: senderId,
          id_user2: receiverId,
          content: [{
            sender: senderId,
            text: message,
            timestamp: new Date().toISOString()
          }]
        }
        
        const result = await insertMessage(messageData)
        
        // Emit to specific receiver
        io.to(receiverId).emit('receive_message', {
          ...result,
          senderId,
          receiverId
        })

        // Emit back to sender for confirmation
        socket.emit('message_sent', {
          ...result,
          senderId,
          receiverId
        })
      } catch (err) {
        console.error('Error handling message:', err)
        socket.emit('message_error', {
          error: 'Failed to send message'
        })
      }
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  server.listen(env.APP_PORT, env.APP_HOST, () => {
    console.log(`Hello ${env.AUTHOR}, I am running at ${env.APP_HOST}:${env.APP_PORT}`)
  })

  exitHook(() => {
    CLOSE_DB()
    console.log('Disconnected from MongoDB')
  })
}

CONNECT_DB()
  .then(() => console.log('Connected to MongoDB!'))
  .then(() => START_SERVER())
  .catch((error) => {
    console.error(error)
    process.exit(0)
  })
