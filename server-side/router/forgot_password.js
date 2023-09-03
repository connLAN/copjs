const path = require('path');
const express = require('express');
// const morgan = require('morgan');
const mysql = require('mysql2/promise');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const crypto = require('crypto');
// const fs = require('fs');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const validator = require('validator');

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

const db = require( path.join(databasePath, '/database'));

const {
    transporter,
    sendMail,
    sendResetPasswordEmail,
    sendVerificationEmail,
    sendWelcomeEmail,
    sendGoodbyeEmail
} = require( path.join(routerPath, '/email'));


async function forgotPasswordHandler(req, res) {
    console.log('forgotPasswordRouter post' + JSON.stringify(req.body));
    const { email, op_type } = req.body;
    console.log('forgotPasswordRouter post,email:' + email +" op_type:" + op_type);

    // Validate input
    if (!email) {
        res.status(400).send('Email is required!');
        return;
    }
    console.log('after validate input');

    const sanitizedEmail = validator.escape(email);
    if(sanitizedEmail !== email ){
        res.status(400).send('Invalid email input');
        return;
    }

    console.log('after sanitizedEmail');
    // Check if the user exists
    const user = await db.getUserByEmail(email);
    if (user) {
        console.log('This email is registered');
        // Generate a password reset token for the user, write into the database , and sent it to the user's email address
        const token = crypto.randomBytes(16).toString('hex');
        try {
            await db.storePasswordResetToken(email, token);
            console.log('Password reset token stored');
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error: when storing password reset token');
            return;
        }

        // Send the password reset token to the user's email address
        // Define the email message
        const mailOptions = {
            from: config.email.auth.user,
            to: email,
            subject: 'Password Reset Token',
            html: 'Your have just requested a password reset for ' + config.web.domain +'\n'
                +'\n'
                + 'The token for reset password is showed below.\n'
                +  token + '\n'
                +'\n'
                + 'Please click the link below to reset your password.\n'
                + '  http://'
                + config.web.domain +':' + config.port
                + '/reset_password\n'
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        res.send('Password reset token has sent to your email address\nPlease check your email');
        return;

    } else {
        console.log('This email is not registered');
        res.status(400).send('This email is not registered');
        return;
    }

}


module.exports = {
    forgotPasswordHandler
};