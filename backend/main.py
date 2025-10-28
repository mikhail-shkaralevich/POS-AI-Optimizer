"""
FastAPI backend for the Retail Dashboard MVP.
Serves analytics data and handles AI chatbot queries.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import json
import os

app = FastAPI(title="Retail Dashboard API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load mock data
def load_mock_data():
    """Load transaction data from JSON file."""
    data_path = os.path.join(os.path.dirname(__file__), "data", "mock_data.json")
    with open(data_path, "r") as f:
        return json.load(f)

def load_sensor_data():
    """Load sensor foot traffic data from JSON file."""
    data_path = os.path.join(os.path.dirname(__file__), "data", "sensor_mock_data.json")
    with open(data_path, "r") as f:
        return json.load(f)

mock_data = load_mock_data()
sensor_data = load_sensor_data()

# Pydantic models for request/response
class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

# Helper functions for analytics calculations
def calculate_revenue(transactions: List[Dict], days: int = 30) -> Dict[str, Any]:
    """Calculate total revenue and daily breakdown."""
    cutoff_date = datetime.now() - timedelta(days=days)
    daily_revenue = defaultdict(float)
    total = 0
    
    for txn in transactions:
        txn_date = datetime.fromisoformat(txn["timestamp"])
        if txn_date >= cutoff_date:
            day_key = txn_date.strftime("%Y-%m-%d")
            txn_total = sum(item["price"] for item in txn["items"])
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

def calculate_atv(transactions: List[Dict], days: int = 30) -> Dict[str, Any]:
    """Calculate Average Transaction Value."""
    cutoff_date = datetime.now() - timedelta(days=days)
    daily_atv = defaultdict(lambda: {"total": 0, "count": 0})
    
    for txn in transactions:
        txn_date = datetime.fromisoformat(txn["timestamp"])
        if txn_date >= cutoff_date:
            day_key = txn_date.strftime("%Y-%m-%d")
            txn_total = sum(item["price"] for item in txn["items"])
            daily_atv[day_key]["total"] += txn_total
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

def calculate_customer_metrics(transactions: List[Dict], days: int = 30) -> Dict[str, Any]:
    """Calculate new vs returning customers."""
    cutoff_date = datetime.now() - timedelta(days=days)
    customer_first_seen = {}
    daily_customers = defaultdict(lambda: {"new": 0, "returning": 0})
    
    # First pass: find first transaction for each customer
    for txn in sorted(transactions, key=lambda x: x["timestamp"]):
        customer_id = txn["customer_id"]
        txn_date = datetime.fromisoformat(txn["timestamp"])
        
        if customer_id not in customer_first_seen:
            customer_first_seen[customer_id] = txn_date
    
    # Second pass: categorize transactions
    for txn in transactions:
        txn_date = datetime.fromisoformat(txn["timestamp"])
        if txn_date >= cutoff_date:
            day_key = txn_date.strftime("%Y-%m-%d")
            customer_id = txn["customer_id"]
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
    # Analyze busiest time slots (by day of week and hour)
    day_hour_counts = defaultdict(int)
    item_pairs = defaultdict(int)
    day_counts = defaultdict(int)
    new_customers_by_day = defaultdict(int)
    customer_first_seen = {}
    
    for txn in transactions:
        txn_date = datetime.fromisoformat(txn["timestamp"])
        day_name = txn_date.strftime("%A")
        hour = txn_date.hour
        
        day_hour_counts[(day_name, hour)] += 1
        day_counts[day_name] += 1
        
        # Track new customers by day of week
        customer_id = txn["customer_id"]
        if customer_id not in customer_first_seen:
            customer_first_seen[customer_id] = txn_date
            first_day = txn_date.strftime("%A")
            new_customers_by_day[first_day] += 1
        
        # Analyze item pairs
        items = [item["name"] for item in txn["items"]]
        if len(items) > 1:
            for i, item1 in enumerate(items):
                for item2 in items[i+1:]:
                    pair = tuple(sorted([item1, item2]))
                    item_pairs[pair] += 1
    
    insights = []
    
    # Busiest time slot
    if day_hour_counts:
        busiest_time = max(day_hour_counts.items(), key=lambda x: x[1])
        day, hour = busiest_time[0]
        hour_range = f"{hour}:00 - {hour+1}:00"
        insights.append(f"Your busiest time slot is {day}s from {hour_range}")
    
    # Item correlation
    if item_pairs:
        top_pair = max(item_pairs.items(), key=lambda x: x[1])
        item1, item2 = top_pair[0]
        count = top_pair[1]
        # Calculate correlation percentage (simplified)
        insights.append(f"Customers who purchase '{item1}' often also buy '{item2}' (appears in {count} transactions together)")
    
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
        txn_date = datetime.fromisoformat(txn["timestamp"])
        hour = txn_date.hour
        txn_total = sum(item["price"] for item in txn["items"])
        total_revenue += txn_total
        
        if 14 <= hour <= 17:  # 2 PM to 5 PM
            afternoon_revenue += txn_total
    
    prescriptions = []
    
    # Afternoon sales recommendation
    afternoon_percentage = (afternoon_revenue / total_revenue * 100) if total_revenue > 0 else 0
    if afternoon_percentage < 20:
        prescriptions.append({
            "type": "ACTION",
            "text": "Offer a 'Happy Hour' discount on pastries from 3 PM to 5 PM on weekdays to increase afternoon sales"
        })
    
    # Bundle recommendation
    prescriptions.append({
        "type": "SUGGESTION",
        "text": "Create a 'Coffee & Pastry' bundle to increase the Average Transaction Value by $1.50-$2.00"
    })
    
    # Top seller marketing
    prescriptions.append({
        "type": "OPPORTUNITY",
        "text": "Your 'Cold Brew' is a top seller. Consider marketing it on social media to attract new customers"
    })
    
    return prescriptions

def get_top_selling_item(transactions: List[Dict]) -> str:
    """Find the top selling item."""
    item_counts = Counter()
    
    for txn in transactions:
        for item in txn["items"]:
            item_counts[item["name"]] += 1
    
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

def calculate_foot_traffic(days: int = 30) -> Dict[str, Any]:
    """Calculate foot traffic metrics from LiDAR sensor data."""
    cutoff_date = datetime.now() - timedelta(days=days)
    daily_traffic = defaultdict(int)
    
    # Count entries from sensor data
    for entry in sensor_data["entries"]:
        entry_date = datetime.fromisoformat(entry["timestamp"])
        if entry_date >= cutoff_date:
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

def calculate_conversion_rate(transactions: List[Dict], days: int = 30) -> Dict[str, Any]:
    """Calculate conversion rate (transactions / foot traffic from sensor)."""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # Get daily transaction counts
    daily_transactions = defaultdict(int)
    for txn in transactions:
        txn_date = datetime.fromisoformat(txn["timestamp"])
        if txn_date >= cutoff_date:
            day_key = txn_date.strftime("%Y-%m-%d")
            daily_transactions[day_key] += 1
    
    # Get daily foot traffic from sensor
    daily_traffic = defaultdict(int)
    for entry in sensor_data["entries"]:
        entry_date = datetime.fromisoformat(entry["timestamp"])
        if entry_date >= cutoff_date:
            day_key = entry_date.strftime("%Y-%m-%d")
            daily_traffic[day_key] += 1
    
    # Calculate daily conversion rates
    trend_data = []
    total_transactions = 0
    total_traffic = 0
    
    all_dates = sorted(set(list(daily_transactions.keys()) + list(daily_traffic.keys())))
    
    for date in all_dates:
        transactions_count = daily_transactions.get(date, 0)
        traffic_count = daily_traffic.get(date, 0)
        
        conversion = (transactions_count / traffic_count * 100) if traffic_count > 0 else 0
        trend_data.append({"date": date, "value": round(conversion, 1)})
        
        total_transactions += transactions_count
        total_traffic += traffic_count
    
    overall_conversion = (total_transactions / total_traffic * 100) if total_traffic > 0 else 0
    
    return {
        "rate": round(overall_conversion, 1),
        "trend": trend_data,
        "transactions": total_transactions,
        "foot_traffic": total_traffic
    }

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
    
    revenue_data = calculate_revenue(transactions)
    atv_data = calculate_atv(transactions)
    customer_data = calculate_customer_metrics(transactions)
    foot_traffic_data = calculate_foot_traffic()  # No transactions parameter
    conversion_data = calculate_conversion_rate(transactions)
    
    return {
        "revenue": revenue_data,
        "atv": atv_data,
        "customers": customer_data,
        "foot_traffic": foot_traffic_data,
        "conversion_rate": conversion_data,
        "top_selling_item": get_top_selling_item(transactions),
        "retention_rate": calculate_retention_rate(transactions),
        "busiest_day": get_busiest_day(transactions)
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
    """Handle chatbot queries using simple pattern matching."""
    query = message.message.lower()
    transactions = mock_data["transactions"]
    
    # Pattern matching for common queries
    if "best selling" in query or "top selling" in query or "most popular" in query:
        item = get_top_selling_item(transactions)
        # Count how many were sold
        count = sum(1 for txn in transactions for i in txn["items"] if i["name"] == item)
        return ChatResponse(response=f"Your best-selling product is '{item}' with {count} units sold in the last 30 days.")
    
    elif "revenue" in query and ("change" in query or "compare" in query or "last month" in query):
        return ChatResponse(response="Your revenue increased by 8% compared to the previous month. Keep up the great work!")
    
    elif "marketing" in query or "suggest" in query or "idea" in query:
        return ChatResponse(response="Based on your data, I recommend implementing a loyalty program for returning customers. Your retention rate is strong at 45%, and a rewards system could boost it to 55-60%. Would you like specific details on setting this up?")
    
    elif "retention" in query or "customer retention" in query:
        rate = calculate_retention_rate(transactions)
        return ChatResponse(response=f"Your customer retention rate is {rate}%. This is above the industry average for small cafes!")
    
    elif "busiest" in query or "busy" in query:
        day = get_busiest_day(transactions)
        return ChatResponse(response=f"Your busiest day is {day}. Consider scheduling more staff and stocking up on popular items for {day}s.")
    
    elif "revenue" in query or "sales" in query or "total" in query:
        revenue_data = calculate_revenue(transactions)
        return ChatResponse(response=f"Your total revenue for the last 30 days is ${revenue_data['total']:,.2f}, with an average daily revenue of ${revenue_data['average_daily']:,.2f}.")
    
    elif "atv" in query or "average transaction" in query or "transaction value" in query:
        atv_data = calculate_atv(transactions)
        return ChatResponse(response=f"Your Average Transaction Value (ATV) is ${atv_data['value']:.2f}. To increase this, consider bundling products or suggesting add-ons at checkout.")
    
    elif "customer" in query and "new" in query:
        customer_data = calculate_customer_metrics(transactions)
        return ChatResponse(response=f"In the last 30 days, you had {customer_data['new']} new customers and {customer_data['returning']} returning customers.")
    
    elif "foot traffic" in query or "visitors" in query or "people visiting" in query:
        traffic_data = calculate_foot_traffic()
        return ChatResponse(response=f"Your foot traffic for the last 30 days is {traffic_data['total']:,} visitors (tracked by LiDAR sensor), with an average of {traffic_data['average_daily']:.0f} visitors per day.")
    
    elif "conversion" in query or "conversion rate" in query:
        conversion_data = calculate_conversion_rate(transactions)
        return ChatResponse(response=f"Your conversion rate is {conversion_data['rate']}%, meaning {conversion_data['rate']}% of visitors make a purchase. This is calculated from {conversion_data['transactions']} transactions out of {conversion_data['foot_traffic']} estimated visitors.")
    
    elif "hello" in query or "hi" in query or "hey" in query:
        return ChatResponse(response="Hello! I'm your AI business consultant. I can help you understand your sales data, identify trends, and provide recommendations. Try asking me about your revenue, best-selling items, or for marketing suggestions!")
    
    elif "help" in query:
        return ChatResponse(response="I can answer questions about:\n• Your revenue and sales trends\n• Best-selling products\n• Customer retention\n• Average transaction value\n• Marketing suggestions\n• Busiest days and times\n\nJust ask me a question in natural language!")
    
    else:
        return ChatResponse(response="I'm not sure I understand that question. Try asking me about your revenue, best-selling products, customer retention, or marketing ideas. You can also type 'help' to see what I can do!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
