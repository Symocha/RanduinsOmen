const router = require('express').Router()
const { list, create, update, remove } = require('../controllers/reviewController')
const auth = require('../middleware/auth')
const optionalAuth = require('../middleware/optionalAuth')

router.get('/', optionalAuth, list)
router.post('/', auth, create)
router.put('/:id', auth, update)
router.delete('/:id', auth, remove)

module.exports = router
