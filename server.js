require('dotenv').config();
require('./config/database');
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const port = process.env.PORT || 3001;
const app = express();

// Manual CORS configuration to ensure preflight handling
app.use((req, res, next) => {
  // Set CORS headers for all requests
  res.header('Access-Control-Allow-Origin', 'https://remofrontend22.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Additional CORS middleware as backup
const corsOptions = {
  origin: [
    'https://remofrontend22.vercel.app',
    'http://localhost:3000',
    /^https?:\/\/localhost(:\d+)?$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Explicit preflight handling
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://remofrontend22.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.status(200).end();
});

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Test CORS endpoint
app.get('/test-cors', (req, res) => {
  res.json({ message: 'CORS is working', origin: req.headers.origin });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Listener
app.listen(port, () => console.log(`Express running on port ${port}`));