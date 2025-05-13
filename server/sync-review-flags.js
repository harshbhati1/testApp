/**
 * This script synchronizes transaction review flags with actual review documents
 * It ensures that transaction.supplierReviewed and transaction.vendorReviewed flags
 * accurately reflect whether reviews exist in the Review collection
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const Review = require('./models/Review');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function syncReviewFlags() {
  console.log('Starting review flag synchronization...');
  
  try {
    // Get all transactions
    const transactions = await Transaction.find();
    console.log(`Found ${transactions.length} transactions to check`);
    
    let fixCount = 0;
    
    // Process each transaction
    for (const transaction of transactions) {
      console.log(`\nChecking transaction ID: ${transaction._id}, status: ${transaction.status}`);
      
      // Skip transactions that aren't confirmed yet
      if (transaction.status !== 'confirmed') {
        console.log('  Skipping - transaction is not confirmed');
        continue;
      }
      
      // Find all reviews for this transaction
      const reviews = await Review.find({ transaction: transaction._id });
      console.log(`  Found ${reviews.length} reviews for this transaction`);
      
      // Track if flags need updating
      let needsUpdate = false;
      
      // Get supplier review
      const supplierReview = reviews.find(r => 
        r.reviewer.toString() === transaction.supplierId.toString()
      );
      
      // Get vendor review
      const vendorReview = reviews.find(r => 
        r.reviewer.toString() === transaction.vendorId.toString()
      );
      
      // Check supplier review flag against actual reviews
      if (!!supplierReview !== transaction.supplierReviewed) {
        console.log(`  MISMATCH: supplierReviewed flag is ${transaction.supplierReviewed} but should be ${!!supplierReview}`);
        transaction.supplierReviewed = !!supplierReview;
        needsUpdate = true;
      }
      
      // Check vendor review flag against actual reviews
      if (!!vendorReview !== transaction.vendorReviewed) {
        console.log(`  MISMATCH: vendorReviewed flag is ${transaction.vendorReviewed} but should be ${!!vendorReview}`);
        transaction.vendorReviewed = !!vendorReview;
        needsUpdate = true;
      }
      
      // Save transaction if flags were updated
      if (needsUpdate) {
        await transaction.save();
        console.log(`  Updated transaction ${transaction._id} review flags`);
        fixCount++;
      } else {
        console.log(`  Transaction ${transaction._id} flags are correct`);
      }
    }
    
    console.log(`\nSynchronization complete. Fixed ${fixCount} transactions.`);
    
  } catch (error) {
    console.error('Error synchronizing review flags:', error);
  }
}

async function main() {
  await connectDB();
  await syncReviewFlags();
  console.log('Done. Exiting.');
  process.exit(0);
}

main();
