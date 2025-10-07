import React from 'react';

function ComparisonsCard({ comparisons }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center mb-4">
        <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900">Comparison Reports</h2>
      </div>
      
      <div className="space-y-3">
        {comparisons.length > 0 ? (
          comparisons.map((comparison, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500"></div>
              <p className="ml-3 text-gray-700 leading-relaxed">{comparison}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">No comparison data available.</p>
        )}
      </div>
    </div>
  );
}

export default ComparisonsCard;
