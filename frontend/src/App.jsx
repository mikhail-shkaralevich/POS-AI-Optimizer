import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PricingPage from './components/PricingPage';
import ContactUs from './components/ContactUs';
import { API_BASE_URL } from './config/api';
import logo from './assets/logo.PNG';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Show main app directly without authentication
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
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  {!mobileMenuOpen ? (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu, show/hide based on menu state */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800"
                >
                  Dashboard
                </Link>
                <Link
                  to="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 hover:text-purple-800"
                >
                  Pricing
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          )}
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
