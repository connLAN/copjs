const nodemailer = require('nodemailer');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// // Create a transporter object using SMTP transport
// const transporter = nodemailer.createTransport({
//   host: 'smtp.qq.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: '44514285@qq.com',
//     pass: 'msthnqahawcqbjed'
//   }
// });



const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass
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