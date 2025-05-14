// Create this file in client/src/pages/TokenDebug.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// A special debug page to check token state and connectivity
const TokenDebug = () => {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Loading...');
  const [testResponse, setTestResponse] = useState(null);
  const [tokenValidated, setTokenValidated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkConnection() {
      try {
        // Check basic connectivity
        const result = await axios.get('http://localhost:4000/api/test-connection');
        setConnectionStatus(`Connected to server: ${result.data.message}`);
        setTestResponse(result.data);
      } catch (err) {
        setConnectionStatus(`Error connecting to server: ${err.message}`);
      }
    }

    async function checkToken() {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token) {
        setTokenInfo({
          error: 'No token found in localStorage',
          isValid: false
        });
        return;
      }

      // Parse token parts (without validation)
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          setTokenInfo({
            error: 'Token is not in valid JWT format',
            isValid: false,
            token: `${token.substring(0, 10)}...`
          });
          return;
        }

        // Decode payload (middle part)
        const payload = JSON.parse(atob(parts[1]));
        
        setTokenInfo({
          id: payload.id,
          email: payload.email,
          roles: payload.roles,
          iat: new Date(payload.iat * 1000).toLocaleString(),
          exp: new Date(payload.exp * 1000).toLocaleString(),
          isExpired: payload.exp * 1000 < Date.now(),
          token: `${token.substring(0, 10)}...`,
          isValid: true
        });

        // Now test with the API to see if server accepts the token
        try {
          const config = {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          };

          const validateResponse = await axios.get('http://localhost:4000/api/auth/verify-token', config);
          setTokenValidated(true);
        } catch (err) {
          setTokenValidated(false);
          setTokenInfo(prev => ({
            ...prev,
            serverValidation: `Failed: ${err.response?.data?.error || err.message}`,
            isValid: false
          }));
        }

      } catch (err) {
        setTokenInfo({
          error: `Error decoding token: ${err.message}`,
          isValid: false,
          token: `${token.substring(0, 10)}...`
        });
      }
    }

    checkConnection();
    checkToken();
  }, []);

  const handleClearTokens = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('Token and user data cleared!');
    window.location.reload();
  };

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Server Connection</h2>
        <div className={`p-4 rounded ${connectionStatus.includes('Error') ? 'bg-red-100' : 'bg-green-100'}`}>
          {connectionStatus}
        </div>
        
        {testResponse && (
          <div className="mt-4">
            <h3 className="font-semibold">Server Response:</h3>
            <pre className="bg-gray-100 p-3 rounded mt-2 text-sm">
              {JSON.stringify(testResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-3">Token Information</h2>
        
        {tokenInfo ? (
          <div>
            <div className={`p-4 rounded mb-4 ${tokenInfo.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
              Status: {tokenInfo.isValid ? 'Token appears valid' : 'Token invalid or expired'} 
              {tokenValidated !== null && (
                <span className="block mt-1">
                  Server Validation: {tokenValidated ? '✓ Accepted by server' : '✗ Rejected by server'}
                </span>
              )}
            </div>
            
            {tokenInfo.error ? (
              <div className="text-red-600 mb-4">{tokenInfo.error}</div>
            ) : (
              <div>
                <p><strong>User ID:</strong> {tokenInfo.id}</p>
                <p><strong>Email:</strong> {tokenInfo.email}</p>
                <p><strong>Roles:</strong> {tokenInfo.roles?.join(', ') || 'None'}</p>
                <p><strong>Issued:</strong> {tokenInfo.iat}</p>
                <p><strong>Expires:</strong> {tokenInfo.exp}</p>
                <p><strong>Is Expired:</strong> {tokenInfo.isExpired ? 'Yes' : 'No'}</p>
                <p><strong>Token Preview:</strong> {tokenInfo.token}</p>
                {tokenInfo.serverValidation && (
                  <p><strong>Server Validation:</strong> {tokenInfo.serverValidation}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        )}
        
        <div className="mt-6 flex space-x-4">
          <button 
            onClick={handleClearTokens}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear Local Storage
          </button>
          <button 
            onClick={handleNavigateToLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenDebug;
