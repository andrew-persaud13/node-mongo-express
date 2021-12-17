const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const app = express();

//templating
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const whitelist = require('./utils/whitelist');

const AppError = require('./utils/AppError');
const errorHandler = require('./controllers/errorController');

//mw's
app.use(helmet()); //security http headers

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour.',
});

app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //for action/method form data
app.use(cookieParser());

//data sanitization against nosql query injection
app.use(mongoSanitize());

//against XSS
app.use(xssClean());

//against parameter pollution
app.use(
  hpp({
    whitelist,
  })
);

//test middleware
// app.use((req, res, next) => {
//   console.log('in mw test', req.cookies);
//   next();
// });

//api routes
app.use('/api/v1/tours', require('./routes/tours'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/reviews', require('./routes/reviews'));

//client routes
app.use('/', require('./routes/views'));

//Not found-->Put after all route handlers

app.all('*', (req, res, next) => {
  next(new AppError(`${req.originalUrl} not found on this server.`, 404));
});

app.use(errorHandler);

module.exports = app;
