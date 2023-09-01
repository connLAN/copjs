const mysql = require('mysql');
const appConfig = require('./router/app_config');
const config = appConfig.appConfig;

// console.log( "appConfig = " + JSON.stringify(appConfig));
// console.log( "config = " + JSON.stringify(config));
console.log( "config.web.domain = " + config.web.domain);

console.log("user:" + config.database.user 
              + " password:" + config.database.password 
              + " host:" + config.database.host 
              + " port:" + config.database.port 
              + " database:" + config.database.database + "");


connection = mysql.createConnection({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password
});


function initializeDatabase() {
  connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL server');

  // Create the database if it doesn't exist
  connection.query('CREATE DATABASE IF NOT EXISTS mydb', (err, result) => {
    if (err) throw err;
    console.log('Database created or already exists');
  });

  // Use the mydb database
  connection.query('USE mydb', (err, result) => {
    if (err) throw err;
    console.log('Using mydb database');

    // Create the user table if it doesn't exist
    const sql = 'CREATE TABLE IF NOT EXISTS users '
              + '(id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255),'
              + ' email VARCHAR(255), password VARCHAR(255), '
              + 'email_verified BOOLEAN DEFAULT false, '
              + 'register_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP);';
    connection.query(sql, (err) => {
      if (err) throw err;
      console.log('User table created or already exists');
    });

    // Create the email verification table if it doesn't exist
    const sql2 = 'CREATE TABLE IF NOT EXISTS email_verification'
                + ' (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255), '
                + 'token VARCHAR(255), expiry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP);';
    connection.query(sql2, (err) => {
      if (err) throw err;
      console.log('Email verification table created or already exists');
    });

    // Create the remember me table if it doesn't exist
    const sql3 = 'CREATE TABLE IF NOT EXISTS remember_me'
              + '(id INT PRIMARY KEY AUTO_INCREMENT, email VARCHAR(255) NOT NULL,'
              + 'token VARCHAR(255) NOT NULL,expires DATETIME NOT NULL)';
    connection.query(sql3, (err) => {
      if (err) throw err;
      console.log('remember_me table created or already exists');
    });

    // create password reset table
    const sql4 = 'CREATE TABLE IF NOT EXISTS password_reset'
              + '(id INT PRIMARY KEY AUTO_INCREMENT, email VARCHAR(255) NOT NULL,'
              + 'token VARCHAR(255) NOT NULL,expires DATETIME NOT NULL)';
    connection.query(sql4, (err) => {
      if (err) throw err;
      console.log('password_reset table created or already exists');
    });

    // Release the MySQL connection
    connection.end();
    });
  });
}

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database
});

function  storeUser(name, email, password) {
  return new Promise((resolve, reject) => {
    // Execute the SQL query using nodemailer
    pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, password],
      (error, results, fields) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else if (results.length > 1) {
          console.error('Duplicate email found in users table');
          resolve({
            id: results[0].id,
            name: results[0].name,
            email: results[0].email,
            password: results[0].password,
            email_verified: results[0].email_verified,
            register_time: new Date(results[0].register_time)
          });
        } else { // normal case
          resolve({
            id: results[0].id,
            name: results[0].name,
            email: results[0].email,
            password: results[0].password,
            email_verified: results[0].email_verified,
            register_time: new Date(results[0].register_time)
          });
        }
      }
    );
  });
}


function getUserByName(name) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM users WHERE name = ?',
      [name],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else if (results.length > 1) {
          console.error('Duplicate email found in users table');
          resolve({
            id: results[0].id,
            name: results[0].name,
            email: results[0].email,
            password: results[0].password,
            email_verified: results[0].email_verified,
            register_time: new Date(results[0].register_time)
          });
        } else { // normal case
          resolve({
            id: results[0].id,
            name: results[0].name,
            email: results[0].email,
            password: results[0].password,
            email_verified: results[0].email_verified,
            register_time: new Date(results[0].register_time)
          });
        }
      }
    );
  });
}

