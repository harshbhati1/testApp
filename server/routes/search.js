const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Review = require('../models/Review');

function getBracket(amount) {
  if (amount == null) return null;
  if (amount < 1000) return '$0 - $1,000';
  if (amount < 5000) return '$1,000 - $5,000';
  if (amount < 20000) return '$5,000 - $20,000';
  if (amount < 50000) return '$20,000 - $50,000';
  return 'Above $50,000';
}

// Get all users (vendors and suppliers) - No auth required
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    
    // If no search query, return all users
    if (!q) {
      const users = await User.find()
        .select('name email roles')
        .lean();

      // Get reviews for each user
      const usersWithReviews = await Promise.all(users.map(async (user) => {
        const reviews = await Review.find({ reviewedCompany: user._id })
          .populate('reviewer', 'name')
          .populate('transaction', 'amount')
          .lean();

        const averageRating = reviews.length > 0
          ? reviews.reduce((acc, review) => acc + Number(review.rating), 0) / reviews.length
          : 0;

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.roles[0],
          reviews: reviews.map(review => ({
            id: review._id,
            rating: Number(review.rating),
            comment: review.comment,
            reviewer: {
              id: review.reviewer?._id,
              name: review.reviewer?.name
            },
            amount: review.transaction?.amount,
            bracket: review.transaction?.amount ? getBracket(review.transaction.amount) : null,
            transactionId: review.transaction?._id,
            createdAt: review.createdAt
          })),
          averageRating,
          reviewCount: reviews.length
        };
      }));

      return res.json(usersWithReviews);
    }

    // If search query exists, search by name
    const searchQuery = {
      name: { $regex: q, $options: 'i' }
    };

    const users = await User.find(searchQuery)
      .select('name email roles')
      .lean();

    // Get reviews for each user
    const usersWithReviews = await Promise.all(users.map(async (user) => {
      const reviews = await Review.find({ reviewedCompany: user._id })
        .populate('reviewer', 'name')
        .populate('transaction', 'amount')
        .lean();

      const averageRating = reviews.length > 0
        ? reviews.reduce((acc, review) => acc + Number(review.rating), 0) / reviews.length
        : 0;

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.roles[0],
        reviews: reviews.map(review => ({
          id: review._id,
          rating: review.rating,
          comment: review.comment,
          reviewer: {
            id: review.reviewer?._id,
            name: review.reviewer?.name
          },
          amount: review.transaction?.amount,
          bracket: review.transaction?.amount ? getBracket(review.transaction.amount) : null,
          transactionId: review.transaction?._id,
          createdAt: review.createdAt
        })),
        averageRating,
        reviewCount: reviews.length
      };
    }));

    res.json(usersWithReviews);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user by ID - No auth required
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching user profile for ID:', req.params.id);
    
    const user = await User.findById(req.params.id)
      .select('name email roles')
      .lean();

    if (!user) {
      console.log('User not found for ID:', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Found user:', user);

    const reviews = await Review.find({ reviewedCompany: user._id })
      .populate('reviewer', 'name')
      .populate('transaction', 'amount')
      .lean();

    console.log('Found reviews:', reviews);

    const averageRating = reviews.length > 0
      ? reviews.reduce((acc, review) => acc + Number(review.rating), 0) / reviews.length
      : 0;

    const formattedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.roles[0],
      reviews: reviews.map(review => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        reviewer: {
          id: review.reviewer?._id,
          name: review.reviewer?.name
        },
        amount: review.transaction?.amount,
        bracket: review.transaction?.amount ? getBracket(review.transaction.amount) : null,
        transactionId: review.transaction?._id,
        createdAt: review.createdAt
      })),
      averageRating,
      reviewCount: reviews.length
    };

    console.log('Sending formatted user:', formattedUser);
    res.json(formattedUser);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

module.exports = router; 