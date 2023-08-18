const mysql = require('mysql');

// Create a connection to the MySQL server
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'tiny',
  password: 'password'
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
      const sql = 'CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), password VARCHAR(255))';
      connection.query(sql, (err, result) => {
        if (err) throw err;
        console.log('User table created or already exists');
      });
    });
  });
});
