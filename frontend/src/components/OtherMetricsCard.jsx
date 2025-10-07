import React, { useState } from 'react';

function OtherMetricsCard({ topSellingItem, retentionRate, busiestDay }) {
  const [showTooltip, setShowTooltip] = useState({ item: false, retention: false, day: false });

  const toggleTooltip = (key) => {
    setShowTooltip(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const MetricBox = ({ title, value, tooltipText, tooltipKey }) => (
    <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow relative">
      <div className="absolute top-3 right-3">
        <div className="relative">
          <button
            className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-semibold transition-colors"
            onMouseEnter={() => setShowTooltip(prev => ({ ...prev, [tooltipKey]: true }))}
            onMouseLeave={() => setShowTooltip(prev => ({ ...prev, [tooltipKey]: false }))}
          >
            ?
          </button>
          {showTooltip[tooltipKey] && (
            <div className="absolute right-0 top-8 w-56 bg-gray-800 text-white text-sm p-3 rounded-lg shadow-lg z-10">
              {tooltipText}
              <div className="absolute -top-2 right-2 w-4 h-4 bg-gray-800 transform rotate-45"></div>
            </div>
          )}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-2">
        <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900">Other Metrics</h2>
      </div>

      <MetricBox
        title="Top Selling Item"
        value={topSellingItem}
        tooltipText="The product with the highest number of units sold in the last 30 days"
        tooltipKey="item"
      />
      
      <MetricBox
        title="Customer Retention Rate"
        value={`${retentionRate}%`}
        tooltipText="Percentage of customers who made more than one purchase, indicating loyalty and satisfaction"
        tooltipKey="retention"
      />
      
      <MetricBox
        title="Busiest Day"
        value={busiestDay}
        tooltipText="The day of the week with the highest number of transactions"
        tooltipKey="day"
      />
    </div>
  );
}

export default OtherMetricsCard;
