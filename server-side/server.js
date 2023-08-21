const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise');
const cookieParser = require('cookie-parser');
const app = express();

// Serve static files from the "public" directory
app.use(express.static('public'));
app.use(express.static('public/img'));
app.use(express.static('/'));

// Parse JSON and URL-encoded query parameters
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

const bcrypt = require('bcrypt');
const validator = require('validator');
const saltRounds = 10;


const fs = require('fs');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

console.log(`Server running on port ${config.port}`);
console.log(`Database connection: ${config.database.host}:${config.database.port}`);


const session = require('express-session');
app.use(session({
  secret: config.session.secret,  
  resave: false,
  saveUninitialized: true
}));

// Connect to the MySQL database
const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database
});

// Create a connection to the MySQL server
const connection = mysql.createConnection({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password
});

// Connect to the MySQL server and create the "mydb" database and users table
// call database.js
require('./database');


const nodemailer = require('nodemailer');
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



// Define a router for the registration form submissions
const registerRouter = express.Router();
registerRouter.post('/', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).send('WRONG: Nameee = ' + name +' email = ' + email +" password = "+ password);
    return;
  }
  try {
    console.log('name = ' + name +' email = ' + email +" password = "+ password);
    // avoid duplicate email
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      // console.log('This email is already registered');
      res.status(400).send('This email is already registered');
      return;
    }

    // avoid duplicate name
    const [rows2] = await pool.query('SELECT * FROM users WHERE name = ?', [name]);
    if (rows2.length > 0) {
      // console.log('This name is already registered');
      res.status(400).send('This name is already registered');
      return;
    }


    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user information into the "users" table
    const [result] = await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
    console.log(result);
   
    // Set a cookie to remember the user's email
    res.cookie('email', email, { maxAge: 3600000, httpOnly: true });


    // Generate a verification token for the user, write into the database , and sent it to the user's email address
    const crypto = require('crypto');

    const token = crypto.randomBytes(16).toString('hex');
    await pool.query('INSERT INTO email_verification (email, token) VALUES (?, ?)', [email, token]);
    console.log(token);
   
    // Send the verification token to the user's email address


    // Define the email message
    const mailOptions = {
      from: config.email.auth.user,
      to: email,
      subject: 'Verification Token',
      text: `Your verification token is ${token}` + '\n'
       + 'Please click the link below to verify your email address:'
       + 'http://'
       + config.web.domain +':' + config.port
       + '/verify?email=' + email + '&token=' + token
    };

    // todo: add global config of web domain in the future instead of hard coding

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
   
   
   
    res.send('Registration successful!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

// Mount the router on the app
app.use('/register', registerRouter);


app.get('/verify', async (req, res) => {
  const { email, token } = req.query;

  // Check if the verification token is valid
  const result = await pool.query('SELECT * FROM email_verification WHERE email = ? AND token = ?', [email, token]);
  if (result.length === 0) {
    // Invalid token
    return res.status(400).send('Invalid verification token');
  }

  // Update the user's email address as verified
  await pool.query('UPDATE users SET email_verified = true WHERE email = ?', [email]);

  // Delete the verification token from the database
  await pool.query('DELETE FROM email_verification WHERE email = ?', [email]);

  // Redirect the user to the login page
  res.redirect('/login');
});



// Define a router for the login form submissions
const loginRouter = express.Router();
loginRouter.post('/', async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    // console.log('Email and password are required');
    res.status(400).send('Email and password are required');
    return;
  }
  if (!validator.isEmail(email)) {
    // console.log('Invalid email address');
    res.status(400).send('Invalid email address');
    return;
  }

  // Sanitize input
  const sanitizedEmail = validator.escape(email);

  try {
    // Get the user with the specified email from the "users" table
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [sanitizedEmail]);
    if (rows.length === 0) {
      // console.log('This email is not registered');
      res.status(401).send('This email is not registered');
      return;
    }

    if (!rows[0].email_verified) {
      // console.log('Email not verified');
      return res.status(401).send('Email not verified, \nplease open your email and click the verification link');
    }

    // Compare the hashed password with the password provided by the user
    const hashedPassword = rows[0].password;
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      res.status(401).send('Invalid email or password');
      return;
    }

    // Set a cookie to remember the user's email
    req.session.user = { email: email };
    res.cookie('email', email, { maxAge: 3600000, httpOnly: true });
    res.send('Login successful!');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while logging in the user');
  }
});

// Mount the router on the app
app.use('/login', loginRouter);



// Define a router for all HTML pages
const htmlRouter = express.Router();
htmlRouter.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/', 'index.html'));
});
htmlRouter.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '/', 'register.html'));
});
htmlRouter.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '/', 'login.html'));
});
htmlRouter.get('/fail', (req, res) => {
  res.sendFile(path.join(__dirname, '/', 'fail.html'));
});


////////////////////////////////////////////////////////////

// 授权中间件
app.get('/welcome', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    // If user is not logged in, redirect to login page
    console.log('Please login first');
    res.redirect('/login');
  } else {
    console.log('You have logged in');
    res.sendFile(path.join(__dirname, '/', 'welcome.html'));
  }
});


////////////////////////////////////////////////////////////

app.use('/', htmlRouter);

// Define a 404 page for non-existent pages
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '/', '404.html'));
});


const cron = require('node-cron');
const moment = require('moment');

// Schedule a cron job to delete unverified users and email verification records every 24 hours
cron.schedule('0 0 * * *', async () => {
  const threshold = moment().subtract(72, 'hours').format('YYYY-MM-DD HH:mm:ss');

  // Delete unverified users
  await pool.query('DELETE FROM users WHERE email_verified = false AND created_at < ?', [threshold]);

  // Delete email verification records
  await pool.query('DELETE FROM email_verification WHERE created_at < ?', [threshold]);
});


// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});


/* 
export config for other modules to use such as in database.js
const serverConfig = require('./server.js');
console.log(serverConfig.config.port);
*/

module.exports = {
  config: config
};

exports.pool = pool;