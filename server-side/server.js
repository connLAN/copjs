const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise');
const cookieParser = require('cookie-parser');
const app = express();

// Serve static files from the "public" directory
app.use(express.static('public'));
app.use(express.static('/'));

// Parse JSON and URL-encoded query parameters
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Connect to the MySQL database
const pool = mysql.createPool({
  host: 'localhost',
  user: 'tiny',
  password: 'password',
  database: 'mydb'
});

// Create a connection to the MySQL server
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'tiny',
  password: 'password'
});

// Define a router for the registration form submissions
const registerRouter = express.Router();
registerRouter.post('/', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).send('Name, email, and password are required');
    return;
  }
  try {
    // Insert user information into the "users" table
    const [result] = await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
    console.log(result);
    res.send('Registration successful!');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while registering the user');
  }
});
app.use('/register', registerRouter);

// Define a router for the login form submissions
const loginRouter = express.Router();
loginRouter.post('/', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send('Email and password are required');
    return;
  }
  try {
    // Find the user with the given email and password
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length > 0) {
      // Set a cookie to remember the user's email
      res.cookie('email', email, { maxAge: 3600000, httpOnly: true });
      res.send('Login successful!');
    } else {
      res.status(401).send('Invalid email or password');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while logging in the user');
  }
});
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
app.use('/', htmlRouter);

// Define a 404 page for non-existent pages
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '/', '404.html'));
});



// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});

exports.pool = pool;