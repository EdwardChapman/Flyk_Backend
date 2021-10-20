const express = require('express');
const helmet = require('helmet'); 
// const bodyParser = require("body-parser"); 


function setupConfig(app){
    app.use(helmet());
    // const rateLimit = require("express-rate-limit"); //TODO: Implement a rate limiter to protect against brute force attacks
    if (app.get('env') === 'production') {
        app.set('trust proxy', true); // B/c nginx layer between client & appEngine
    }
}
module.exports = setupConfig