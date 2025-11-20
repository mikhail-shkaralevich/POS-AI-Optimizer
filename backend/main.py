"""
FastAPI backend for the Retail Dashboard MVP.
Serves analytics data and handles AI chatbot queries.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from collections import defaultdict, Counter
import json
import os
import shutil
from anthropic import Anthropic
from dotenv import load_dotenv
from sqlalchemy import create_engine
import time
from threading import Lock
from jose import JWTError, jwt
import secrets

# Load environment variables
load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Security scheme
security = HTTPBearer()

# Rate limiting for API calls
api_call_lock = Lock()
last_api_call_time = 0
MIN_API_CALL_INTERVAL = 2.0  # Minimum 2 seconds between API calls

# Rate limiting for login attempts
login_attempts = defaultdict(list)
MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_MINUTES = 15

# Cache for generated insights
insights_cache = {}
CACHE_DURATION = 300  # Cache insights for 5 minutes

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://127.0.0.1:5174,http://localhost:3000",
    ).split(",")
    if origin.strip()
]

# Initialize database engine when a DATABASE_URL is provided
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("[WARNING] DATABASE_URL not set. Database features will be disabled.")
    engine = None
else:
    try:
        engine = create_engine(DATABASE_URL)
        print("[INFO] Database engine initialized")
    except Exception as exc:
        print(f"[ERROR] Failed to initialize database engine: {exc}")
        engine = None

app = FastAPI(title="Retail Dashboard API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load real data from Shopify and sensor
def load_shopify_data():
    """Load transaction data from Shopify CSV file."""
    import csv
    
    data_path = os.path.join(os.path.dirname(__file__), "data", "shopify_data.csv")
    transactions = []
    
    print("[INFO] Loading Shopify data...")
    
    try:
        with open(data_path, "r", encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Parse Square/Shopify data format
                try:
                    # Combine date and time
                    date_str = row.get("Date", "")
                    time_str = row.get("Time", "")
                    
                    if date_str and time_str:
                        # Parse date format: 7/31/25
                        month, day, year = date_str.split("/")
                        year = f"20{year}" if len(year) == 2 else year
                        
                        timestamp = f"{year}-{month.zfill(2)}-{day.zfill(2)} {time_str}"
                    else:
                        continue
                    
                    # Parse amounts (remove $ and commas)
                    gross_sales = row.get("Gross Sales", "$0.00").replace("$", "").replace(",", "").strip()
                    net_sales = row.get("Net Sales", "$0.00").replace("$", "").replace(",", "").strip()
                    tax = row.get("Tax", "$0.00").replace("$", "").replace(",", "").strip()
                    
                    transaction = {
                        "transaction_id": row.get("Transaction ID", ""),
                        "timestamp": timestamp,
                        "customer_id": row.get("Customer ID", "GUEST") or "GUEST",
                        "customer_name": row.get("Customer Name", ""),
                        "total": float(gross_sales) if gross_sales else 0.0,
                        "net_sales": float(net_sales) if net_sales else 0.0,
                        "tax": float(tax) if tax else 0.0,
                        "item_name": row.get("Item", ""),
                        "category": row.get("Category", ""),
                        "quantity": int(row.get("Qty", 0)) if row.get("Qty") else 0,
                        "location": row.get("Location", ""),
                        "device": row.get("Device Name", ""),
                        "variant": row.get("Price Point Name", ""),  # Add variant field
                    }
                    transactions.append(transaction)
                except Exception as e:
                    # Skip rows with parsing errors
                    continue
        
        print(f"  [OK] Loaded {len(transactions)} transaction records from Shopify")
        return {
            "business_name": "Aloha Kira",
            "transactions": transactions
        }
    except Exception as e:
        print(f"  [ERROR] Failed to load Shopify data: {e}")
        return {"business_name": "Your Retail Store", "transactions": []}

def load_sensor_data():
    """Load sensor foot traffic data from JSON file."""
    data_path = os.path.join(os.path.dirname(__file__), "data", "sensor_data.json")
    
    print("[INFO] Loading sensor data...")
    
    try:
        with open(data_path, "r", encoding='utf-8') as f:
            raw_data = json.load(f)
            
            # Parse the MongoDB-style format
            entries = []
            for entry in raw_data:
                try:
                    # Extract timestamp from MongoDB format
                    if isinstance(entry.get("timestamp"), dict):
                        timestamp_str = entry["timestamp"]["$date"]
                    else:
                        timestamp_str = entry.get("timestamp", "")
                    
                    entries.append({
                        "timestamp": timestamp_str,
                        "device_id": entry.get("device_id", ""),
                        "direction": entry.get("direction", 1),  # 1=in, 0=out
                    })
                except:
                    continue
            
            print(f"  [OK] Loaded {len(entries)} sensor readings")
            return {"entries": entries}
    except Exception as e:
        print(f"  [ERROR] Failed to load sensor data: {e}")
        return {"entries": []}

# Load real data
mock_data = load_shopify_data()
sensor_data = load_sensor_data()

# Initialize Anthropic client with error handling
try:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "your_anthropic_api_key_here":
        print("[WARNING] ANTHROPIC_API_KEY not set. Chatbot will not work until API key is configured.")
        anthropic_client = None
    else:
        anthropic_client = Anthropic(api_key=api_key)
        print("[INFO] Anthropic client initialized successfully")
except Exception as e:
    print(f"[ERROR] Failed to initialize Anthropic client: {e}")
    anthropic_client = None

# Try multiple model names in case some are not available
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "2000"))

# Pydantic models for request/response
class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class SecurityCodeRequest(BaseModel):
    code: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

# JWT Helper Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return payload."""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check if token has expired
        exp = payload.get("exp")
        if exp is None:
            raise HTTPException(status_code=401, detail="Invalid token: missing expiration")
        
        if datetime.now(timezone.utc) > datetime.fromtimestamp(exp, tz=timezone.utc):
            raise HTTPException(status_code=401, detail="Token has expired")
        
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def get_client_ip(x_forwarded_for: Optional[str] = Header(None), 
                  x_real_ip: Optional[str] = Header(None)) -> str:
    """Extract client IP from headers."""
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    if x_real_ip:
        return x_real_ip
    return "unknown"

