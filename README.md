# Retail Dashboard MVP - AI-Powered Analytics

A modern, AI-powered dashboard for small retail businesses that provides prescriptive insights and comparative analytics.

## Features

- **Real-time Metrics**: Track revenue, average transaction value, and customer patterns
- **AI Insights**: Get actionable business intelligence from your data
- **Comparative Analytics**: Benchmark against similar businesses
- **Prescriptive Recommendations**: Receive AI-driven suggestions to improve performance
- **AI Consultant Chatbot**: Ask questions about your business data in natural language
- **Pricing Page**: Professional pricing tiers with hardware options (LiDAR sensor)
- **Data Import**: Upload your own Shopify/Square POS data and LiDAR sensor data directly from the web interface
- **Customizable Dashboard**: Drag-and-drop widget selection - show/hide any metric or analytics card with one click

## Tech Stack

- **Frontend**: React.js with Vite, Tailwind CSS, Recharts
- **Backend**: Python with FastAPI
- **Data**: Real transaction data from Shopify/Square POS and LiDAR sensor foot traffic data
- **Storage**: localStorage for dashboard preferences and customization

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- npm or yarn

## Setup Instructions

### 1. Clone or Navigate to Project Directory

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

### 4. Running the Application

#### Start the Backend Server (Terminal 1)

```bash
# From backend directory
cd backend
python main.py
```

The backend will run on `http://localhost:8000`

**Note:** The server automatically generates fresh mock data (for the last 30 days) every time it starts, so your data is always up-to-date!

#### Start the Frontend Development Server (Terminal 2)

```bash
# From frontend directory
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

### 5. Access the Dashboard

Open your browser and navigate to `http://localhost:5173`

### 6. Import Your Data

The dashboard requires both POS transaction data and sensor foot traffic data to function properly:

1. **Click "Import Data"** at the top of the dashboard to expand the upload section
2. **Upload Shopify/Square POS CSV file**:
   - Export your transaction data from Shopify or Square POS
   - Required columns: Date, Time, Transaction ID, Customer ID, Item, Qty, Gross Sales
   - File must be in CSV format
3. **Upload Sensor JSON file**:
   - Export foot traffic data from your LiDAR sensor device
   - Required format: JSON array with entries containing timestamp, device_id, direction (1=entry, 0=exit)
   - File must be in JSON format
4. **Important**: Both files should cover the **same date range** for accurate conversion rate calculations

After uploading, the dashboard will automatically refresh and display metrics calculated from your real business data.

## Data Requirements

### Shopify/Square POS CSV Format
Your CSV file must include these columns:
- **Date**: Transaction date (e.g., 7/31/25)
- **Time**: Transaction time (e.g., 16:23:13)
- **Transaction ID**: Unique transaction identifier
- **Customer ID**: Customer identifier (can be "GUEST" for walk-ins)
- **Item**: Product name
- **Qty**: Quantity sold
- **Gross Sales**: Total amount (with $ sign, e.g., $12.50)
- **Category** (optional): Product category

### LiDAR Sensor JSON Format
Your JSON file must be an array of entries:
```json
{
  "entries": [
    {
      "timestamp": "2025-07-01T10:30:00.000Z",
      "device_id": "sensor_123",
      "direction": 1
    }
  ]
}
```
- **timestamp**: ISO 8601 format datetime
- **device_id**: Sensor identifier
- **direction**: 1 for entry, 0 for exit

### Sample Data
Sample data files are included in `/backend/data/`:
- `shopify_data.csv` - Example POS export from Aloha Kira boutique
- `sensor_data.json` - Example LiDAR sensor readings

## Project Structure

```
MVP/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── requirements.txt     # Python dependencies
│   └── data/
│       ├── shopify_data.csv        # Your POS transaction data
│       └── sensor_data.json        # Your LiDAR sensor data
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main application component with routing
│   │   ├── components/      # React components
│   │   │   ├── Dashboard.jsx        # Main dashboard view
│   │   │   ├── DashboardCustomizer.jsx # Widget customization UI
│   │   │   ├── PricingPage.jsx      # Pricing tiers page
│   │   │   ├── DataUpload.jsx       # File upload interface
│   │   │   └── ...                  # Other components
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Customizing Your Dashboard

The dashboard is fully customizable! Control which metrics and analytics you see:

### How to Customize:
1. **Click the ⚙️ settings button** in the bottom-right corner of the dashboard
2. **Check/uncheck widgets** to show or hide specific cards:
   - **Metrics**: Revenue, ATV, Customer Mix, Foot Traffic, Conversion Rate
   - **Analytics**: AI Insights, Comparisons, Prescriptions
   - **Tools**: AI Chatbot
3. **Your preferences are saved** - Layout persists when you revisit the dashboard
4. **Reset to default** - Use the "Reset to Default" button to restore all widgets

### What Gets Saved:
- Widget visibility preferences
- Dashboard layout configuration
- All settings stored in browser's localStorage (no account needed)

## How It Works

The application analyzes your real business data to provide actionable insights:

1. **Data Import**: Upload your Shopify/Square POS transaction data (CSV) and LiDAR sensor foot traffic data (JSON)
2. **Automatic Analysis**: The system calculates key metrics including:
   - Total revenue and daily trends
   - Average transaction value (ATV)
   - New vs. returning customers
   - Foot traffic patterns
   - Conversion rate (transactions ÷ foot traffic)
3. **AI-Powered Insights**: Rule-based algorithms analyze your data to identify:
   - Busiest time slots
   - Top-selling products
   - Customer acquisition patterns
   - Revenue opportunities
4. **Prescriptive Recommendations**: Get specific, data-driven suggestions tailored to your actual products and sales patterns

**Note**: The dashboard requires data from matching date ranges for both POS and sensor files to accurately calculate conversion rates and other combined metrics.

## AI Logic

For this MVP, the "AI" features include:
- **Insights**: Calculated from real transaction patterns in your uploaded data
- **Comparisons**: Simulated benchmarks against industry averages
- **Prescriptions**: Rule-based recommendations customized to your actual products and sales data
- **Chatbot**: Natural language processing with pattern matching to answer questions about your business

## Development Notes

- The chatbot uses simple pattern matching for the MVP
- All insights are calculated from your real uploaded data
- Comparison data is simulated for demonstration purposes
- Prescriptions are dynamically generated based on your actual product catalog
- Conversion rate calculation automatically filters out days with incomplete sensor data
- Ready to integrate with advanced ML models and real-time data streams

## Future Enhancements

- Real-time data sync with POS systems
- Advanced ML models for sales predictions and demand forecasting
- User authentication and multi-user support
- Multi-location support with location comparison
- Automated report generation and email delivery
- Export functionality for reports and insights
- Mobile app for on-the-go analytics
- Integration with marketing platforms (Facebook Ads, Google Analytics)

## License

MIT License
