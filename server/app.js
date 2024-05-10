require('./db');
require('dotenv').config();
// require('express-async-errors');

const express = require('express');
const morgan = require('morgan');

const logoRoutes = require('./routers/post');

const app = express();

const PORT = process.env.PORT;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8081');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
});

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(logoRoutes);

// app.get('/', (req, res) => {
//     res.send('<h1>Hello from server!<h1>');
// });

app.listen(PORT, () => {
    console.log(`Port is listening on port: ${PORT}`);
});