# AI Context Generator
def generate_business_context() -> str:
    """Generate comprehensive business context for Claude AI."""
    transactions = mock_data["transactions"]
    business_name = mock_data["business_name"]
    
    # Check if data is available
    if not transactions or len(transactions) == 0:
        return """
BUSINESS OVERVIEW:
Business Name: Your Retail Store
Status: No transaction data available

IMPORTANT: Please upload your business data using the "Upload Data" section on the dashboard to enable AI insights and analysis.

Required files:
1. Shopify/POS CSV file - Your transaction data
2. Sensor JSON file - Your foot traffic data

Once data is uploaded, I'll be able to provide detailed insights about:
- Revenue and sales trends
- Customer behavior patterns
- Product performance
- Operational recommendations
- And much more!

Please upload your data files to get started.
"""
    
    # Calculate key metrics using the same parameters as /api/metrics endpoint
    revenue_data = calculate_revenue(transactions)  # Use default 120 days to match /api/metrics
    atv_data = calculate_atv(transactions)  # Use default 120 days
    customer_data = calculate_customer_metrics(transactions)  # Use default 120 days
    foot_traffic_data = calculate_foot_traffic()
    conversion_data = calculate_conversion_rate(transactions)
    retention_rate = calculate_retention_rate(transactions)
    busiest_day = get_busiest_day(transactions)
    top_item = get_top_selling_item(transactions)
    
    # Get top 5 selling items with counts
    item_counts = Counter()
    for txn in transactions:
        item_name = txn.get("item_name", "")
        quantity = txn.get("quantity", 1)
        if item_name and item_name.lower() != "bag fee":
            item_counts[item_name] += quantity
    top_5_items = item_counts.most_common(5)
    
    # Analyze busiest hours
    hour_counts = Counter()
    for txn in transactions:
        try:
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
            hour_counts[txn_date.hour] += 1
        except:
            continue
    
    busiest_hours = hour_counts.most_common(3) if hour_counts else []
    
    context = f"""
BUSINESS OVERVIEW:
Business Name: {business_name}
Business Type: Retail Store (selling accessories, hair products, and lifestyle items)

KEY METRICS (All Available Data):
- Total Revenue: ${revenue_data['total']:,.2f}
- Average Daily Revenue: ${revenue_data['average_daily']:,.2f}
- Average Transaction Value (ATV): ${atv_data['value']:.2f}
- Total Transactions: {len(set(txn['transaction_id'] for txn in transactions))}
- Foot Traffic (LiDAR sensor): {foot_traffic_data['total']:,} visitors
- Conversion Rate: {conversion_data['rate']}%
- Customer Retention Rate: {retention_rate}%
- New Customers: {customer_data['new']}
- Returning Customers: {customer_data['returning']}

PRODUCT INSIGHTS:
Top Selling Items:
"""
    
    for i, (item, count) in enumerate(top_5_items, 1):
        context += f"{i}. {item}: {count} units sold\n"
    
    context += f"\nOPERATIONAL INSIGHTS:\n"
    context += f"- Busiest Day: {busiest_day}\n"
    
    if busiest_hours:
        hours_str = ", ".join([f"{hour}:00" for hour, _ in busiest_hours])
        context += f"- Busiest Hours: {hours_str}\n"
    
    context += f"\nREVENUE TRENDS:\n"
    if len(revenue_data['trend']) > 1:
        trend_values = [t['value'] for t in revenue_data['trend']]
        is_increasing = revenue_data['trend'][-1]['value'] > revenue_data['trend'][0]['value']
        context += f"- Recent trend: {'Increasing' if is_increasing else 'Decreasing/Stable'}\n"
        context += f"- Daily revenue range: ${min(trend_values):.2f} - ${max(trend_values):.2f}\n"
    else:
        context += "- Insufficient trend data available\n"
    
    context += """
You are an expert AI business consultant with the following capabilities:

1. DATA ANALYSIS: You have access to the business data above. Use it to provide specific, data-driven insights when asked about this business's performance.

2. GENERAL BUSINESS KNOWLEDGE: You can also answer general business questions, provide industry insights, discuss business strategies, marketing tactics, and operational best practices - even when they're not specifically related to the data above.

3. HYBRID RESPONSES: When appropriate, combine your general business knowledge with the specific data to provide comprehensive, actionable advice.

Be conversational, insightful, and practical in your recommendations. If asked about specific metrics in the data, cite the actual numbers. If asked general business questions, draw on your broad business knowledge while relating it to retail/small business contexts when relevant.
"""
    
    return context

# Helper functions for analytics calculations
def calculate_revenue(transactions: List[Dict], days: int = 120) -> Dict[str, Any]:
    """Calculate total revenue and daily breakdown."""
    cutoff_date = datetime.now() - timedelta(days=days)
    daily_revenue = defaultdict(float)
    total = 0
    
    for txn in transactions:
        try:
            # Parse timestamp format: YYYY-MM-DD HH:MM:SS
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
        except:
            continue
        
        if txn_date >= cutoff_date:
            day_key = txn_date.strftime("%Y-%m-%d")
            txn_total = txn.get("total", 0)
            daily_revenue[day_key] += txn_total
            total += txn_total
    
    # Sort by date and get values for trend
    sorted_days = sorted(daily_revenue.items())
    trend_data = [{"date": date, "value": round(value, 2)} for date, value in sorted_days]
    
    return {
        "total": round(total, 2),
        "trend": trend_data,
        "average_daily": round(total / days, 2) if days > 0 else 0
    }

def calculate_atv(transactions: List[Dict], days: int = 120) -> Dict[str, Any]:
    """Calculate Average Transaction Value."""
    cutoff_date = datetime.now() - timedelta(days=days)
    daily_atv = defaultdict(lambda: {"total": 0, "count": 0})
    
    # Group by transaction ID to avoid counting line items multiple times
    unique_transactions = defaultdict(lambda: {"total": 0, "date": None})
    
    for txn in transactions:
        try:
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
        except:
            continue
        
        if txn_date >= cutoff_date:
            txn_id = txn["transaction_id"]
            if unique_transactions[txn_id]["date"] is None:
                unique_transactions[txn_id]["date"] = txn_date
            unique_transactions[txn_id]["total"] = txn.get("total", 0)
    
    # Calculate daily ATV
    for txn_id, data in unique_transactions.items():
        if data["date"]:
            day_key = data["date"].strftime("%Y-%m-%d")
            daily_atv[day_key]["total"] += data["total"]
            daily_atv[day_key]["count"] += 1
    
    # Calculate ATV for each day
    trend_data = []
    total_sum = 0
    total_count = 0
    
    for date in sorted(daily_atv.keys()):
        day_data = daily_atv[date]
        daily_avg = day_data["total"] / day_data["count"] if day_data["count"] > 0 else 0
        trend_data.append({"date": date, "value": round(daily_avg, 2)})
        total_sum += day_data["total"]
        total_count += day_data["count"]
    
    overall_atv = total_sum / total_count if total_count > 0 else 0
    
    return {
        "value": round(overall_atv, 2),
        "trend": trend_data
    }

