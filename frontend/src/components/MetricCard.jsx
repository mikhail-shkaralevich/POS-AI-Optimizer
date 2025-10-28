import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function MetricCard({ title, value, trend, tooltip, type }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Prepare chart data based on type
  const prepareChartData = () => {
    if (type === 'customers') {
      return trend.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        new: item.new,
        returning: item.returning
      }));
    } else {
      return trend.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: item.value
      }));
    }
  };

  const chartData = prepareChartData();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative hover:shadow-lg transition-shadow">
      {/* Tooltip Icon */}
      <div className="absolute top-4 right-4">
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-semibold transition-colors">
            ?
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-8 w-64 bg-gray-800 text-white text-sm p-3 rounded-lg shadow-lg z-10">
              {tooltip}
              <div className="absolute -top-2 right-2 w-4 h-4 bg-gray-800 transform rotate-45"></div>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>

      {/* Value */}
      <p className="text-3xl font-bold text-gray-900 mb-4">{value}</p>

      {/* Chart */}
      <div className="h-24">
        {type === 'customers' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="new" stackId="a" fill="#10b981" />
              <Bar dataKey="returning" stackId="a" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        ) : type === 'revenue' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        ) : type === 'footTraffic' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        ) : type === 'conversion' ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
