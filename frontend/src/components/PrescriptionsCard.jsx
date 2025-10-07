import React from 'react';

function PrescriptionsCard({ prescriptions }) {
  const getTypeColor = (type) => {
    switch (type) {
      case 'ACTION':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'SUGGESTION':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'OPPORTUNITY':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-2">
        <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900">Prescriptive Measures</h2>
      </div>

      {prescriptions.length > 0 ? (
        prescriptions.map((prescription, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border-l-4 border-purple-500"
          >
            <div className="flex items-start">
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getTypeColor(prescription.type)} mr-3 mt-0.5`}>
                {prescription.type}
              </span>
              <p className="text-gray-700 leading-relaxed flex-1">{prescription.text}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-lg shadow-md p-5">
          <p className="text-gray-500 italic">No prescriptive measures available.</p>
        </div>
      )}
    </div>
  );
}

export default PrescriptionsCard;
