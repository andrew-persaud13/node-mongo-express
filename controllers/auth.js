const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/email');
const reviews = require('../models/reviews');

const generateToken = user =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendToken = (res, user) => {
  const token = generateToken(user);
  const secure = process.env.NODE_ENV === 'development' ? false : true;

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 3600 * 1000
    ),
    secure,
    httpOnly: true, //can't be modified in browser
  };

  console.log(cookieOptions);

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  return res.status(200).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //destructure the properties needed in case user tries to bamboozle
  const { name, email, password, passwordConfirm, role } = req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role,
  });

  return createAndSendToken(res, newUser);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //make sure you have email and password
  if (!email || !password)
    return next(new AppError('Must provide email and password', 400));

  //make sure email exists && password good
  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new AppError('Invalid credentials', 400));

  if (!(await user.verifyPassword(password)))
    return next(new AppError('Invalid credentials', 400));

  //good, send token

  return createAndSendToken(res, user);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1.) get token  and check if it exists
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return next(new AppError('Not authorized. Please login', 400));

  //2.) Validate token
  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  ); //will throw an error and get caught by catchAsync

  //3, If valid, you can use the payload to see if user still exists
  const user = await User.findById(decodedToken.id);
  if (!user) return next(new AppError('Not authorized. Please login', 400));

  //4 check if user changed password after the token was issued
  if (user.isPasswordUpdatedAfterTokenIssue(decodedToken.iat)) {
    return next(new AppError('Not authorized. Please login', 400));
  }

  //Good, put user on req and call next to go to protected route

  req.user = user;
  res.locals.user = user;

  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) return next(new AppError('User does not exist', 404));

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false }); //because we initialized the reset token and token expires fields

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  const text = `Forgot your password? Please click this url within 10 minutes to reset your password: ${resetURL}. Ignore if you did not request.`;

  //Want to catch this one instead of going straight to error handler because need some cleanup
  try {
    await sendEmail({
      email: user.email,
      subject: 'Forgotten password, Natours app',
      text,
    });
    return res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('Password reset request failed. Please try again.')
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { resetToken } = req.params;

  //get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Please make a new account.', 404));

  //if token has not expired, and there is a user, set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  //Log user in, send JWT

  return createAndSendToken(res, user);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //get the user from the collection
  if (
    !req.body.password ||
    !req.body.currentPassword ||
    !req.body.passwordConfirm
  ) {
    return next(new AppError('Please specify all required fields'));
  }
  const user = await User.findById(req.user._id).select('+password');
  //check if posted password is correct
  if (!(await user.verifyPassword(req.body.currentPassword)))
    return next(new AppError('Password update failed', 401));
  //if so, update the password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); //can't use findbyIdAndUpdate because middleware won't work to hash password
  //log user in, send JWT

  return createAndSendToken(res, user);
});

exports.deleteUserAuth = catchAsync(async (req, res, next) => {
  const { user } = req;

  await User.findByIdAndUpdate(user._id, { active: false });

  return res.status(204).send({
    status: 'success',
    data: null,
  });
});

exports.restrictTo = roles => (req, res, next) => {
  const { user } = req; //if you are in here, you have the user

  if (!roles.some(role => role === user.role))
    return next(new AppError('Not Authorized to complete this action.', 403));

  next();
};

//only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decodedToken = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      ); //will throw an error and get caught by catchAsync

      //3, If valid, you can use the payload to see if user still exists
      const user = await User.findById(decodedToken.id);
      if (!user) return next();

      //4 check if user changed password after the token was issued
      if (user.isPasswordUpdatedAfterTokenIssue(decodedToken.iat)) {
        return next();
      }

      //There is a logged in user
      res.locals.user = user; //res.locals data can be retrieved in templates
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
