import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import MetricCard from './MetricCard';
import InsightsCard from './InsightsCard';
import ComparisonsCard from './ComparisonsCard';
import PrescriptionsCard from './PrescriptionsCard';
import OtherMetricsCard from './OtherMetricsCard';
import ChatBot from './ChatBot';
import DataUpload from './DataUpload';

const API_BASE_URL = 'http://localhost:8000';

function Dashboard() {
  const [businessName, setBusinessName] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [businessInfoRes, metricsRes, insightsRes, comparisonsRes, prescriptionsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/business-info`),
        axios.get(`${API_BASE_URL}/api/metrics`),
        axios.get(`${API_BASE_URL}/api/insights`),
        axios.get(`${API_BASE_URL}/api/comparisons`),
        axios.get(`${API_BASE_URL}/api/prescriptions`)
      ]);

      setBusinessName(businessInfoRes.data.business_name);
      setMetrics(metricsRes.data);
      setInsights(insightsRes.data.insights);
      setComparisons(comparisonsRes.data.comparisons);
      setPrescriptions(prescriptionsRes.data.prescriptions);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header businessName={businessName} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Upload Section */}
        <DataUpload onUploadSuccess={fetchData} />

        {/* Data Range Display */}
        {metrics?.date_range && (
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600">
              Data Period: <span className="font-semibold text-gray-800">{metrics.date_range}</span>
            </p>
          </div>
        )}

        {/* Top 5 Metrics Section - Updated to include Foot Traffic and Conversion Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={`$${metrics?.revenue?.total?.toLocaleString() || '0'}`}
            trend={metrics?.revenue?.trend || []}
            tooltip="The total revenue generated from all transactions"
            type="revenue"
          />
          <MetricCard
            title="Average Transaction Value (ATV)"
            value={`$${metrics?.atv?.value || '0'}`}
            trend={metrics?.atv?.trend || []}
            tooltip="ATV: The average amount spent by a customer in a single transaction"
            type="atv"
          />
          <MetricCard
            title="New vs. Returning Customers"
            value={`${metrics?.customers?.new || 0} / ${metrics?.customers?.returning || 0}`}
            trend={metrics?.customers?.trend || []}
            tooltip="Number of new customers versus returning customers"
            type="customers"
          />
          <MetricCard
            title="Foot Traffic"
            value={metrics?.foot_traffic?.total?.toLocaleString() || '0'}
            trend={metrics?.foot_traffic?.trend || []}
            tooltip="Estimated number of visitors to your store (tracked by LiDAR sensor)"
            type="footTraffic"
          />
          <MetricCard
            title="Conversion Rate"
            value={`${metrics?.conversion_rate?.rate || 0}%`}
            trend={metrics?.conversion_rate?.trend || []}
            tooltip="Percentage of visitors who make a purchase (transactions ÷ foot traffic × 100)"
            type="conversion"
          />
        </div>

        {/* Insights & Comparison Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <InsightsCard insights={insights} />
          <ComparisonsCard comparisons={comparisons} />
        </div>

        {/* Prescriptive & Other Metrics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PrescriptionsCard prescriptions={prescriptions} />
          <OtherMetricsCard
            topSellingItem={metrics?.top_selling_item || 'N/A'}
            retentionRate={metrics?.retention_rate || 0}
            busiestDay={metrics?.busiest_day || 'N/A'}
          />
        </div>
      </main>

      {/* AI Chatbot */}
      <ChatBot />
    </div>
  );
}

export default Dashboard;
