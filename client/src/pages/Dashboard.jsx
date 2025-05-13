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
      }
      
      console.log('Making API request to fetch transactions...');
      const response = await axios.get('http://localhost:4000/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
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
      if (!selectedCompany?.transactionId) {
        console.error('Transaction ID is missing for review submission:', selectedCompany);
        setError('Transaction ID is missing. Cannot submit review.');
        return;
      }
      
      const transactionId = selectedCompany.transactionId;
      console.log('Submitting review for transaction ID:', transactionId);
      
      // Close modal first to give immediate feedback
      setShowReviewModal(false);
      
      // Submit the review
      const response = await axios.post('http://localhost:4000/api/reviews', {
        transactionId: transactionId,
        rating,
        comment
      });
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
      const errorMessage = err.response?.data?.error || 'Failed to submit review';
      setError(errorMessage);
      
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

    if (transaction.status === 'pending' && user?.roles?.includes('vendor')) {
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

    if (transaction.status === 'completed' && user?.roles?.includes('supplier')) {
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

      {/* Supplier Section */}
      {user?.roles?.includes('supplier') && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Request Payment</h2>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendors by name or username..."
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
              No vendors found. Try a different search term.
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((vendor) => (
                <div key={vendor.id} className="border rounded p-4">
                  <div className="flex items-center gap-4 mb-4">
                    {vendor.logo ? (
                      <img src={vendor.logo} alt={vendor.name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-2xl text-gray-500">{vendor.name[0]}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{vendor.name}</h3>
                      <p className="text-sm text-gray-500">@{vendor.username}</p>
                      <p className="text-sm text-gray-500">{vendor.industry}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{vendor.description}</p>
                  <button
                    onClick={() => handleRequest(vendor)}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Request Payment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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