require('dotenv').config();
require('./config/database');
const express = require('express');
const logger = require('morgan');
const port = process.env.PORT || 3001;
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(require('./config/checkToken'));

// API Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/projects', require('./routes/api/projects'));

app.listen(port, function () {
  console.log(`Express app running on port ${port}`);
});