const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const requireAuth = require('../middleware/requireAuth');

// Get user's transactions
router.get('/', requireAuth, async (req, res) => {
  console.log(`[${new Date().toISOString()}] TRANSACTIONS_ROUTE: Entered GET /transactions for user: ${req.user ? req.user.id : 'UNKNOWN USER'}`);
  try {
    console.log('GET /transactions - Processing request for user:', req.user.id);
    
    if (!req.user) {
      console.error('User object not found in request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!req.user.id && !req.user._id) {
      console.error('User ID not found in token payload');
      return res.status(400).json({ error: 'Invalid user information in token' });
    }
    
    const { status } = req.query;
    
    // Try both id and _id formats to be safe - provide a default if somehow both are missing
    const userId = req.user.id || req.user._id || 'invalid-id';
    console.log('Looking for transactions with user ID:', userId);
    
    // Convert to string if it's an ObjectId
    const userIdStr = String(userId);
    
    // Debug what we're looking for
    console.log(`Searching for transactions where supplierId or vendorId equals: ${userIdStr}`);
    
    // Create a query that handles various ID formats
    const query = {
      $or: [
        { supplierId: userId },
        { vendorId: userId },
        { supplierId: userIdStr },
        { vendorId: userIdStr }
      ]
    };
    
    // Log the MongoDB query we're executing
    console.log('MongoDB query:', JSON.stringify(query));

    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .populate('supplierId', 'name')
      .populate('vendorId', 'name')
      .sort({ createdAt: -1 });

    // Log total transactions found
    console.log(`Found ${transactions.length} transactions for user ID: ${req.user.id}`);
    
    // Check if we got any results
    if (transactions.length === 0) {
      console.log('No transactions found for query:', query);
    }
    
    const mappedTransactions = transactions.map(t => {
      // Extract supplier ID safely
      let supplierId = null;
      if (t.supplierId) {
        if (typeof t.supplierId === 'object') {
          supplierId = t.supplierId._id ? t.supplierId._id.toString() : t.supplierId.toString();
        } else {
          supplierId = t.supplierId.toString();
        }
      }
      
      // Extract vendor ID safely
      let vendorId = null;
      if (t.vendorId) {
        if (typeof t.vendorId === 'object') {
          vendorId = t.vendorId._id ? t.vendorId._id.toString() : t.vendorId.toString();
        } else {
          vendorId = t.vendorId.toString();
        }
      }
      
      // Check if this transaction belongs to current user
      const isUserTransaction = (supplierId === req.user.id || vendorId === req.user.id);
      if (!isUserTransaction) {
        console.log(`Warning: Transaction ${t._id} doesn't match user ${req.user.id}`);
      }
      
      // Get supplier and vendor names safely
      const supplierName = typeof t.supplierId === 'object' && t.supplierId ? t.supplierId.name : 'Unknown';
      const vendorName = typeof t.vendorId === 'object' && t.vendorId ? t.vendorId.name : 'Unknown';
        
      // Ensure we have the raw IDs for comparison as well as objects
      const transaction = {
        _id: t._id.toString(),  // Ensure ID is a string
        id: t._id.toString(),   // Ensure ID is a string
        amount: t.amount,
        description: t.description,
        status: t.status,
        // Include both the populated objects and raw IDs for flexibility
        supplier: supplierId ? { 
          id: supplierId, 
          name: supplierName
        } : null,
        vendor: vendorId ? { 
          id: vendorId, 
          name: vendorName
        } : null,
        // Include the raw IDs as well (as strings for consistent comparison)
        supplierId: supplierId,
        vendorId: vendorId,
        // Ensure these are always boolean values
        supplierReviewed: typeof t.supplierReviewed === 'boolean' ? t.supplierReviewed : false,
        vendorReviewed: typeof t.vendorReviewed === 'boolean' ? t.vendorReviewed : false,
        createdAt: t.createdAt
      };
      
      console.log('Processed transaction:', transaction);
      return transaction;
    });
    
    console.log('Sending mapped transactions:', mappedTransactions);
    res.json(mappedTransactions);
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create payment request
router.post('/', requireAuth, async (req, res) => {
  try {
    const { vendorId, amount, description } = req.body;

    // Allow any user to create payment requests 
    // (supplierId = requester, vendorId = recipient)
    // We don't check roles anymore, as any user can send payment requests
    
    console.log('Creating transaction with supplier (requester):', req.user.id, 'vendor (recipient):', vendorId);

    const transaction = new Transaction({
      supplierId: req.user.id,  // Current user is the requester
      vendorId,                 // Target user is the recipient
      amount,
      description,
      status: 'pending'
    });

    await transaction.save();
    res.json(transaction);
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update transaction status
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if user is part of the transaction
    if (![transaction.supplierId.toString(), transaction.vendorId.toString()].includes(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to update this transaction' });
    }

    // Validate status changes
    const validStatusChanges = {
      pending: ['completed', 'rejected'],
      completed: ['confirmed'],
      confirmed: []
    };

    if (!validStatusChanges[transaction.status].includes(status)) {
      return res.status(400).json({ error: 'Invalid status change' });
    }

    // Check transaction-role-based permissions based on the user's role in THIS transaction
    // Only the recipient (vendorId) can mark as completed
    if (status === 'completed' && transaction.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ 
        error: 'Only the recipient of the request can mark payments as completed',
        details: {
          yourId: req.user.id,
          transactionVendorId: transaction.vendorId.toString()
        }
      });
    }

    // Only the initiator (supplierId) can confirm the payment
    if (status === 'confirmed' && transaction.supplierId.toString() !== req.user.id) {
      return res.status(403).json({ 
        error: 'Only the initiator of the request can confirm payments',
        details: {
          yourId: req.user.id,
          transactionSupplierId: transaction.supplierId.toString()
        }
      });
    }

    // Update transaction status
    transaction.status = status;
    
    // If marking as completed, reset review flags
    if (status === 'completed') {
      transaction.supplierReviewed = false;
      transaction.vendorReviewed = false;
      console.log('Transaction marked as completed, review flags reset');
    }
    
    // If confirming payment, ensure review flags are properly set
    if (status === 'confirmed') {
      console.log('==========================================');
      console.log('TRANSACTION CONFIRMED - SETTING REVIEW FLAGS');
      console.log('==========================================');
      console.log('Current flags before confirmation:', {
        supplierReviewed: transaction.supplierReviewed,
        vendorReviewed: transaction.vendorReviewed
      });
      
      // CRITICAL: Force both flags to be explicitly false to ensure reviews can be submitted
      transaction.supplierReviewed = false;
      transaction.vendorReviewed = false;
      
      console.log('Review flags after confirmation:', {
        supplierReviewed: transaction.supplierReviewed,
        vendorReviewed: transaction.vendorReviewed
      });
      // Removed duplicate flag reset that was here
    }

    await transaction.save();

    // Return populated transaction data
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('supplierId', 'name')
      .populate('vendorId', 'name');

    const responseData = {
      _id: populatedTransaction._id,  // Include both _id and id for compatibility
      id: populatedTransaction._id,
      amount: populatedTransaction.amount,
      description: populatedTransaction.description,
      status: populatedTransaction.status,
      supplier: populatedTransaction.supplierId ? { id: populatedTransaction.supplierId._id, name: populatedTransaction.supplierId.name } : null,
      vendor: populatedTransaction.vendorId ? { id: populatedTransaction.vendorId._id, name: populatedTransaction.vendorId.name } : null,
      supplierReviewed: populatedTransaction.supplierReviewed || false,  // Ensure these are always boolean values
      vendorReviewed: populatedTransaction.vendorReviewed || false,      // Ensure these are always boolean values
      createdAt: populatedTransaction.createdAt
    };
    
    console.log('Sending updated transaction response:', responseData);
    res.json(responseData);
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get transactions for a specific user
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [
        { vendorId: req.params.userId },
        { supplierId: req.params.userId }
      ]
    })
      .populate('supplierId', 'name')
      .populate('vendorId', 'name')
      .select('amount status supplierId vendorId')
      .lean();

    res.json(transactions.map(t => ({
      id: t._id,
      amount: t.amount,
      status: t.status,
      supplier: t.supplierId ? { id: t.supplierId._id, name: t.supplierId.name } : null,
      vendor: t.vendorId ? { id: t.vendorId._id, name: t.vendorId.name } : null
    })));
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router; 