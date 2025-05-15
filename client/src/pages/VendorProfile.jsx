import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import RequestModal from '../components/RequestModal';
import ReviewModal from '../components/ReviewModal';

export default function VendorProfile() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyData();
  }, [id]);

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
  };

  const handleRequest = async (amount, description) => {
    try {
      await axios.post('http://localhost:4000/api/transactions', {
        vendorId: id,
        amount,
        description
      }, { withCredentials: true });
      
      setShowRequestModal(false);
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-6 mb-6">
            {company.logo ? (
              <img 
                src={company.logo} 
                alt={`${company.name} logo`}
                className="w-24 h-24 rounded-full object-cover shadow-md"
              />
            ) : (
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=random&color=fff&size=192&rounded=true`} 
                alt={`${company.name} logo`}
                className="w-24 h-24 rounded-full object-cover shadow-md"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = `https://ui-avatars.com/api/?name=C&background=gray&color=fff&size=192&rounded=true`;
                }}
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{company.name}</h1>
              <p className="text-gray-600 mb-4">{company.industry}</p>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star}
                      className={`text-xl ${
                        star <= Number(company.averageRating) 
                          ? 'text-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-gray-600">
                  ({company.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 mb-6">{company.description}</p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Request Payment
            </button>
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
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      <img
                        src={`https://ui-avatars.com/api/?name=${review.role === 'supplier' ? 'S' : 'V'}&background=${review.role === 'supplier' ? '4f46e5' : '7e22ce'}&color=fff&size=64&rounded=true`}
                        alt={review.role === 'supplier' ? 'Supplier' : 'Vendor'}
                        className="w-8 h-8 rounded-full mr-2 shadow-sm"
                      />
                      <span className="text-gray-500 text-sm mr-4">
                        {review.role === 'supplier' ? 'Anonymous Supplier' : 'Anonymous Vendor'}
                      </span>
                    </div>
                    
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star}
                          className={`text-lg ${
                            star <= Number(review.rating) 
                              ? 'text-yellow-400' 
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showRequestModal && (
        <RequestModal
          company={company}
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleRequest}
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