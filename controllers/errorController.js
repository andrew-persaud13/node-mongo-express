const AppError = require('../utils/AppError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  const message = `Duplicate field value: ${value[0]}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;

  return new AppError(message, 400);
};

const handleJwtError = err =>
  new AppError('Invalid credentials. Please login', 401); //reminder: to make them operational/app errors

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  return res.status(err.statusCode).render('error', {
    message: err.message,
    title: 'Something went wrong!',
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      //Don't leak these errors to client. These are bugs.
      console.error(err); //will go heroku logs
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
      });
    }
  }

  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      message: err.message,
      title: 'Something went wrong!',
    });
  }
  //Don't leak these errors to client. These are bugs.
  console.error(err); //will go heroku logs
  return res.status(500).render('error', {
    title: 'Something went wrong...',
    message: 'Unknown error occured. Please retry.',
  });
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'fail';

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, message: err.message };
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
      error = handleJwtError();

    //Convert mongoose errors to AppErrors before calling this
    return sendErrorProd(err, req, res);
  }
};

module.exports = errorHandler;
