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
  const config = appConfig;


  const {
    serverSessions,
    getSessionId,
    storeSessionId,
    checkSession,
    logoutOtherLogins
  } = require(path.join(routerPath, '/session'));

function logoutHandler(req, res) {
    console.log('LOGOUT HANDLER: req.path = ' + req.path + '  req.method = ' + req.method);
    const email = req.session.user.email;
    const rememberMeToken = req.cookies.rememberMe;

    if (rememberMeToken) {
        const index = rememberMeTokens.indexOf(rememberMeToken);
        if (index !== -1) {
            rememberMeTokens.splice(index, 1);
        }
        // // res.clearCookie('rememberMe');
    }

    logoutOtherLogins(email);
    req.session.destroy();
    res.redirect('/login');
}

module.exports = {
    logoutHandler
};
