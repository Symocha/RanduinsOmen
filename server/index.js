require('dotenv').config()
const http = require('http')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { Server } = require('socket.io')
const { verify } = require('./src/utils/jwt')
const prisma = require('./src/lib/prisma')
const errorHandler = require('./src/middleware/errorHandler')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
})

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Unauthorized'))
    const payload = verify(token)
    const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true } })
    if (!user) return next(new Error('Unauthorized'))
    socket.userId = user.id
    next()
  } catch {
    next(new Error('Unauthorized'))
  }
})

io.on('connection', (socket) => {
  socket.on('join-outing', (outingId) => socket.join(`outing:${outingId}`))
  socket.on('leave-outing', (outingId) => socket.leave(`outing:${outingId}`))
})

app.set('io', io)

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(morgan('dev'))
app.use(express.json())

app.use('/api/auth', require('./src/routes/auth'))
app.use('/api/restaurants', require('./src/routes/restaurants'))
app.use('/api/reviews', require('./src/routes/reviews'))
app.use('/api/wishlist', require('./src/routes/wishlist'))
app.use('/api/friends', require('./src/routes/friends'))
app.use('/api/outings', require('./src/routes/outings'))

app.use(errorHandler)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