def calculate_customer_metrics(transactions: List[Dict], days: int = 120) -> Dict[str, Any]:
    """Calculate new vs returning customers."""
    cutoff_date = datetime.now() - timedelta(days=days)
    customer_first_seen = {}
    daily_customers = defaultdict(lambda: {"new": 0, "returning": 0})
    
    # First pass: find first transaction for each customer
    for txn in sorted(transactions, key=lambda x: x["timestamp"]):
        customer_id = txn["customer_id"]
        try:
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
        except:
            continue
        
        if customer_id not in customer_first_seen:
            customer_first_seen[customer_id] = txn_date
    
    # Second pass: categorize transactions (unique customers per day)
    processed_customers = defaultdict(set)
    
    for txn in transactions:
        try:
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
        except:
            continue
        
        if txn_date >= cutoff_date:
            day_key = txn_date.strftime("%Y-%m-%d")
            customer_id = txn["customer_id"]
            
            # Skip if already counted this customer today
            if customer_id in processed_customers[day_key]:
                continue
            processed_customers[day_key].add(customer_id)
            
            first_seen = customer_first_seen[customer_id]
            
            if first_seen >= cutoff_date and first_seen.strftime("%Y-%m-%d") == day_key:
                daily_customers[day_key]["new"] += 1
            else:
                daily_customers[day_key]["returning"] += 1
    
    # Calculate totals
    total_new = sum(data["new"] for data in daily_customers.values())
    total_returning = sum(data["returning"] for data in daily_customers.values())
    
    # Trend data
    trend_data = [
        {"date": date, "new": data["new"], "returning": data["returning"]}
        for date, data in sorted(daily_customers.items())
    ]
    
    return {
        "new": total_new,
        "returning": total_returning,
        "trend": trend_data
    }

def generate_insights(transactions: List[Dict]) -> List[str]:
    """Generate AI insights from transaction data."""
    # Analyze busiest time slots
    day_hour_counts = defaultdict(int)
    item_counts = defaultdict(int)
    new_customers_by_day = defaultdict(int)
    customer_first_seen = {}
    
    for txn in transactions:
        try:
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
        except:
            continue
        
        day_name = txn_date.strftime("%A")
        hour = txn_date.hour
        
        day_hour_counts[(day_name, hour)] += 1
        
        # Track popular items
        item_name = txn.get("item_name", "")
        quantity = txn.get("quantity", 1)
        if item_name:
            item_counts[item_name] += quantity
        
        # Track new customers by day
        customer_id = txn["customer_id"]
        if customer_id not in customer_first_seen:
            customer_first_seen[customer_id] = txn_date
            first_day = txn_date.strftime("%A")
            new_customers_by_day[first_day] += 1
    
    insights = []
    
    # Busiest time slot
    if day_hour_counts:
        busiest_time = max(day_hour_counts.items(), key=lambda x: x[1])
        day, hour = busiest_time[0]
        hour_range = f"{hour}:00 - {hour+1}:00"
        insights.append(f"Your busiest time slot is {day}s from {hour_range}")
    
    # Top selling items
    if item_counts:
        top_items = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        top_item_names = ", ".join([f"'{name}'" for name, _ in top_items])
        insights.append(f"Your top selling items are: {top_item_names}")
    
    # New customer pattern
    if new_customers_by_day:
        top_day = max(new_customers_by_day.items(), key=lambda x: x[1])
        insights.append(f"You gain the most new customers on {top_day[0]}s ({top_day[1]} new customers)")
    
    return insights

def generate_comparisons() -> List[str]:
    """Generate comparison insights (simulated benchmarks)."""
    return [
        "Your foot traffic (tracked by LiDAR) is 12% higher than the average for cafes in your area",
        "Your average transaction value is $0.50 below the sector benchmark. Consider upselling side items",
        "Customer retention rate is 8% above industry average - excellent work!",
        "Your 40.8% conversion rate exceeds the typical cafe benchmark of 35-38%"
    ]

def generate_prescriptions(transactions: List[Dict]) -> List[Dict[str, str]]:
    """Generate prescriptive recommendations."""
    # Analyze afternoon sales
    afternoon_revenue = 0
    total_revenue = 0
    
    for txn in transactions:
        try:
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
        except:
            continue
        
        hour = txn_date.hour
        try:
            txn_total = float(str(txn.get("total", "0")).replace("$", "").strip())
        except:
            txn_total = 0
        
        total_revenue += txn_total
        
        if 14 <= hour <= 17:  # 2 PM to 5 PM
            afternoon_revenue += txn_total
    
    # Get top selling items
    item_counts = Counter()
    for txn in transactions:
        item_name = txn.get("item_name", "")
        quantity = txn.get("quantity", 1)
        if item_name and item_name.lower() != "bag fee":
            item_counts[item_name] += quantity
    
    top_items = item_counts.most_common(3)
    
    # Calculate conversion rate for the prescription
    conversion_data = calculate_conversion_rate(transactions)
    conversion_rate = conversion_data['rate']
    
    prescriptions = []
    
    # Afternoon sales recommendation
    afternoon_percentage = (afternoon_revenue / total_revenue * 100) if total_revenue > 0 else 0
    if afternoon_percentage < 20:
        prescriptions.append({
            "type": "ACTION",
            "text": "Offer a limited-time afternoon discount (2-5 PM) on accessories and stickers to boost slower hours and increase foot traffic"
        })
    
    # Bundle recommendation based on actual products
    if len(top_items) >= 2:
        item1, item2 = top_items[0][0], top_items[1][0]
        prescriptions.append({
            "type": "SUGGESTION",
            "text": f"Create a bundle deal: Pair '{item1}' with '{item2}' at 10% off to increase Average Transaction Value"
        })
    else:
        prescriptions.append({
            "type": "SUGGESTION",
            "text": "Create accessory bundles (e.g., Hair Claw + Sticker + Keychain) to increase Average Transaction Value"
        })
    
    # Top seller marketing with actual product
    if top_items:
        top_item = top_items[0][0]
        prescriptions.append({
            "type": "OPPORTUNITY",
            "text": f"Your '{top_item}' is a top seller. Feature it prominently in window displays and Instagram posts to attract new customers"
        })
    
    # Conversion rate optimization
    if conversion_rate < 45:
        prescriptions.append({
            "type": "ACTION",
            "text": f"Your {conversion_rate}% conversion rate can be improved. Train staff on greeting customers within 30 seconds of entry to boost conversions by 5-8%"
        })
    else:
        prescriptions.append({
            "type": "OPPORTUNITY",
            "text": f"Excellent {conversion_rate}% conversion rate! Consider implementing a loyalty program to retain these converting customers"
        })
    
    return prescriptions

