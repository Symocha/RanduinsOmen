const prisma = require('../lib/prisma')

const list = async (req, res, next) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: { restaurant: true },
      orderBy: { addedAt: 'desc' },
    })
    res.json(wishlist)
  } catch (err) {
    next(err)
  }
}

const add = async (req, res, next) => {
  try {
    const { restaurantId } = req.body
    if (!restaurantId) return res.status(400).json({ error: 'restaurantId is required' })

    const item = await prisma.wishlist.create({
      data: { userId: req.user.id, restaurantId },
      include: { restaurant: true },
    })
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    await prisma.wishlist.deleteMany({
      where: { userId: req.user.id, restaurantId: req.params.restaurantId },
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { list, add, remove }
