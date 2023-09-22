const path = require('path');
const express = require('express');
const fs = require('fs');
const router = express.Router();
const addCourseRouter = express.Router();

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






function handleListCourse(req, res) {
}

courseRouter

module.exports = {
    handleListCourse
};
