const nodemailer = require('nodemailer')
const sendEmail = async options => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS
    }
  });

  const mailOptions = {
    from: 'Hafiz Hasnain <sh.hafizhasnain@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || null,
  }
  await transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}


module.exports = sendEmail 