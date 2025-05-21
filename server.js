require('dotenv').config();
require('./config/database');
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const port = process.env.PORT || 3001;
const app = express();

// Optimized CORS
app.use(cors({
  origin: [
    /^https?:\/\/localhost(:\d+)?$/, // All localhost variants
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rest of your code remains unchanged
app.use(logger('dev'));
app.use(express.json());
app.use(require('./config/checkToken'));

app.use('/api/users', require('./routes/api/users'));
app.use('/api/projects', require('./routes/api/projects'));

app.listen(port, () => console.log(`Express running on port ${port}`));