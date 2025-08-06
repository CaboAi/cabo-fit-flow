const express = require('express');
const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ 
    message: 'CaboFit API',
    version: '1.0.0',
    endpoints: '/api'
  });
});

app.use('/api', routes); // Ensure this line mounts the routes under /api

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: { message: 'Route not found' }
  });
});

app.use(errorHandler);

module.exports = app;