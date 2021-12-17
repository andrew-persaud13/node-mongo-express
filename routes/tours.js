const express = require('express');
const router = express.Router();

const {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  topFiveCheap,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
} = require('../controllers/tours');

const { protect, restrictTo } = require('../controllers/auth');
const reviewRouter = require('../routes/reviews');

router.use('/:tourId/reviews', reviewRouter);

router.get('/top-5-cheap', topFiveCheap, getAllTours); //intercept it and put on the fields
router.get('/tour-stats', getTourStats);
router.get(
  '/monthly-plan/:year',
  protect,
  restrictTo(['admin', 'lead-guide', 'guide']),
  getMonthlyPlan
);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo(['admin', 'lead-guide']), createTour);

router
  .route('/:id')
  .get(getTour)
  .patch(protect, restrictTo(['admin', 'lead-guide']), updateTour)
  .delete(protect, restrictTo(['admin', 'lead-guide']), deleteTour);

module.exports = router;
