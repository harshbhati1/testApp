import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roles: []
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, value]
        : prev.roles.filter(role => role !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.roles.length === 0) {
      setError('Please select at least one role');
      return;
    }

    try {
      console.log('Submitting registration:', { ...formData, password: '***' });
      const response = await axios.post('http://localhost:4000/api/auth/register', 
        formData
      );
      
      if (response.data.user) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err.response?.data || err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.join(', ') || 
                          'Registration failed';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral">
      <div className="max-w-sm w-full mx-4">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold text-center mb-6">Sign Up</h2>
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-control">
                <input 
                  type="text" 
                  placeholder="Name" 
                  className="input input-bordered w-full mb-3" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required 
                />
              </div>
              <div className="form-control">
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="input input-bordered w-full mb-3" 
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required 
                />
              </div>
              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text mb-1">Select Role(s)</span>
                </label>
                <label className="cursor-pointer label justify-start gap-2">
                  <input 
                    type="checkbox" 
                    value="supplier" 
                    className="checkbox checkbox-secondary"
                    onChange={handleRoleChange}
                  /> 
                  Supplier
                </label>
                <label className="cursor-pointer label justify-start gap-2">
                  <input 
                    type="checkbox" 
                    value="vendor" 
                    className="checkbox checkbox-secondary"
                    onChange={handleRoleChange}
                  /> 
                  Vendor
                </label>
              </div>
              <div className="form-control">
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="input input-bordered w-full mb-6" 
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required 
                />
              </div>
              <button className="btn btn-primary w-full" type="submit">
                Create Account
              </button>
            </form>
            <p className="mt-4 text-sm text-center">
              Have an account? <Link to="/login" className="link text-secondary">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 