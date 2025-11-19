import React from 'react';

function HourlyRevenueCard({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue by Hour</h3>
        <p className="text-gray-500 text-sm">No hourly data available</p>
      </div>
    );
  }

  // Find max revenue for scaling bars
  const maxRevenue = Math.max(...data.map(item => item.revenue));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        Revenue by Hour
      </h3>
      
      <div className="border-t-2 border-green-600 mb-4"></div>

      <div className="space-y-3">
        {data.map((item, index) => {
          // Calculate bar width percentage (minimum 2% for visibility)
          const barWidth = maxRevenue > 0 
            ? Math.max(2, (item.revenue / maxRevenue) * 100) 
            : 0;
          
          return (
            <div key={index} className="flex items-center gap-3">
              {/* Hour label */}
              <div className="w-16 text-sm font-medium text-gray-700 text-right">
                {item.label}
              </div>
              
              {/* Bar and amount */}
              <div className="flex-1 flex items-center gap-2">
                {/* Visual bar */}
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ width: `${barWidth}%` }}
                  >
                    {barWidth > 15 && (
                      <span className="text-xs font-semibold text-white">
                        ${item.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Amount label (shown when bar is too small) */}
                {barWidth <= 15 && (
                  <span className="text-sm font-semibold text-gray-700 w-24 text-right">
                    ${item.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <p className="text-center text-gray-500 text-sm mt-4">
          No revenue data for the selected period
        </p>
      )}
    </div>
  );
}

export default HourlyRevenueCard;
