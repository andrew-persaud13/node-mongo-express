const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tours');
const User = require('../../models/users');
const Review = require('../../models/reviews');

dotenv.config({ path: './config.env' });

mongoose.connect(
  process.env.DB_URI,
  { useNewUrlParser: true, useCreateIndex: true },
  async con => {
    console.log('Populating db');
    await deleteData();
    await importData();
    await mongoose.disconnect();
    console.log('Db populated. bye....');
  }
);

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users);
    await Review.create(reviews);
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany({});
    await Review.deleteMany({});
    await User.deleteMany({});
  } catch (err) {}
};
