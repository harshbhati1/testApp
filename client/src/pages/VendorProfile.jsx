import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import RequestModal from '../components/RequestModal';
import ReviewModal from '../components/ReviewModal';
import UserAvatar from '../components/UserAvatar';
import ReviewItem from '../components/ReviewItem';
import { getReviewerAvatar } from '../utils/avatars';

export default function VendorProfile() {  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [error, setError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSelfRequest, setIsSelfRequest] = useState(false);
  useEffect(() => {
    fetchCompanyData();
  }, [id]);

  useEffect(() => {
    if (currentUser && (currentUser.id === id || currentUser._id === id)) {
      setIsSelfRequest(true);
      // Close request modal if it's open
      if (showRequestModal) {
        setShowRequestModal(false);
      }
    } else {
      setIsSelfRequest(false);
    }
  }, [currentUser, id, showRequestModal]);

  const fetchCompanyData = async () => {
    try {
      const [companyResponse, reviewsResponse] = await Promise.all([
        axios.get(`http://localhost:4000/api/search/${id}`),
        axios.get(`http://localhost:4000/api/reviews/${id}`)
      ]);
      setCompany(companyResponse.data);
      setReviews(reviewsResponse.data.reviews);
    } catch (err) {
      setError('Failed to fetch company data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };  const handleRequest = async (amount, description) => {
    // Check if the current user is the same as the vendor
    if (isSelfRequest) {
      setRequestError('You cannot send a payment request to yourself');
      return;
    }

    try {
      await axios.post('http://localhost:4000/api/transactions', {
        vendorId: id,
        amount,
        description
      }, { withCredentials: true });
      
      setShowRequestModal(false);
      setRequestError('');
    } catch (err) {
      setError('Failed to create payment request');
    }
  };

  const handleReview = async (rating, comment) => {
    try {
      await axios.post('http://localhost:4000/api/reviews', {
        vendorId: id,
        rating,
        comment
      }, { withCredentials: true });
      
      setShowReviewModal(false);
      fetchCompanyData();
    } catch (err) {
      setError('Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded shadow-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Company not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Company Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">          <div className="flex items-center gap-6 mb-6">            <UserAvatar 
              name={company.name ? company.name.toUpperCase() : 'U'} // Force uppercase for consistency
              image={company.logo}
              size="lg"
              background="consistent"
              length={1} // Show only first letter for consistency
              bold={true} // Ensure bold text
              className="shadow-md"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{company.name}</h1>
              <p className="text-gray-600 mb-4">{company.industry}</p>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => {
                    // Convert company.averageRating to a number and check if the star should be filled
                    const rating = parseFloat(company.averageRating);
                    return (
                      <span 
                        key={star}
                        className={`text-xl ${
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
                <span className="text-gray-600">
                  ({company.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 mb-6">{company.description}</p>          <div className="flex gap-4">
            {isSelfRequest ? (
              <div className="text-sm text-gray-500 italic py-2">
                This is your company profile
              </div>
            ) : (
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Request Payment
              </button>
            )}
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-6 py-2 bg-purple-400 text-white rounded hover:bg-purple-500"
            >
              Write Review
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-gray-600">No reviews yet</p>
          ) : (            <div className="space-y-6">
              {reviews.map(review => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}      {showRequestModal && (
        <RequestModal
          vendor={company}
          onClose={() => {
            setShowRequestModal(false);
            setRequestError('');
          }}
          onSubmit={handleRequest}
          error={requestError}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          company={company}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
} 