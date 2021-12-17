const express = require('express');
const {
  getReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourAndUserIds,
} = require('../controllers/reviews');
const { protect, restrictTo } = require('../controllers/auth');

const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .get(getReviews) //either the nested route or /
  .post(restrictTo(['user']), setTourAndUserIds, createReview);

router
  .route('/:id')
  .delete(restrictTo(['user', 'admin']), deleteReview)
  .patch(restrictTo(['user', 'admin']), updateReview);

module.exports = router;