def get_top_selling_item(transactions: List[Dict]) -> str:
    """Find the top selling item."""
    item_counts = Counter()
    
    for txn in transactions:
        item_name = txn.get("item_name", "")
        quantity = txn.get("quantity", 1)
        if item_name:
            item_counts[item_name] += quantity
    
    if item_counts:
        return item_counts.most_common(1)[0][0]
    return "N/A"

def calculate_retention_rate(transactions: List[Dict]) -> float:
    """Calculate customer retention rate."""
    customer_txn_count = Counter(txn["customer_id"] for txn in transactions)
    returning_customers = sum(1 for count in customer_txn_count.values() if count > 1)
    total_customers = len(customer_txn_count)
    
    return round((returning_customers / total_customers * 100), 1) if total_customers > 0 else 0

def get_busiest_day(transactions: List[Dict]) -> str:
    """Find the busiest day of the week."""
    day_counts = Counter()
    
    for txn in transactions:
        txn_date = datetime.fromisoformat(txn["timestamp"])
        day_name = txn_date.strftime("%A")
        day_counts[day_name] += 1
    
    if day_counts:
        return day_counts.most_common(1)[0][0]
    return "N/A"

def calculate_foot_traffic(days: int = 120) -> Dict[str, Any]:
    """Calculate foot traffic metrics from LiDAR sensor data."""
    cutoff_date = datetime.now().replace(tzinfo=None) - timedelta(days=days)
    daily_traffic = defaultdict(int)
    
    # Count entries from sensor data (direction=1 means entry)
    for entry in sensor_data["entries"]:
        try:
            entry_date = datetime.fromisoformat(entry["timestamp"]).replace(tzinfo=None)
        except:
            continue
        
        if entry_date >= cutoff_date and entry.get("direction") == 1:
            day_key = entry_date.strftime("%Y-%m-%d")
            daily_traffic[day_key] += 1
    
    total_traffic = sum(daily_traffic.values())
    
    # Calculate daily trend
    trend_data = [
        {"date": date, "value": count}
        for date, count in sorted(daily_traffic.items())
    ]
    
    return {
        "total": total_traffic,
        "trend": trend_data,
        "average_daily": round(total_traffic / days, 1) if days > 0 else 0
    }

def calculate_conversion_rate(transactions: List[Dict], days: int = 120) -> Dict[str, Any]:
    """Calculate conversion rate (transactions / foot traffic from sensor).
    
    Calculates total conversion across ALL data, even if dates don't overlap.
    This gives a meaningful conversion rate even when transaction and sensor data
    are from different time periods.
    
    Edge case handling:
    - If transactions > foot_traffic on a specific day, it indicates potential data quality issues
    - We still calculate it but cap at 100% and log warnings for debugging
    """
    # Count ALL unique transactions (no date restrictions)
    unique_transaction_ids = set()
    daily_transactions = defaultdict(set)
    
    for txn in transactions:
        try:
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
            txn_id = txn.get("transaction_id", "")
            if txn_id:
                unique_transaction_ids.add(txn_id)
                day_key = txn_date.strftime("%Y-%m-%d")
                daily_transactions[day_key].add(txn_id)
        except:
            continue
    
    # Count ALL foot traffic entries (no date restrictions)
    total_foot_traffic = 0
    daily_traffic = defaultdict(int)
    
    for entry in sensor_data["entries"]:
        try:
            entry_date = datetime.fromisoformat(entry["timestamp"]).replace(tzinfo=None)
            if entry.get("direction") == 1:  # Only count entries (direction=1)
                total_foot_traffic += 1
                day_key = entry_date.strftime("%Y-%m-%d")
                daily_traffic[day_key] += 1
        except:
            continue
    
    # Calculate TOTAL conversion rate across all data
    total_transactions = len(unique_transaction_ids)
    overall_conversion = (total_transactions / total_foot_traffic * 100) if total_foot_traffic > 0 else 0
    overall_conversion = min(overall_conversion, 100)  # Cap at 100%
    
    print(f"[DEBUG] Total transactions: {total_transactions}")
    print(f"[DEBUG] Total foot traffic: {total_foot_traffic}")
    print(f"[DEBUG] Overall conversion: {overall_conversion}%")
    
    # Build trend data with improved edge case handling
    trend_data = []
    all_dates = sorted(set(list(daily_transactions.keys()) + list(daily_traffic.keys())))
    suspicious_days = []  # Track days with potential data quality issues
    
    for date in all_dates:
        transactions_count = len(daily_transactions.get(date, set()))
        traffic_count = daily_traffic.get(date, 0)
        
        # Include all days in trend, even if only one metric exists
        if transactions_count > 0 or traffic_count > 0:
            if traffic_count > 0:
                # Calculate conversion rate
                raw_conversion = (transactions_count / traffic_count * 100)
                conversion = min(raw_conversion, 100)  # Cap at 100%
                
                # Flag suspicious data: more transactions than foot traffic
                if transactions_count > traffic_count:
                    suspicious_days.append({
                        "date": date,
                        "transactions": transactions_count,
                        "traffic": traffic_count,
                        "raw_conversion": raw_conversion
                    })
                    print(f"[WARNING] {date}: {transactions_count} transactions > {traffic_count} foot traffic ({raw_conversion:.1f}% conversion)")
            else:
                # No traffic data for this day - set conversion to 0%
                conversion = 0
                if transactions_count > 0:
                    print(f"[WARNING] {date}: {transactions_count} transactions but NO foot traffic data (sensor may be offline)")
            
            trend_data.append({"date": date, "value": round(conversion, 1)})
    
    return {
        "rate": round(overall_conversion, 1),
        "trend": trend_data,
        "transactions": total_transactions,
        "foot_traffic": total_foot_traffic,
        "data_quality_warnings": suspicious_days  # Include warnings for frontend/debugging
    }

