require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const errorHandler = require('./src/middleware/errorHandler')

const app = express()

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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
