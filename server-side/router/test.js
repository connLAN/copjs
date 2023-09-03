const express = require('express');
const app = express();
const router = express.Router();

const fs = require('fs');
const morgan = require('morgan');
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

  serveStaticDirectories(app);

function accessLogger(req, res, next) {
    const accessLogStream = fs.createWriteStream(path.join(__dirname, 'a01.log'), { flags: 'a' });
    morgan('combined', { stream: accessLogStream })(req, res, next);
}
app.use(accessLogger);

// Define routes for each HTML page
router.get('/test', function(req, res) {
    res.sendFile(path.join(__dirname, '../html/test.html'));
});

router.post('/reset_password000', function(req, res) {
    console.log('req.body: ', req.body);
    res.send('test');
});


// Mount the router on the app
app.use('/', router);




console.log('Server started on port 3000');
app.listen(3000);