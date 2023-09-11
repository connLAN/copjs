const express = require('express');
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
      /^\/webfonts\/fa-solid-900\.(woff2|woff|ttf|svg)/,
      /^\/webfonts\/fa-brands-400\.(woff2|woff|ttf|svg)/,
      /^\/css\/bootstrap\.min\.css/,
      /^\/bg\d+\.html$/, // Exclude paths like bg1.html, bg2.html, bg3.html
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


    // Check if user is authenticated
    const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
    if (isAuthenticated) {
      console.log('isAuthenticated, next()');
      next();
      return;
    }
  
    // Check if request path is a login path
    const loginPaths = ['/login'];
    if (loginPaths.includes(req.path)) {
      // Skip middleware for login paths
      console.log('Skip middleware for login paths');
      next();
      return;
    }
  
    // Check if remember me cookie is set
    if (req.cookies.remember_me) {
      const token = req.cookies.remember_me.token;
      console.log('MAIN ROUTER: token = ' + token);
  
      db.getUserByToken(token)
        .then(user => {
          if (user) {
            if(user.expires > new Date()) {
              req.session.user = user;
              res.cookie('auth', 'true', { maxAge: 3600000 }); // Set cookie expiration to 1 hour
  
              db.updateTokenexpires(token)
                .then(() => {
                  console.log('Token expires updated');
                })
                .catch(error => {
                  console.error(error);
                  res.status(500).send('Internal server error: when updating token expires');
                });
  
                console.log('Remember me OK, next()');
                next();
                        
            }else{
              console.log('Remember me OK, but token has expired, redirecting to login');
              res.redirect('/login');
              return;
            }
          } else {
            console.log('Remember me OK, but user not found, redirecting to login');
            res.redirect('/login');
            return;
          }
        })
        .catch(error => {
          console.error(error);
          res.status(500).send('Internal server error');
          return;
        });
    } else {
      console.log('Remember me not OK, redirecting to login');
      res.redirect('/login');
      return;
    }
    

    return next();
}


// Define a router for all HTML pages
const htmlRouter = express.Router();

htmlRouter.get('/dashboard', (req, res) => {
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






function notFoundHandler(req, res) {
  res.status(404).sendFile(path.join(htmlPath, '404.html'));
}

module.exports = {
  checkAuthentication,
  htmlRouter,
  notFoundHandler
};