const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews for the same transaction
reviewSchema.index({ reviewer: 1, transaction: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 