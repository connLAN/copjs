const express = require('express');
const path = require('path');

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

const db = require(path.join(rootPath + '/database'));


function checkAuthentication(req, res, next) {
    const excludedPaths = ['/register',
                          '/forgot_password',
                          '/reset_password',
                          '/fail', 
                          '/verify',
                          '/test'];
                          
    if (excludedPaths.includes(req.path)) {
      // Skip middleware for excluded paths
      console.log('Skip middleware for excluded paths');
      next();
      return;
    }
  
    // Check if user is authenticated
    const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';
    if (isAuthenticated) {
      console.log('isAuthenticated, direct to dashboard AAA');
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
        });
    } else {
      console.log('Remember me not OK, redirecting to login');
      res.redirect('/login');
      return;
    }
}


// Define a router for all HTML pages
const htmlRouter = express.Router();

function dashboardHandler(req, res) {
    // Check if user is authenticated
    const isAuthenticated = req.cookies.auth === 'true' || req.query.auth === 'true';

    if (isAuthenticated) {
        // User is authenticated, show dashboard page
        res.sendFile(path.join(htmlPath, 'dashboard.html'));
    } else {
        // User is not authenticated, redirect to login page
        console.Console('not authenticated, direct to login');
        res.redirect('/login');
    }
}  
htmlRouter.get('/dashboard', dashboardHandler);


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

htmlRouter.get('/fail', (req, res) => {
  res.sendFile(path.join(htmlPath, 'fail.html'));
});

htmlRouter.get('/welcome', (req, res) => {
  res.sendFile(path.join(htmlPath, 'welcome.html'));
});


htmlRouter.get('/test', (req, res) => {
  res.sendFile(path.join(htmlPath, 'test.html'));
});

function notFoundHandler(req, res) {
  res.status(404).sendFile(path.join(htmlPath, '404.html'));
}

module.exports = {
  checkAuthentication,
  htmlRouter,
  notFoundHandler
};