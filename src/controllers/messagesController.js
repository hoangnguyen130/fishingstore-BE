/* eslint-disable no-console */
import { insertMessage, getMessages } from '~/models/messagesModel'

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
    res.status(200).json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(400).json({ error: error.message })
  }
}
