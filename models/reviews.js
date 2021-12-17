const mongoose = require('mongoose');
const Tour = require('./tours');

const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must have a user'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    content: {
      type: String,
      required: [true, 'A review must have content'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//To ensure a user can only review a tour once
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRating = async tourId => {
  const stats = await this.aggregate([
    // this is Review model
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating,
  });
};

//Create a review, calc tour rating
reviewSchema.post('save', async function () {
  await this.constructor.calcAverageRating(this.tour);
  //this.constructor gets you the model
});

//after persisting changes after a update/ delete, need to update ratings as well
reviewSchema.post(/^findOneAnd/, async function (doc) {
  //in post you get the returned document/docs after exec
  await doc.constructor.calcAverageRating(doc.tour);
});

module.exports = mongoose.model('Review', reviewSchema);
