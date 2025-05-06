require('dotenv').config();
require('./config/database');
const express = require('express');
const logger = require('morgan');
const cors = require('cors'); // Import cors
const port = process.env.PORT || 3001;
const app = express();

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://rawdahremodeling.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(logger('dev'));
app.use(express.json());
app.use(require('./config/checkToken'));

// API Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/projects', require('./routes/api/projects'));

app.listen(port, function () {
  console.log(`Express app running on port ${port}`);
});