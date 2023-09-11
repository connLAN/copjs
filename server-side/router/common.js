fs = require('fs');
const morgan = require('morgan');
const path = require('path');


function accessLogger(req, res, next) {
    const accessLogStream = fs.createWriteStream(path.join(__dirname, '../../access.log'), { flags: 'a' });
    morgan('combined', { stream: accessLogStream })(req, res, next);
}

module.exports = accessLogger; 
