const prisma = require('../lib/prisma')

const list = async (req, res, next) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: req.user.id }, { addresseeId: req.user.id }],
      },
      include: {
        requester: { select: { id: true, name: true, avatar: true } },
        addressee: { select: { id: true, name: true, avatar: true } },
      },
    })
    const friends = friendships.map(f => ({
      friendshipId: f.id,
      ...(f.requesterId === req.user.id ? f.addressee : f.requester),
    }))
    res.json(friends)
  } catch (err) {
    next(err)
  }
}

const requests = async (req, res, next) => {
  try {
    const pending = await prisma.friendship.findMany({
      where: { addresseeId: req.user.id, status: 'pending' },
      include: {
        requester: { select: { id: true, name: true, avatar: true } },
      },
    })
    res.json(pending)
  } catch (err) {
    next(err)
  }
}

const send = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'email is required' })

    const target = await prisma.user.findUnique({ where: { email } })
    if (!target) return res.status(404).json({ error: 'No user with that email' })
    if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot add yourself' })

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.user.id, addresseeId: target.id },
          { requesterId: target.id, addresseeId: req.user.id },
        ],
      },
    })
    if (existing) return res.status(409).json({ error: 'Friend request already exists' })

    const friendship = await prisma.friendship.create({
      data: { requesterId: req.user.id, addresseeId: target.id },
      include: { addressee: { select: { id: true, name: true, avatar: true } } },
    })
    res.status(201).json(friendship)
  } catch (err) {
    next(err)
  }
}

const accept = async (req, res, next) => {
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } })
    if (!friendship) return res.status(404).json({ error: 'Request not found' })
    if (friendship.addresseeId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    const updated = await prisma.friendship.update({
      where: { id: req.params.id },
      data: { status: 'accepted' },
      include: { requester: { select: { id: true, name: true, avatar: true } } },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

const decline = async (req, res, next) => {
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } })
    if (!friendship) return res.status(404).json({ error: 'Request not found' })
    const isParty = friendship.requesterId === req.user.id || friendship.addresseeId === req.user.id
    if (!isParty) return res.status(403).json({ error: 'Forbidden' })

    await prisma.friendship.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { list, requests, send, accept, decline }
