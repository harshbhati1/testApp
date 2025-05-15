import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';

const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-lg p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-purple-600">Vendor Verification</Link>
          <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-lg p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-purple-600">Vendor Verification</Link>
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-600 hover:text-purple-600">Home</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-600 hover:text-purple-600">Dashboard</Link>              <div className="flex items-center gap-2">                <UserAvatar
                  name={user.name} 
                  image={null} // Force using generated avatar
                  size="xs"
                  background="consistent"
                  bold={true} 
                  rounded={true}
                  className="shadow-sm"
                />
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Login</Link>
              <Link to="/signup" className="px-4 py-2 bg-purple-400 text-white rounded hover:bg-purple-500">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 