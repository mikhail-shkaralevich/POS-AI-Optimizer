# Retail Dashboard MVP - AI-Powered Analytics

A modern, AI-powered dashboard for small retail businesses that provides prescriptive insights and comparative analytics.

## Features

- **Real-time Metrics**: Track revenue, average transaction value, and customer patterns
- **AI Insights**: Get actionable business intelligence from your data
- **Comparative Analytics**: Benchmark against similar businesses
- **Prescriptive Recommendations**: Receive AI-driven suggestions to improve performance
- **AI Consultant Chatbot**: Ask questions about your business data in natural language
- **Pricing Page**: Professional pricing tiers with hardware options (LiDAR sensor)

## Tech Stack

- **Frontend**: React.js with Vite, Tailwind CSS, Recharts
- **Backend**: Python with FastAPI
- **Data**: Mock JSON transaction data

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

#### Start the Frontend Development Server (Terminal 2)

```bash
# From frontend directory
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

### 5. Access the Dashboard

Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
MVP/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── requirements.txt     # Python dependencies
│   └── data/
│       ├── mock_data.json          # Mock transaction data
│       └── mock_data_generator.py  # Script to regenerate mock data
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main application component with routing
│   │   ├── components/      # React components
│   │   │   ├── Dashboard.jsx        # Main dashboard view
│   │   │   ├── PricingPage.jsx      # Pricing tiers page
│   │   │   └── ...                  # Other components
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Mock Data

The application uses mock transaction data to simulate a cafe's POS system. The data includes:
- Transaction timestamps
- Items sold with prices
- Customer IDs (for tracking new vs. returning customers)

**Note:** The mock data generators are configured to automatically create data for the last 30 days from the current date. Running the generators will always produce fresh, up-to-date data.

To regenerate mock data:
```bash
cd backend/data
python mock_data_generator.py      # Regenerates transaction data
python sensor_data_generator.py    # Regenerates LiDAR sensor data
```

## AI Logic

For this MVP, the "AI" features include:
- **Insights**: Calculated from transaction patterns in the mock data
- **Comparisons**: Simulated benchmarks against industry averages
- **Prescriptions**: Rule-based recommendations based on data analysis
- **Chatbot**: Natural language processing with pre-programmed responses

## Development Notes

- The chatbot uses simple pattern matching for the MVP
- All insights are calculated from the mock data
- Comparison data is simulated for demonstration purposes
- Ready to integrate with real AI models and actual POS systems

## Future Enhancements

- Integration with real POS systems
- Advanced ML models for predictions
- User authentication
- Multi-location support
- Export reports functionality
- Mobile responsive improvements

## License

MIT License
