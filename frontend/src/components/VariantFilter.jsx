import React, { useState, useEffect, useMemo } from 'react';

/**
 * VariantFilter Component
 * 
 * Allows users to filter inventory items by product variants.
 * Supports multi-select with visual indicators for active filters.
 * Persists filter state in sessionStorage.
 */
function VariantFilter({ data, onFilterChange, className = '' }) {
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Extract unique variants from the data
  const availableVariants = useMemo(() => {
    if (!data || data.length === 0) return [];

    const variantSet = new Set();
    
    data.forEach(item => {
      const variant = item.variant;
      if (variant && variant !== '-' && variant !== 'Standard' && variant.trim() !== '') {
        variantSet.add(variant.trim());
      }
    });

    // Convert to array and sort alphabetically
    return Array.from(variantSet).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Load saved filters from sessionStorage on mount
  useEffect(() => {
    try {
      const savedFilters = sessionStorage.getItem('inventory_variant_filters');
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters);
        if (Array.isArray(parsed)) {
          setSelectedVariants(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }, []);

  // Save filters to sessionStorage and notify parent
  useEffect(() => {
    try {
      sessionStorage.setItem('inventory_variant_filters', JSON.stringify(selectedVariants));
      onFilterChange(selectedVariants);
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  }, [selectedVariants, onFilterChange]);

  const handleToggleVariant = (variant) => {
    setSelectedVariants(prev => {
      if (prev.includes(variant)) {
        return prev.filter(v => v !== variant);
      } else {
        return [...prev, variant];
      }
    });
  };

  const handleClearAll = () => {
    setSelectedVariants([]);
  };

  const handleSelectAll = () => {
    setSelectedVariants([...availableVariants]);
  };

  // Don't render if no variants available
  if (availableVariants.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
          selectedVariants.length > 0
            ? 'border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span>Filter by Variant</span>
        {selectedVariants.length > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-full">
            {selectedVariants.length}
          </span>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Dropdown Content */}
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Select Variants to Filter
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Variant List */}
            <div className="overflow-y-auto flex-1 p-2">
              {availableVariants.map((variant) => {
                const isSelected = selectedVariants.includes(variant);
                return (
                  <label
                    key={variant}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleVariant(variant)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                      {variant}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Footer with count */}
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-600">
                {selectedVariants.length > 0 ? (
                  <>
                    <span className="font-semibold text-blue-600">{selectedVariants.length}</span> of {availableVariants.length} variants selected
                  </>
                ) : (
                  <>Showing all {availableVariants.length} variants</>
                )}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default VariantFilter;
