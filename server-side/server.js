const express = require('express');
const mysql = require('mysql2/promise');
const cookieParser = require('cookie-parser');
const session = require('express-session');
// const RedisStore = require('connect-redis').default;
const path = require('path');


const crypto = require('crypto');
// const fs = require('fs');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const validator = require('validator');

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
} = require('./router/app_config');
const config = appConfig;

const app = express();
serveStaticDirectories(app);

// Parse JSON and URL-encoded query parameters
app.use(express.json());
app.use(express.json({limit: '500mb'}));

app.use(express.urlencoded({ extended: true }));


app.use(cookieParser());

const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb",  extended: true }));


function sessionHandler(app, config) {
  app.use(session({
    secret: config.session.secret,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: true, maxAge: config.session.session_timeout_in_seconds }
  }));
}
sessionHandler(app, config);

// // write access log
// accessLogger = require('./router/common');
// app.use(accessLogger);

// Connect to the MySQL server and create the "mydb" database and users table
// call database.js
const db = require( path.join(databasePath, '/database'));

// Initialize the database
db.initializeDatabase();


mainRouter = require(path.join(routerPath + '/main_router'));
app.use(mainRouter.checkAuthentication); 
// cover all methods, including GET, POST, PUT, DELETE, etc.

const registerRouter = require('./router/register');
app.post('/register', registerRouter.registerHandler);
app.get('/verifyRegister', registerRouter.verifyRegisterHandler);


const loginRouter = require(path.join(routerPath + '/login'));
app.post('/login', loginRouter.loginHandler);

const {
  forgotPasswordHandler
} = require(path.join(routerPath + '/forgot_password'));
app.post('/forgot_password', forgotPasswordHandler);

const {
  verifyResetPasswordHandler,  
  resetPasswordHandler
} = require(path.join(routerPath + '/reset_password'));
app.post('/verify_reset_password', verifyResetPasswordHandler);
app.post('/reset_password000', resetPasswordHandler);


//////////////////////////////////////
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const courseRouter = require(path.join(routerPath, 'courses'));
app.post('/addCourse', upload.single('image'), courseRouter.handleAddCourse);


app.post('/logout', (req, res) => {
  logoutHandler(req, res);
});

/////////////////////////////////////
const { 
  logoutOtherLogins,
  logoutHandler
  } 
   = require(path.join(routerPath + '/logout'));

app.post('/logout', (req, res) => {
  logoutHandler(req, res);
});

/////////////////////////////////////


app.use(mainRouter.htmlRouter);
app.use(mainRouter.notFoundHandler);



/*
app.post('/logout_other_logins', (req, res) => {
  logoutOtherLogins(req, res);
});

const multer = require('multer');
// Configure multer middleware to handle file uploads
const upload = multer({ dest: 'uploads/' });

// Handle POST requests to /submit
app.post('/addCourse', upload.single('image'), (req, res) => {
  // req.body contains the form data
  console.log(req.body);
  // req.file contains information about the uploaded file
  console.log(req.file);
  res.send('Form submitted successfully');
});

*/



require('./router/cron');

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
