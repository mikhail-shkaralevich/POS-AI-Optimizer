import React, { useState, useEffect } from 'react';

const AVAILABLE_WIDGETS = [
  { id: 'revenue', title: 'Total Revenue', category: 'metrics' },
  { id: 'atv', title: 'Average Transaction Value', category: 'metrics' },
  { id: 'customers', title: 'New vs. Returning Customers', category: 'metrics' },
  { id: 'footTraffic', title: 'Foot Traffic', category: 'metrics' },
  { id: 'conversion', title: 'Conversion Rate', category: 'metrics' },
  { id: 'insights', title: 'AI Insights', category: 'analytics' },
  { id: 'comparisons', title: 'Comparisons', category: 'analytics' },
  { id: 'prescriptions', title: 'Prescriptions', category: 'analytics' },
  { id: 'otherMetrics', title: 'Other Metrics', category: 'analytics' },
  { id: 'chatbot', title: 'AI Chatbot', category: 'tools' },
];

function DashboardCustomizer({ onWidgetsChange }) {
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Load customizer settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboardWidgets');
    if (saved) {
      setActiveWidgets(JSON.parse(saved));
    } else {
      // Default widgets
      setActiveWidgets(['revenue', 'atv', 'customers', 'footTraffic', 'conversion', 'insights', 'comparisons', 'prescriptions', 'otherMetrics']);
    }
  }, []);

  // Save customizer settings to localStorage
  const saveLayout = (widgets) => {
    setActiveWidgets(widgets);
    localStorage.setItem('dashboardWidgets', JSON.stringify(widgets));
  };

  const toggleWidget = (widgetId) => {
    const updated = activeWidgets.includes(widgetId)
      ? activeWidgets.filter(id => id !== widgetId)
      : [...activeWidgets, widgetId];
    saveLayout(updated);
    // Notify parent component immediately
    if (onWidgetsChange) {
      onWidgetsChange(updated);
    }
  };

  const resetToDefault = () => {
    const defaults = ['revenue', 'atv', 'customers', 'footTraffic', 'conversion', 'insights', 'comparisons', 'prescriptions', 'otherMetrics'];
    saveLayout(defaults);
    if (onWidgetsChange) {
      onWidgetsChange(defaults);
    }
  };

  const handleCloseCustomizer = () => {
    setShowCustomizer(false);
    // Notify parent when closing
    if (onWidgetsChange) {
      onWidgetsChange(activeWidgets);
    }
  };

  const categories = {
    metrics: AVAILABLE_WIDGETS.filter(w => w.category === 'metrics'),
    analytics: AVAILABLE_WIDGETS.filter(w => w.category === 'analytics'),
    tools: AVAILABLE_WIDGETS.filter(w => w.category === 'tools'),
  };

  return (
    <>
      {/* Floating Customizer Button */}
      <button
        onClick={() => setShowCustomizer(!showCustomizer)}
        className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        title="Customize Dashboard"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.15.23-.42.12-.64l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.22-.07.49.12.64l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.15-.23.42-.12.64l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.64l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
      </button>

      {/* Customizer Panel */}
      {showCustomizer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={handleCloseCustomizer}
          />

          {/* Customizer Sidebar */}
          <div className="fixed bottom-20 right-6 z-40 bg-white rounded-lg shadow-2xl w-80 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Customize Dashboard</h3>
                <button
                  onClick={handleCloseCustomizer}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Metrics Category */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2 text-sm">Metrics</h4>
                <div className="space-y-2">
                  {categories.metrics.map(widget => (
                    <label key={widget.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={activeWidgets.includes(widget.id)}
                        onChange={() => toggleWidget(widget.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{widget.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Analytics Category */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2 text-sm">Analytics</h4>
                <div className="space-y-2">
                  {categories.analytics.map(widget => (
                    <label key={widget.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={activeWidgets.includes(widget.id)}
                        onChange={() => toggleWidget(widget.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{widget.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tools Category */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2 text-sm">Tools</h4>
                <div className="space-y-2">
                  {categories.tools.map(widget => (
                    <label key={widget.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={activeWidgets.includes(widget.id)}
                        onChange={() => toggleWidget(widget.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{widget.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetToDefault}
                className="w-full mt-4 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-medium transition-colors"
              >
                Reset to Default
              </button>

              <p className="text-xs text-gray-500 mt-3">
                Check/uncheck widgets to customize your dashboard view.
              </p>
            </div>
          </div>
        </>
      )}

      {/* No widgets selected modal - Allow interaction */}
      {activeWidgets.length === 0 && !showCustomizer && (
        <>
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75" />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg p-6 text-center pointer-events-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-2">No widgets selected</h3>
              <p className="text-gray-600 mb-4">Click the customize button to select dashboard widgets</p>
              <button
                onClick={() => setShowCustomizer(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Customize Now
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export { AVAILABLE_WIDGETS };
export default DashboardCustomizer;
