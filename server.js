const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION...SHUTTING DOWN...');
  console.error(err.name, err.message);
  process.exit(1);
});

const app = require('./app');

require('./models/tours');
require('./models/reviews');
require('./models/users');

//mongoose
mongoose.connect(
  process.env.DB_URI,
  { useNewUrlParser: true, useCreateIndex: true },
  con => {
    console.log('Connected to db!');
  }
);

//start server
const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`App running on port: ${PORT}`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION...SHUTTING DOWN...');
  server.close(() => process.exit(1));
});
