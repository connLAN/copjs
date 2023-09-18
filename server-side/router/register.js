const validator = require('validator');
const crypto = require('crypto');

const bcrypt = require('bcrypt');
const saltRounds = 10;

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

const db = require(path.join(databasePath + '/database'));
const config = appConfig;
console.log('config.web.domain = ' + config.web.domain);
console.log('config.port = ' + config.port);

const {
  sendMail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendGoodbyeEmail
} = require(path.join(routerPath + '/email'));


async function registerHandler(req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).send('WRONG: Nameee = ' + name +' email = ' + email +" password = "+ password);
      return;
    }

    try {
      console.log('name = ' + name +' email = ' + email +" password = "+ password);
  
      // Sanitize input
      const sanitizedEmail = validator.escape(email);
      const sanitizedName = validator.escape(name);
      const sanitizedPassword = validator.escape(password);
  
      if(sanitizedEmail !== email
        || !validator.isEmail(sanitizedEmail)){
        res.status(400).send('Invalid email input');
        return;
      }
   
      if(sanitizedName !== name 
        || !validator.isLength(sanitizedName, {min: 3, max: 20})
        || !validator.isAlphanumeric(sanitizedName)){
        res.status(400).send('Invalid name input');
        return;
      }
  
      if(sanitizedPassword !== password  
        || !validator.isLength(sanitizedPassword, {min: 8, max: 20})
        || !validator.isAlphanumeric(sanitizedPassword)){
        res.status(400).send('Invalid password input');
        return;
      }
  
      // Validate input
      // avoid duplicate email
      const userByEmail = await db.getUserByEmail(email);
      if (userByEmail) {
        console.log('This email is registered');
        res.status(400).send('This email is already registered');
        return;
      } else {
        console.log('This email is not registered');
      }
  
      const userByName = await db.getUserByName(name);
      if (userByName) {
        console.log('This name is registered');
        res.status(400).send('This name is already registered');
        return;
      } else {
        console.log('This name is not registered');
      }
  
      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      await db.storeUser(name, email, hashedPassword);
      console.log('User information stored');
  
      // Set a cookie to remember the user's email
      // res.cookie('email', email, { maxAge: 3600000, httpOnly: true, secure: true, sameSite: 'strict' });
  
      // Generate a verification token for the user, write into the database , and sent it to the user's email address
      const token = crypto.randomBytes(16).toString('hex');
      await db.storeVerificationToken(email, token);
      console.log('Verification token stored');
  
      // Send the verification token to the user's email address
      // Define the email message
      sendMail(email, 'Register Verification Token', 'Your have just registered ' + config.web.domain +'\n'
          +'\n' 
          + 'Please click the link below to verify your email address:'
          + 'http://'
          + config.web.domain +':' + config.port
          + '/verifyRegister?email=' + email + '&token=' + token
      );
      res.send('Registration successful!');
    }
    catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
}



async function verifyRegisterHandler(req, res) {
    const { email, token } = req.query;
    console.log('email = ' + email + ' token = ' + token);
    try {
        const verificationToken = await db.getVerificationToken(email);
        if (verificationToken) {
            console.log('email = ' + email + ' token = ' 
            + token + ' verificationToken.token = ' + verificationToken.token 
            + ' verificationToken.expires = ' + verificationToken.expires);

            if(token !== verificationToken.token){
                console.log('Verification token does not match');
                return res.status(400).send('Verification token does not match');
            }

            const expires = new Date(verificationToken.expires).getTime() 
                            + config.session.verify_token_timeout_in_seconds*1000;

            console.log( 'expires = ' + expires + ' Date.now() = ' + Date.now());
            if (expires < Date.now()) {
                await db.deleteVerificationToken(email);
                console.log('Verification token has expired');
                return res.status(400).send('Verification token has expired');
            } else {
                console.log('Verification token has not expired');
                await db.deleteVerificationToken(email);
                console.log('Verification token deleted');

                await db.updateUserEmailVerified(email);
                console.log('User email verified');

                res.redirect('/login');
            }
        } else {
            console.log('Verification token not found');
            return res.status(400).send('Verification token not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
}
  
module.exports = {
    registerHandler,
    verifyRegisterHandler
};
