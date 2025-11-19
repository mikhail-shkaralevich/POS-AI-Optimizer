import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import apiClient from '../utils/apiClient';
import { generateBenchmarkSeries } from '../utils/benchmark';

function MetricCard({ title, value, trend, tooltip, type, dataQualityWarnings = [] }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [granularity, setGranularity] = useState('daily');
  const [hourlyData, setHourlyData] = useState(null);
  const [loadingHourly, setLoadingHourly] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(false);
  
  // Create a map of suspicious dates for quick lookup
  const suspiciousDatesMap = dataQualityWarnings.reduce((acc, warning) => {
    acc[warning.date] = warning;
    return acc;
  }, {});

  // Prepare chart data based on type and granularity
  const prepareChartData = (dataSource = null) => {
    const sourceData = dataSource || trend;
    
    // Helper to extract just the date part from "MM/DD HH[AM/PM]" format
    const formatDateForAxis = (dateStr) => {
      if (granularity === 'hourly') {
        // Extract just the date part (e.g., "07/13 12PM" -> "07/13")
        return dateStr.split(' ')[0];
      }
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    if (type === 'customers') {
      return sourceData.map(item => {
        const suspicious = suspiciousDatesMap[item.date];
        return {
          date: formatDateForAxis(item.date),
          fullDate: item.date,
          new: item.new,
          returning: item.returning,
          isSuspicious: !!suspicious,
          suspiciousReason: suspicious?.raw_conversion
        };
      });
    } else {
      return sourceData.map(item => {
        const suspicious = suspiciousDatesMap[item.date];
        return {
          date: formatDateForAxis(item.date),
          fullDate: item.date,
          value: item.value,
          isSuspicious: !!suspicious,
          suspiciousReason: suspicious?.raw_conversion,
          suspiciousDetails: suspicious
        };
      });
    }
  };

  const fetchHourlyData = async () => {
    if (hourlyData) {
      return; // Already fetched
    }
    
    setLoadingHourly(true);
    try {
      const response = await apiClient.get('/api/metrics/hourly');
      setHourlyData(response.data);
    } catch (error) {
      console.error('Error fetching hourly data:', error);
    }
    setLoadingHourly(false);
  };

  const handleExpand = async () => {
    if (!isExpanded) {
      await fetchHourlyData();
    }
    setIsExpanded(!isExpanded);
  };

  const getCurrentData = () => {
    // Only use hourly data when expanded AND hourly granularity is selected
    if (isExpanded && granularity === 'hourly' && hourlyData) {
      // Map the type to the correct hourly data key
      const typeMap = {
        'revenue': 'revenue',
        'atv': 'atv',
        'customers': 'customers',
        'footTraffic': 'foot_traffic',
        'conversion': 'conversion_rate'
      };
      return hourlyData[typeMap[type]]?.trend || [];
    }
    // Always use daily data for minimized view
    return trend;
  };

  const chartData = prepareChartData(getCurrentData());

  // Build benchmark chart data (daily only)
  const benchmarkSeriesRaw = (isExpanded && granularity === 'daily' && showBenchmark)
    ? generateBenchmarkSeries(type, trend || [])
    : [];

  const prepareBenchmarkChartData = () => {
    if (!benchmarkSeriesRaw || benchmarkSeriesRaw.length === 0) return [];
    if (type === 'customers') {
      return benchmarkSeriesRaw.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: item.fullDate,
        new: item.benchmarkNew,
        returning: item.benchmarkReturning,
      }));
    }
    return benchmarkSeriesRaw.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: item.fullDate,
      value: item.benchmark,
    }));
  };
  const benchmarkChartData = prepareBenchmarkChartData();

  // Merge actual and benchmark into one dataset for overlay
  const combinedData = chartData.map((row, idx) => {
    const merged = { ...row };
    const b = benchmarkChartData[idx];
    if (b) {
      if (type === 'customers') {
        merged.benchmarkNew = b.new;
        merged.benchmarkReturning = b.returning;
      } else {
        merged.benchmark = b.value;
      }
    }
    return merged;
  });

  // Compute benchmark aggregates for the header summary (expanded daily only)
  const getBenchmarkAggregate = () => {
    if (!(isExpanded && granularity === 'daily' && showBenchmark) || !benchmarkSeriesRaw || benchmarkSeriesRaw.length === 0) {
      return null;
    }
    if (type === 'customers') {
      const totals = benchmarkSeriesRaw.reduce((acc, d) => {
        acc.new += d.benchmarkNew || 0;
        acc.returning += d.benchmarkReturning || 0;
        return acc;
      }, { new: 0, returning: 0 });
      const total = totals.new + totals.returning;
      return {
        label: `${totals.new.toLocaleString()} / ${totals.returning.toLocaleString()} (Total ${total.toLocaleString()})`,
      };
    }
    if (type === 'revenue' || type === 'footTraffic') {
      const sum = benchmarkSeriesRaw.reduce((s, d) => s + (d.benchmark || 0), 0);
      const formatted = type === 'revenue' ? `$${sum.toLocaleString()}` : sum.toLocaleString();
      return { label: `${formatted}` };
    }
    if (type === 'atv') {
      const avg = benchmarkSeriesRaw.reduce((s, d) => s + (d.benchmark || 0), 0) / benchmarkSeriesRaw.length;
      return { label: `$${avg.toFixed(2)}` };
    }
    if (type === 'conversion') {
      const avg = benchmarkSeriesRaw.reduce((s, d) => s + (d.benchmark || 0), 0) / benchmarkSeriesRaw.length;
      return { label: `${avg.toFixed(1)}%` };
    }
    return null;
  };
  const benchmarkAggregate = getBenchmarkAggregate();

  // Compute store total for customers to append to title
  const getStoreCustomersTotal = () => {
    if (!(isExpanded && type === 'customers')) return null;
    const src = getCurrentData() || [];
    const totals = src.reduce((acc, d) => {
      acc.new += d.new || 0;
      acc.returning += d.returning || 0;
      return acc;
    }, { new: 0, returning: 0 });
    return (totals.new + totals.returning) || 0;
  };
  const storeCustomersTotal = getStoreCustomersTotal();

  // Custom tooltip to show full date/time in hourly view
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const fullDate = dataPoint.fullDate || label;
      const isSuspicious = dataPoint.isSuspicious && type === 'conversion';
      
      // Format date based on view state
      let displayDate;
      if (!isExpanded) {
        // Minimized view: Show short format like "Jul 08"
        try {
          const date = new Date(fullDate);
          displayDate = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        } catch {
          displayDate = fullDate;
        }
      } else {
        // Expanded view: Show full date/time
        displayDate = fullDate;
      }
      
      // Format value based on metric type
      const formatValue = (entry) => {
        let formattedValue = entry.value;
        
        // Add $ for revenue and ATV metrics
        if (type === 'revenue' || type === 'atv') {
          formattedValue = `$${entry.value}`;
        }
        // Add % for conversion rate
        else if (type === 'conversion') {
          formattedValue = `${entry.value}%`;
        }
        
        // For customers metric, show simplified labels
        if (type === 'customers') {
          const dk = entry.dataKey || '';
          const isBench = dk.startsWith('benchmark');
          const isNew = dk.includes('New') || dk === 'new';
          const baseLabel = isNew ? 'New' : 'Returning';
          const labelText = isBench ? `${baseLabel} (Benchmark)` : baseLabel;
          return `${labelText}: ${formattedValue}`;
        }
        
        return isExpanded ? `${entry.name}: ${formattedValue}` : formattedValue;
      };
      
      return (
        <div className={`border rounded-lg shadow-lg p-3 ${
          isSuspicious 
            ? 'bg-orange-50 border-orange-300' 
            : 'bg-white border-gray-300'
        }`}>
          <p className="text-sm font-semibold text-gray-700 mb-1">{displayDate}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {formatValue(entry)}
            </p>
          ))}
          {isSuspicious && dataPoint.suspiciousDetails && (
            <div className="mt-2 pt-2 border-t border-orange-300">
              <p className="text-xs font-semibold text-orange-700 mb-1">⚠️ Data Quality Issue</p>
              <p className="text-xs text-orange-600">
                {dataPoint.suspiciousDetails.transactions} transactions vs {dataPoint.suspiciousDetails.traffic} visitors
              </p>
              <p className="text-xs text-orange-600">
                Raw rate: {dataPoint.suspiciousDetails.raw_conversion.toFixed(1)}% (capped at 100%)
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Possible causes: Sensor offline, duplicate transactions, or data sync issues
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom X-axis tick formatter to show unique dates only
  const renderCustomTick = (tickProps) => {
    const { x, y, payload, index } = tickProps;
    const dataPoint = chartData[index];
    const isSuspicious = dataPoint?.isSuspicious && type === 'conversion';
    
    // In hourly view, only show date if it's the first occurrence
    if (granularity === 'hourly' && isExpanded) {
      const currentDate = payload.value;
      const previousDate = index > 0 ? chartData[index - 1]?.date : null;
      
      // Only render if this is a new date
      if (currentDate !== previousDate) {
        return (
          <text 
            x={x} 
            y={y + 10} 
            textAnchor="middle" 
            fill={isSuspicious ? '#ea580c' : '#666'}
            fontSize={12}
            fontWeight={isSuspicious ? 'bold' : 'normal'}
          >
            {currentDate}
          </text>
        );
      }
      return null;
    }
    
    // For daily view in conversion metric, highlight suspicious dates
    if (granularity === 'daily' && isExpanded && type === 'conversion') {
      const isSuspiciousDay = dataPoint?.isSuspicious;
      return (
        <text 
          x={x} 
          y={y + 10} 
          textAnchor="middle" 
          fill={isSuspiciousDay ? '#ea580c' : '#666'}
          fontSize={12}
          fontWeight={isSuspiciousDay ? 'bold' : 'normal'}
        >
          {payload.value}{isSuspiciousDay ? ' ⚠' : ''}
        </text>
      );
    }
    
    // Default rendering for other views
    return (
      <text 
        x={x} 
        y={y + 10} 
        textAnchor="middle" 
        fill="#666"
        fontSize={12}
      >
        {payload.value}
      </text>
    );
  };

  // Render chart based on type
  const renderChart = (height = "100%") => {
    const dataToUse = combinedData;
    const commonProps = {
      width: "100%",
      height: height
    };

    if (type === 'customers') {
      return (
        <ResponsiveContainer {...commonProps}>
          <BarChart data={dataToUse}>
            {isExpanded && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="date" 
              hide={!isExpanded} 
              height={isExpanded ? 80 : 0}
              tick={renderCustomTick}
            />
            <YAxis hide={!isExpanded} />
            <Tooltip content={<CustomTooltip />} />
            {isExpanded && <Legend />}
            {isExpanded && showBenchmark && granularity === 'daily' && (
              <>
                {/* Benchmark New: yellow, Benchmark Returning: red */}
                <Bar dataKey="benchmarkNew" stackId="b" fill="#fde68a" fillOpacity={0.85} name="Benchmark New" />
                <Bar dataKey="benchmarkReturning" stackId="b" fill="#ef4444" fillOpacity={0.7} name="Benchmark Returning" />
              </>
            )}
            <Bar dataKey="new" stackId="a" fill="#10b981" name="New Customers" />
            <Bar dataKey="returning" stackId="a" fill="#3b82f6" name="Returning Customers" />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (type === 'revenue') {
      return (
        <ResponsiveContainer {...commonProps}>
          <AreaChart data={dataToUse}>
            {isExpanded && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="date" 
              hide={!isExpanded}
              height={isExpanded ? 80 : 0}
              tick={renderCustomTick}
            />
            <YAxis hide={!isExpanded} />
            <Tooltip content={<CustomTooltip />} />
            {isExpanded && showBenchmark && granularity === 'daily' && (
              <Area type="monotone" dataKey="benchmark" stroke="#ef4444" fill="#fecaca" fillOpacity={0.35} name="Benchmark" />
            )}
            <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} name="Revenue" />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else if (type === 'footTraffic') {
      return (
        <ResponsiveContainer {...commonProps}>
          <AreaChart data={dataToUse}>
            {isExpanded && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="date" 
              hide={!isExpanded}
              height={isExpanded ? 80 : 0}
              tick={renderCustomTick}
            />
            <YAxis hide={!isExpanded} />
            <Tooltip content={<CustomTooltip />} />
            {isExpanded && showBenchmark && granularity === 'daily' && (
              <Area type="monotone" dataKey="benchmark" stroke="#ef4444" fill="#fecaca" fillOpacity={0.35} name="Benchmark" />
            )}
            <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Foot Traffic" />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else if (type === 'conversion') {
      return (
        <ResponsiveContainer {...commonProps}>
          <LineChart data={dataToUse}>
            {isExpanded && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="date" 
              hide={!isExpanded}
              height={isExpanded ? 80 : 0}
              tick={renderCustomTick}
            />
            <YAxis hide={!isExpanded} />
            <Tooltip content={<CustomTooltip />} />
            {isExpanded && showBenchmark && granularity === 'daily' && (
              <Line type="monotone" dataKey="benchmark" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={!isExpanded ? false : true} name="Benchmark %" />
            )}
            <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} dot={!isExpanded ? false : true} name="Conversion Rate %" />
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer {...commonProps}>
          <LineChart data={dataToUse}>
            {isExpanded && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="date" 
              hide={!isExpanded}
              height={isExpanded ? 80 : 0}
              tick={renderCustomTick}
            />
            <YAxis hide={!isExpanded} />
            <Tooltip content={<CustomTooltip />} />
            {isExpanded && showBenchmark && granularity === 'daily' && (
              <Line type="monotone" dataKey="benchmark" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={!isExpanded ? false : true} name="Benchmark" />
            )}
            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={!isExpanded ? false : true} name="Value" />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <>
      {/* Regular Card View */}
      <div className="bg-white rounded-lg shadow-md p-6 relative hover:shadow-lg transition-shadow">
        {/* Tooltip Icon in top right corner */}
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
          {renderChart("100%")}
        </div>

        {/* Expand Icon in bottom right corner */}
        <button
          onClick={handleExpand}
          className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-gray-200 hover:bg-blue-600 hover:text-white flex items-center justify-center text-gray-600 transition-colors"
          title="Expand View"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Expanded Modal View */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleExpand}>
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                  <div className="mt-2 flex items-baseline gap-6 flex-wrap">
                    <p className="text-4xl font-bold text-blue-600">
                      {type === 'customers' && storeCustomersTotal !== null
                        ? `${value} (Total ${storeCustomersTotal.toLocaleString()})`
                        : value}
                    </p>
                    {benchmarkAggregate && (
                      <p className="text-4xl font-bold text-red-600">{benchmarkAggregate.label}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleExpand}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Granularity Selector */}
              <div className="mb-6 flex gap-2">
                <button
                  onClick={() => setGranularity('daily')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    granularity === 'daily'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Daily View
                </button>
                {/* Hide hourly view button for conversion rate */}
                {type !== 'conversion' && (
                  <button
                    onClick={() => setGranularity('hourly')}
                    disabled={loadingHourly}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      granularity === 'hourly'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } ${loadingHourly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loadingHourly ? 'Loading...' : 'Hourly View'}
                  </button>
                )}
                {/* Benchmarking toggle only for daily view */}
                {granularity === 'daily' && (
                  <button
                    onClick={() => setShowBenchmark(prev => !prev)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showBenchmark ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {showBenchmark ? 'Hide benchmarking' : 'Show benchmarking'}
                  </button>
                )}
              </div>

              {/* Expanded Chart */}
              <div className="h-96 mb-4">
                {renderChart("100%")}
              </div>

              {/* Info note */}
              {showBenchmark && granularity === 'daily' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>ℹ️ Info:</strong> Benchmark overlays show estimated industry averages for small retail. Values are mock data with weekday/weekend seasonality for context; use alongside your data for directional comparison.
                  </p>
                </div>
              )}

              {/* Data Quality Warnings for Conversion Rate */}
              {type === 'conversion' && dataQualityWarnings && dataQualityWarnings.length > 0 && (
                <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mt-4">
                  <p className="text-sm font-semibold text-orange-900 mb-2">
                    ⚠️ Data Quality Issues Detected
                  </p>
                  <div className="space-y-2">
                    {dataQualityWarnings.map((warning, idx) => (
                      <div key={idx} className="text-sm text-orange-800">
                        <p className="font-medium">{warning.date}</p>
                        <p className="ml-2 text-xs">
                          • {warning.transactions} transactions recorded vs {warning.traffic} foot traffic visitors
                        </p>
                        <p className="ml-2 text-xs">
                          • Raw conversion rate: {warning.raw_conversion.toFixed(1)}% (capped at 100%)
                        </p>
                        <p className="ml-2 text-xs text-orange-700 mt-1">
                          This indicates more transactions than visitors, suggesting possible sensor offline issues, duplicate transactions, or data sync problems.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>ℹ️ Tip:</strong> {tooltip}
                </p>
                {granularity === 'hourly' && (
                  <p className="text-sm text-gray-600 mt-2">
                    Viewing hourly breakdown. Each data point represents a specific hour of the day.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MetricCard;
