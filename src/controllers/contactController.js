import { addContact, getContacts } from '~/models/contactModel'

// Hàm xử lý POST request để thêm liên lạc
export const addNewContact = async (req, res) => {
  const { userId } = req.params // Lấy userId từ URL
  const contactData = req.body // Dữ liệu liên lạc từ request body

  try {
    // Validate dữ liệu liên lạc (tạo một Joi schema có thể sử dụng ở đây)
    const contact = await addContact(userId, contactData)
    res.status(201).json(contact) // Trả về thông tin liên lạc vừa được thêm
  } catch (error) {
    console.error('Error adding contact:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
// Hàm xử lý GET contacts
export const fetchContacts = async (req, res) => {
  const { userId } = req.params // Lấy userId từ URL

  try {
    const contacts = await getContacts(userId)
    res.status(200).json(contacts) // Trả về danh sách liên lạc
  } catch (error) {
    console.error('Error fetching contacts:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
