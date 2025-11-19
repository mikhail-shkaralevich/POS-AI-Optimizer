import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';

function InventoryInsights() {
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('velocity'); // 'velocity', 'slowMovers', 'variants'

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/inventory-insights');
      setInventoryData(response.data);
    } catch (error) {
      console.error('Error fetching inventory insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with View Toggles */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Inventory Insights</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveView('velocity')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'velocity'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Sales Velocity
          </button>
          <button
            onClick={() => setActiveView('slowMovers')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'slowMovers'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🐌 Slow Movers
          </button>
          <button
            onClick={() => setActiveView('variants')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'variants'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎨 Variant Analysis
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeView === 'velocity' && (
          <SalesVelocityView data={inventoryData?.salesVelocity} />
        )}
        {activeView === 'slowMovers' && (
          <SlowMoversView data={inventoryData?.slowMovers} />
        )}
        {activeView === 'variants' && (
          <VariantAnalysisView data={inventoryData?.variantAnalysis} />
        )}
      </div>
    </div>
  );
}

function SalesVelocityView({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-center py-8">No sales velocity data available</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Products by Sales Velocity</h3>
        <span className="text-sm text-gray-500">Units sold per day</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variant
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Sold
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Velocity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {item.product}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.variant || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  {item.totalSold}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                  {item.velocity} / day
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  ${item.revenue.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    item.velocity >= 2 
                      ? 'bg-green-100 text-green-800'
                      : item.velocity >= 1
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.velocity >= 2 ? '🔥 Fast' : item.velocity >= 1 ? 'Medium' : 'Slow'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Products with velocity &gt; 2 units/day are your fast movers. 
          Consider keeping higher stock levels for these items to prevent stock-outs.
        </p>
      </div>
    </div>
  );
}

function SlowMoversView({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2">🎉 Great news! No significant slow-moving inventory detected.</p>
        <p className="text-sm text-gray-400">All products are selling at a reasonable pace.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Slow-Moving Inventory</h3>
        <span className="text-sm text-gray-500">Needs attention</span>
      </div>

      <div className="grid gap-4">
        {data.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.product}</h4>
                {item.variant && (
                  <p className="text-sm text-gray-600 mt-1">Variant: {item.variant}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-gray-600">
                    Sold: <strong>{item.totalSold}</strong> units
                  </span>
                  <span className="text-gray-600">
                    Velocity: <strong>{item.velocity}</strong> per day
                  </span>
                  <span className="text-gray-600">
                    Days since last sale: <strong>{item.daysSinceLastSale}</strong>
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                  item.daysSinceLastSale > 30
                    ? 'bg-red-100 text-red-800'
                    : item.daysSinceLastSale > 14
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.daysSinceLastSale > 30 ? '⚠️ Critical' : item.daysSinceLastSale > 14 ? '⚡ Warning' : '📊 Monitor'}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-700">
                <strong>Recommendation:</strong> {item.recommendation}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-orange-50 rounded-lg">
        <p className="text-sm text-orange-800">
          <strong>⚡ Action Required:</strong> Consider markdowns, bundling with popular items, 
          or featuring these products prominently to move inventory faster.
        </p>
      </div>
    </div>
  );
}

function VariantAnalysisView({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-center py-8">No variant data available</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Product Variant Performance</h3>
        <span className="text-sm text-gray-500">Compare variants within products</span>
      </div>

      {data.map((product, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-5">
          <div className="mb-4">
            <h4 className="font-bold text-gray-900 text-lg">{product.product}</h4>
            <p className="text-sm text-gray-600 mt-1">
              Total Units: <strong>{product.totalSold}</strong> | 
              Revenue: <strong>${product.totalRevenue.toLocaleString()}</strong> | 
              Variants: <strong>{product.variantCount}</strong>
            </p>
          </div>

          <div className="space-y-2">
            {product.variants.map((variant, vIndex) => (
              <div key={vIndex} className="flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {variant.variant || 'Standard'}
                    </span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-600">
                        {variant.units} units ({variant.percentOfTotal}%)
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${variant.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        variant.percentOfTotal > 30
                          ? 'bg-green-500'
                          : variant.percentOfTotal > 15
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                      }`}
                      style={{ width: `${variant.percentOfTotal}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {product.topVariant && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-green-700">
                <strong>🏆 Best Performer:</strong> {product.topVariant.variant || 'Standard'} ({product.topVariant.units} units sold)
              </p>
            </div>
          )}
          {product.recommendation && (
            <div className="mt-2">
              <p className="text-sm text-gray-700">
                <strong>💡 Insight:</strong> {product.recommendation}
              </p>
            </div>
          )}
        </div>
      ))}

      <div className="mt-4 p-4 bg-purple-50 rounded-lg">
        <p className="text-sm text-purple-800">
          <strong>🎨 Variant Strategy:</strong> Focus inventory on top-performing variants. 
          Consider discontinuing variants that represent less than 5% of sales.
        </p>
      </div>
    </div>
  );
}

export default InventoryInsights;
