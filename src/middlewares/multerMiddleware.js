import multer from 'multer'

// Cấu hình storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

// Cấu hình middleware multer
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ cho phép upload file ảnh'))
    }
    cb(null, true)
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
})

export default upload