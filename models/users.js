const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please enter a valid email',
    },
  },
  role: {
    type: String,
    required: [true, 'A user must have a role'],
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  photo: String,
  password: {
    type: String,
    minlength: [6, 'A password must be 6 characters minimum'],
    required: [true, 'A user must have a password'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A user must have a password confirmation'],
    validate: {
      message: 'Password confirmation does not match password',
      validator: function (val) {
        return val === this.password; //only works on save and create
      },
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//document mw
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; //required for input only, you don't have to persist it
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; //password change at might be greater than jwt iat in this setup
  next();
});

//query mw

userSchema.pre(/^find/, function (next) {
  const query = this;
  query.find({ active: { $ne: false } });
  next();
});

//instance methods
userSchema.methods.verifyPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isPasswordUpdatedAfterTokenIssue = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const passwordTimestamp = (this.passwordChangedAt.getTime() / 1000) * 1;

    return passwordTimestamp > jwtTimestamp;
  }

  return false;
};

userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); //store hashed reset token in database

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
