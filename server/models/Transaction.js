const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'rejected', 'confirmed'],
    default: 'pending'
  },
  // This field is deprecated - using the more specific flags below instead
  reviewed: {
    type: Boolean,
    default: false
  },
  // Flag indicating if the supplier has submitted a review for this transaction
  supplierReviewed: {
    type: Boolean,
    default: false,
    required: true
  },
  // Flag indicating if the vendor has submitted a review for this transaction
  vendorReviewed: {
    type: Boolean,
    default: false,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
TransactionSchema.index({ supplierId: 1, vendorId: 1, status: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema); 