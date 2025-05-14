import { useState } from 'react';

const ReviewModal = ({ isOpen, company, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate rating and comment
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars');
      return;
    }
    
    if (!comment.trim()) {
      setError('Please provide a comment');
      return;
    }
    
    // Log before submitting to check value
    console.log('Submitting review with rating:', rating, 'Type:', typeof rating);
    
    // Pass the numeric rating and comment to parent component
    onSubmit(Number(rating), comment);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Review {company?.name}</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Rating
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    console.log('Star clicked:', star);
                    setRating(star);
                  }}
                  className={`text-2xl ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating} {rating === 1 ? 'Star' : 'Stars'}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Share your experience..."
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal; 