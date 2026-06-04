const { verify } = require('../utils/jwt')
const prisma = require('../lib/prisma')

module.exports = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const payload = verify(header.slice(7))
    req.user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, avatar: true },
    })
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
