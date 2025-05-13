// Simple server to test connection
const express = require('express');
const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Simple test endpoint that doesn't require auth
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  console.log('Headers:', req.headers);
  res.json({ message: 'Server is running correctly!' });
});

// Start server
const PORT = 4001; // Different port than main server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
