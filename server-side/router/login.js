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

const db = require(path.join(rootPath, '/database'));

const {
    sendMail,
    sendResetPasswordEmail,
    sendVerificationEmail,
    sendWelcomeEmail,
    sendGoodbyeEmail
} =  require(path.join(routerPath, '/email'));

async function loginHandler(req, res) {
    const { email, password, rememberMe } = req.body;

    // Validate input
    if (!email || !password) {
        res.status(400).send('Email and password are required');
        return;
    }

    const sanitizedEmail = validator.escape(email);
    const sanitizedPassword = validator.escape(password);

    if(sanitizedEmail !== email || !validator.isEmail(sanitizedEmail)){
        res.status(400).send('Invalid email input');
        return;
    }

    if(sanitizedPassword !== password || !validator.isLength(sanitizedPassword, {min: 8, max: 20})
        || !validator.isAlphanumeric(sanitizedPassword)){
        res.status(400).send('Invalid password input');
        return;
    }

    // Check if the user exists
    const user = await db.getUserByEmail(sanitizedEmail);
    if (user) {
        console.log('This email is registered');
        // check if the user's email address is verified
        if (!user.email_verified) {
            console.log('Email not verified');
            res.status(401).send('Email not verified, \nplease open your email and click the verification link');
            return;
        } else {
            console.log('Email verified');
            // compare the hashed password with the password provided by the user
            const hashedPassword = user.password;
            const isMatch = await bcrypt.compare(password, hashedPassword);
            if (!isMatch) {
                res.status(401).send('Invalid email or password');
                return;
            } else {
                // Set a cookie to remember the user's email
                const token = crypto.randomBytes(64).toString('hex');
                const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

                if (rememberMe) {
                    // Store token in remember_me table
                    try {
                        await db.storeToken(email, token, expires);
                        console.log('Token stored in remember_me table');
                    } catch (error) {
                        console.error(error);
                        res.status(500).send('Internal server error');
                        return;
                    }

                    const cookieData = {
                        email: email,
                        token: token,
                        authType: 'remember_me',
                        auth: true
                    };

                    const cookieString = JSON.stringify(cookieData);
                    // Set remember_me cookie with token
                    res.cookie('remember_me', cookieString, {
                        expires: expires,
                        httpOnly: true,
                        secure: true,
                        sameSite: 'strict'
                    });
                    console.log('Remember me cookie set');

                    // Set session user with email and expires
                    req.session.user = { email: email, expires: expires };
                    res.send('Login successful!');
                    return;

                } else {
                    // Set session user with email only
                    req.session.user = { email: email };
                    res.redirect('/dashboard');
                    return;
                }
            }
        }
    } else {
        console.log('This email is not registered');
        res.status(401).send('Invalid email or password');
        return;
    }
}

module.exports = {
    loginHandler
};