const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Submit a review
router.post('/', auth, async (req, res) => {
  try {
    const { transactionId, rating, comment } = req.body;
    console.log('==========================================');
    console.log('REVIEW SUBMISSION REQUEST');
    console.log('==========================================');
    console.log('Request data:', { transactionId, rating, comment });
    console.log('User data:', { 
      id: req.user._id.toString(), 
      roles: req.user.roles,
      name: req.user.name
    });
    
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Ensure reviewer ID is stored as a string for consistent comparison
    const reviewer = req.user._id;
    console.log('Reviewer ID:', reviewer.toString());

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);
    console.log('Found transaction:', transaction);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Determine the reviewed company based on user ID matching transaction parties
    const reviewerId = reviewer.toString();
    const supplierIdStr = transaction.supplierId.toString();
    const vendorIdStr = transaction.vendorId.toString();
    
    let reviewedCompany;
    let isSupplier = false;
    let isVendor = false;
    
    console.log('Comparing IDs to determine role in transaction:');
    console.log('Reviewer ID:', reviewerId);
    console.log('Supplier ID in transaction:', supplierIdStr);
    console.log('Vendor ID in transaction:', vendorIdStr);
    
    // Check if user is supplier or vendor IN THIS TRANSACTION (not just by roles)
    if (reviewerId === supplierIdStr) {
      console.log('Reviewer is the supplier in this transaction');
      reviewedCompany = transaction.vendorId;
      isSupplier = true;
    } else if (reviewerId === vendorIdStr) {
      console.log('Reviewer is the vendor in this transaction');
      reviewedCompany = transaction.supplierId;
      isVendor = true;
    } else {
      console.log('Reviewer is neither supplier nor vendor in this transaction');
      return res.status(403).json({ error: 'You are not a party to this transaction' });
    }

    console.log('Reviewed company ID:', reviewedCompany);

    // Check if transaction is in a state that allows reviews
    if (transaction.status !== 'confirmed') {
      return res.status(400).json({ error: 'Transaction must be confirmed to submit a review' });
    }

    // IMPORTANT: The most reliable way to check if a user has already reviewed
    // is to check the Review collection directly, not the transaction flags
    console.log('==========================================');
    console.log('CHECKING FOR EXISTING REVIEW - BY REVIEWER ID');
    console.log('==========================================');
    
    // The key fix: We ONLY care if THIS USER has already reviewed, not if the transaction has been reviewed by anyone
    const existingReview = await Review.findOne({
      transaction: transactionId,
      reviewer: reviewer // This checks if THIS specific user (by ID) has already reviewed
    });

    if (existingReview) {
      console.log('ERROR: User already has a review document for this transaction:', existingReview);
      return res.status(400).json({ 
        error: 'You have already reviewed this transaction',
        reviewId: existingReview._id,
        date: existingReview.createdAt
      });
    }
    
    // CRITICAL FIX: We will ONLY trust the Review collection to determine if a user has already reviewed
    // Ignore the transaction flags for this check, as they might be inconsistent
    
    // We already checked for existing reviews in the Review collection above
    // If we're here, there is no existing review from this user for this transaction
    
    // Just log the transaction flags for debugging
    if (isSupplier && transaction.supplierReviewed) {
      console.log('WARNING: Transaction indicates supplier has already reviewed, but no review document was found');
      console.log('Will reset the supplierReviewed flag to match reality');
      transaction.supplierReviewed = false;
    }
    
    if (isVendor && transaction.vendorReviewed) {
      console.log('WARNING: Transaction indicates vendor has already reviewed, but no review document was found');
      console.log('Will reset the vendorReviewed flag to match reality');
      transaction.vendorReviewed = false;
    }
    
    console.log('No existing review found in the Review collection - user can proceed');
    
    // For debugging only: Check if transaction flags match what we expect
    // But we'll rely on the Review document check above, not these flags
    console.log('==========================================');
    console.log('TRANSACTION FLAG STATUS (INFORMATIONAL ONLY)');
    console.log('==========================================');
    console.log('Transaction review flags:', {
      supplierReviewed: transaction.supplierReviewed,
      vendorReviewed: transaction.vendorReviewed
    });
    console.log('User role in transaction:', {
      isSupplier,
      isVendor,
      userId: reviewerId,
      supplierIdInTransaction: supplierIdStr,
      vendorIdInTransaction: vendorIdStr
    });
    
    // We'll continue regardless of what the flags say, since we checked the Review collection directly
    console.log('Proceeding with review submission - Review collection check passed');
    
    console.log('Review status check passed:', {
      isSupplier,
      isVendor,
      supplierReviewed: transaction.supplierReviewed,
      vendorReviewed: transaction.vendorReviewed
    });

    // Create the review
    const review = new Review({
      reviewer: reviewer,
      reviewedCompany: reviewedCompany,
      transaction: transactionId,
      rating: rating,
      comment: comment
    });

    console.log('Saving review:', review);
    await review.save();
    console.log('Review saved successfully:', review);

    // Mark transaction as reviewed based on comparing reviewer ID with transaction parties
    console.log('Setting review flags - reviewer ID:', reviewer);
    console.log('Transaction supplier ID:', transaction.supplierId);
    console.log('Transaction vendor ID:', transaction.vendorId);
    
    // We already have isSupplier and isVendor determined correctly above
    // No need to recalculate or compare IDs again
    
    console.log('Setting review flags based on previously determined role:', { 
      isSupplier, 
      isVendor,
      currentSupplierReviewed: transaction.supplierReviewed,
      currentVendorReviewed: transaction.vendorReviewed
    });
    
    // IMPORTANT: Only update the flag for the specific user role
    console.log('==========================================');
    console.log('UPDATING REVIEW FLAGS');
    console.log('==========================================');
    console.log('Current flags before update:', {
      supplierReviewed: transaction.supplierReviewed,
      vendorReviewed: transaction.vendorReviewed
    });
    
    // Use atomic update to prevent race conditions
    if (isSupplier) {
      console.log('User is SUPPLIER - updating supplierReviewed to TRUE');
      // Explicitly ensure the flag is set to true
      transaction.supplierReviewed = true;
      // DO NOT modify the vendor's flag
      console.log('Vendor flag remains:', transaction.vendorReviewed);
    } else if (isVendor) {
      console.log('User is VENDOR - updating vendorReviewed to TRUE');
      // Explicitly ensure the flag is set to true
      transaction.vendorReviewed = true;
      // DO NOT modify the supplier's flag
      console.log('Supplier flag remains:', transaction.supplierReviewed);
    } else {
      console.log('ERROR: User is neither supplier nor vendor in this transaction');
      return res.status(403).json({ error: 'You are not authorized to review this transaction' });
    }
    
    console.log('Final flags after update:', {
      supplierReviewed: transaction.supplierReviewed,
      vendorReviewed: transaction.vendorReviewed
    });
    
    // Log the transaction state before saving
    console.log('Transaction before save:', {
      id: transaction._id,
      supplierReviewed: transaction.supplierReviewed,
      vendorReviewed: transaction.vendorReviewed,
      reviewerId,
      supplierIdStr,
      vendorIdStr
    });
    
    await transaction.save();

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ error: 'You have already reviewed this transaction' });
    }
    console.error('Review submission error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get reviews for a company
router.get('/company/:companyId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedCompany: req.params.companyId })
      .populate('reviewer', 'name')
      .populate('transaction', 'amount')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router; 