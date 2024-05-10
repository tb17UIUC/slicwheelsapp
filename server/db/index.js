const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.DB_URL;

mongoose
    .connect(uri)
    .then(() => console.log('db connected on uri: ', uri))
    .catch((error) =>
        console.log('db connection failed: ', error.message || error)
    );
