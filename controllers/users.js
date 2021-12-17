const reviews = require('../models/reviews');
const User = require('../models/users');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.updateMe = catchAsync(async (req, res, next) => {
  //throw error if any invalid fields
  const invalidFields = ['password', 'passwordConfirm', 'role'];
  if (Object.keys(req.body).some(key => invalidFields.includes(key))) {
    return next(new AppError('Invalid user update', 401));
  }
  //no invalid fields. don't care if any random fields because they're not specified on Schema
  const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
    runValidators: true,
  });
  return res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.me = (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(200).json({
      status: 'success',
      data: {
        data: req.user, //this always a success. front end can check for null
      },
    });
  }

  res.status(200).render('account', {
    title: 'My Account',
  });
};

//mw's

exports.setUserIdOnParam = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};
