var session = require('express-session');
const { v4: uuidv4 } = require('uuid');



function createSessionObject(sql) {

    var sess = {
        genid: function(req) {
          return uuidv4(); // use UUIDs for session IDs
        },
        name: 'Flyk',
        resave: false,
        rolling: true,
        cookie: { 
            path: '/', 
            httpOnly: true, 
            secure: false, 
            maxAge: 1000 * 60 * 60 * 24 * 365, //TODO: Change??? currently at 1yr
            sameSite: 'strict' 
        },
        saveUninitialized: false,
        store: new (require('./PostgresSessionStorage')(session, sql))()
    }

    if (process.env.NODE_ENV === 'production') {
        sess.cookie.secure = true; // serve secure cookies if in production
    }
    return session(sess)
}

module.exports = createSessionObject