def calculate_hourly_revenue(transactions: List[Dict], days: int = 120) -> Dict[str, Any]:
    """Calculate revenue broken down by hour of day."""
    cutoff_date = datetime.now() - timedelta(days=days)
    hourly_revenue = defaultdict(float)
    
    for txn in transactions:
        try:
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
        except:
            continue
        
        if txn_date >= cutoff_date:
            hour_key = txn_date.strftime("%Y-%m-%d %H:00")
            txn_total = txn.get("total", 0)
            hourly_revenue[hour_key] += txn_total
    
    # Sort by datetime and format for frontend
    sorted_hours = sorted(hourly_revenue.items())
    trend_data = [
        {
            "date": datetime.strptime(hour, "%Y-%m-%d %H:00").strftime("%m/%d %I%p"),
            "value": round(value, 2)
        }
        for hour, value in sorted_hours
    ]
    
    return {"trend": trend_data}

def calculate_hourly_atv(transactions: List[Dict], days: int = 120) -> Dict[str, Any]:
    """Calculate ATV broken down by hour."""
    cutoff_date = datetime.now() - timedelta(days=days)
    hourly_atv = defaultdict(lambda: {"total": 0, "count": 0})
    unique_transactions = defaultdict(lambda: {"total": 0, "hour": None})
    
    for txn in transactions:
        try:
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
        except:
            continue
        
        if txn_date >= cutoff_date:
            txn_id = txn["transaction_id"]
            hour_key = txn_date.strftime("%Y-%m-%d %H:00")
            if unique_transactions[txn_id]["hour"] is None:
                unique_transactions[txn_id]["hour"] = hour_key
            unique_transactions[txn_id]["total"] = txn.get("total", 0)
    
    for txn_id, data in unique_transactions.items():
        if data["hour"]:
            hourly_atv[data["hour"]]["total"] += data["total"]
            hourly_atv[data["hour"]]["count"] += 1
    
    trend_data = []
    for hour in sorted(hourly_atv.keys()):
        day_data = hourly_atv[hour]
        hourly_avg = day_data["total"] / day_data["count"] if day_data["count"] > 0 else 0
        trend_data.append({
            "date": datetime.strptime(hour, "%Y-%m-%d %H:00").strftime("%m/%d %I%p"),
            "value": round(hourly_avg, 2)
        })
    
    return {"trend": trend_data}

def calculate_hourly_customers(transactions: List[Dict], days: int = 120) -> Dict[str, Any]:
    """Calculate new vs returning customers by hour."""
    cutoff_date = datetime.now() - timedelta(days=days)
    customer_first_seen = {}
    hourly_customers = defaultdict(lambda: {"new": 0, "returning": 0})
    
    # Find first transaction for each customer
    for txn in sorted(transactions, key=lambda x: x["timestamp"]):
        customer_id = txn["customer_id"]
        try:
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
        except:
            continue
        
        if customer_id not in customer_first_seen:
            customer_first_seen[customer_id] = txn_date
    
    # Categorize by hour (unique customers per hour)
    processed_customers = defaultdict(set)
    
    for txn in transactions:
        try:
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
        except:
            continue
        
        if txn_date >= cutoff_date:
            hour_key = txn_date.strftime("%Y-%m-%d %H:00")
            customer_id = txn["customer_id"]
            
            if customer_id in processed_customers[hour_key]:
                continue
            processed_customers[hour_key].add(customer_id)
            
            first_seen = customer_first_seen[customer_id]
            
            if first_seen >= cutoff_date and first_seen.strftime("%Y-%m-%d %H:00") == hour_key:
                hourly_customers[hour_key]["new"] += 1
            else:
                hourly_customers[hour_key]["returning"] += 1
    
    trend_data = [
        {
            "date": datetime.strptime(hour, "%Y-%m-%d %H:00").strftime("%m/%d %I%p"),
            "new": data["new"],
            "returning": data["returning"]
        }
        for hour, data in sorted(hourly_customers.items())
    ]
    
    return {"trend": trend_data}

def calculate_hourly_foot_traffic(days: int = 120) -> Dict[str, Any]:
    """Calculate foot traffic by hour."""
    cutoff_date = datetime.now().replace(tzinfo=None) - timedelta(days=days)
    hourly_traffic = defaultdict(int)
    
    for entry in sensor_data["entries"]:
        try:
            entry_date = datetime.fromisoformat(entry["timestamp"]).replace(tzinfo=None)
        except:
            continue
        
        if entry_date >= cutoff_date and entry.get("direction") == 1:
            hour_key = entry_date.strftime("%Y-%m-%d %H:00")
            hourly_traffic[hour_key] += 1
    
    trend_data = [
        {
            "date": datetime.strptime(hour, "%Y-%m-%d %H:00").strftime("%m/%d %I%p"),
            "value": count
        }
        for hour, count in sorted(hourly_traffic.items())
    ]
    
    return {"trend": trend_data}

def calculate_hourly_conversion(transactions: List[Dict], days: int = 120) -> Dict[str, Any]:
    """Calculate conversion rate by hour."""
    cutoff_date = datetime.now().replace(tzinfo=None) - timedelta(days=days)
    
    # Get unique transactions per hour
    hourly_transactions = defaultdict(set)
    for txn in transactions:
        try:
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
        except:
            continue
        
        if txn_date >= cutoff_date:
            hour_key = txn_date.strftime("%Y-%m-%d %H:00")
            hourly_transactions[hour_key].add(txn.get("transaction_id", ""))
    
    # Get hourly foot traffic
    hourly_traffic = defaultdict(int)
    for entry in sensor_data["entries"]:
        try:
            entry_date = datetime.fromisoformat(entry["timestamp"]).replace(tzinfo=None)
        except:
            continue
        
        if entry_date >= cutoff_date and entry.get("direction") == 1:
            hour_key = entry_date.strftime("%Y-%m-%d %H:00")
            hourly_traffic[hour_key] += 1
    
    # Calculate hourly conversion rates
    trend_data = []
    all_hours = sorted(set(list(hourly_transactions.keys()) + list(hourly_traffic.keys())))
    
    for hour in all_hours:
        transactions_count = len(hourly_transactions.get(hour, set()))
        traffic_count = hourly_traffic.get(hour, 0)
        
        if traffic_count > 0 and transactions_count <= traffic_count:
            conversion = (transactions_count / traffic_count * 100)
            trend_data.append({
                "date": datetime.strptime(hour, "%Y-%m-%d %H:00").strftime("%m/%d %I%p"),
                "value": round(conversion, 1)
            })
    
    return {"trend": trend_data}

