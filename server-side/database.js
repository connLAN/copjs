const mysql = require('mysql');


const fs = require('fs');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

console.log("user:" + config.database.user + "password:" + config.database.password + "host:" + config.database.host + "port:" + config.database.port + "database:" + config.database.database + "");

// // Create a connection to the MySQL server
// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'tiny',
//   password: 'password'
// });

// Create a connection to the MySQL server
const connection = mysql.createConnection({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password
});

// Connect to the MySQL server
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL server');

  // Create the database if it doesn't exist
  connection.query('CREATE DATABASE IF NOT EXISTS mydb', (err, result) => {
    if (err) throw err;
    console.log('Database created or already exists');

    // Use the mydb database
    connection.query('USE mydb', (err, result) => {
      if (err) throw err;
      console.log('Using mydb database');

      // Create the user table if it doesn't exist
      const sql = 'CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), password VARCHAR(255), email_verified BOOLEAN DEFAULT false, register_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP);';
      connection.query(sql, (err, result) => {
        if (err) throw err;
        console.log('User table created or already exists');
      });

      // Create the email verification table if it doesn't exist
      const sql2 = 'CREATE TABLE IF NOT EXISTS email_verification (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255), token VARCHAR(255), expiry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP);';
      connection.query(sql2, (err, result) => {
        if (err) throw err;
        console.log('Email verification table created or already exists');
      });

    });
  });
});
