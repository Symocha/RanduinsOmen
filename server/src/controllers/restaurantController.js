const prisma = require('../lib/prisma')

const list = async (req, res, next) => {
  try {
    const { search, cuisine, priceRange } = req.query
    const restaurants = await prisma.restaurant.findMany({
      where: {
        createdBy: req.user.id,
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
        ...(cuisine && { cuisineType: cuisine }),
        ...(priceRange && { priceRange: parseInt(priceRange) }),
      },
      include: { _count: { select: { reviews: true } } },
      orderBy: { name: 'asc' },
    })
    res.json(restaurants)
  } catch (err) {
    next(err)
  }
}

const get = async (req, res, next) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: {
        reviews: {
          where: { visibility: 'public' },
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' })
    res.json(restaurant)
  } catch (err) {
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const { name, address, cuisineType, priceRange, googlePlaceId } = req.body
    if (!name || !address || !cuisineType || !priceRange) {
      return res.status(400).json({ error: 'name, address, cuisineType, priceRange are required' })
    }
    const restaurant = await prisma.restaurant.create({
      data: { name, address, cuisineType, priceRange: parseInt(priceRange), googlePlaceId, createdBy: req.user.id },
    })
    res.status(201).json(restaurant)
  } catch (err) {
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const restaurant = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(restaurant)
  } catch (err) {
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    await prisma.restaurant.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { list, get, create, update, remove }
