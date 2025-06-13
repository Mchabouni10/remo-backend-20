require('dotenv').config();
require('./config/database');
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const port = process.env.PORT || 3001;
const app = express();

// Optimized CORS configuration
// This now includes your deployed Vercel frontend URL and an explicit localhost:3000.
app.use(cors({
  origin: [
    'https://remofrontend22.vercel.app', // Your Vercel frontend
    'http://localhost:3000',          // Explicitly added for clarity
    /^https?:\/\/localhost(:\d+)?$/,   // All localhost variants for local development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(logger('dev'));
app.use(express.json());

// This middleware should come after express.json() and cors()
// but before your API routes.
app.use(require('./config/checkToken'));

// API Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/projects', require('./routes/api/projects'));

// Listener
app.listen(port, () => console.log(`Express running on port ${port}`));