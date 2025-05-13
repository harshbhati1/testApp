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
app.use(cors({
  origin: /^http:\/\/localhost:\d+$/,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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