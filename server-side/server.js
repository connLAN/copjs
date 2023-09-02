const path = require('path');
const express = require('express');
// const morgan = require('morgan');
const mysql = require('mysql2/promise');
const cookieParser = require('cookie-parser');
const session = require('express-session');

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
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const bodyParser = require('body-parser');
app.use(bodyParser.json());

function sessionHandler(app, config) {
  app.use(session({
    secret: config.session.secret,  
    resave: false,
    saveUninitialized: true
  }));
}
sessionHandler(app, config);

// write access log
accessLogger = require('./router/common');
app.use(accessLogger);

// Connect to the MySQL server and create the "mydb" database and users table
// call database.js
const db = require( path.join(rootPath, '/database'));

// Initialize the database
db.initializeDatabase();


mainRouter = require(path.join(routerPath + '/main_router'));
app.use(mainRouter.checkAuthentication);   // cover all methods, including GET, POST, PUT, DELETE, etc.

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
app.post('/reset_password', resetPasswordHandler);

app.use(mainRouter.htmlRouter);
app.use(mainRouter.notFoundHandler);

require('./router/cron');

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
