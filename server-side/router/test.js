const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

const app = express();

async function setupSession(app) {
    const redisClient = redis.createClient({
        host: 'localhost',
        port: 6379
    });

    await redisClient.connect();

    app.use(session({
        secret: 'mysecret',
        resave: false,
        saveUninitialized: true,
        store: new RedisStore({ client: redisClient })
    }));

    
    app.get('/', function(req, res) {
        if (!req.session.views) {
            req.session.views = 1;
        } else {
            req.session.views++;
        }

        res.send(`You have visited this page ${req.session.views} times`);
    });


}

setupSession(app);



app.listen(3000, function() {
    console.log('Server listening on port 3000');
});