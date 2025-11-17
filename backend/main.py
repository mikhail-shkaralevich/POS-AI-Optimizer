"""
FastAPI backend for the Retail Dashboard MVP.
Serves analytics data and handles AI chatbot queries.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import json
import os
import shutil
from anthropic import Anthropic
from dotenv import load_dotenv
from sqlalchemy import create_engine

# Load environment variables
load_dotenv()

# Initialize database engine when a DATABASE_URL is provided
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("[WARNING] DATABASE_URL not set. Database features will be disabled.")
    db_engine = None
else:
    try:
        db_engine = create_engine(DATABASE_URL)
        print("[INFO] Database engine initialized")
    except Exception as exc:
        print(f"[ERROR] Failed to initialize database engine: {exc}")
        db_engine = None

app = FastAPI(title="Retail Dashboard API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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

# AI Context Generator
def generate_business_context() -> str:
    """Generate comprehensive business context for Claude AI."""
    transactions = mock_data["transactions"]
    business_name = mock_data["business_name"]
    
    # Calculate key metrics
    revenue_data = calculate_revenue(transactions, days=30)
    atv_data = calculate_atv(transactions, days=30)
    customer_data = calculate_customer_metrics(transactions, days=30)
    foot_traffic_data = calculate_foot_traffic(days=30)
    conversion_data = calculate_conversion_rate(transactions, days=30)
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

KEY METRICS (Last 30 Days):
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
    """Calculate conversion rate (transactions / foot traffic from sensor)."""
    cutoff_date = datetime.now().replace(tzinfo=None) - timedelta(days=days)
    
    # Get unique transactions by transaction_id per day
    daily_transactions = defaultdict(set)
    for txn in transactions:
        try:
            txn_date = datetime.strptime(txn["timestamp"], "%Y-%m-%d %H:%M:%S")
        except:
            continue
        
        if txn_date >= cutoff_date:
            day_key = txn_date.strftime("%Y-%m-%d")
            daily_transactions[day_key].add(txn.get("transaction_id", ""))
    
    # Get daily foot traffic from sensor (entries only)
    daily_traffic = defaultdict(int)
    for entry in sensor_data["entries"]:
        try:
            entry_date = datetime.fromisoformat(entry["timestamp"]).replace(tzinfo=None)
        except:
            continue
        
        if entry_date >= cutoff_date and entry.get("direction") == 1:
            day_key = entry_date.strftime("%Y-%m-%d")
            daily_traffic[day_key] += 1
    
    # Calculate daily conversion rates
    trend_data = []
    total_transactions = 0
    total_traffic = 0
    
    all_dates = sorted(set(list(daily_transactions.keys()) + list(daily_traffic.keys())))
    
    for date in all_dates:
        transactions_count = len(daily_transactions.get(date, set()))
        traffic_count = daily_traffic.get(date, 0)
        
        # Only calculate conversion if traffic > 0 and transactions <= traffic (valid data)
        if traffic_count > 0 and transactions_count <= traffic_count:
            conversion = (transactions_count / traffic_count * 100)
            trend_data.append({"date": date, "value": round(conversion, 1)})
            total_transactions += transactions_count
            total_traffic += traffic_count
        elif traffic_count > 0:
            # Skip days where sensor data appears incomplete (transactions > traffic)
            # Don't add to trend or totals
            pass
    
    overall_conversion = (total_transactions / total_traffic * 100) if total_traffic > 0 else 0
    
    return {
        "rate": round(overall_conversion, 1),
        "trend": trend_data,
        "transactions": total_transactions,
        "foot_traffic": total_traffic
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

@app.get("/api/business-info")
def get_business_info():
    """Get business name and basic info."""
    return {"business_name": mock_data["business_name"]}

@app.get("/api/metrics")
def get_metrics():
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
def get_hourly_metrics():
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
def get_insights():
    """Get AI-generated insights."""
    transactions = mock_data["transactions"]
    return {"insights": generate_insights(transactions)}

@app.get("/api/comparisons")
def get_comparisons():
    """Get comparison reports."""
    return {"comparisons": generate_comparisons()}

@app.get("/api/prescriptions")
def get_prescriptions():
    """Get prescriptive recommendations."""
    transactions = mock_data["transactions"]
    return {"prescriptions": generate_prescriptions(transactions)}

@app.post("/api/chat")
def chat(message: ChatMessage):
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
async def upload_shopify_data(file: UploadFile = File(...)):
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
async def upload_sensor_data(file: UploadFile = File(...)):
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
