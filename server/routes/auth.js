const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');
const bcrypt = require('bcryptjs');

// Register/Signup user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, roles = ['supplier'] } = req.body;
    console.log('Registration attempt:', { email, name, roles });

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Missing fields:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          name: !name ? 'Name is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    console.log('Password hashed successfully');

    // Create user
    const user = new User({
      name,
      email,
      passwordHash,
      roles
    });

    // Save user
    await user.save();
    console.log('User saved successfully:', { id: user._id, email: user.email });

    // Generate token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        roles: user.roles
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (err) {
    console.error('Registration error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: Object.values(err.errors).map(e => e.message)
      });
    }
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', { id: user._id, email: user.email });
    
    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password validation result:', isValid);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        roles: user.roles
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for:', email);

    // Ensure user object has consistent ID fields and necessary properties
    res.json({
      token,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(), // Include both id and _id for compatibility
        name: user.name,
        email: user.email,
        roles: user.roles || ['supplier'], // Default role if missing
        company: user.company || null
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create test vendor account
router.post('/create-test-vendor', async (req, res) => {
  try {
    const testVendor = new User({
      name: 'Test Vendor',
      email: 'vendor@test.com',
      username: 'testvendor',
      password: 'password123',
      roles: ['vendor'],
      company: {
        name: 'Test Company',
        description: 'A test company for demonstration',
        industry: 'Technology',
        logo: 'https://via.placeholder.com/150'
      }
    });

    await testVendor.save();
    res.status(201).json({ message: 'Test vendor created successfully' });
  } catch (err) {
    console.error('Create test vendor error:', err);
    res.status(500).json({ error: 'Failed to create test vendor' });
  }
});

// Endpoint to verify a token is valid (for debugging purposes)
router.get('/verify-token', requireAuth, (req, res) => {
  // If requireAuth middleware passes, token is valid
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      roles: req.user.roles
    }
  });
});

module.exports = router; 