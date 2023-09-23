fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const path = require('path');

const rootPath = path.normalize(__dirname + '/..');
const htmlPath = path.join(rootPath, 'html');
const publicPath = path.join(rootPath, 'public');
const imgPath = path.join(publicPath, 'img');
const uploadPath = path.join(publicPath, 'upload');
const cssPath = path.join(publicPath, 'css');
const jsPath = path.join(publicPath, 'js');
const routerPath = path.join(rootPath, 'router');
const commonPath = path.join(rootPath, 'common');
const databasePath = path.join(rootPath, 'database');
const configPath = path.join(rootPath, 'config');
const cronPath = path.join(rootPath, 'cron');


function serveStaticDirectories(app) {
    app.use(express.static(publicPath));
    app.use(express.static(imgPath));
    app.use(express.static(uploadPath));
    app.use(express.static(cssPath));
    app.use(express.static(jsPath));
    app.use(express.static(htmlPath));
    app.use(express.static(routerPath));
    app.use(express.static(commonPath));
    app.use(express.static(databasePath));
    app.use(express.static(configPath));
    app.use(express.static(cronPath));
    app.use(express.static(rootPath));
}


const appConfig = JSON.parse(fs.readFileSync(routerPath +  '/config.json', 'utf8'));

// console.log('appConfig = ' + JSON.stringify(appConfig));


module.exports = {
    rootPath,
    htmlPath,
    publicPath,
    imgPath,
    uploadPath,
    routerPath,
    commonPath,
    databasePath,
    configPath,
    cronPath,
    serveStaticDirectories,
    appConfig
};