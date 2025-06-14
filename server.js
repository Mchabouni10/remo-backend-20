require('dotenv').config();
require('./config/database');
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const port = process.env.PORT || 3001;
const app = express();

// CORS configuration - MOVED BEFORE OTHER MIDDLEWARE
const corsOptions = {
  origin: [
    'https://remofrontend22.vercel.app', // Your Vercel frontend
    'http://localhost:3000',             // Local development
    /^https?:\/\/localhost(:\d+)?$/,     // All localhost variants
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly for all routes
app.options('*', cors(corsOptions));

// Basic middleware
app.use(logger('dev'));
app.use(express.json());

// Apply checkToken middleware conditionally - skip for login/signup routes
app.use((req, res, next) => {
  // Skip token check for login and signup routes
  if (req.path === '/api/users/login' || req.path === '/api/users/signup' || req.path === '/api/users/register') {
    return next();
  }
  // Apply token check for all other routes
  return require('./config/checkToken')(req, res, next);
});

// API Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/projects', require('./routes/api/projects'));

// Health check endpoint (useful for deployment)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Listener
app.listen(port, () => console.log(`Express running on port ${port}`));