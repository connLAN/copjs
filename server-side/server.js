const path = require('path');
const express = require('express');
const morgan = require('morgan');
const mysql = require('mysql2/promise');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const fs = require('fs');
const cron = require('node-cron');
const app = express();

// Serve static files from the "public" directory
app.use(express.static('public'));
app.use(express.static('public/img'));
app.use(express.static('/'));

// create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }));

// Parse JSON and URL-encoded query parameters
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

const bcrypt = require('bcrypt');
const validator = require('validator');
const saltRounds = 10;

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
console.log(`Server running on port ${config.port}`);
console.log(`Database connection: ${config.database.host}:${config.database.port}`);

const session = require('express-session');
app.use(session({
  secret: config.session.secret,  
  resave: false,
  saveUninitialized: true
}));

// Connect to the MySQL server and create the "mydb" database and users table
// call database.js
const db = require('./database');

// Initialize the database
db.initializeDatabase();

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

// Define a middleware function to be used for every secured routes
app.use((req, res, next) => {
  const excludedPaths = ['/register','/fail', '/verify'];
  if (excludedPaths.includes(req.path)) {
    // Skip middleware for excluded paths
    console.log('Skip middleware for excluded paths');
    next();
    return;
  }

  // 检查是否已通过身份验证
  const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
  if (isAuthenticated) {
    console.log('isAuthenticated, direct to dashboard AAA');
    // res.redirect('/dashboard');
    next();
    return;
  }

  if (req.cookies.remember_me) {
    const token = req.cookies.remember_me;
    const user = db.getUserByToken(token);

    db.getUserByToken(token)
      .then(user => {
        if (user) {
          if(user.expires > new Date()) {
            req.session.user = user;
            res.cookie('auth', 'true', { maxAge: 3600000 }); // 设置 cookie 有效期为 1 小时

            db.updateTokenexpires(token)
              .then(() => {
                console.log('Token expires updated');
              })
              .catch(error => {
                console.error(error);
                res.status(500).send('Internal server error');
              });

              console.log('remembe me ok, direct to dashboard');
              // res.redirect('/dashboard');
              next();
                      
          }else{
            console.log('remembe me ok, but token expires, direct to login');
            res.redirect('/login');
            return;
          }
        } else {
          console.log('remembe me ok, but user not found, direct to login');
          res.redirect('/login');
          return;
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Internal server error');
      });
  } else {
    console.log('remembe me not ok, direct to login');
    res.redirect('/login');
    return;
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

    // Sanitize input
    const sanitizedEmail = validator.escape(email);
    const sanitizedName = validator.escape(name);
    const sanitizedPassword = validator.escape(password);

    if(sanitizedEmail !== email
      || !validator.isEmail(sanitizedEmail)){
      res.status(400).send('Invalid email input');
      return;
    }
 
    if(sanitizedName !== name 
      || !validator.isLength(sanitizedName, {min: 3, max: 20})
      || !validator.isAlphanumeric(sanitizedName)){
      res.status(400).send('Invalid name input');
      return;
    }

    if(sanitizedPassword !== password  
      || !validator.isLength(sanitizedPassword, {min: 8, max: 20})
      || !validator.isAlphanumeric(sanitizedPassword)){
      res.status(400).send('Invalid password input');
      return;
    }

    // Validate input
    // avoid duplicate email
    db.getUserByEmail(email)
      .then(user => {
        if (user) {
          console.log('This email is registered');
          res.status(400).send('This email is already registered');
          return;
        } else {
          console.log('This email is not registered');
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Internal server error: when checking if the email is already registered');
      });

    db.getUserByName(name)
      .then(user => {
        if (user) {
          console.log('This name is registered');
          res.status(400).send('This name is already registered');
          return;
        } else {
          console.log('This name is not registered');
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Internal server error: when checking if the name is already registered');
      });

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    db.storeUser(name, email, hashedPassword)
      .then(() => {
        console.log('User information stored');
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Internal server error: when storing user information');
      });

    // Set a cookie to remember the user's email
    res.cookie('email', email, { maxAge: 3600000, httpOnly: true, secure: true, sameSite: 'strict' });

    // Generate a verification token for the user, write into the database , and sent it to the user's email address
    const token = crypto.randomBytes(16).toString('hex');
    db.storeVerificationToken(email, token)
      .then(() => {
        console.log('Verification token stored');
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Internal server error: when storing verification token');
      });

    // Send the verification token to the user's email address
    // Define the email message
    const mailOptions = {
      from: config.email.auth.user,
      to: email,
      subject: 'Verification Token',
      text: 'Your have just registered ' + config.web.domain +'\n'
       +'\n'
       + 'Please click the link below to verify your email address:'
       + 'http://'
       + config.web.domain +':' + config.port
       + '/verify?email=' + email + '&token=' + token
    };

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

// Define a router for the verification link
app.get('/verify', async (req, res) => {
  const { email, token } = req.query;

  // Check if the verification token is valid
  db.getVerificationToken(email)
    .then(token => {
      if (token) {
        console.log('email = ' + email + ' token = ' + token);

        // Check if the verification token has expired
        const expires = new Date(token.created_at).getTime() + config.session.verify_token_timeout_in_seconds; 
        if (expires < Date.now()) {
          // Verification token has expired
          db.deleteVerificationToken(email)
            .then(() => {
              console.log('Verification token has expired');
            })
            .catch(error => {
              console.error(error);
              res.status(500).send('Internal server error');
            });

          return res.status(400).send('Verification token has expired');
        }else{
          console.log('Verification token has not expired');
          db.deleteVerificationToken(email)
            .then(() => {
              console.log('Verification token deleted');
            }
            )
            .catch(error => {
              console.error(error);
              res.status(500).send('Internal server error');
            }
            );

          // Update the user's email address as verified
          db.updateUserEmailVerified(email)
            .then(() => {
              console.log('User email verified');
            })
            .catch(error => {
              console.error(error);
              res.status(500).send('Internal server error');
            });

          // Redirect the user to the login page
          res.redirect('/login');
        }

      } else {  
        console.log('Verification token not found');
        return res.status(400).send('Verification token not found');  
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal server error');
    });
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

  const sanitizedEmail = validator.escape(email);
  const sanitizedPassword = validator.escape(password);

  if(sanitizedEmail !== email
    || !validator.isEmail(sanitizedEmail)){
    res.status(400).send('Invalid email input');
    return;
  }

  if(sanitizedPassword !== password  
    || !validator.isLength(sanitizedPassword, {min: 8, max: 20})
    || !validator.isAlphanumeric(sanitizedPassword)){
    res.status(400).send('Invalid password input');
    return;
  }

  // Check if the user exists
  db.getUserByEmail(sanitizedEmail)
    .then(user => {
      if (user) {
        console.log('This email is registered');
        // check if the user's email address is verified
        if (!user.email_verified) {
          console.log('Email not verified');
          res.status(401).send('Email not verified, \nplease open your email and click the verification link');
          return;
        }else{
          console.log('Email verified');
          // compare the hashed password with the password provided by the user
          const hashedPassword = user.password;
          bcrypt.compare(password, hashedPassword)
            .then(isMatch => {
              if (!isMatch) {
                res.status(401).send('Invalid email or password');
                return;
              }else{
                // Set a cookie to remember the user's email
                const rememberMe = req.body.rememberMe;
                const token = crypto.randomBytes(64).toString('hex');
                const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

                if (rememberMe) {
                  // Store token in remember_me table
                  db.storeToken(email, token, expires)
                    .then(() => {
                      // Set remember_me cookie with token
                      res.cookie('remember_me', token, {
                        expires: expires,
                        httpOnly: true,
                        secure: true
                      });

                      // Set session user with email and expires
                      req.session.user = { email: email, expires: expires };
                      res.send('Login successful!');
                    })
                    .catch(error => {
                      console.error(error);
                      res.status(500).send('Internal server error');
                    });
                } else {
                  // Set session user with email only
                  req.session.user = { email: email };
                  res.redirect('/dashboard');
                }
              }
            })
            .catch(error => {
              console.error(error);
              res.status(500).send('Internal server error');
            });
        }
      } else {
        console.log('This email is not registered');
        res.status(401).send('Invalid email or password');
        return;
      }
    })
  });

// Mount the router on the app
app.use('/login', loginRouter);


// handle requests
app.get('/cookie', (req, res) => {
  // get the value of the "remeeber_me" cookie

  const token = req.cookies.remember_me;
  const email = req.cookies.email;

  res.send('Your cookie value is: token = ' + token
                                  + ' email = ' + email);

});


// Define a router for all HTML pages
const htmlRouter = express.Router();


htmlRouter.get('/dashboard', (req, res) => {
  // 检查是否已通过身份验证
  const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';

  if (isAuthenticated) {
    // 用户已通过身份验证，显示 dashboard 页面
    res.sendFile(path.join(__dirname, '/', 'dashboard.html'));
  } else {
    // 用户未通过身份验证，重定向到登录页面
    res.redirect('/login');
  }
});


htmlRouter.get('/', (req, res) => {
  const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
  if (isAuthenticated) {
    // 用户已通过身份验证，显示 dashboard 页面
    res.redirect('/dashboard');
    return;
  }   
  res.sendFile(path.join(__dirname, '/', 'index.html'));
});
htmlRouter.get('/index', (req, res) => {
  const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
  if (isAuthenticated) {
    // 用户已通过身份验证，显示 dashboard 页面
    res.redirect('/dashboard');
    return;
  }   
  res.sendFile(path.join(__dirname, '/', 'index.html'));
});
htmlRouter.get('/index.html', (req, res) => {
  const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
  if (isAuthenticated) {
    // 用户已通过身份验证，显示 dashboard 页面
    res.redirect('/dashboard');
    return;
  } 

  res.sendFile(path.join(__dirname, '/', 'index.html'));
});

htmlRouter.get('/register', (req, res) => {
  const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
  if (isAuthenticated) {
    // 用户已通过身份验证，显示 dashboard 页面
    res.redirect('/dashboard');
    return;
  } 

  res.sendFile(path.join(__dirname, '/', 'register.html'));
});
htmlRouter.get('/login', (req, res) => {
  const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
  if (isAuthenticated) {
    // 用户已通过身份验证，显示 dashboard 页面
    res.redirect('/dashboard');
    return;
  }
  res.sendFile(path.join(__dirname, '/', 'login.html'));
});

htmlRouter.get('/fail', (req, res) => {
  res.sendFile(path.join(__dirname, '/', 'fail.html'));
});

htmlRouter.get('/welcome', (req, res) => {
  res.sendFile(path.join(__dirname, '/', 'welcome.html'));
});


app.use('/', htmlRouter);

// Define a 404 page for non-existent pages
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '/', '404.html'));
});


// Schedule a cron job to delete unverified users and email verification records, '0 0 * * *' means every day at 00:00
cron.schedule('0 0 * * *', async () => {
  // Delete email verification records
  db.timeout_delete_email_verification()
    .then(() => {
      console.log('Delete email verification records');
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal server error');
    });

  // Delete remember me records
  db.timeout_delete_remember_me()
    .then(() => {
      console.log('Delete remember me records');
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal server error');
    });
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});



