const express = require('express');
const {
  getOverview,
  getTour,
  getLogin,
  postLogin,
  updateUser,
} = require('../controllers/views');

const { protect, isLoggedIn } = require('../controllers/auth');

const { me } = require('../controllers/users');

const router = express.Router();

router.get('/me', protect, me);
router.post('/update-user', protect, updateUser);

router.use(isLoggedIn);

router.get('/', getOverview);
router.get('/tour/:slug', getTour);

router.get('/login', getLogin);
router.post('/login', postLogin);

module.exports = router;