# API Endpoints
@app.get("/")
def read_root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Retail Dashboard API is running"}

@app.post("/api/auth/verify", response_model=TokenResponse)
def verify_security_code(request: SecurityCodeRequest, client_ip: str = Depends(get_client_ip)):
    """Verify the security code and return JWT token."""
    expected_code = os.getenv("SECURITY_CODE", "")
    
    if not expected_code:
        raise HTTPException(status_code=500, detail="Security code not configured on server")
    
    # Rate limiting: check login attempts
    now = datetime.now()
    attempts = login_attempts[client_ip]
    # Remove attempts older than the window
    attempts = [t for t in attempts if (now - t).seconds < LOGIN_WINDOW_MINUTES * 60]
    login_attempts[client_ip] = attempts
    
    if len(attempts) >= MAX_LOGIN_ATTEMPTS:
        raise HTTPException(
            status_code=429, 
            detail=f"Too many login attempts. Please try again in {LOGIN_WINDOW_MINUTES} minutes."
        )
    
    # Verify security code
    if request.code != expected_code:
        # Record failed attempt
        login_attempts[client_ip].append(now)
        raise HTTPException(status_code=401, detail="Invalid security code")
    
    # Clear failed attempts on successful login
    login_attempts[client_ip] = []
    
    # Create JWT token
    access_token_expires = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    access_token = create_access_token(
        data={"sub": "dashboard_user", "type": "access"},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_HOURS * 3600  # in seconds
    }

@app.get("/api/auth/validate")
def validate_token(payload: dict = Depends(verify_token)):
    """Validate if token is still valid."""
    return {"valid": True, "user": payload.get("sub")}

@app.get("/api/business-info")
def get_business_info(payload: dict = Depends(verify_token)):
    """Get business name and basic info."""
    # Override with "Test Store" - original name still available in mock_data["business_name"]
    return {"business_name": "Test Store"}

@app.get("/api/transactions")
def get_transactions(payload: dict = Depends(verify_token)):
    """Get raw transaction data for custom metrics."""
    transactions = mock_data["transactions"]
    return {
        "transactions": transactions,
        "count": len(transactions)
    }

@app.get("/api/metrics")
def get_metrics(payload: dict = Depends(verify_token)):
    """Get all dashboard metrics."""
    transactions = mock_data["transactions"]
    
    # Calculate date range of the data
    if transactions:
        dates = [datetime.strptime(t["timestamp"], "%Y-%m-%d %H:%M:%S") for t in transactions]
        min_date = min(dates).strftime("%B %d, %Y")
        max_date = max(dates).strftime("%B %d, %Y")
        data_range = f"{min_date} - {max_date}"
    else:
        data_range = "No data available"
    
    revenue_data = calculate_revenue(transactions)
    atv_data = calculate_atv(transactions)
    customer_data = calculate_customer_metrics(transactions)
    foot_traffic_data = calculate_foot_traffic()  # No transactions parameter
    conversion_data = calculate_conversion_rate(transactions)
    
    return {
        "date_range": data_range,
        "revenue": revenue_data,
        "atv": atv_data,
        "customers": customer_data,
        "foot_traffic": foot_traffic_data,
        "conversion_rate": conversion_data,
        "top_selling_item": get_top_selling_item(transactions),
        "retention_rate": calculate_retention_rate(transactions),
        "busiest_day": get_busiest_day(transactions)
    }

@app.get("/api/metrics/hourly")
def get_hourly_metrics(payload: dict = Depends(verify_token)):
    """Get hourly breakdown of all metrics for detailed analysis."""
    transactions = mock_data["transactions"]
    
    return {
        "revenue": calculate_hourly_revenue(transactions),
        "atv": calculate_hourly_atv(transactions),
        "customers": calculate_hourly_customers(transactions),
        "foot_traffic": calculate_hourly_foot_traffic(),
        "conversion_rate": calculate_hourly_conversion(transactions)
    }

@app.get("/api/insights")
def get_insights(payload: dict = Depends(verify_token)):
    """Get AI-generated insights."""
    transactions = mock_data["transactions"]
    return {"insights": generate_insights(transactions)}

@app.get("/api/comparisons")
def get_comparisons(payload: dict = Depends(verify_token)):
    """Get comparison reports."""
    return {"comparisons": generate_comparisons()}

@app.get("/api/prescriptions")
def get_prescriptions(payload: dict = Depends(verify_token)):
    """Get prescriptive recommendations."""
    transactions = mock_data["transactions"]
    return {"prescriptions": generate_prescriptions(transactions)}