function isEmailVerified(email) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT email_verified FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else if (results.length === 0) {
          resolve(false);
        } else if (results.length > 1) {
          console.error('Duplicate email found in users table');
          resolve(results[0].email_verified);
        } else {
          resolve(results[0].email_verified);
        }
      }
    );
  });
}



function storeVerificationToken(email, token) {
  return new Promise((resolve, reject) => {
    // 将日期格式化为 MySQL DATETIME 格式,  store created datetime.
    
    const options = { timeZone: 'China/Shang_Hai' };

    console.log(formattedDate);
    const formattedDate = new Date().toISOString('en-US', options).slice(0, 19).replace('T', ' ');
    console.log('storeVerificationToken: formattedDate = ' + formattedDate);

    // 执行 SQL 查询
    pool.query(
      'INSERT INTO email_verification (email, token, expiry_time) VALUES (?, ?, ?)',
      [email, token, formattedDate],
      (error, results, fields) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function getVerificationToken(email) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM email_verification WHERE email = ?',
      [email],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else if (results.length > 1) {
          console.error('Duplicate token found in email_verification table');
          resolve({
            token: results[0].token,
            expires: new Date(results[0].expiry_time)
          });
        } else {
          resolve({
            token: results[0].token,
            expires: new Date(results[0].expiry_time)
          });
        }
      }
    );
  });
}

function deleteVerificationToken(token) {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM email_verification WHERE token = ?',
      [token],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function updateUserEmailVerified(email) {
  return new Promise((resolve, reject) => {
    pool.query(
      'UPDATE users SET email_verified = true WHERE email = ?',
      [email],

      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
      
  });
}



// 存储令牌
function storeToken(email, token, expires) {
  return new Promise((resolve, reject) => {
    // 将日期格式化为 MySQL DATETIME 格式
    const formattedDate = expires.toISOString().slice(0, 19).replace('T', ' ');

    // 执行 SQL 查询
    pool.query(
      'INSERT INTO remember_me(email, token, expires) VALUES (?, ?, ?)',
      [email, token, formattedDate],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
}


function getUserByToken(token) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM remember_me WHERE token = ?',
      [token],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else if (results.length > 1) {
          console.error('Duplicate token found in remember_me table');
          resolve({
            email: results[0].email,
            expires: new Date(results[0].expires)
          });
        } else {
          resolve({
            email: results[0].email,
            expires: new Date(results[0].expires)
          });
        }
      }
    );
  });
}

function updateTokenexpires(token) {
  return new Promise((resolve, reject) => {
    // 将日期格式化为 MySQL DATETIME 格式
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const formattedDate = expires.toISOString().slice(0, 19).replace('T', ' ');

    pool.query(
      'UPDATE remember_me SET expires = ? WHERE token = ?',
      [formattedDate, token],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function storePasswordResetToken(email, token) {
  return new Promise((resolve, reject) => {
    // 将日期格式化为 MySQL DATETIME 格式
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    const formattedDate = expires.toISOString().slice(0, 19).replace('T', ' ');

    // 执行 SQL 查询
    pool.query(
      'INSERT INTO password_reset (email, token, expires) VALUES (?, ?, ?)',
      [email, token, formattedDate],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function getPasswordResetToken(token) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM password_reset WHERE token = ?',
      [token],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else if (results.length > 1) {
          console.error('Duplicate token found in password_reset table');
          resolve({
            email: results[0].email,
            expires: new Date(results[0].expires)
          });
        } else {
          resolve({
            email: results[0].email,
            expires: new Date(results[0].expires)
          });
        }
      }
    );
  });
}




function timeout_delete_remember_me() {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM remember_me WHERE expires < NOW()',
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function timeout_delete_email_verification() {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM email_verification WHERE expiry_time < NOW()',
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
}



module.exports = {
  initializeDatabase,
  storeUser,
  getUserByEmail,
  getUserByName,
  isEmailVerified,
  storeVerificationToken,
  getVerificationToken,
  deleteVerificationToken,
  updateUserEmailVerified,
  storeToken,
  getUserByToken,
  updateTokenexpires,
  storePasswordResetToken,
  getPasswordResetToken,
  timeout_delete_remember_me,
  timeout_delete_email_verification
};


