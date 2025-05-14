require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const reviewRoutes = require('./routes/reviews');
const searchRoutes = require('./routes/search');
const transactionRoutes = require('./routes/transactions');

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());

// ADD LOGGING MIDDLEWARE HERE
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] SERVER RECEIVED: ${req.method} ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

app.use(cors({
  origin: /^http:\/\/localhost:\d+$/,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires']
}));

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Simple test endpoint that doesn't require auth
app.get('/api/test-connection', (req, res) => {
  console.log('Connection test endpoint called');
  res.json({ success: true, message: 'Server connection successful!' });
});

// Debug route to check authentication headers
app.get('/api/debug-auth', (req, res) => {
  console.log('Debug auth endpoint called');
  console.log('Headers:', req.headers);
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ 
      success: false, 
      message: 'No Authorization header found',
      headers: {
        ...req.headers,
        authorization: '[SANITIZED]' // Don't log the actual token if present
      }
    });
  }

  // Check if token format is correct
  if (!authHeader.startsWith('Bearer ')) {
    return res.json({ 
      success: false, 
      message: 'Authorization header format is incorrect',
      format: authHeader.substring(0, 10) + '...'
    });
  }

  // Token is present, but don't try to verify it here
  res.json({ 
    success: true, 
    message: 'Authorization header found and format is correct',
    headerPrefix: authHeader.substring(0, 10) + '...'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/transactions', transactionRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server only after MongoDB connects
connectDB().then(() => {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
});