@app.post("/api/generate-insights")
def generate_ai_insights(request: dict, payload: dict = Depends(verify_token)):
    """Generate AI-powered insights using Claude API with rate limiting and caching."""
    global last_api_call_time
    
    try:
        # Check if Anthropic client is initialized
        if anthropic_client is None:
            return {
                "error": "Anthropic API is not configured. Please set your ANTHROPIC_API_KEY in the backend/.env file."
            }
        
        # Get the business data from request
        business_data = request.get("businessData", {})
        is_refresh = request.get("isRefresh", False)
        
        # Generate cache key based on business data (excluding time-sensitive fields)
        cache_key = f"{business_data.get('totalRevenue', 0)}_{business_data.get('transactions', 0)}_{business_data.get('conversionRate', 0)}_{is_refresh}"
        
        # Check cache first (skip cache if it's a refresh request)
        if not is_refresh and cache_key in insights_cache:
            cached_data = insights_cache[cache_key]
            if time.time() - cached_data['timestamp'] < CACHE_DURATION:
                print("[INFO] Returning cached insights")
                return cached_data['data']
        
        # Rate limiting: ensure minimum interval between API calls
        with api_call_lock:
            time_since_last_call = time.time() - last_api_call_time
            if time_since_last_call < MIN_API_CALL_INTERVAL:
                wait_time = MIN_API_CALL_INTERVAL - time_since_last_call
                print(f"[INFO] Rate limiting: waiting {wait_time:.2f}s before API call")
                time.sleep(wait_time)
            
            last_api_call_time = time.time()
        
        # Build the prompt
        prompt = f"""You are an expert retail analytics consultant analyzing data for a small-to-mid-sized retail business. Your role is to identify actionable insights and provide prescriptive recommendations based on their actual business data.

## BUSINESS CONTEXT
Business Name: {business_data.get('businessName', 'This Store')}
Business Type: {business_data.get('businessType', 'Retail Store')}
Location: {business_data.get('location', 'Hawaii')}
Customer Mix: {business_data.get('customerMix', 'Mixed local and tourist')}
Current Date: {datetime.now().strftime('%B %d, %Y')}

## CURRENT BUSINESS DATA
Time Period: {business_data.get('timePeriod', 'Last 7 Days')}

Key Metrics:
- Total Revenue: ${business_data.get('totalRevenue', 0):,.2f}
- Foot Traffic: {business_data.get('footTraffic', 0):,} visitors
- Transactions: {business_data.get('transactions', 0)}
- Conversion Rate: {business_data.get('conversionRate', 0)}%
- Average Transaction Value: ${business_data.get('avgTransactionValue', 0):.2f}
- Peak Traffic Hours: {business_data.get('peakHours', 'Unknown')}
- Peak Sales Hours: {business_data.get('peakSalesHours', 'Unknown')}

{f"Top Sellers: {', '.join(business_data.get('topProducts', []))}" if business_data.get('topProducts') else ''}
{f"Slow-Moving Items: {', '.join(business_data.get('slowMovers', []))}" if business_data.get('slowMovers') else ''}

Historical Comparison:
- Revenue vs Last Period: {business_data.get('revenueChange', 'N/A')}
- Traffic vs Last Period: {business_data.get('trafficChange', 'N/A')}
- Conversion vs Last Period: {business_data.get('conversionChange', 'N/A')}

## YOUR TASK
Generate insights in TWO categories:

### 1. INTERESTING INSIGHTS (3-4 insights)
Identify notable patterns, trends, or anomalies in the data. These should be:
- Specific to their actual numbers
- Surprising or non-obvious
- Based on data comparisons
- Focused on "what's happening" with brief "why it matters"

### 2. PRESCRIPTIVE INSIGHTS (3-4 recommendations)
Provide actionable recommendations. These should be:
- Specific, concrete actions (not vague suggestions)
- Directly tied to their data patterns
- Prioritized by potential impact
- Include expected outcome when possible
- Address: dead inventory, staffing optimization, missed opportunities, promotion effectiveness, local vs tourist targeting

## IMPORTANT GUIDELINES
- Never repeat the same insight twice - always provide fresh analysis
- Use their actual numbers in your insights
- Prioritize insights that can save time or increase revenue
- Focus on problems they can actually solve
- Be direct and confident in your recommendations
- Consider Hawaii's unique retail context (tourist/local dynamics, seasonal patterns)
- Reference specific time periods, percentages, and dollar amounts
- Avoid obvious statements - explain WHY and WHAT TO DO

## OUTPUT FORMAT
Return ONLY a valid JSON object with this structure (no markdown, no code blocks):

{{
  "interestingInsights": [
    {{
      "title": "Brief headline (5-8 words)",
      "description": "2-3 sentence explanation with specific numbers and why it matters",
      "priority": "high",
      "category": "conversion"
    }}
  ],
  "prescriptiveInsights": [
    {{
      "title": "Action-oriented headline starting with verb",
      "description": "2-3 sentences explaining what to do, how to do it, and expected impact",
      "priority": "high",
      "actionType": "immediate",
      "category": "staffing",
      "estimatedImpact": "Brief statement of expected benefit"
    }}
  ]
}}

{"IMPORTANT: This is a REFRESH request. Do not repeat any insights from your previous response. Generate completely new insights based on different aspects of the data." if is_refresh else ""}

NOW ANALYZE THE DATA AND GENERATE FRESH, SPECIFIC INSIGHTS IN VALID JSON FORMAT."""

        # Call Claude AI
        print(f"[INFO] Making API call to Claude (refresh={is_refresh})")
        response = anthropic_client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=1500,  # Reduced to use fewer tokens
            temperature=0.8 if is_refresh else 0.7,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        # Extract and parse the response
        insights_text = response.content[0].text
        
        # Clean potential markdown code blocks
        cleaned_text = insights_text.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
        insights = json.loads(cleaned_text)
        
        # Cache the result (even for refresh requests)
        insights_cache[cache_key] = {
            'data': insights,
            'timestamp': time.time()
        }
        
        print(f"[INFO] Successfully generated and cached insights")
        return insights
        
    except Exception as e:
        print(f"[ERROR] Generate insights error: {e}")
        return {
            "error": str(e)
        }

