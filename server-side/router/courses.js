const path = require('path');
const express = require('express');

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

const db = require(path.join(databasePath, 'database'));

async function handleListCourse(req, res) {
    db.coursesList()
        .then(result => {
            res.json(result);
        })
        .catch(error => {
            res.status(500).json({ error });
        });
}


module.exports = {
    handleListCourse
};
