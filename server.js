require('dotenv').config();
require('./config/database');
const express = require('express');
const logger = require('morgan');
const cors = require('cors'); // Import cors
const port = process.env.PORT || 3001;
const app = express();

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from this origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
  credentials: true // If you're using tokens/cookies
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