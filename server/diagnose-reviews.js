// This script will check all transactions and reviews for possible issues
// It will help diagnose problems with the review system

const mongoose = require('mongoose');
require('dotenv').config();
const Transaction = require('./models/Transaction');
const Review = require('./models/Review');

async function diagnoseProblem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all confirmed transactions
    console.log('\n=== CHECKING CONFIRMED TRANSACTIONS ===');
    const transactions = await Transaction.find({ status: 'confirmed' });
    console.log(`Found ${transactions.length} confirmed transactions`);

    for (const transaction of transactions) {
      console.log('\n-----------------------------------');
      console.log(`Transaction ID: ${transaction._id}`);
      console.log(`Supplier ID: ${transaction.supplierId}`);
      console.log(`Vendor ID: ${transaction.vendorId}`);
      console.log(`Status: ${transaction.status}`);
      console.log(`SupplierReviewed: ${transaction.supplierReviewed}`);
      console.log(`VendorReviewed: ${transaction.vendorReviewed}`);
      
      // Find reviews for this transaction
      const reviews = await Review.find({ transaction: transaction._id });
      console.log(`Found ${reviews.length} reviews for this transaction`);
      
      for (const review of reviews) {
        console.log(`Review ID: ${review._id}`);
        console.log(`Reviewer ID: ${review.reviewer}`);
        console.log(`Reviewed Company ID: ${review.reviewedCompany}`);
        console.log(`Rating: ${review.rating}, Comment: ${review.comment}`);
        
        // Check if reviewer is supplier or vendor
        const isSupplier = review.reviewer.toString() === transaction.supplierId.toString();
        const isVendor = review.reviewer.toString() === transaction.vendorId.toString();
        console.log(`Reviewer is supplier: ${isSupplier}`);
        console.log(`Reviewer is vendor: ${isVendor}`);
        
        // Check if review flags match actual reviews
        if (isSupplier && !transaction.supplierReviewed) {
          console.log('ERROR: Supplier has reviewed but flag is not set!');
        }
        if (isVendor && !transaction.vendorReviewed) {
          console.log('ERROR: Vendor has reviewed but flag is not set!');
        }
        if (isSupplier && transaction.vendorReviewed && reviews.length < 2) {
          console.log('ERROR: Vendor review flag is set but no vendor review exists!');
        }
        if (isVendor && transaction.supplierReviewed && reviews.length < 2) {
          console.log('ERROR: Supplier review flag is set but no supplier review exists!');
        }
      }
    }

    console.log('\nDiagnostics complete!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

diagnoseProblem();
