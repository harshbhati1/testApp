import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ConnectionTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Testing connection...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('Testing connection to the server...');
        
        // Try with a direct GET request without auth
        const result = await axios.get('http://localhost:4000/api/test-connection', {
          timeout: 5000
        });
        
        console.log('Connection test result:', result.data);
        setIsConnected(true);
        setStatus('Connected to server successfully!');
      } catch (err) {
        console.error('Connection test error:', err);
        
        if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
          setStatus('Network error: Cannot reach the server. Check if the server is running.');
        } else if (err.response) {
          // The server responded with a status code outside of 2xx
          setStatus(`Server responded with error ${err.response.status}: ${err.response.data.error || 'Unknown error'}`);
        } else if (err.request) {
          // The request was made but no response was received
          setStatus('No response received from server. Check server logs and firewall settings.');
        } else {
          // Something happened in setting up the request
          setStatus(`Request setup error: ${err.message}`);
        }
        
        setError(err);
        setIsConnected(false);
      }
    };
    
    testConnection();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">API Connection Test</h2>
      <div className={`p-4 mb-4 ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded`}>
        {status}
      </div>

      {error && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">Error Details:</h3>
          <pre className="p-3 bg-gray-100 rounded overflow-auto text-xs">
            {error.message}
          </pre>
        </div>
      )}

      <div className="mt-4">
        <h3 className="font-bold mb-2">Connection Troubleshooting:</h3>
        <ul className="list-disc pl-5">
          <li>Make sure the server is running on port 4000</li>
          <li>Check for any CORS issues in browser console</li>
          <li>Verify the server URL is correct (http://localhost:4000)</li>
          <li>Check if your firewall is blocking requests</li>
          <li>Try restarting both client and server</li>
        </ul>
      </div>
    </div>
  );
}

export default ConnectionTest;
