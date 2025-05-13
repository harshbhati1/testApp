const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  roles: {
    type: [String],
    default: ['supplier'],
    validate: {
      validator: function(roles) {
        return roles.every(role => ['vendor', 'supplier'].includes(role));
      },
      message: 'Invalid role. Must be either vendor or supplier'
    }
  },
  company: {
    name: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true
    },
    logo: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema); 