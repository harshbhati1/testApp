import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import RequestModal from '../components/RequestModal';
import ReviewModal from '../components/ReviewModal';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true); // Ensure loading state is true at the start of fetching
    try {
      console.log('Fetching transactions...');
      
      // DEBUGGING - Remove this in production
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('Current logged in user:', {
            id: parsedUser.id || parsedUser._id,
            email: parsedUser.email,
            roles: parsedUser.roles
          });
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      } else {
        console.warn('No user data found in localStorage');
      }
      
      // Get token from localStorage to ensure it's fresh
      const token = localStorage.getItem('token');
      
      // If no token, set an error and return early
      if (!token) {
        console.error('No auth token available');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Log the token format for debugging (first few characters only)
      if (token && token.length > 10) {
        console.log('Using token (first 10 chars):', token.substring(0, 10) + '...');
        
        // Basic check if token looks like a valid JWT (has 3 parts separated by dots)
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error('Token does not appear to be a valid JWT format (should have 3 parts)');
          setError('Invalid authentication token format. Please log in again.');
          setLoading(false);
          return;
        }
      }
      
      console.log('Making API request to fetch transactions...');
      
      // Explicitly set Authorization header for this request
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('DEBUG - Headers being sent:', {
        'Authorization': `Bearer ${token.substring(0, 10)}...`,
        'Cache-Control': 'no-cache'
      });
      
      // Simplified headers to avoid CORS issues
      const response = await axios.get('http://localhost:4000/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}` // Only set the Authorization header
        },
        params: { // Adding a unique parameter to prevent URL-based caching
          _t: new Date().getTime(),
        },
        timeout: 10000 // 10 second timeout
      });
      console.log('Raw transaction data (cache-busted):', response.data);
      
      // Ensure all IDs are strings for consistent comparison
      const transactionsWithId = response.data.map(t => {
        // Make deep copies of nested objects to prevent reference issues
        const transaction = {
          ...t,
          _id: String(t._id || t.id),
          id: String(t._id || t.id),
          supplierId: t.supplierId ? String(t.supplierId) : null,
          vendorId: t.vendorId ? String(t.vendorId) : null,
          supplierReviewed: !!t.supplierReviewed, // Convert to boolean
          vendorReviewed: !!t.vendorReviewed,     // Convert to boolean
          
          // Copy nested objects with string IDs
          supplier: t.supplier ? {
            ...t.supplier,
            id: String(t.supplier.id)
          } : null,
          
          vendor: t.vendor ? {
            ...t.vendor,
            id: String(t.vendor.id)
          } : null
        };
        
        return transaction;
      });
      
      console.log('Processed transactions (cache-busted):', transactionsWithId);
      setTransactions(transactionsWithId);
      setError(null); // Clear previous errors on successful fetch
    } catch (err) {
      console.error('Fetch transactions error:', err);
      
      // Handle different error scenarios
      if (err.response) {
        // The server responded with a status code outside the 2xx range
        if (err.response.status === 401) {
          console.error('Authentication error:', err.response.data);
          setError('Your session has expired. Please log in again.');
          // Consider logging the user out here if authentication failed
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          setError(err.response.data?.error || `Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        setError('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request
        setError('Failed to fetch transactions: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    setSearchLoading(true);
    setSearched(true);
    try {
      const response = await axios.get(`http://localhost:4000/api/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || 'Failed to search vendors');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRequest = (vendor) => {
    setSelectedVendor(vendor);
    setShowRequestModal(true);
  };

  const handleRequestSubmit = async (amount, description) => {
    try {
      await axios.post('http://localhost:4000/api/transactions', {
        vendorId: selectedVendor.id,
        amount,
        description
      });
      setShowRequestModal(false);
      fetchTransactions();
    } catch (err) {
      console.error('Request error:', err);
      setError(err.response?.data?.error || 'Failed to create payment request');
    }
  };

  const handleStatusUpdate = async (transactionId, newStatus) => {
    try {
      console.log('handleStatusUpdate called with:', { transactionId, newStatus });
      if (!transactionId) {
        console.error('Transaction ID is missing in handleStatusUpdate');
        setError('Transaction ID is missing');
        return;
      }
      const response = await axios.patch(`http://localhost:4000/api/transactions/${transactionId}`, {
        status: newStatus
      });
      console.log('Transaction status updated successfully:', response.data);
      fetchTransactions();
    } catch (err) {
      console.error('Update transaction error:', err);
      setError(err.response?.data?.error || 'Failed to update transaction status');
    }
  };

  const handleReview = async (rating, comment) => {
    try {
      // Validate required data before proceeding
      if (!selectedCompany?.transactionId) {
        console.error('Transaction ID is missing for review submission:', selectedCompany);
        setError('Transaction ID is missing. Cannot submit review.');
        return;
      }
      
      // Validate comment is not empty
      if (!comment || comment.trim() === '') {
        console.error('Review comment cannot be empty');
        setError('Please enter a comment for your review.');
        return;
      }
      
      // Validate rating is valid
      if (!rating || rating < 1 || rating > 5) {
        console.error('Invalid rating value:', rating);
        setError('Please select a rating between 1 and 5 stars.');
        return;
      }
      
      // Ensure user is logged in
      const userData = localStorage.getItem('user');
      if (!userData) {
        const noUserError = 'You need to be logged in to submit a review.';
        console.error(noUserError);
        setError(noUserError);
        return;
      }
      
      const transactionId = selectedCompany.transactionId;
      
      // Log user and transaction data for debugging
      console.log('Review submission context:', {
        userId: JSON.parse(userData).id || JSON.parse(userData)._id,
        userRoles: JSON.parse(userData).roles,
        transactionId
      });
      console.log('Submitting review for transaction ID:', transactionId);
      
      // Close modal first to give immediate feedback
      setShowReviewModal(false);
      
      // Get fresh token to ensure auth is valid
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      // Ensure rating is a number and log it
      const numericRating = parseInt(rating, 10);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        console.error('Invalid rating before submission:', rating);
        setError('Invalid rating value. Please select between 1-5 stars.');
        return;
      }
      
      console.log('Sending review with rating:', numericRating, 'Type:', typeof numericRating);
      
      // Submit the review with explicit authorization header
      const response = await axios.post('http://localhost:4000/api/reviews', 
        {
          transactionId: transactionId,
          rating: numericRating, // Explicitly send as a number
          comment
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('Review submitted successfully for transaction ID:', transactionId, response.data);
      
      // Clear any existing transactions to avoid showing stale data temporarily
      setTransactions([]);
      
      // Add a small delay to ensure server has processed the review
      // This helps prevent race conditions
      setTimeout(async () => {
        try {
          await fetchTransactions(); // Refresh with latest data including review flags
          setError(null);
          alert('Your review was submitted successfully!');
        } catch (fetchErr) {
          console.error('Error refreshing transactions after review:', fetchErr);
        }
      }, 500);
    } catch (err) {
      console.error('Review submission error:', err.response?.data || err.message);
      
      // Extract all available error details
      const errorData = err.response?.data;
      const errorMessage = errorData?.error || 'Failed to submit review';
      const errorDetails = errorData?.message 
        ? `${errorMessage} - ${errorData.message}` 
        : errorMessage;
      
      // Log detailed error information for debugging
      console.error('Full error details:', {
        message: errorDetails,
        details: errorData?.details,
        stack: errorData?.stack
      });
      
      // Display the error in an alert with more details if available
      alert(`Review submission error: ${errorDetails}`);
      
      // Also set the error state
      setError(errorDetails);
      
      // If the error is due to an already submitted review, we should refresh to show current state
      if (errorMessage.includes('already reviewed')) {
        await fetchTransactions();
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      confirmed: 'bg-green-100 text-green-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const getActionButton = (transaction) => {
    console.log('getActionButton called with transaction:', transaction);

    if (!user || !user._id) {
      console.log('User data is not available yet in getActionButton');
      return null; // Or some placeholder if user data isn't loaded
    }

    // Check if current user is the VENDOR in this transaction (the receiving party)
    const isVendorInTransaction = String(user._id) === String(transaction.vendorId);

    if (transaction.status === 'pending' && isVendorInTransaction) {
      console.log('User is the VENDOR in this transaction (recipient of request)');
      return (
        <div className="space-x-2">
          <button
            onClick={() => {
              console.log('Mark as Paid clicked for transaction:', transaction);
              handleStatusUpdate(transaction._id, 'completed');
            }}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Mark as Paid
          </button>
          <button
            onClick={() => {
              console.log('Reject clicked for transaction:', transaction);
              handleStatusUpdate(transaction._id, 'rejected');
            }}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      );
    }

    // Check if current user is the SUPPLIER in this transaction (the initiating party)
    const isSupplierInTransaction = String(user._id) === String(transaction.supplierId);
    
    if (transaction.status === 'completed' && isSupplierInTransaction) {
      console.log('User is the SUPPLIER in this transaction (initiator of request)');
      return (
        <button
          onClick={() => {
            console.log('Confirm Payment clicked for transaction:', transaction);
            handleStatusUpdate(transaction._id, 'confirmed');
          }}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
        >
          Confirm Payment
        </button>
      );
    }

    if (transaction.status === 'confirmed') {
      console.log('Confirmed transaction details:', transaction);
      console.log('Current user details:', user);
      
      const userIdStr = String(user._id);
      // Use the direct supplierId and vendorId from the transaction object
      const transactionSupplierId = String(transaction.supplierId);
      const transactionVendorId = String(transaction.vendorId);
      
      const isSupplier = userIdStr === transactionSupplierId;
      const isVendor = userIdStr === transactionVendorId;
      
      console.log('ID comparisons for review eligibility:', {
        userId: userIdStr,
        transactionSupplierId: transactionSupplierId,
        transactionVendorId: transactionVendorId,
        isSupplierRoleInTransaction: isSupplier,
        isVendorRoleInTransaction: isVendor
      });
      
      console.log('Transaction review flags:', {
        supplierReviewed: transaction.supplierReviewed,
        vendorReviewed: transaction.vendorReviewed
      });
      
      // Check if the current user (based on their role in THIS transaction) has already reviewed
      // Use double-bang to ensure we're working with boolean values
      const hasSupplierReviewed = !!transaction.supplierReviewed;
      const hasVendorReviewed = !!transaction.vendorReviewed;
      
      console.log('Review status with explicit booleans:', {
        hasSupplierReviewed,
        hasVendorReviewed,
        rawSupplierReviewed: transaction.supplierReviewed,
        rawVendorReviewed: transaction.vendorReviewed
      });
      
      if (isSupplier && hasSupplierReviewed) {
        console.log('User is Supplier for this transaction and has already reviewed.');
        return <span className="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded">Already Reviewed</span>;
      }
      if (isVendor && hasVendorReviewed) {
        console.log('User is Vendor for this transaction and has already reviewed.');
        return <span className="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded">Already Reviewed</span>;
      }
      
      // If not reviewed yet, show the appropriate review button
      if (isSupplier) {
        console.log('User is Supplier. Offering "Review Vendor" button.');
        return (
          <button
            onClick={() => {
              console.log('Opening review modal for vendor (user is supplier)');
              setSelectedCompany({ 
                name: transaction.vendor?.name || "Vendor", 
                transactionId: transaction._id 
              });
              setShowReviewModal(true);
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Review Vendor
          </button>
        );
      } else if (isVendor) {
        console.log('User is Vendor. Offering "Review Supplier" button.');
        return (
          <button
            onClick={() => {
              console.log('Opening review modal for supplier (user is vendor)');
              setSelectedCompany({ 
                name: transaction.supplier?.name || "Supplier", 
                transactionId: transaction._id
              });
              setShowReviewModal(true);
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Review Supplier
          </button>
        );
      }
      console.log('User is neither supplier nor vendor for this transaction, or flags are in an unexpected state. No review button shown.');
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {/* Payment Request Section - Available to all users */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Send Payment Requests</h2>
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for users by name..."
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

        {searched && searchResults.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No users found. Try a different search term.
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((user) => (
              <div key={user.id} className="border rounded p-4">
                <div className="flex items-center gap-4 mb-4">
                  {user.logo ? (
                    <img src={user.logo} alt={user.name} className="w-16 h-16 rounded-full object-cover shadow-md" />
                  ) : (
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&size=128&rounded=true`}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover shadow-md"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=U&background=gray&color=fff&size=128&rounded=true`;
                      }}
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-sm text-gray-500">Role: {user.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRequest(user)}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Request Payment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-600">No transactions found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map(transaction => {
                  const isSupplier = String(user._id) === String(transaction.supplier?.id);
                  const otherParty = isSupplier ? transaction.vendor : transaction.supplier;
                  console.log('You:', user._id, 'Supplier:', transaction.supplier?.id, 'Vendor:', transaction.vendor?.id, 'Other party:', otherParty);
                  return (
                    <tr key={transaction._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {/* Display avatar for transaction party */}
                          {otherParty?.logo ? (
                            <img 
                              src={otherParty.logo} 
                              alt={otherParty?.name || 'Company'}
                              className="w-10 h-10 rounded-full object-cover mr-3 shadow-sm" 
                            />
                          ) : (
                            <img 
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(otherParty?.name || 'Unknown')}&background=random&color=fff&size=80&rounded=true`}
                              alt={otherParty?.name || 'Company'}
                              className="w-10 h-10 rounded-full object-cover mr-3 shadow-sm"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=C&background=gray&color=fff&size=80&rounded=true`;
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {(() => {
                                return otherParty?.id && otherParty?.name ? (
                                  <Link to={`/profile/${otherParty.id}`} className="text-blue-600 hover:underline">{otherParty.name}</Link>
                                ) : 'Unknown';
                              })()}
                            </div>
                            <div className="text-sm text-gray-500">{transaction.description}</div>
                            {/* Debug info - can be removed in production */}
                            {transaction.status === 'confirmed' && (
                              <div className="text-xs text-gray-400 mt-1">
                                {isSupplier ? "You're supplier" : "You're vendor"} • 
                                S:{transaction.supplierReviewed ? '✓' : '✗'} 
                                V:{transaction.vendorReviewed ? '✓' : '✗'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${transaction.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getStatusBadgeClass(transaction.status)
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getActionButton(transaction)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRequestModal && (
        <RequestModal
          vendor={selectedVendor}
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleRequestSubmit}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          isOpen={showReviewModal}
          company={selectedCompany}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
};

export default Dashboard;