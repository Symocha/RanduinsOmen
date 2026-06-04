const prisma = require('../lib/prisma')

const list = async (req, res, next) => {
  try {
    const { restaurantId } = req.query
    const userId = req.user?.id

    let friendIds = []
    if (userId) {
      const friendships = await prisma.friendship.findMany({
        where: {
          status: 'accepted',
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
      })
      friendIds = friendships.map(f =>
        f.requesterId === userId ? f.addresseeId : f.requesterId
      )
    }

    const reviews = await prisma.review.findMany({
      where: {
        ...(restaurantId && { restaurantId }),
        OR: [
          { visibility: 'public' },
          ...(userId ? [{ userId }] : []),
          ...(friendIds.length ? [{ userId: { in: friendIds }, visibility: 'friends' }] : []),
        ],
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        restaurant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(reviews)
  } catch (err) {
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const { restaurantId, foodScore, serviceScore, ambianceScore, valueScore, notes, visibility, visitedAt } = req.body
    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        restaurantId,
        foodScore,
        serviceScore,
        ambianceScore,
        valueScore,
        notes,
        visibility: visibility || 'private',
        visitedAt: new Date(visitedAt),
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    })
    res.status(201).json(review)
  } catch (err) {
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } })
    if (!review) return res.status(404).json({ error: 'Review not found' })
    if (review.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } })
    if (!review) return res.status(404).json({ error: 'Review not found' })
    if (review.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    await prisma.review.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, update, remove }
