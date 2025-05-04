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
import { getMessage } from './models/messagesModel'

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
    console.log('A user connected')
    socket.on('send_message', async (data) => {
      try {
        const result = getMessage(data.insertedId)
        console.log('Message received:', result)

        socket.broadcast.emit('receive_message', result)
        // Phát lại tin nhắn tới tất cả các client đang kết nối
        // io.emit('receive_message', message)
      } catch (err) {
        console.log(err)
      }

    })

    socket.on('disconnect', () => {
      console.log('User disconnected')
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
