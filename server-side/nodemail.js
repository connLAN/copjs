const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 587,
  secure: false,
  auth: {
    user: '44514285@qq.com',
    pass: 'msthnqahawcqbjed'
  }
});

// Define the email message
const mailOptions = {
  from: '44514285@qq.com',
  to: 'tinyserver@foxmail.com',
  subject: 'Test Email',
  text: 'This is a test email from Node.js'
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});

// node nodemail.js , when send success, it will print: Email sent: 250 OK: queued as