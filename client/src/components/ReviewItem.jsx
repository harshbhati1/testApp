import React from 'react';
import UserAvatar from './UserAvatar';

/**
 * ReviewItem component to display a single review with consistent styling
 */
const ReviewItem = ({ review }) => {
  return (
    <div className="border-b border-gray-200 pb-6 last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center">
          <UserAvatar
            name={review.role === 'supplier' ? 'Supplier' : 'Vendor'}
            size="xs"
            colorScheme={review.role === 'supplier' ? 'blue' : 'purple'}
            className="mr-2 shadow-sm"
          />
          <span className="text-gray-500 text-sm mr-4">
            {review.role === 'supplier' ? 'Anonymous Supplier' : 'Anonymous Vendor'}
          </span>
        </div>
        
        <div className="flex">          {[1, 2, 3, 4, 5].map((star) => {
              // Convert review.rating to a number and check if the star should be filled
              const rating = parseFloat(review.rating);
              return (
                <span 
                  key={star}
                  className={`text-lg ${
                    star <= rating
                      ? 'text-yellow-400' 
                      : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              );
            })}
        </div>
        
        <span className="text-xs text-gray-400 ml-auto">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="text-gray-600">{review.comment}</p>
    </div>
  );
};

export default ReviewItem;
