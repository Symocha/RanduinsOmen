const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')
const { sign } = require('../utils/jwt')

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email already in use' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, avatar: true },
    })

    res.status(201).json({ user, token: sign({ id: user.id }) })
  } catch (err) {
    next(err)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const { password: _, ...safeUser } = user
    res.json({ user: safeUser, token: sign({ id: user.id }) })
  } catch (err) {
    next(err)
  }
}

const me = (req, res) => res.json(req.user)

module.exports = { register, login, me }
