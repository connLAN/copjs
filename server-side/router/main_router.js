const express = require('express');

const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());

const path = require('path');
fs = require('fs');
const morgan = require('morgan');

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
} = require('./app_config');

const db = require(path.join(databasePath + '/database'));

const {
  redisClient,
  getSessionId,
  storeSessionId,
  checkSession
} = require(path.join(routerPath + '/session'));


function checkCookie(req, res, next) {
  console.log('checkCookie: req.path = ' + req.path
              + '  req.method = ' + req.method
  );

  // Check if remember me cookie is set
  if (req.cookies.rememberMe) {
    const {email,token, expires, authType} = JSON.parse(req.cookies.rememberMe);
    console.log('rememberMe cookie is set, email = '
      + email + ' token = ' + token + ' expires = ' 
      + expires + ' authType = ' + authType);

    db.getUserByToken(token)
      .then(user => {
        if (user) {
          if(user.expires > new Date()) {
            req.session.user = user;
            // console.log("---- set auth cookie");
            // res.cookie('auth', 'true', { maxAge: 3600000 }); // Set cookie expiration to 1 hour

            db.updateRememberMeTokenExpires(email, token)
              .then(() => {
                console.log('Token expires updated');
              })
              .catch(error => {
                console.error(error);
                res.status(500).send('Internal server error: when updating token expires');
                return;
              });

              console.log('Remember me OK, next()');

              if( req.path === '/login'){
                res.redirect('/dashboard');
                return;
              }else{
                return next();
              }

          }else{
            console.log('Remember me OK, but token has expired, redirecting to login');
            res.redirect('/login');
            return;
          }
        } else {
          console.log('checkAuthentication: Remember me OK, but user not found, redirecting to login');

          return next();
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Internal server error');
        return;
      });
  } else {
    console.log('rememberMe cookie is not set, redirecting to login');
    if( req.path === '/login'){
      return next();
    }else{
      res.redirect('/login');
      return;
    }    
  }
    
}



function checkAuthentication(req, res, next) {
    console.log('MAIN ROUTER: req.path = ' + req.path
               + '  req.method = ' + req.method
               + '  req.session.id = ' + req.session.id);

    
    const excludedPaths = [
      /^\/register/,
      /^\/forgot_password/,
      /^\/reset_password/,
      /^\/fail/,
      /^\/verifyRegister/,
      /^\/test/,
      /^\/logout/,
      /^\/webfonts\/fa-solid-900\.(woff2|woff|ttf|svg)/,
      /^\/webfonts\/fa-brands-400\.(woff2|woff|ttf|svg)/,
      /^\/css\/bootstrap\.min\.css/,
      /^\/bg\d+\.html$/, // Exclude paths like bg1.html, bg2.html, bg3.html
      /^.*\.css$/,// Exclude all paths that end with .css
      /^.*\.js$/,// Exclude all paths that end with .js
      /^.*\.jpg$/,// Exclude all paths that end with .jpg
      /^.*\.mp4$/,// Exclude all paths that end with .mp4
      /^.*\.webm$/,// Exclude all paths that end with .webm
      /^.*\.srt$/,// Exclude all paths that end with .srt
      /^.*\.json$/,// Exclude all paths that end with .json
      /^.*\.php$/ // Exclude all paths that end with .php
    ];
  
    if (excludedPaths.some(path => path.test(req.path))) {
      return next();
    }

    return next();

/*
    // Check if user is authenticated
    const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
    if (isAuthenticated) {
      console.log('isAuthenticated, next()');
      return next();
    }else{
      if(req.path === '/login' ){
        console.log('/login, next()');
        return next();
      }else{

        // Check if remember me cookie is set
        // checkCookie(req, res, next);

        console.log('not isAuthenticated, redirecting to login');
        res.redirect('/login');
        return;
      }
    }
    */


}


// Define a router for all HTML pages
const htmlRouter = express.Router();

// TODO: Add login check
htmlRouter.get('/dashboard', (req, res) => {
    // Check if user is authenticated
    // const res.session.user = req.cookies.auth === 'true' || req.query.auth === 'true';


    res.sendFile(path.join(htmlPath, 'dashboard.html'));
}); 

htmlRouter.get('/forgot_password', (req, res) => {
  res.sendFile(path.join(htmlPath, 'forgot_password.html'));
});

htmlRouter.get('/reset_password', (req, res) => {
  res.sendFile(path.join(htmlPath, 'reset_password.html'));
});


htmlRouter.get('/', (req, res) => {
  const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
  if (isAuthenticated) {
    // 用户已通过身份验证，显示 dashboard 页面
    res.redirect('/dashboard');
    return;
  }   
  res.sendFile(path.join(htmlPath, 'index.html'));
});

htmlRouter.get('/index', (req, res) => {
  const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
  if (isAuthenticated) {
    // 用户已通过身份验证，显示 dashboard 页面
    res.redirect('/dashboard');
    return;
  }   
  res.sendFile(path.join(htmlPath, 'index.html'));
});

htmlRouter.get('/index.html', (req, res) => {
  const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
  if (isAuthenticated) {
    // 用户已通过身份验证，显示 dashboard 页面
    res.redirect('/dashboard');
    return;
  }

  res.sendFile(path.join(htmlPath, 'index.html'));
});


htmlRouter.get('/register', (req, res) => {
  const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
  if (isAuthenticated) {
    // 用户已通过身份验证，显示 dashboard 页面
    res.redirect('/dashboard');
    return;
  }

  res.sendFile(path.join(htmlPath, 'register.html'));
});

htmlRouter.get('/login', (req, res) => {
  const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
  if (isAuthenticated) {
    // 用户已通过身份验证，显示 dashboard 页面
    res.redirect('/dashboard');
    return;
  }
  res.sendFile(path.join(htmlPath, 'login.html'));
});

htmlRouter.get('/logout', (req, res) => {
  res.sendFile(path.join(htmlPath, 'logout.html'));
});

htmlRouter.get('/fail', (req, res) => {
  res.sendFile(path.join(htmlPath, 'fail.html'));
});

htmlRouter.get('/welcome', (req, res) => {
  res.sendFile(path.join(htmlPath, 'welcome.html'));
});


htmlRouter.get('/test', (req, res) => {
  res.sendFile(path.join(htmlPath, 'test.html'));
});

htmlRouter.get('/courses', (req, res) => {
  res.sendFile(path.join(htmlPath, 'courses.html'));
});

htmlRouter.get('/courses.html', (req, res) => {
  res.sendFile(path.join(htmlPath, 'courses.html'));
});

htmlRouter.get('/order', (req, res) => {
  res.sendFile(path.join(htmlPath, 'order.html'));
});

htmlRouter.get('/order.html', (req, res) => {
  res.sendFile(path.join(htmlPath, 'order.html'));
});

htmlRouter.get('/learning', (req, res) => {
  res.sendFile(path.join(htmlPath, 'learning.html'));
});
htmlRouter.get('/learning.html', (req, res) => {
  res.sendFile(path.join(htmlPath, 'learning.html'));
});


// temp for test
htmlRouter.get('/setcookie', (req, res) => {
  const data = {
    email: 'user@example.com', 
    token: 'abc123',
    authType: 'rememberMe',
    auth: true   
  };

  res.cookie('rememberMe', 
            JSON.stringify(data),
            {
              expires: new Date(Date.now() + 86400000),
              httpOnly: false
            }
  );

  res.send('cookie set'); //Sets name = express
});

htmlRouter.get('/getcookie', (req, res) => {
  res.sendFile(path.join(htmlPath, 'getcookie.html'));
});
htmlRouter.get('/getcookie.html', (req, res) => {
  res.sendFile(path.join(htmlPath, 'getcookie.html'));
});



function notFoundHandler(req, res) {
  res.status(404).sendFile(path.join(htmlPath, '404.html'));
}

module.exports = {
  checkAuthentication,
  htmlRouter,
  notFoundHandler
};
