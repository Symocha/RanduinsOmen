const router = require('express').Router()
const { list, get, create, update, invite, rsvp, propose, removeProposal, vote } = require('../controllers/outingsController')
const auth = require('../middleware/auth')

router.get('/', auth, list)
router.post('/', auth, create)
router.get('/:id', auth, get)
router.patch('/:id', auth, update)
router.post('/:id/invite', auth, invite)
router.patch('/:id/rsvp', auth, rsvp)
router.post('/:id/proposals', auth, propose)
router.delete('/:id/proposals/:proposalId', auth, removeProposal)
router.post('/:id/vote', auth, vote)

module.exports = router
