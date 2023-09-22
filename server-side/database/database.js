const mysql = require('mysql');

const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

const {
  rootPath,
  htmlPath,
  publicPath,
  imgPath,
  routerPath,
  commonPath,
  databasePath,
  configPath,
  cronPath,
  serveStaticDirectories,
  appConfig
} = require('../router/app_config');
const config = appConfig;

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

    var sql;
    // Create the user table if it doesn't exist
    sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255),
      password VARCHAR(255),
      email_verified BOOLEAN DEFAULT false,
      register_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      role VARCHAR(255) NOT NULL DEFAULT 'buyer'
    )
  `;
    connection.query(sql, (err) => {
      if (err) throw err;
      console.log('User table created or already exists');
    });

    // Create the email verification table if it doesn't exist
   sql = 'CREATE TABLE IF NOT EXISTS email_verification'
                + ' (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255), '
                + 'token VARCHAR(255), expiry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP);';
    connection.query(sql, (err) => {
      if (err) throw err;
      console.log('Email verification table created or already exists');
    });

    // Create the rememberMe table if it doesn't exist
    sql = 'CREATE TABLE IF NOT EXISTS rememberMe'
              + '(id INT PRIMARY KEY AUTO_INCREMENT, email VARCHAR(255) NOT NULL,'
              + 'token VARCHAR(255) NOT NULL,expires DATETIME NOT NULL)';
    connection.query(sql, (err) => {
      if (err) throw err;
      console.log('rememberMe table created or already exists');
    });

    // create password reset table
    sql = 'CREATE TABLE IF NOT EXISTS password_reset'
              + '(id INT PRIMARY KEY AUTO_INCREMENT, email VARCHAR(255) NOT NULL,'
              + 'token VARCHAR(255) NOT NULL,expires DATETIME NOT NULL)';
    connection.query(sql, (err) => {
      if (err) throw err;
      console.log('password_reset table created or already exists');
    });


    sql = `
    CREATE TABLE IF NOT EXISTS courses (
      id INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      picurl VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL DEFAULT 9999,
      status VARCHAR(20) NOT NULL DEFAULT 'draft',
      author VARCHAR(255) NOT NULL DEFAULT 'admin',
      timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `;
    connection.query(sql, (err) => {
      if (err) throw err;
      console.log('courses table created or already exists');
    });

    sql = `
    CREATE TABLE IF NOT EXISTS lessons (
      id INT NOT NULL AUTO_INCREMENT,
      course_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      video_url VARCHAR(255) NOT NULL,
      duration INT NOT NULL,
      sequence INT NOT NULL,
      is_free BOOLEAN NOT NULL DEFAULT false,
      pic_url VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL,
      author VARCHAR(255) NOT NULL,
      timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
    `;
    connection.query(sql, (err) => {
      if (err) throw err;
      console.log('lessons table created or already exists');
    });
   
    sql = `
      CREATE TABLE  IF NOT EXISTS user_courses (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        course_id INT NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
      )
    `;
    connection.query(sql, (err) => {
      if (err) throw err;
      console.log('user_courses table created or already exists');
    });




    // create orders table
    sql = "CREATE TABLE  IF NOT EXISTS orders ("
      +"id INT NOT NULL AUTO_INCREMENT,"
      +"user_id INT NOT NULL,"
      +"course_id INT NOT NULL,"
      +"order_date DATETIME NOT NULL,"
      +"PRIMARY KEY (id),"
      +"FOREIGN KEY (user_id) REFERENCES users(id),"
      +"FOREIGN KEY (course_id) REFERENCES courses(id)"
      +");";
    connection.query(sql, (err) => {
      if (err) throw err;
      console.log('orders table created or already exists');
    });



    sql = `
    CREATE TABLE  IF NOT EXISTS user_actions (
      id INT NOT NULL AUTO_INCREMENT,
      user_id INT NOT NULL,
      action_type VARCHAR(255) NOT NULL,
      action_date DATETIME NOT NULL,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `;
    connection.query(sql, (err) => {
      if (err) throw err;
      console.log('user_actions table created or already exists');
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

function getUserByToken(token) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM rememberMe WHERE token = ?',
      [token],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else if (results.length === 0) {
          console.log('getUserByToken: results.length === 0\n' + token);
          resolve(null);
        } else if (results.length > 1) {
          console.error('Duplicate token found in users table');
          resolve({
            id: results[0].id,
            email: results[0].email,
            token: results[0].token,
            expires: new Date(results[0].expires)
          });
        } else { // normal case
          console.log('getUserByToken: results.length === 1');
          resolve({
            id: results[0].id,
            email: results[0].email,
            token: results[0].token,
            expires: new Date(results[0].expires)
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
    const formattedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
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


function storeRememberMeToken(email, token, expires) {
  return new Promise((resolve, reject) => {
    if (!(expires instanceof Date && !isNaN(expires))) {
      reject(new Error('Invalid expires parameter'));
      return;
    }

    const expiresString = expires.toISOString().slice(0, 19).replace('T', ' ');
    const query = 'INSERT INTO rememberMe (email, token, expires) VALUES (?, ?, ?)';
    const params = [email, token, expiresString];
    pool.query(query, params, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}


function getRememberMeTokenByEmail(email){
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM rememberMe WHERE email = ?',
      [email],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else if (results.length > 1) {
          console.error('Duplicate token found in rememberMe table');
          resolve({
            email: results[0].email,
            token: results[0].token,
            expires: new Date(results[0].expires)
          });
        } else {
          resolve({
            email: results[0].email,
            token: results[0].token,
            expires: new Date(results[0].expires)
          });
        }
      }
    );
  });
}

function getRememberMeTokenByEmailToken(email, token) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM rememberMe WHERE email = ? AND token = ?';
    const params = [email, token];
    pool.query(query, params, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results[0]);
      }
    });
  });
}

function getUserByRememberMeToken(token) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM rememberMe WHERE token = ?',
      [token],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else if (results.length > 1) {
          console.error('Duplicate token found in rememberMe table');
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

function deleteRememberMeTokenByEmailToken(email, token) {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM rememberMe WHERE email = ? AND token = ?',
      [email,token],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}




function updateRememberMeTokenExpires(email,token) {
  return new Promise((resolve, reject) => {
    // 将日期格式化为 MySQL DATETIME 格式
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const formattedDate = expires.toISOString().slice(0, 19).replace('T', ' ');

    pool.query(
      'UPDATE rememberMe SET expires = ? WHERE token = ? AND email = ?',
      [formattedDate, token, email],
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

function getPasswordResetToken(email) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM password_reset WHERE email = ?',
      [email],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else if (results.length > 1) {
          console.error('Duplicate token found in password_reset table');
          console.log('getPasswordResetToken 000: results[0].expires = ' + results[0].expires 
          + ' email = ' + results[0].email
          + ' token = ' +  results[0].token);

          resolve({
            email: results[0].email,
            token: results[0].token,
            expires: new Date(results[0].expires)
          });
        } else {

          console.log('getPasswordResetToken 111: results[0].expires = ' + results[0].expires 
                      + ' email = ' + results[0].email
                      + ' token = ' +  results[0].token);

          resolve({
            email: results[0].email,
            token: results[0].token,
            expires: new Date(results[0].expires)
          });
        }
      }
    );
  });
}

function updateUserPassword(email, hashedPassword) {
  return new Promise((resolve, reject) => {
    pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email],
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

function deletePasswordResetToken(email) {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM password_reset WHERE email = ?',
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

function logUserAction(user_id, action_type) {
  return new Promise((resolve, reject) => {
    pool.query(
      'INSERT INTO user_actions (user_id, action_type, action_date) VALUES (?, ?, NOW())',
      [user_id, action_type],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}


function timeout_delete_remember_me() {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM rememberMe WHERE expires < NOW()',
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

// todo: courses and lessions table and user_courses table functions.

function addCourse(name, description, author,image) {
  return new Promise((resolve, reject) => {
    pool.query(
      'INSERT INTO courses (name, description, image,author) VALUES (?, ?, ?,?)',
      [name, description, image, author],
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


function coursesList() {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM courses',
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

function getCourseById(id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM courses WHERE id = ?',
      [id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else if (results.length > 1) {
          console.error('Duplicate id found in courses table');
          resolve({
            id: results[0].id,
            name: results[0].name,
            description: results[0].description,
            price: results[0].price
          });
        } else { // normal case
          resolve({
            id: results[0].id,
            name: results[0].name,
            description: results[0].description,
            price: results[0].price
          });
        }
      }
    );
  });
}

function coursesUpdate(id, name, description, price) {
  return new Promise((resolve, reject) => {
    pool.query(
      'UPDATE courses SET name = ?, description = ?, price = ? WHERE id = ?',
      [name, description, price, id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
} 

function coursesDelete(id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM courses WHERE id = ?',
      [id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}

function addLessons(course_id, name, description, video_url, duration, sequence, is_free) {
  return new Promise((resolve, reject) => {
    pool.query(
      'INSERT INTO lessons (course_id, name, description, video_url, duration, sequence, is_free) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [course_id, name, description, video_url, duration, sequence, is_free],
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

function lessonsList(course_id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM lessons WHERE course_id = ?',
      [course_id],
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


function getLessonById(id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM lessons WHERE id = ?',
      [id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else if (results.length > 1) {
          console.error('Duplicate id found in lessons table');
          resolve({
            id: results[0].id,
            course_id: results[0].course_id,
            name: results[0].name,
            description: results[0].description,
            video_url: results[0].video_url,
            duration: results[0].duration,
            sequence: results[0].sequence,
            is_free: results[0].is_free
          });

        } else { // normal case
          resolve({
            id: results[0].id,
            course_id: results[0].course_id,
            name: results[0].name,
            description: results[0].description,
            video_url: results[0].video_url,
            duration: results[0].duration,
            sequence: results[0].sequence,
            is_free: results[0].is_free
          });

        }
      } 
    );
  });
}

function lessonsUpdate(id, course_id, name, description, video_url, duration, sequence, is_free) {
  return new Promise((resolve, reject) => {
    pool.query(
      'UPDATE lessons SET course_id = ?, name = ?, description = ?, video_url = ?, duration = ?, sequence = ?, is_free = ? WHERE id = ?',
      [course_id, name, description, video_url, duration, sequence, is_free, id],
      (error, results) => {
        if (error) {

          console.error(error);
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}

function lessonsDelete(id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM lessons WHERE id = ?',
      [id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}


function addOrder(user_id, course_id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'INSERT INTO orders (user_id, course_id, order_date) VALUES (?, ?, NOW())',
      [user_id, course_id],
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

function ordersList(user_id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM orders WHERE user_id = ?',
      [user_id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log('ordersList: results = ' + JSON.stringify(results));
          resolve(results);
        }
      }
    );

  });
}

function ordersListByCourseId(course_id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM orders WHERE course_id = ?',
      [course_id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log('ordersListByCourseId: results = ' + JSON.stringify(results));
          resolve(results);
        }
      }
    );

  });
}

function ordersListByUserIdAndCourseId(user_id, course_id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM orders WHERE user_id = ? AND course_id = ?',
      [user_id, course_id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log('ordersListByUserIdAndCourseId: results = ' + JSON.stringify(results));
          resolve(results);
        }
      }
    );

  });
}

function ordersDelete(id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM orders WHERE id = ?',
      [id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log('ordersDelete: results = ' + JSON.stringify(results));
          resolve();
        }
      }
    );
  });
}

function addCourseToUser(user_id, course_id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'INSERT INTO user_courses (user_id, course_id) VALUES (?, ?)',
      [user_id, course_id],
      (error, results, fields) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log('addCourseToUser: results = ' + JSON.stringify(results));
          resolve(results);
        }
      }
    );
  });
}

function userCoursesList(user_id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM user_courses WHERE user_id = ?',
      [user_id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log('userCoursesList: results = ' + JSON.stringify(results));
          resolve(results);
        }
      }
    );
  });
}

function userCoursesListByCourseId(course_id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM user_courses WHERE course_id = ?',
      [course_id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log('userCoursesListByCourseId: results = ' + JSON.stringify(results));
          resolve(results);
        }
      }
    );
  });
}

function userCoursesListByUserIdAndCourseId(user_id, course_id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM user_courses WHERE user_id = ? AND course_id = ?',
      [user_id, course_id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log('userCoursesListByUserIdAndCourseId: results = ' + JSON.stringify(results));
          resolve(results);
        }
      }
    );
  });
}

function userCoursesDelete(id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM user_courses WHERE id = ?',
      [id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log('userCoursesDelete: results = ' + JSON.stringify(results));
          resolve();
        }
      }
    );
  });
}

function userCoursesDeleteByUserIdAndCourseId(user_id, course_id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM user_courses WHERE user_id = ? AND course_id = ?',
      [user_id, course_id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log('userCoursesDeleteByUserIdAndCourseId: results = ' + JSON.stringify(results));
          resolve();
        }
      }
    );
  });
}

function userCoursesDeleteByCourseId(course_id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM user_courses WHERE course_id = ?',
      [course_id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log('userCoursesDeleteByCourseId: results = ' + JSON.stringify(results));
          resolve();
        }
      }
    );
  });
}

function userCoursesDeleteByUserId(user_id) {
  return new Promise((resolve, reject) => {
    pool.query(
      'DELETE FROM user_courses WHERE user_id = ?',
      [user_id],
      (error, results) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log('userCoursesDeleteByUserId: results = ' + JSON.stringify(results));
          resolve();
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
  getUserByToken,
  isEmailVerified,
  storeVerificationToken,
  getVerificationToken,
  deleteVerificationToken,
  updateUserEmailVerified,
  storeRememberMeToken,
  getRememberMeTokenByEmail,
  getRememberMeTokenByEmailToken,
  getUserByRememberMeToken,
  deleteRememberMeTokenByEmailToken,
  updateRememberMeTokenExpires,
  storePasswordResetToken,
  getPasswordResetToken,
  updateUserPassword,
  deletePasswordResetToken,
  logUserAction,
  timeout_delete_remember_me,
  timeout_delete_email_verification,
  addCourse,
  coursesList,
  getCourseById,
  coursesUpdate,
  coursesDelete,
  addLessons,
  lessonsList,
  getLessonById,
  lessonsUpdate,
  lessonsDelete,
  addOrder,
  ordersList,
  ordersListByCourseId,
  ordersListByUserIdAndCourseId,
  ordersDelete,
  addCourseToUser,
  userCoursesList,
  userCoursesListByCourseId,
  userCoursesListByUserIdAndCourseId,
  userCoursesDelete,
  userCoursesDeleteByUserIdAndCourseId,
  userCoursesDeleteByCourseId,
  userCoursesDeleteByUserId
};


