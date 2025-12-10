import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PricingPage from './components/PricingPage';
import ContactUs from './components/ContactUs';
import Login from './components/Login';
import axios from 'axios';
import { API_BASE_URL } from './config/api';
import logo from './assets/logo.PNG';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    const token = localStorage.getItem('access_token');
    const expiresAt = localStorage.getItem('token_expires_at');
    
    if (!token || !expiresAt) {
      setIsCheckingAuth(false);
      return;
    }
    
    // Check if token expired locally first
    const currentTime = new Date().getTime();
    if (currentTime >= parseInt(expiresAt, 10)) {
      // Token expired
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_expires_at');
      setIsCheckingAuth(false);
      return;
    }
    
    // Validate with server
    try {
      await axios.get(`${API_BASE_URL}/api/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setIsAuthenticated(true);
    } catch (error) {
      // Token invalid or expired on server
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_expires_at');
      console.error('Token validation failed:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expires_at');
    setIsAuthenticated(false);
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Show main app if authenticated
  return (
    <Router>
      <div>
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link to="/" className="flex items-center space-x-3">
                  <img src={logo} alt="StoreScope Logo" className="h-12 w-auto" />
                  <span className="text-xl font-bold text-gray-900">StoreScope</span>
                </Link>
                <div className="hidden md:flex space-x-4">
                  <Link
                    to="/"
                    className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/pricing"
                    className="px-3 py-2 rounded-md text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 hover:text-purple-800 transition-colors"
                  >
                    Pricing
                  </Link>
                  <Link
                    to="/contact"
                    className="px-3 py-2 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800 transition-colors"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleLogout}
                  className="text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
