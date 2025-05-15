import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserAvatar from '../components/UserAvatar';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to format time ago
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return Math.floor(seconds) + ' seconds ago';
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('Fetching profile for ID:', id);
        const response = await axios.get(`http://localhost:4000/api/search/${id}`);
        console.log('Profile data received:', response.data);
        setProfile(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.error || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    } else {
      setError('No profile ID provided');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 text-red-800 p-4 rounded">
          <p className="mb-2">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded">
          <p className="mb-2">Profile not found</p>
          <button 
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">        <div className="flex items-center space-x-6">          {/* User profile avatar using UserAvatar component */}          <UserAvatar 
            name={profile.name}
            image={profile.logo}
            size="lg"
            background="consistent"
            className="shadow-md"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{profile.name}</h1>
            <p className="text-gray-600">@{profile.email.split('@')[0]}</p>
            <p className="text-gray-600 capitalize">{profile.role}</p>
            <p className="text-gray-600">{profile.industry}</p>
            {profile.averageRating > 0 && (
              <div className="flex items-center mt-2">
                <div className="flex">                  {[1, 2, 3, 4, 5].map((star) => {
                    // Convert profile.averageRating to a number
                    const rating = parseFloat(profile.averageRating);
                    return (
                      <span
                        key={star}
                        className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
                      >
                        ★
                      </span>
                    );
                  })}
                </div>
                <span className="ml-2 text-gray-600">
                  ({profile.averageRating.toFixed(1)}) • {profile.reviewCount} reviews
                </span>
              </div>
            )}
          </div>
        </div>
        <p className="mt-6 text-gray-700">{profile.description}</p>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">All Reviews</h2>
        {profile.reviews && profile.reviews.length > 0 ? (
          <div className="space-y-6">
            {profile.reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">                <div className="flex items-center justify-between mb-2">                  <Link 
                    to={`/profile/${review.reviewer.id}`}
                    className="flex items-center space-x-2 hover:text-blue-600"
                  >
                    <UserAvatar 
                      name={review.reviewer.name}
                      image={review.reviewer.logo}
                      size="xs"
                      className="mr-2" 
                    />
                    <span className="font-medium">{review.reviewer.name}</span>
                  </Link><div className="flex items-center">
                    <div className="flex">                      {[1, 2, 3, 4, 5].map((star) => {
                        // Convert review.rating to a number and check if star should be filled
                        const rating = parseFloat(review.rating);
                        return (
                          <span
                            key={star}
                            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
                          >
                            ★
                          </span>
                        );
                      })}
                    </div>
                    <span className="ml-2 text-gray-600">{review.rating}</span>
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
                {review.bracket && (
                  <p className="text-sm text-gray-500 mt-1">
                    Transaction Bracket: {review.bracket}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {getTimeAgo(review.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No reviews yet</p>
        )}
      </div>
    </div>
  );
};

export default Profile; 