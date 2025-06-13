const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const port = process.env.PORT || 3001;
const app = express();

// CORS middleware - place this BEFORE other middleware
app.use(cors({
  origin: [
    'https://remofrontend22.vercel.app',
    'http://localhost:3000',
    /^https?:\/\/localhost(:\d+)?$/,
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Other middleware
app.use(logger('dev'));
app.use(express.json());
app.use(require('./config/checkToken'));

// API Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/projects', require('./routes/api/projects'));

// Listener
app.listen(port, () => console.log(`Express running on port ${port}`));