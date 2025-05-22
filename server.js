require('dotenv').config(); // For local development with .env file
require('./config/database');
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const port = process.env.PORT || 3001;
const app = express();

// Optimized CORS configuration
app.use(cors({
  origin: [
    /^https?:\/\/localhost(:\d+)?$/, // Allow localhost for development
    'http://localhost:3000', // Allow React app on localhost
    'https://my-frontend.onrender.com' // Replace with your actual frontend URL
    // Add more origins as needed, e.g., 'https://another-frontend.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(logger('dev'));
app.use(express.json());
app.use(require('./config/checkToken'));

app.use('/api/users', require('./routes/api/users'));
app.use('/api/projects', require('./routes/api/projects'));

app.listen(port, () => console.log(`Express running on port ${port}`));