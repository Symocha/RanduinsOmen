const router = require('express').Router()
const { list, add, remove } = require('../controllers/wishlistController')
const auth = require('../middleware/auth')

router.get('/', auth, list)
router.post('/', auth, add)
router.delete('/:restaurantId', auth, remove)

module.exports = router
