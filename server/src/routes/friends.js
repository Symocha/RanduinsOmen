const router = require('express').Router()
const { list, requests, send, accept, decline } = require('../controllers/friendsController')
const auth = require('../middleware/auth')

router.get('/', auth, list)
router.get('/requests', auth, requests)
router.post('/', auth, send)
router.patch('/:id/accept', auth, accept)
router.delete('/:id', auth, decline)

module.exports = router
