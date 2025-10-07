import React from 'react';

function InsightsCard({ insights }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center mb-4">
        <svg className="w-6 h-6 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900">Interesting Insights</h2>
      </div>
      
      <div className="space-y-3">
        {insights.length > 0 ? (
          insights.map((insight, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary-500"></div>
              <p className="ml-3 text-gray-700 leading-relaxed">{insight}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">No insights available at the moment.</p>
        )}
      </div>
    </div>
  );
}

export default InsightsCard;
