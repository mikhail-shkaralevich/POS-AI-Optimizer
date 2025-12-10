import React from 'react';

function Header({ businessName }) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">{businessName}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              disabled 
              className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-md cursor-not-allowed opacity-60"
            >
              Online Tab
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
