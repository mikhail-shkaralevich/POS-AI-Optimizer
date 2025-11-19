/**
 * Utility functions for calculating custom dashboard metrics
 * from transaction data
 */

/**
 * Calculate top 5 products by revenue
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Top 5 products with name, units, and revenue
 */
export function calculateTopProducts(transactions) {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Group by item name and calculate totals
  const productMap = new Map();

  transactions.forEach(txn => {
    const itemName = txn.item_name || txn.item || 'Unknown';
    const quantity = parseInt(txn.quantity || txn.qty || 0);
    const revenue = parseFloat(txn.net_sales || txn.netSales || 0);

    // Skip bag fees and empty items
    if (!itemName || itemName.toLowerCase().includes('bag fee')) {
      return;
    }

    if (productMap.has(itemName)) {
      const existing = productMap.get(itemName);
      productMap.set(itemName, {
        name: itemName,
        units: existing.units + quantity,
        revenue: existing.revenue + revenue
      });
    } else {
      productMap.set(itemName, {
        name: itemName,
        units: quantity,
        revenue: revenue
      });
    }
  });

  // Convert to array, sort by revenue, and take top 5
  const products = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return products;
}

/**
 * Calculate revenue by hour of day
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Revenue for each hour (0-23) with hour and revenue
 */
export function calculateHourlyRevenue(transactions) {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Initialize all hours with 0
  const hourlyData = {};
  for (let hour = 0; hour < 24; hour++) {
    hourlyData[hour] = 0;
  }

  // Sum revenue by hour
  transactions.forEach(txn => {
    try {
      const timestamp = txn.timestamp;
      if (!timestamp) return;

      // Parse timestamp format: "YYYY-MM-DD HH:MM:SS"
      const timePart = timestamp.split(' ')[1];
      if (!timePart) return;

      const hour = parseInt(timePart.split(':')[0]);
      if (isNaN(hour) || hour < 0 || hour > 23) return;

      const revenue = parseFloat(txn.net_sales || txn.netSales || 0);
      hourlyData[hour] += revenue;
    } catch (error) {
      // Skip invalid timestamps
      return;
    }
  });

  // Convert to array format with 12-hour time
  const result = [];
  for (let hour = 0; hour < 24; hour++) {
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? 'am' : 'pm';
    
    result.push({
      hour: hour,
      label: `${hour12}${ampm}`,
      revenue: hourlyData[hour]
    });
  }

  return result;
}
