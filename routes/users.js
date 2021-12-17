const express = require('express');
const {
  getAllUsers,
  getUser,
  updateMe,
  deleteUser,
  me,
  updateUser,
  setUserIdOnParam,
} = require('../controllers/users');

const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  protect,
  updatePassword,
  deleteUserAuth,
  restrictTo,
  logout,
} = require('../controllers/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:resetToken', resetPassword);
router.get('/logout', logout);

router.use(protect);

router.patch('/update-password', updatePassword);
router.patch('/update-me', updateMe);
router.get('/me', setUserIdOnParam, getUser);
router.delete('/delete-me', deleteUserAuth);

router.use(restrictTo(['admin']));

router.route('/').get(getAllUsers);
router.route('/:id').delete(deleteUser).patch(updateUser).get(getUser);

module.exports = router;
