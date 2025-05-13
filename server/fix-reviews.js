require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const Review = require('./models/Review');

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Checking for inconsistencies in reviews...');

    // Get all transactions that are confirmed (eligible for reviews)
    const transactions = await Transaction.find({ status: 'confirmed' });
    console.log(`Found ${transactions.length} confirmed transactions`);

    // For each transaction, check the reviews and update the flags
    for (const transaction of transactions) {
      console.log(`\nChecking transaction ${transaction._id}`);
      
      // Find all reviews for this transaction
      const reviews = await Review.find({ transaction: transaction._id });
      console.log(`Found ${reviews.length} reviews for this transaction`);

      // Check for supplier reviews
      const supplierReviews = reviews.filter(r => 
        r.reviewer.toString() === transaction.supplierId.toString()
      );
      
      // Check for vendor reviews
      const vendorReviews = reviews.filter(r => 
        r.reviewer.toString() === transaction.vendorId.toString()
      );

      console.log(`Supplier reviews: ${supplierReviews.length}, flag: ${transaction.supplierReviewed}`);
      console.log(`Vendor reviews: ${vendorReviews.length}, flag: ${transaction.vendorReviewed}`);

      // Update the transaction flags to match the actual reviews
      let needsUpdate = false;
      
      // If supplier has reviews but flag is false, update it
      if (supplierReviews.length > 0 && !transaction.supplierReviewed) {
        console.log('Fixing: Setting supplierReviewed to true');
        transaction.supplierReviewed = true;
        needsUpdate = true;
      }
      
      // If supplier has no reviews but flag is true, update it
      if (supplierReviews.length === 0 && transaction.supplierReviewed) {
        console.log('Fixing: Setting supplierReviewed to false');
        transaction.supplierReviewed = false;
        needsUpdate = true;
      }
      
      // If vendor has reviews but flag is false, update it
      if (vendorReviews.length > 0 && !transaction.vendorReviewed) {
        console.log('Fixing: Setting vendorReviewed to true');
        transaction.vendorReviewed = true;
        needsUpdate = true;
      }
      
      // If vendor has no reviews but flag is true, update it
      if (vendorReviews.length === 0 && transaction.vendorReviewed) {
        console.log('Fixing: Setting vendorReviewed to false');
        transaction.vendorReviewed = false;
        needsUpdate = true;
      }

      // Save the transaction if needed
      if (needsUpdate) {
        await transaction.save();
        console.log('Transaction updated');
      } else {
        console.log('No updates needed for this transaction');
      }
    }

    console.log('\nReview fix completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
