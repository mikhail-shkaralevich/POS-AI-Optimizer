# Retail Dashboard MVP - AI-Powered Analytics

A modern, AI-powered dashboard for small retail businesses that provides prescriptive insights and comparative analytics.

## Features

- **Secure Access**: Login page with security code authentication to protect your business data
- **Real-time Metrics**: Track revenue, average transaction value, and customer patterns
- **AI Insights**: Get actionable business intelligence from your data
- **Comparative Analytics**: Benchmark against similar businesses
- **Benchmarking (Daily View)**: In any maximized metric chart, toggle "Show benchmarking" to overlay industry average (mocked) series on the same chart for small retail
- **Prescriptive Recommendations**: Receive AI-driven suggestions to improve performance
- **AI Consultant Chatbot**: Ask questions about your business data in natural language
- **Pricing Page**: Professional pricing tiers with hardware options (LiDAR sensor)
- **Data Import**: Upload your own Shopify/Square POS data and LiDAR sensor data directly from the web interface
- **Customizable Dashboard**: Drag-and-drop widget selection - show/hide any metric or analytics card with one click
- **Session Management**: 24-hour authentication sessions with easy logout

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

### 3. Configure Environment Variables

The application requires configuration for both AI chatbot and security:

1. **Open the `.env` file** in the `backend` directory

2. **Configure Security Code** (Required for dashboard access):
   ```properties
   # Security Code for Dashboard Access
   # Change this to your desired access code before deploying
   SECURITY_CODE=your-secure-code-here
   ```

3. **Configure JWT Secret Key** (Required for session authentication):
   ```properties
   # JWT Secret Key for Token Generation
   # Generate a secure random string (32+ characters recommended)
   # You can use: python -c "import secrets; print(secrets.token_urlsafe(32))"
   JWT_SECRET_KEY=your-secret-key-here-change-this-in-production
   ```

4. **Configure Anthropic API Key** (Required for AI chatbot):
   - Visit [https://console.anthropic.com](https://console.anthropic.com)
   - Sign up or log in
   - Navigate to **API Keys** and create a new key
   - Copy your API key (starts with `sk-ant-api03-...`)
   - Add to `.env`:
     ```properties
     # Required: Your Anthropic API key
     ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
     
     # Optional: Specify Claude model (default: claude-3-5-sonnet-20241022)
     ANTHROPIC_MODEL=claude-sonnet-4-20250514
     
     # Optional: Maximum tokens for AI responses (default: 2000)
     MAX_TOKENS=4096
     ```

5. **Configure CORS (Required for production deployments)**:
   ```properties
   # ALLOWED_ORIGINS - Comma-separated list of allowed frontend URLs
   # For local development (default if not set):
   # http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
   
   # For Railway deployment (example):
   ALLOWED_ORIGINS=https://pos-optimizer.up.railway.app,http://localhost:5173
   
   # For multiple production domains:
   # ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```
   **Important**: When deploying your backend, make sure to include your frontend's production URL in `ALLOWED_ORIGINS` to avoid CORS errors.

6. **Available AI Models**:
   - `claude-sonnet-4-20250514` - Claude Sonnet 4 (latest, recommended)
   - `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet
   - `claude-3-opus-20240229` - Claude 3 Opus (most capable)

**Important Security Notes**:
- Always change the default `SECURITY_CODE` before deploying to production
- Always change the default `JWT_SECRET_KEY` to a strong random string
- Keep your security code and JWT secret key private and secure
- The chatbot will not work without a valid Anthropic API key

### 4. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

**Configure Frontend Environment Variables:**

The frontend only requires one environment variable:

1. Open the `.env` file in the `frontend` directory (or create one)
2. Set the backend API URL:
   ```properties
   # For local development
   VITE_API_BASE_URL=http://localhost:8000
   
   # For production (Railway deployment)
   # VITE_API_BASE_URL=https://your-backend.railway.app
   ```

**Important Notes**:
- Vite requires environment variables to be prefixed with `VITE_` to be accessible in the frontend code
- The Anthropic API key is NOT needed in the frontend - it's only used by the backend
- When deploying to Railway or other platforms, set `VITE_API_BASE_URL` as an environment variable in your deployment platform

### 5. Running the Application

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

### 6. Access the Dashboard

1. Open your browser and navigate to `http://localhost:5173`

2. **Login with Security Code**:
   - You'll be presented with a login page
   - Enter the security code you configured in the `.env` file (default: `kira-super-shop`)
   - Click "Access Dashboard"
   - Your session will remain active for 24 hours
   - Use the "Logout" button in the navigation bar to sign out

### 7. Import Your Data

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

### Benchmarking in Maximized Charts

In the maximized view of any metric chart, select "Daily View" and click "Show benchmarking" to overlay the industry benchmark on the same chart. The benchmark represents a realistic industry average for small retail businesses, including weekday/weekend seasonality. It is currently mock data designed for demo purposes and applies to:

- Total Revenue
- Average Transaction Value (ATV)
- New vs. Returning Customers
- Foot Traffic
- Conversion Rate

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
- **Chatbot**: Powered by Claude AI (Anthropic) with natural language understanding to answer questions about your business data

## Development Notes

- The chatbot uses Claude AI for natural language understanding
- All insights are calculated from your real uploaded data
- Comparison data is simulated for demonstration purposes
- Prescriptions are dynamically generated based on your actual product catalog
- Conversion rate calculation automatically filters out days with incomplete sensor data
- Ready to integrate with advanced ML models and real-time data streams

## Deployment Guide

### Railway Deployment Checklist

When deploying your application to production (e.g., Railway), ensure you configure the following:

**Backend Deployment:**
1. Set all required environment variables:
   - `SECURITY_CODE`
   - `JWT_SECRET_KEY`
   - `ANTHROPIC_API_KEY`
   - `ANTHROPIC_MODEL` (optional)
   - `MAX_TOKENS` (optional)
   - **`ALLOWED_ORIGINS`** - Include your frontend's production URL
   
   Example:
   ```
   ALLOWED_ORIGINS=https://pos-optimizer.up.railway.app
   ```

**Frontend Deployment:**
1. Set `VITE_API_BASE_URL` to your deployed backend URL:
   ```
   VITE_API_BASE_URL=https://your-backend.railway.app
   ```

### Common Deployment Issues

**CORS Error: "has been blocked by CORS policy"**
- **Cause**: Frontend calling wrong backend URL or backend not configured to allow frontend origin
- **Solution**: 
  1. Check frontend `VITE_API_BASE_URL` points to deployed backend (not localhost)
  2. Add frontend URL to backend `ALLOWED_ORIGINS` environment variable
  3. Redeploy both frontend and backend after changes

**401 Unauthorized on Login**
- **Cause**: JWT_SECRET_KEY mismatch or incorrect SECURITY_CODE
- **Solution**: Verify both environment variables are set correctly in backend deployment

**Chatbot Not Responding**
- **Cause**: Invalid or missing ANTHROPIC_API_KEY
- **Solution**: Check API key is valid and set in backend environment variables

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