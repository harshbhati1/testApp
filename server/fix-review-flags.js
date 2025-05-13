// This script will reset the review flags for all confirmed transactions
// to ensure both parties can submit reviews independently

const mongoose = require('mongoose');
require('dotenv').config();
const Transaction = require('./models/Transaction');

async function fixReviewFlags() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all confirmed transactions
    const transactions = await Transaction.find({ status: 'confirmed' });
    console.log(`Found ${transactions.length} confirmed transactions`);

    // Update each transaction's review flags
    let updated = 0;
    for (const transaction of transactions) {
      // Reset both flags to false to allow both parties to submit reviews
      transaction.supplierReviewed = false;
      transaction.vendorReviewed = false;
      
      await transaction.save();
      updated++;
      console.log(`Reset flags for transaction ${transaction._id}`);
    }

    console.log(`Updated ${updated} transactions`);
    console.log('All done! Both suppliers and vendors can now submit reviews independently.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixReviewFlags();
