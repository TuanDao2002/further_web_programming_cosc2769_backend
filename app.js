var express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cookieParser = require('cookie-parser');

app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));


// CORS for server and client communication
app.use(
    cors({
      credentials: true,
      origin: '*',
    })
);

// set limit request from same API in timePeroid from same ip
// set this limit to API calls only
const limiter = rateLimit({
    max: 20, //   max number of limits
    windowMs: 5 * 60 * 1000, // 5 minutes
    message: ' Too many req from this IP , please Try  again in 5 minutes!',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: true, // skip if the request is succesful
});

app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));

// Enable parsing cookies to read
app.use(cookieParser());

const port = 3000;
app.listen(port, ()=>{
    console.log(`Listening at port: ${port}`)
})