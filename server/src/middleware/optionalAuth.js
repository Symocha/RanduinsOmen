const { verify } = require('../utils/jwt')
const prisma = require('../lib/prisma')

module.exports = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next()

  try {
    const payload = verify(header.slice(7))
    req.user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, avatar: true },
    })
  } catch {
    // proceed as unauthenticated
  }
  next()
}
