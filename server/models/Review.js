const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Main schema fields
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  
  // Legacy field names that might exist in the database
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  // Review content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Index for older field names that are in the database
reviewSchema.index({ userId: 1, transactionId: 1 }, { 
  unique: true,
  sparse: true 
});

// Index for current field names in our schema
reviewSchema.index({ reviewer: 1, transaction: 1 }, { 
  unique: true,
  sparse: true 
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 