@app.get("/api/inventory-insights")
def get_inventory_insights(payload: dict = Depends(verify_token)):
    """Get inventory insights including sales velocity, slow movers, and variant analysis."""
    try:
        transactions = mock_data["transactions"]
        
        if not transactions:
            return {
                "salesVelocity": [],
                "slowMovers": [],
                "variantAnalysis": []
            }
        
        # Calculate date range
        dates = []
        for txn in transactions:
            try:
                txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
                dates.append(txn_date)
            except:
                continue
        
        if not dates:
            return {
                "salesVelocity": [],
                "slowMovers": [],
                "variantAnalysis": []
            }
        
        earliest_date = min(dates)
        latest_date = max(dates)
        days_range = (latest_date - earliest_date).days + 1
        
        # 1. SALES VELOCITY ANALYSIS
        product_stats = defaultdict(lambda: {"units": 0, "revenue": 0, "variants": defaultdict(int), "last_sale": None})
        
        for txn in transactions:
            item_name = txn.get("item_name", "Unknown")
            variant = txn.get("category", "") or "Standard"
            quantity = txn.get("quantity", 0)
            revenue = txn.get("net_sales", 0)
            
            if not item_name or item_name.lower() == "bag fee":
                continue
            
            try:
                txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
                product_stats[item_name]["last_sale"] = max(
                    product_stats[item_name]["last_sale"] or txn_date,
                    txn_date
                )
            except:
                pass
            
            product_stats[item_name]["units"] += quantity
            product_stats[item_name]["revenue"] += revenue
            product_stats[item_name]["variants"][variant] += quantity
        
        # Calculate velocity and prepare sales velocity data
        sales_velocity = []
        for product, stats in product_stats.items():
            velocity = round(stats["units"] / days_range, 2) if days_range > 0 else 0
            
            # Get primary variant
            primary_variant = max(stats["variants"].items(), key=lambda x: x[1])[0] if stats["variants"] else None
            
            sales_velocity.append({
                "product": product,
                "variant": primary_variant,
                "totalSold": stats["units"],
                "velocity": velocity,
                "revenue": round(stats["revenue"], 2)
            })
        
        # Sort by velocity (descending)
        sales_velocity.sort(key=lambda x: x["velocity"], reverse=True)
        sales_velocity = sales_velocity[:30]  # Top 30 items
        
        # 2. SLOW MOVERS ANALYSIS
        slow_movers = []
        for product, stats in product_stats.items():
            velocity = stats["units"] / days_range if days_range > 0 else 0
            
            # Calculate days since last sale
            days_since_last = 0
            if stats["last_sale"]:
                days_since_last = (latest_date - stats["last_sale"]).days
            
            # Identify slow movers: velocity < 0.2 per day OR no sale in 14+ days
            if velocity < 0.2 or days_since_last > 14:
                primary_variant = max(stats["variants"].items(), key=lambda x: x[1])[0] if stats["variants"] else None
                
                # Generate recommendation
                if days_since_last > 30:
                    recommendation = "Consider 30-50% markdown or bundle with popular items"
                elif days_since_last > 14:
                    recommendation = "Feature prominently at point-of-sale or offer 20% discount"
                elif velocity < 0.1:
                    recommendation = "Very slow mover - consider clearance or return to supplier"
                else:
                    recommendation = "Monitor closely - may need promotional support"
                
                slow_movers.append({
                    "product": product,
                    "variant": primary_variant,
                    "totalSold": stats["units"],
                    "velocity": round(velocity, 2),
                    "daysSinceLastSale": days_since_last,
                    "recommendation": recommendation
                })
        
        # Sort by days since last sale (descending)
        slow_movers.sort(key=lambda x: x["daysSinceLastSale"], reverse=True)
        slow_movers = slow_movers[:20]  # Top 20 slow movers
        
        # 3. VARIANT ANALYSIS
        # Group by product and analyze variants
        product_variants = defaultdict(lambda: {"variants": defaultdict(lambda: {"units": 0, "revenue": 0}), "total_units": 0, "total_revenue": 0})
        
        for txn in transactions:
            item_name = txn.get("item_name", "Unknown")
            variant = txn.get("variant", "").strip() or "Standard"
            quantity = txn.get("quantity", 0)
            revenue = txn.get("net_sales", 0)
            
            if not item_name or item_name.lower() == "bag fee":
                continue
            
            product_variants[item_name]["variants"][variant]["units"] += quantity
            product_variants[item_name]["variants"][variant]["revenue"] += revenue
            product_variants[item_name]["total_units"] += quantity
            product_variants[item_name]["total_revenue"] += revenue
        
        # Prepare variant analysis data
        variant_analysis = []
        for product, data in product_variants.items():
            # Only include products with multiple variants
            if len(data["variants"]) < 2:
                continue
            
            variants_list = []
            for variant, stats in data["variants"].items():
                percent = round((stats["units"] / data["total_units"]) * 100, 1) if data["total_units"] > 0 else 0
                variants_list.append({
                    "variant": variant,
                    "units": stats["units"],
                    "revenue": round(stats["revenue"], 2),
                    "percentOfTotal": percent
                })
            
            # Sort variants by units sold
            variants_list.sort(key=lambda x: x["units"], reverse=True)
            
            # Generate recommendation
            top_variant_percent = variants_list[0]["percentOfTotal"] if variants_list else 0
            recommendation = None
            
            if top_variant_percent > 60:
                recommendation = f"Focus inventory on top variant - it represents {top_variant_percent}% of sales"
            elif len([v for v in variants_list if v["percentOfTotal"] < 5]) > 0:
                recommendation = "Consider discontinuing variants with less than 5% of sales"
            else:
                recommendation = "Balanced variant distribution - maintain current mix"
            
            variant_analysis.append({
                "product": product,
                "totalSold": data["total_units"],
                "totalRevenue": round(data["total_revenue"], 2),
                "variantCount": len(variants_list),
                "variants": variants_list[:10],  # Top 10 variants
                "topVariant": variants_list[0] if variants_list else None,
                "recommendation": recommendation
            })
        
        # Sort by total revenue
        variant_analysis.sort(key=lambda x: x["totalRevenue"], reverse=True)
        variant_analysis = variant_analysis[:15]  # Top 15 products
        
        return {
            "salesVelocity": sales_velocity,
            "slowMovers": slow_movers,
            "variantAnalysis": variant_analysis
        }
        
    except Exception as e:
        print(f"[ERROR] Inventory insights error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate inventory insights: {str(e)}")

@app.post("/api/chat")
def chat(message: ChatMessage, payload: dict = Depends(verify_token)):
    """Handle chatbot queries using Claude AI with business context."""
    try:
        # Check if Anthropic client is initialized
        if anthropic_client is None:
            return ChatResponse(
                response="The AI chatbot is not configured. Please set your ANTHROPIC_API_KEY in the backend/.env file and restart the server. Visit https://console.anthropic.com to get your API key."
            )
        
        # Generate business context with current data
        business_context = generate_business_context()
        
        # Call Claude AI
        response = anthropic_client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=MAX_TOKENS,
            system=business_context,
            messages=[
                {
                    "role": "user",
                    "content": message.message
                }
            ]
        )
        
        # Extract the response text
        ai_response = response.content[0].text
        
        return ChatResponse(response=ai_response)
        
    except Exception as e:
        # Log error and return a friendly message
        print(f"[ERROR] Chat API error: {e}")
        return ChatResponse(
            response="I apologize, but I encountered an error processing your request. Please try again or rephrase your question."
        )

@app.post("/api/upload/shopify")
async def upload_shopify_data(file: UploadFile = File(...), payload: dict = Depends(verify_token)):
    """Upload Shopify CSV data file."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file")
    
    try:
        # Save the uploaded file
        data_path = os.path.join(os.path.dirname(__file__), "data", "shopify_data.csv")
        with open(data_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Reload the data
        global mock_data
        mock_data = load_shopify_data()
        
        return {
            "success": True,
            "message": f"Shopify data uploaded successfully",
            "records": len(mock_data["transactions"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@app.post("/api/upload/sensor")
async def upload_sensor_data(file: UploadFile = File(...), payload: dict = Depends(verify_token)):
    """Upload sensor JSON data file."""
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="File must be a JSON file")
    
    try:
        # Save the uploaded file
        data_path = os.path.join(os.path.dirname(__file__), "data", "sensor_data.json")
        with open(data_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Reload the data
        global sensor_data
        sensor_data = load_sensor_data()
        
        return {
            "success": True,
            "message": f"Sensor data uploaded successfully",
            "entries": len(sensor_data["entries"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
