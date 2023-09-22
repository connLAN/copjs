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
const config = appConfig;

const { updateRememberMeTokenExpires } = require('../database/database');

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
        // Delete token from rememberMe table
        try {
            await db.deleteRememberMeTokenByEmailToken(email);
            console.log('Token deleted from rememberMe table');
        } catch (error) {
            console.error(error);
            // res.status(500).send('Internal server error');
            return false;
        }

        // Delete rememberMe cookie
        // res.clearCookie('rememberMe');
        console.log('000 rememberMe cookie deleted');
        return false;
    }

    // check if the token is in rememberMe table
    const tokenInTable = await db.getRememberMeTokenByEmailToken(email, token);
    if (tokenInTable) {
        // check if the token has expired
        const expiresInTable = tokenInTable.expires;
        if (expiresInTable < today) {
            // Delete token from rememberMe table
            try {
                await db.deleteRememberMeTokenByEmailToken(email, token);
                console.log('Token deleted from rememberMe table');
            } catch (error) {
                console.error(error);
                return false;
            }

            // Delete rememberMe cookie
            // res.clearCookie('rememberMe');
            console.log('111 rememberMe cookie deleted');
            return false;
        } else {
            // update token expires
            try {
                await db.updateRememberMeTokenExpires(email, token, expires);
                console.log('Token expires updated');
            } catch (error) {
                console.error(error);
                return false;
            }

            // check is user exists
            const user = await db.getUserByEmail(email);
            if (user) {
                return true;
            }else{
                return false;
            }
        }
    } else { // token not in rememberMe table
        // Delete rememberMe cookie
        // res.clearCookie('rememberMe');
        console.log('222 rememberMe cookie deleted');
        return false;
    }
}


async function loginHandler(req, res) {
    const { email, password, isRememberMe } = req.body;
    console.log('loginHandler: ' + email + ' : ' + password + ' : ' + isRememberMe);

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
    if (req.cookies.rememberMe) { // remembeMe cookie exits
        const cookieData = JSON.parse(req.cookies.rememberMe);
        console.log( "cookies.rememberMe: " + cookieData.email 
            + " : " + cookieData.token 
            + " : " + cookieData.expires
            + " : " + cookieData.authType 
            );

        if (cookieData.authType === 'rememberMe') { // valid cookie
            const { email, token, expires } = cookieData;
            console.log( "loginHandle ==>  cookies.rememberMe: " + email
                + " : " + token
                + " : " + expires
                + " : " + cookieData.authType
                );

            const result = await checkRememberMeToken(req, res, email, token, new Date(expires));
            if (result) {// valid rememberMe
                if(isRememberMe){ // valid rememberMe and isRememberMe
                    db.deleteRememberMeTokenByEmailToken(email,token);
                    console.log('Token deleted from rememberMe table');

                    // Set rememberMe cookie
                    const expiresNew = new Date(Date.now() + config.session.cookieExpires);
                    console.log('@@@@@@@@@@ expiresNew: ' + expiresNew);

                    const cookieData = { 
                        email: email, 
                        token: token,
                        authType: 'rememberMe',
                        expires: expiresNew,
                        auth: true
                    };
        
                    const cookieOptions = {
                        maxAge: config.session.cookieExpires, // 1 month in milliseconds
                        httpOnly: true,
                        secure: true,
                        sameSite: 'strict'
                    };
        
                    res.cookie('rememberMe', JSON.stringify(cookieData), cookieOptions);

                    // update token in rememberMe table
                    try {
                        await db.updateRememberMeTokenExpires(email, token, expiresNew);
                        console.log('updateRememberMeTokenExpires finished.');
                    } catch (error) {
                        console.error(error);
                        res.status(500).send('Internal server error');
                        return;
                    }

                    res.send('You have logged in already');
                    return;
                }
            }else{ // invalid rememberMe
                // Delete rememberMe cookie
                // res.clearCookie('rememberMe');
                console.log('rememberMe cookie deleted');
                res.send('You have logged in already');
                return;
            }

        }else{ // invalid remembeMe cookie
            // Delete rememberMe cookie
            // res.clearCookie('rememberMe');
            console.log('rememberMe cookie deleted');
            res.send('You have logged in already');
            return;
        }
    }else{ // cookie doesn't exists, nop
        console.log(`cookie doesn't exists, nop`);
    }


    // normal login process
    console.log('normal login process, no cookies before --- --- ---');

    // firstly, check if register email is verified
    const user = await db.getUserByEmail(email);
    if (user) {
        console.log('user.email_verified = ' + user.email_verified);
        if (!user.email_verified) {
            res.status(401).send('Email not verified, please check your email');
            return;
        }
    }

    // check if the user and password is valid
    const isValid = await isValidUser(email, password);
    if (isValid) {
        // Set session user with email and expires, authType, auth
        req.session.user = { email: email,
             expires: new Date(Date.now() + 3600000) , 
             authType: 'normal',
             auth: true};
        
        // Set rememberMe cookie
        if (isRememberMe) { // rememberMe is checked
            const expiresNew = new Date(Date.now() + config.session.cookieExpires);
            const dateNow = Date.now();
            const  aaa= dateNow + config.session.cookieExpires;
            console.log('###### dateNow: ' 
                        + dateNow + ', config.session.cookieExpires: ' 
                        + config.session.cookieExpires+ ', aaa =  ' + aaa );

            console.log('###### expiresNew: ' + expiresNew);

            const token = crypto.randomBytes(64).toString('hex');
            const cookieData = { 
                email: email, 
                token: token,
                authType: 'rememberMe',
                expires: expiresNew,
                auth: true
            };

            const cookieOptions = {
                maxAge: config.session.cookieExpires, // 1 month in milliseconds
                httpOnly: true,
                secure: true,
                sameSite: 'strict'
            };

            res.cookie('rememberMe', JSON.stringify(cookieData), cookieOptions);
   
            // Store token in rememberMe table
            console.log("before storeRememberMeToken():" + email+ " : \n" + token +" : \n" + expiresNew);
            db.storeRememberMeToken(email, token, expiresNew)
            .then(() => {
                console.log('Token stored successfully');
                res.send('You are logged in');
                return;
              })
              .catch((error) => {
                console.error('Error storing token:', error);
                res.status(501)(error);
                return;
              });
        }else{  // rememberMe not checked
            // Delete rememberMe cookie
            // res.clearCookie('rememberMe');
            console.log('delete rememberMe cookie if exists');
            res.send('You are logged in');
            return;
        }

    } else { // invalid email or password.
        console.log('Invalid email or password , 44444444444444444');
        res.status(401).send('Invalid email or password');
    }
}


module.exports = {
    checkRememberMeToken,
    loginHandler
};