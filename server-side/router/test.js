
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

let now = Date.now();
let timestampInSeconds = Math.floor(now / 1000);


console.log(timestampInSeconds);


console.log(config.session.cookieExpires);

let expires = config.session.cookieExpires;

now += expires;
console.log("expires=" +expires +'  ' + now);

timestampInSeconds = Math.floor(now / 1000);
console.log(timestampInSeconds);
