const nodemailer = require('nodemailer');
const { options } = require('../routes/tours');

const sendEmail = async options => {
  //Transporter --> service that sends an email
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //Email options

  const mailOptions = {
    from: 'Andrew Persaud <drew@drew.com>',
    to: options.email,
    subject: options.subject,
    text: options.text,
  };

  //Send email

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
