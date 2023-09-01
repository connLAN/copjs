// const mainRouter = require('./main_router');
// const config = require('./config');
// const email = require('./email');
// const db = require('../database');

// console.log(`Server running on port ${config.port}`);
// console.log(`Database connection: ${config.database.host}:${config.database.port}`);

// email.sendWelcomeEmail('tinyserver@foxmail.com');
// email.sendGoodbyeEmail('tinyserver@foxmail.com');

// db.initializeDatabase();

const options = { timeZone: 'Asia/Shanghai' };
const formattedDate = new Date().toISOString('zh-CN', options).slice(0, 19).replace('T', ' ');

console.log(formattedDate);

const formattedDate2 = new Date().toISOString('en-US', options).slice(0, 19).replace('T', ' ');

console.log(formattedDate2);
