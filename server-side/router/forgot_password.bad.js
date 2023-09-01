const express = require('express');
const router = express.Router();
const crypto = require('crypto');
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

const email = require('./email');


async function forgotPasswordHandler(req, res) {
    console.log('forgotPasswordRouter post' + JSON.stringify(req.body));
    const { email, op_type } = req.body;
    console.log('forgotPasswordRouter post,email:' + email +" op_type:" + op_type);

    res.send('I am trying to send email');
    return;
    /*
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
            text: 'Your have just requested a password reset for ' + config.web.domain +'\n'
                +'\n'
                + 'Please click the link below to reset your password:'
                + 'http://'
                + config.web.domain +':' + config.port
                + '/verify_reset_password?email=' + email + '&token=' + token
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        res.send('Password reset token sent to your email address\nPlease check your email');
        return;

    } else {
        console.log('This email is not registered');
        res.status(400).send('This email is not registered');
        return;
    }

    */
}


module.exports = {
    forgotPasswordHandler
};