import React from 'react';

function TopProductsCard({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Products by Revenue</h3>
        <p className="text-gray-500 text-sm">No product data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
        Top 5 Products by Revenue
      </h3>
      
      <div className="border-t-2 border-blue-600 mb-4"></div>

      <div className="space-y-4">
        {data.map((product, index) => (
          <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold text-blue-600">#{index + 1}</span>
                  <h4 className="text-base font-semibold text-gray-800 leading-tight">
                    {product.name}
                  </h4>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    <span className="font-semibold text-gray-800">{product.units}</span> units
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-green-600 font-bold">
                    ${product.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <p className="text-center text-gray-500 text-sm mt-4">
          No products found in the selected date range
        </p>
      )}
    </div>
  );
}

export default TopProductsCard;
