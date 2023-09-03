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

const email = require('./email');
const db = require( path.join(databasePath, '/database'));



// verifyResetPasswordHandler
async function verifyResetPasswordHandler(req, res) {
    console.log('verifyResetPasswordHandler');
    // const { email,  password } = req.body;
    const { email, token,password } = req.query;
    console.log('email: ', email  + ' password: ' + password);
    res.send('verifyResetPasswordHandler');

    return;
}



// reset password handler
async function resetPasswordHandler(req, res) {
  console.log('resetPasswordHandler');
  const { email, token, password } = req.body;
  console.log('email = ' + email + ' token = ' + token + ' password = ' + password);

  if (!email || !token || !password) {
    console.log('Email, token and password are required');
    res.status(400).send('Email, token and password are required');
    return;
  }

  const sanitizedEmail = validator.escape(email);
  const sanitizedToken = validator.escape(token);
  const sanitizedPassword = validator.escape(password);
  
  if(sanitizedEmail !== email
    || !validator.isEmail(sanitizedEmail)){
      console.log('Invalid email input 111');
    res.status(400).send('Invalid email input 111');
    return;
  }

  if(sanitizedToken !== token
    || !validator.isLength(sanitizedToken, {min: 32, max: 32})
    || !validator.isAlphanumeric(sanitizedToken)){
    console.log('Invalid token input 222');
    res.status(400).send('Invalid token input 222');
    return;
  }

  if(sanitizedPassword !== password
    || !validator.isLength(sanitizedPassword, {min: 8, max: 20})
    || !validator.isAlphanumeric(sanitizedPassword)){
    console.log('Invalid password input 333');
    res.status(400).send('Invalid password input 333');
    return;
  }

  // Check if the password reset token is valid
  const resetToken = await db.getPasswordResetToken(email);

  if (!resetToken || resetToken.length === 0 || resetToken.token === null) {
    console.log('Password reset token not found');
    res.status(400).send('Password reset token not found');
    return;
  }

  console.log('resetToken = ' + JSON.stringify(resetToken));

  console.log( 'resetToken = ' + resetToken
             + 'resetToken.token = ' + resetToken.token
             + ' token = ' + resetToken.token + ' email = ' + resetToken.email
             + ' resetToken.expires = ' + resetToken.expires
             );

  console.log('AAA resetToken.token = ' + resetToken.token + ' token = ' + token);
  // Check if the password reset token matches
  if (resetToken.token !== token) {
    console.log('Password reset token does not match');
    res.status(400).send('Password reset token does not match');
    return;
  }



  // Check if the password reset token has expired
  const expires = new Date(resetToken.created_at).getTime()
    + config.session.password_reset_token_timeout_in_seconds*1000;

  if (expires < Date.now()) {
    // Password reset token has expired
    db.deletePasswordResetToken(email)
      .then(() => {
          console.log('Password reset token has expired, delete it');
          res.status(400).send('Password reset token has expired');
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Internal server error: when deleting expired token');
      });
    return;
  }

  // Hash the password using bcrypt
  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  // Update the user's password
  db.updateUserPassword(email, hashedPassword)
    .then(() => {
      console.log('User password updated');
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal server error: when updating user password');
    });

  // Delete the password reset token
  db.deletePasswordResetToken(email)
    .then(() => {
      console.log('Password reset token deleted');
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal server error: when deleting password reset token');
    });

  res.send('Password reset successful!');
  return;
}
 
  
module.exports = {
    verifyResetPasswordHandler,
    resetPasswordHandler,
};



