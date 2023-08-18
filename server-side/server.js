const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

// Serve static files from the "public" directory
app.use(express.static('public'));

// Parse JSON and URL-encoded query parameters
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to the MySQL database
const pool = mysql.createPool({
  host: 'localhost',
  user: 'tiny',
  password: 'password',
  database: 'mydatabase'
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

// Route the root URL to the index.html file
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

// Route the register URL to the register.html file
app.get('/register', (req, res) => {
  res.sendFile('register.html', { root: __dirname });
});


// Route the login URL to the login.html file
app.get('/login', (req, res) => {
  res.sendFile('login.html', { root: __dirname });
});



// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});