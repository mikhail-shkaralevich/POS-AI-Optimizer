# Dashboard Metrics Documentation

This document explains how each metric in the POS AI Optimizer dashboard works, including data sources, calculations, and interpretation.

---

## Table of Contents
1. [Core Metrics](#core-metrics)
2. [Custom Metrics](#custom-metrics)
3. [AI-Powered Features](#ai-powered-features)
4. [Data Sources](#data-sources)

---

## Core Metrics

### 1. Total Revenue
**What it shows:** The total sales revenue generated from all transactions in the selected time period.

**Calculation:**
```javascript
Total Revenue = Sum of all transaction netSales values
```

**Data Source:** 
- Field: `netSales` from transactions
- This represents sales after discounts have been applied

**Trend:** Daily revenue breakdown shown as a sparkline chart

**Interpretation:**
- Higher is better
- Shows overall business performance
- Compare across time periods to identify growth trends

---

### 2. Average Transaction Value (ATV)
**What it shows:** The average amount a customer spends per transaction.

**Calculation:**
```javascript
ATV = Total Revenue ÷ Number of Unique Transactions
```

**Data Source:**
- Groups transactions by `transaction_id` to avoid counting line items multiple times
- Sums `total` for each unique transaction
- Divides by count of unique transactions

**Trend:** Daily ATV shown as a sparkline chart

**Interpretation:**
- Higher ATV means customers are buying more per visit
- Low ATV might indicate need for upselling or bundling strategies
- Industry benchmark for retail: $20-$50 depending on product type

---

### 3. New vs. Returning Customers
**What it shows:** How many first-time customers vs. repeat customers you have.

**Calculation:**
```javascript
New Customer = customer_id appears for the first time in the period
Returning Customer = customer_id has appeared before
```

**Data Source:**
- Field: `customer_id` from transactions
- Tracks first appearance of each customer ID
- Empty/GUEST customer_id are treated as anonymous

**Trend:** Daily breakdown of new vs. returning customers

**Interpretation:**
- High new customers = good acquisition
- High returning customers = good retention
- Ideal ratio varies by business type (aim for 30-40% returning for retail)

---

### 4. Foot Traffic
**What it shows:** Total number of visitors who entered your store (tracked by LiDAR sensor).

**Calculation:**
```javascript
Foot Traffic = Count of sensor entries where direction = 1 (in)
```

**Data Source:**
- Sensor data from LiDAR device
- Field: `direction` (1 = entering, 0 = exiting)
- Only counts entries, not exits

**Trend:** Daily visitor count shown as sparkline

**Interpretation:**
- Shows total store visitors regardless of purchase
- Use to calculate conversion rate
- Compare to transaction count to see buying behavior
- Peak traffic times help with staffing decisions

---

### 5. Conversion Rate
**What it shows:** Percentage of visitors who make a purchase.

**Calculation:**
```javascript
Conversion Rate = (Unique Transactions ÷ Foot Traffic) × 100
```

**Data Source:**
- Numerator: Count of unique `transaction_id` values
- Denominator: Count of sensor entries (direction = 1)

**Trend:** Daily conversion rate shown as sparkline

**Interpretation:**
- Industry average: 20-40% for retail stores
- Low conversion = visitors not buying (improve sales approach, store layout, pricing)
- High conversion = effective selling (maintain and optimize)
- Factors affecting conversion: staff training, product placement, pricing, store atmosphere

---

### 6. Other Metrics

#### Top Selling Item
**What it shows:** The single product with the highest sales quantity.

**Calculation:**
```javascript
Top Selling Item = Product with max(quantity sold)
```

#### Customer Retention Rate
**What it shows:** Percentage of customers who made more than one purchase.

**Calculation:**
```javascript
Retention Rate = (Customers with >1 transaction ÷ Total customers) × 100
```

#### Busiest Day
**What it shows:** Day of the week with most transactions.

**Calculation:**
```javascript
Busiest Day = Day with max(transaction count)
```

---

## Custom Metrics

### 1. Top 5 Products by Revenue
**What it shows:** The 5 best-selling products ranked by total revenue generated.

**Calculation:**
```javascript
1. Group all transactions by item_name
2. For each product:
   - Sum netSales → total revenue
   - Sum qty → total units sold
3. Sort by revenue (descending)
4. Take top 5
```

**Data Source:**
- Fields: `item_name`, `netSales`, `quantity`
- Excludes: "Bag Fee" items
- Filters out empty/null product names

**Display Format:**
```
1. Product Name
   45 units • $2,025.00
```

**Use Cases:**
- Identify your cash cows
- Stock decisions (ensure top sellers never run out)
- Marketing focus (promote winners)
- Bundle opportunities (pair top sellers with slower movers)

---

### 2. Revenue by Hour of Day
**What it shows:** How much revenue is generated during each hour of operation.

**Calculation:**
```javascript
1. Parse timestamp to extract hour (0-23)
2. Group transactions by hour
3. Sum netSales for each hour
4. Convert to 12-hour format (8am, 9am, etc.)
5. Display with proportional bar chart
```

**Data Source:**
- Fields: `timestamp`, `netSales`
- Parses time format: "YYYY-MM-DD HH:MM:SS"

**Display Format:**
```
8am  ████░░░░░░ $324.50
9am  ██████░░░░ $567.20
10am ████████░░ $892.00
```

**Use Cases:**
- **Staffing optimization:** Schedule more staff during high-revenue hours
- **Break scheduling:** Plan breaks during slower hours
- **Promotional timing:** Run specials during slow hours to boost sales
- **Inventory management:** Restock before peak hours
- **Labor cost control:** Reduce staff during genuinely slow periods

**Insights:**
- Bars show relative revenue (largest = 100%)
- All hours displayed (including $0.00 hours)
- Updates automatically when date range changes

---

## AI-Powered Features

### AI Insights
**What it shows:** Automated analysis of your business data with actionable observations.

**How it works:**
1. Analyzes all dashboard metrics
2. Identifies patterns, trends, and anomalies
3. Uses Claude AI to generate context-aware insights
4. Returns specific, data-driven observations

**When it loads:**
- **NOT automatically** on page load (saves API costs)
- Only when you toggle "AI Insights" ON in customization panel
- Click "Get New Insights" button to regenerate

**Categories:**
- Conversion patterns
- Traffic analysis
- Sales trends
- Customer behavior

---

### Prescriptive Insights
**What it shows:** AI-generated recommendations for what actions to take.

**How it works:**
1. Analyzes current performance vs. benchmarks
2. Identifies opportunities for improvement
3. Provides specific, actionable steps
4. Estimates potential impact

**Action Types:**
- **Immediate:** Do this today/this week
- **Strategic:** Plan and implement over time
- **Optimization:** Fine-tune existing processes

**Categories:**
- Staffing recommendations
- Promotional timing
- Product merchandising
- Customer engagement

**Expected Impact:**
- Each prescription includes estimated benefit
- Examples: "Increase revenue by $500/week", "Reduce labor costs by 10%"

---

## Data Sources

### Transaction Data (CSV)
**File Format:** Shopify/Square POS export format

**Key Fields:**
- `date`: Transaction date (MM/DD/YY)
- `time`: Transaction time (HH:MM:SS)
- `category`: Product category
- `item`: Product name
- `qty`: Quantity sold
- `grossSales`: Pre-discount sales
- `discounts`: Discount amount
- `netSales`: Post-discount sales (used for revenue)
- `tax`: Tax collected
- `transactionId`: Unique transaction ID
- `customerId`: Customer ID (empty if anonymous)
- `cardBrand`: Payment method (Visa, MasterCard, etc.)

**Data Processing:**
- Uploaded via dashboard UI
- Stored in backend
- Parsed and validated on upload
- Accessible via `/api/transactions` endpoint

### Sensor Data (JSON)
**Source:** LiDAR foot traffic sensor

**Key Fields:**
- `timestamp`: Entry/exit time
- `device_id`: Sensor identifier
- `direction`: 1 = entering, 0 = exiting

**Data Processing:**
- Uploaded via dashboard UI
- Stored in backend as JSON
- Only "direction: 1" (entries) counted for foot traffic
- Accessible via `/api/metrics` endpoint

---

## Metric Toggles

All metrics can be toggled on/off via the **Dashboard Customizer** (gear icon, bottom-right).

**Default ON:**
- Total Revenue
- Average Transaction Value
- New vs. Returning Customers
- Foot Traffic
- Conversion Rate
- Comparisons
- Prescriptions
- Other Metrics

**Default OFF (to save API costs):**
- AI Insights

**Always Available:**
- Top 5 Products (toggle in "Custom Metrics")
- Hourly Revenue (toggle in "Custom Metrics")
- AI Chatbot (toggle in "Tools")

**State Persistence:**
- Toggle settings saved to localStorage
- Preferences persist across browser sessions
- "Reset to Default" button restores original configuration

---

## Performance Notes

### Calculation Timing
- **Core metrics:** Calculated by backend on data load
- **Custom metrics:** Calculated by frontend using React's `useMemo`
- **Recalculation:** Only when underlying data changes (not on every render)

### API Efficiency
- Transaction data fetched once on page load
- Metrics calculated from cached data
- AI insights only generated when explicitly requested (toggle ON or click "Regenerate")
- No polling or auto-refresh (manual refresh via data upload)

### Data Limits
- Frontend can handle 10,000+ transactions
- Backend aggregates data before sending to frontend
- Charts use sampling for large datasets (trend visualization)

---

## Troubleshooting

### Metric Shows $0 or 0
- Check if data is uploaded (see "Data Upload" section)
- Verify CSV format matches expected schema
- Check browser console for errors
- Ensure date range includes transactions

### Conversion Rate Shows N/A or 0%
- Requires both transaction data AND sensor data
- Check that sensor data is uploaded
- Verify sensor entries (direction=1) exist in date range

### AI Insights Not Generating
- Ensure API key is configured in backend/.env
- Check browser console for API errors
- Try clicking "Get New Insights" button
- Verify backend server is running

### Custom Metrics Not Appearing
- Check that toggle is ON in Dashboard Customizer
- Verify transaction data is loaded
- Check for console errors
- Refresh the page

---

## Future Enhancements

**Planned Features:**
- Date range selector (currently shows all data)
- Export to PDF/CSV
- Email reports
- Custom metric builder
- Comparative analytics (week-over-week, month-over-month)
- Goal setting and tracking
- Real-time alerts

---

For technical implementation details, see:
- `frontend/src/utils/metricCalculations.js` - Custom metric logic
- `backend/main.py` - Core metric calculations
- `frontend/src/components/InsightsSection.jsx` - AI insights implementation
