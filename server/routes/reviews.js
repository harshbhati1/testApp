const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const requireAuth = require('../middleware/requireAuth');

// Submit a review
router.post('/', requireAuth, async (req, res) => {
  try {
    const { transactionId, rating, comment } = req.body;
    console.log('REVIEW SUBMISSION REQUEST:', { transactionId, rating, comment });
    
    // Basic validations
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!transactionId) return res.status(400).json({ error: 'Transaction ID is required' });
    if (!rating) return res.status(400).json({ error: 'Rating is required' });
    if (!comment) return res.status(400).json({ error: 'Comment is required' });

    // Get user ID safely
    const userId = req.user.id || (req.user._id ? req.user._id.toString() : null);
    if (!userId) return res.status(400).json({ error: 'User ID not found' });
    
    // Find transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    
    // Extract transaction party IDs
    const supplierId = transaction.supplierId.toString();
    const vendorId = transaction.vendorId.toString();
    
    // Determine role and reviewed company
    let isSupplier = false;
    let isVendor = false;
    let reviewedCompanyId;
    
    if (userId === supplierId) {
      isSupplier = true;
      reviewedCompanyId = vendorId;
    } else if (userId === vendorId) {
      isVendor = true;
      reviewedCompanyId = supplierId;
    } else {
      return res.status(403).json({ error: 'You are not a party to this transaction' });
    }
    
    // Check if transaction is confirmed
    if (transaction.status !== 'confirmed') {
      return res.status(400).json({ error: 'Transaction must be confirmed to submit a review' });
    }
    
    // Check for existing reviews with either field naming pattern
    const existingReview = await Review.findOne({
      $or: [
        // Check both possible field combinations to handle schema evolution
        { transaction: transactionId, reviewer: userId },
        { transactionId: transactionId, userId: userId }
      ]
    });
    
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this transaction' });
    }
    
    // Ensure the rating is properly converted to a number and validated
    const numericRating = parseInt(rating, 10);
    
    // Validate the rating is within bounds
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ 
        error: 'Invalid rating value',
        details: `Rating must be between 1 and 5, received: ${rating}` 
      });
    }
    
    console.log(`Converting rating ${rating} (${typeof rating}) to numeric: ${numericRating}`);
    
    // Create review document with BOTH field sets to handle schema mismatch
    const review = new Review({
      // Current schema fields
      reviewer: userId,
      transaction: transactionId,
      reviewedCompany: reviewedCompanyId,
      
      // Legacy fields that exist in DB indexes
      userId: userId,
      transactionId: transactionId,
      
      rating: numericRating, // Use the validated numeric rating
      comment: comment
    });

    console.log('Saving review:', {
      reviewer: userId,
      reviewedCompany: reviewedCompanyId,
      transaction: transactionId,
      rating: Number(rating)
    });
    
    try {
      await review.save();
      console.log('Review saved successfully');
    } catch (saveErr) {
      console.error('Error saving review:', saveErr);
      return res.status(500).json({ 
        error: 'Failed to save review', 
        message: saveErr.message
      });
    }

    // Update transaction review flags
    console.log('Updating transaction flags');
    
    // Set the appropriate flag based on user role
    if (isSupplier) {
      transaction.supplierReviewed = true;
    } else if (isVendor) {
      transaction.vendorReviewed = true;
    }
    
    try {
      await transaction.save();
      console.log('Transaction flags updated successfully');
    } catch (saveErr) {
      console.error('Error saving transaction flags:', saveErr);
      // Continue with the review response even if flag update fails
    }

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ error: 'You have already reviewed this transaction' });
    }
    console.error('Review submission error:', err);
    
    // Create simpler error response
    res.status(500).json({ 
      error: 'Failed to submit review', 
      message: err.message
    });
  }
});

// Get reviews for a company
router.get('/company/:companyId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedCompany: req.params.companyId })
      .populate('reviewer', 'name')
      .populate('transaction', 'amount')
      .sort({ createdAt: -1 });
    
    // Explicitly ensure ratings are numeric
    const formattedReviews = reviews.map(review => {
      const reviewObj = review.toObject();
      reviewObj.rating = Number(reviewObj.rating); // Ensure rating is a number
      return reviewObj;
    });
    
    res.json(formattedReviews);
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router; 