import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        // Parse user data and ensure crucial fields are present
        const parsedUser = JSON.parse(userData);
        
        // Log user data for debugging
        console.log('Loaded user data from localStorage:', {
          id: parsedUser.id || parsedUser._id,
          roles: parsedUser.roles
        });
        
        setUser(parsedUser);
        // Set default authorization header for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Verify token is correctly set in headers
        console.log('Authorization header set:', axios.defaults.headers.common['Authorization'] ? 'Yes' : 'No');
      } catch (err) {
        console.error('Error parsing stored user data:', err);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      console.log('No stored authentication found');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:4000/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { 
        success: false, 
        error: err.response?.data?.error || 'Failed to login' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:4000/api/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      return { 
        success: false, 
        error: err.response?.data?.error || 'Failed to register' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 