const prisma = require('../lib/prisma')

const OUTING_DETAIL_INCLUDE = {
  creator: { select: { id: true, name: true, avatar: true } },
  restaurant: true,
  members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
  votes: true,
}

const list = async (req, res, next) => {
  try {
    const outings = await prisma.outing.findMany({
      where: {
        OR: [
          { creatorId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        creator: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(outings)
  } catch (err) {
    next(err)
  }
}

const get = async (req, res, next) => {
  try {
    const outing = await prisma.outing.findUnique({
      where: { id: req.params.id },
      include: OUTING_DETAIL_INCLUDE,
    })
    if (!outing) return res.status(404).json({ error: 'Outing not found' })

    const isParty =
      outing.creatorId === req.user.id ||
      outing.members.some(m => m.userId === req.user.id)
    if (!isParty) return res.status(403).json({ error: 'Forbidden' })

    res.json(outing)
  } catch (err) {
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const { name, restaurantId, date } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })

    const outing = await prisma.outing.create({
      data: {
        name,
        creatorId: req.user.id,
        restaurantId: restaurantId || null,
        date: date ? new Date(date) : null,
      },
      include: {
        creator: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    })
    res.status(201).json(outing)
  } catch (err) {
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const outing = await prisma.outing.findUnique({ where: { id: req.params.id } })
    if (!outing) return res.status(404).json({ error: 'Outing not found' })
    if (outing.creatorId !== req.user.id) return res.status(403).json({ error: 'Only the creator can update' })

    const { name, restaurantId, date, status } = req.body
    const updated = await prisma.outing.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(restaurantId !== undefined && { restaurantId: restaurantId || null }),
        ...(date !== undefined && { date: date ? new Date(date) : null }),
        ...(status && { status }),
      },
      include: OUTING_DETAIL_INCLUDE,
    })
    req.app.get('io').to(`outing:${req.params.id}`).emit('outing:updated', updated)
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

const invite = async (req, res, next) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'userId is required' })

    const outing = await prisma.outing.findUnique({ where: { id: req.params.id } })
    if (!outing) return res.status(404).json({ error: 'Outing not found' })
    if (outing.creatorId !== req.user.id) return res.status(403).json({ error: 'Only the creator can invite' })

    const existing = await prisma.outingMember.findFirst({
      where: { outingId: req.params.id, userId },
    })
    if (existing) return res.status(409).json({ error: 'Already a member' })

    const member = await prisma.outingMember.create({
      data: { outingId: req.params.id, userId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    })
    req.app.get('io').to(`outing:${req.params.id}`).emit('member:added', member)
    res.status(201).json(member)
  } catch (err) {
    next(err)
  }
}

const rsvp = async (req, res, next) => {
  try {
    const { status } = req.body
    const valid = ['going', 'not_going', 'pending']
    if (!valid.includes(status)) return res.status(400).json({ error: 'status must be going, not_going, or pending' })

    const member = await prisma.outingMember.findFirst({
      where: { outingId: req.params.id, userId: req.user.id },
    })
    if (!member) return res.status(404).json({ error: 'You are not a member of this outing' })

    const updated = await prisma.outingMember.update({
      where: { id: member.id },
      data: { rsvp: status },
    })
    req.app.get('io').to(`outing:${req.params.id}`).emit('rsvp:update', { userId: req.user.id, rsvp: status })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

const vote = async (req, res, next) => {
  try {
    const { restaurantId } = req.body
    if (!restaurantId) return res.status(400).json({ error: 'restaurantId is required' })

    const outingId = req.params.id
    const existing = await prisma.outingVote.findFirst({
      where: { outingId, userId: req.user.id, restaurantId },
    })

    const io = req.app.get('io')
    if (existing) {
      await prisma.outingVote.delete({ where: { id: existing.id } })
      io.to(`outing:${outingId}`).emit('vote:toggle', { userId: req.user.id, restaurantId, added: false })
      return res.status(204).send()
    }

    const created = await prisma.outingVote.create({
      data: { outingId, userId: req.user.id, restaurantId },
    })
    io.to(`outing:${outingId}`).emit('vote:toggle', { userId: req.user.id, restaurantId, added: true })
    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
}

module.exports = { list, get, create, update, invite, rsvp, vote }
