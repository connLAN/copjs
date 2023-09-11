const express = require('express');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
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
const { config } = require('process');
const { updateRememberMeTokenexpires } = require('../database/database');

const db = require(path.join(databasePath, '/database'));

const {
    sendMail,
    sendResetPasswordEmail,
    sendVerificationEmail,
    sendWelcomeEmail,
    sendGoodbyeEmail
} =  require(path.join(routerPath, '/email'));


const {
    serverSessions,
    getSessionId,
    storeSessionId,
    checkSession,
    logoutOtherLogins
  } = require(path.join(routerPath, '/session'));

async function isValidUser(email, password) {
    const user = await db.getUserByEmail(email);
    if (user) {
        const hashedPassword = user.password;
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (isMatch) {
            return true;
        }
    }
    return false;
}

async function checkRememberMeToken(req, res, email, token, expires) {
    // check if the token is valid
    const today = new Date();

    if (expires < today) {
        // Delete token from remember_me table
        try {
            await db.deleteTokenByEmail(email);
            console.log('Token deleted from remember_me table');
        } catch (error) {
            console.error(error);
            // res.status(500).send('Internal server error');
            return false;
        }
        // Delete rememberMe cookie
        res.clearCookie('rememberMe');
        console.log('rememberMe cookie deleted');
        // res.status(401).send('Your session has expired, please login again');
        return false;
    } 

    // check if the token matches the one stored in the database
    const user = await db.getUserByEmail(email);
    if (user) {
        const storedToken = await db.getRememberMeTokenByEmail(email);
        if (storedToken) {
            if (storedToken.token === token && storedToken.expires >= expires) {   
                // Set session user with email and expires
                req.session.user = { email: email, expires: expires };
                // res.redirect('/dashboard');
                return true;
            } else {
                // Delete token from remember_me table
                try {
                    await db.deleteTokenByEmail(email);
                    console.log('Token deleted from remember_me table');
                } catch (error) {
                    console.error(error);
                    // res.status(500).send('Internal server error');
                    return false;
                }
                // Delete rememberMe cookie
                res.clearCookie('rememberMe');
                console.log('rememberMe cookie deleted');
                // res.status(401).send('Your session has expired, please log in again');
                return false;
            }
        } else {    
            // Delete rememberMe cookie
            res.clearCookie('rememberMe');
            console.log('rememberMe cookie deleted');
            // res.status(401).send('Your session has expired, please log in again');
            return false;
        }
    } else {
        // Delete rememberMe cookie
        res.clearCookie('rememberMe');
        console.log('rememberMe cookie deleted');
        // res.status(401).send('Your session has expired, please log in again');
        return false;
    }
}


async function loginHandler(req, res) {
    const { email, password, isRememberMe } = req.body;

    // Validate input
    if (!email || !password) {
        res.status(400).send('Email and password are required');
        return;
    }

    const escpEmail = validator.escape(email);
    const escpPassword = validator.escape(password);

    if(escpEmail !== email || !validator.isEmail(email)){
        res.status(400).send('Invalid email input');
        return;
    }

    if(escpPassword !== password || !validator.isLength(password, {min: 8, max: 20})
        || !validator.isAlphanumeric(password)){
        res.status(400).send('Invalid password input');
        return;
    }

    //check if the user is already logged in
    if (req.session.user) {
        if (req.session.user.email === email) {
            res.send('You are already logged in');
            return;
        }
    }

    // check cookie rememberMe
    if (req.cookies.rememberMe) {
        const cookieData = JSON.parse(req.cookies.rememberMe);
        if (cookieData.authType === 'rememberMe') {

            const { email, token, expires } = cookieData;
            const result = await checkRememberMeToken(req, res, email, token, new Date(expires));
            if (result) {
                if(isRememberMe){
                    updateRememberMeTokenexpires(email, token, new Date(Date.now() + config.rememberMeCookieExpires));
                }

                res.send('You have logged in already');
                return;
            }
        }else{
            console.log('Invalid cookie authType');
        }
    }

    // normal login process
    const isValid = await isValidUser(email, password);
    if (isValid) {
        // Set session user with email and expires
        req.session.user = { email: email, expires: new Date(Date.now() + 3600000) };
        
        // Set rememberMe cookie
        if (isRememberMe) {
            const expiresNew = new Date(Date.now() + config.rememberMeCookieExpires);
            const token = crypto.randomBytes(64).toString('hex');
            const cookieData = { email: email, token: token, expires: expiresNew, authType: 'rememberMe' };
            res.cookie('rememberMe', JSON.stringify(cookieData));
            
            // Store token in remember_me table
            try {
                await db.storeTokenByEmail(email, token, expires);
                console.log('Token stored in remember_me table');
                res.send('You are logged in');
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal server error');
                return;
            }
        }

        // Redirect to dashboard
        res.redirect('/dashboard');
    } else {
        res.status(401).send('Invalid email or password');
    }
}


module.exports = {
    checkRememberMeToken,
    loginHandler
};