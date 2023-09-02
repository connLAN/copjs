const express = require('express');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');

// Define a router for the password reset link
const verifyResetPasswordHandler = express.Router();
verifyResetPasswordHandler.post('/', async (req, res) => {
  const { email, token } = req.query;

  // Check if the password reset token is valid
  db.getPasswordResetToken(email)
    .then(token => {
      if (token) {
        console.log('email = ' + email + ' token = ' + token);

        // Check if the password reset token has expired
        const expires = new Date(token.created_at).getTime() 
          + config.session.password_reset_token_timeout_in_seconds*1000;

        if (expires < Date.now()) {
          // Password reset token has expired
          db.deletePasswordResetToken(email)
            .then(() => {
              // console.log('Password reset token has expired');
              res.send('Password reset token has expired');
              return;
            })
            .catch(error => {
              console.error(error);
              res.status(500).send('Internal server error: when deleting password reset token');
              return;
            });
          return;
        }else{
          console.log('Password reset token has not expired');
          //////
          res.sendFile(path.join(__dirname, '/', 'reset_password.html')); // ? 
          return;
        }

      } else {
        console.log('Password reset token not found');
        res.status(400).send('Password reset token not found');
        return;
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal server error: when getting password reset token'); 
    });
});


// Define a router for the password reset form submissions
const resetPasswordHandler = express.Router();
resetPasswordHandler.post('/', async (req, res) => {
  console.log('resetPasswordHandler');
  const { email, token, password } = req.body;
  console.log('email = ' + email + ' token = ' + token + ' password = ' + password);

  // Validate input
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
  db.getPasswordResetToken(email) 
    .then(token => {
      if (token) {
        console.log('email = ' + email + ' token = ' + token);

        // Check if the password reset token has expired
        const expires = new Date(token.created_at).getTime() + config.session.password_reset_token_timeout_in_seconds;
        if (expires < Date.now()) {
          // Password reset token has expired
          db.deletePasswordResetToken(email)
            .then(() => {
                console.log('Password reset token has expired');
                res.status(400).send('Password reset token has expired');
            })
            .catch(error => {
              console.error(error);
              res.status(500).send('Internal server error: when deleting password reset token');
            });
          return;
        }else{
          console.log('Password reset token has not expired');
          // Hash the password using bcrypt
          const hashedPassword = bcrypt.hashSync(password, saltRounds);
          db.updateUserPassword(email, hashedPassword)
            .then(() => {
              console.log('User password updated');
            })
            .catch(error => {
              console.error(error);
              res.status(500).send('Internal server error: when updating user password');
            });

          db.deletePasswordResetToken(email)
            .then(() => {
              console.log('Password reset token deleted');
            })
            .catch(error => {
              console.error(error);
              res.status(500).send('Internal server error: when deleting password reset token');
            });

          res.send('Password reset successful!');
        }

      } else {
        console.log('Password reset token not found');
        res.status(400).send('Password reset token not found');
        return;
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal server error: when getting password reset token');
    });
});
// Mount the router on the app

module.exports = {  
  verifyResetPasswordHandler,
  resetPasswordHandler
};
