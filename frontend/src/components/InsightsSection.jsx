import React, { useState, useEffect } from 'react';
import { generateBusinessInsights } from '../utils/generateInsights';

export default function InsightsSection({ dashboardData }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const loadInsights = async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare business data from dashboard
      const businessData = {
        businessName: dashboardData.businessName || "Your Store",
        businessType: dashboardData.businessType || "Retail Store",
        location: dashboardData.location || "Honolulu, HI",
        customerMix: dashboardData.customerMix || "Mixed local and tourist",
        timePeriod: dashboardData.timePeriod || "Last 7 Days",
        totalRevenue: dashboardData.totalRevenue || 0,
        footTraffic: dashboardData.footTraffic || 0,
        transactions: dashboardData.transactions || 0,
        conversionRate: dashboardData.conversionRate || 0,
        avgTransactionValue: dashboardData.avgTransactionValue || 0,
        peakHours: dashboardData.peakHours || "2pm-4pm",
        peakSalesHours: dashboardData.peakSalesHours || "11am-1pm",
        topProducts: dashboardData.topProducts || [],
        slowMovers: dashboardData.slowMovers || [],
        revenueChange: dashboardData.revenueChange || "+0%",
        trafficChange: dashboardData.trafficChange || "+0%",
        conversionChange: dashboardData.conversionChange || "+0%"
      };
      
      const newInsights = await generateBusinessInsights(businessData, isRefresh);
      setInsights(newInsights);
    } catch (err) {
      console.error("Failed to load insights:", err);
      setError(err.message || "Failed to generate insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadInsights(); // Load on mount
  }, []);
  
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-blue-500';
      default: return 'border-gray-500';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI-Powered Business Insights</h2>
        <button 
          onClick={() => loadInsights(true)}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <span className="animate-spin">⟳</span>
              Generating...
            </>
          ) : (
            <>
              🔄 Get New Insights
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {loading && !insights && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⟳</div>
            <p className="text-gray-600">Analyzing your business data...</p>
          </div>
        </div>
      )}
      
      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interesting Insights Section */}
          <section className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              What's Happening
            </h3>
            <div className="space-y-3">
              {insights.interestingInsights.map((insight, idx) => (
                <div 
                  key={idx} 
                  className={`border-l-4 ${getPriorityColor(insight.priority)} bg-gray-50 p-4 rounded-lg`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-base">{insight.title}</h4>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {insight.category}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{insight.description}</p>
                </div>
              ))}
            </div>
          </section>
          
          {/* Prescriptive Insights Section */}
          <section className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              What To Do Next
            </h3>
            <div className="space-y-3">
              {insights.prescriptiveInsights.map((insight, idx) => (
                <div 
                  key={idx} 
                  className={`border-l-4 ${getPriorityColor(insight.priority)} bg-gray-50 p-4 rounded-lg`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-base">{insight.title}</h4>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                        {insight.actionType}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                        {insight.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{insight.description}</p>
                  {insight.estimatedImpact && (
                    <p className="text-sm text-green-600 font-medium">
                      💰 {insight.estimatedImpact}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
