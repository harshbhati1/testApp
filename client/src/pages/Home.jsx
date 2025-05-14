import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users...');
        const response = await axios.get('http://localhost:4000/api/search');
        console.log('Fetched users:', response.data);
        setUsers(response.data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.response?.data?.error || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axios.get(`http://localhost:4000/api/search?q=${encodeURIComponent(searchQuery)}`);
      console.log('Search results:', response.data);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || 'Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };

  const displayUsers = searchQuery ? searchResults : users;

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
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Companies</h1>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search companies by name or username..."
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={searchLoading}
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayUsers.map((user) => {
          console.log('User object:', user);
          return (
            <Link
              key={user.id}
              to={`/profile/${user.id}`}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center space-x-4">
                {user.logo ? (
                  <img src={user.logo} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl text-gray-500">{user.name?.[0]}</span>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
                  <p className="text-gray-600">@{typeof user.username === 'string' ? user.username : (user.email ? user.email.split('@')[0] : '')}</p>
                  <p className="text-gray-600 capitalize">{Array.isArray(user.role) ? user.role[0] : (typeof user.role === 'string' ? user.role : (user.role?.name || 'User'))}</p>
                  <p className="text-gray-600">{typeof user.industry === 'string' ? user.industry : (user.industry?.name || 'Not specified')}</p>
                  {user.averageRating > 0 && (
                    <div className="flex items-center mt-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-yellow-400 ${
                              star <= Math.round(user.averageRating) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        ({user.averageRating.toFixed(1)}) • {user.reviewCount} reviews
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-4 text-gray-700 line-clamp-2">{user.description}</p>
              {user.reviews && user.reviews.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Recent Reviews</h3>
                  <div className="space-y-2">
                    {user.reviews.slice(0, 2).map((review) => (
                      <div key={review.id} className="text-sm">
                        <div className="flex items-center">
                          <span className="text-yellow-400">★</span>
                          <span className="ml-1 font-medium">{review.rating}</span>
                          <span className="mx-2">•</span>
                          <span className="text-gray-600">{review.reviewer?.name || ''}</span>
                        </div>
                        <p className="text-gray-700 mt-1 line-clamp-2">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Home; 