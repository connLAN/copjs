const nodemailer = require('nodemailer');
const config = require('./config');
const fs = require('fs');

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass
  }
});

function sendMail(email, subject, text) {
  const mailOptions = {
    from: config.email.auth.user,
    to: email,
    subject: subject,
    text: text
  };

  try{
    transporter.sendMail(mailOptions);
  }catch(error){
    console.error(error);
  }
}

function sendResetPasswordEmail(email, token) {
  const subject = 'Reset Password';
  const text = 'Please click the following link to reset your password: ' + config.server.url + '/reset_password?email=' + email + '&token=' + token;
  sendMail(email, subject, text);
}

function sendVerificationEmail(email, token) {
  const subject = 'Email Verification'; 
  const text = 'Please click the following link to verify your email address: ' + config.server.url + '/verify_email?email=' + email + '&token=' + token;
  sendMail(email, subject, text);
}

function sendWelcomeEmail(email) {
  const subject = 'Welcome';
  const text = 'Welcome to our website!';
  sendMail(email, subject, text);
}

function sendGoodbyeEmail(email) {
  const subject = 'Goodbye';
  const text = 'We are sorry to see you go!';
  sendMail(email, subject, text);
}




// node nodemail.js , when send success, it will print: Email sent: 250 OK: queued as

module.exports = {
  transporter,
  sendMail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendGoodbyeEmail
};


