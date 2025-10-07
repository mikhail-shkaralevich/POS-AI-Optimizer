"""
Script to generate realistic mock data for the retail dashboard.
Run this to regenerate mock_data.json with larger values.
"""
import json
import random
from datetime import datetime, timedelta

# Configuration
TARGET_REVENUE = 40000
START_DATE = datetime(2025, 9, 10)
END_DATE = datetime(2025, 10, 7)
NUM_DAYS = (END_DATE - START_DATE).days + 1

# Products with realistic pricing
PRODUCTS = {
    "Coffee": [
        {"name": "Espresso", "price": 3.50},
        {"name": "Latte", "price": 4.50},
        {"name": "Cappuccino", "price": 4.75},
        {"name": "Americano", "price": 3.75},
        {"name": "Cold Brew", "price": 5.00},
        {"name": "Iced Latte", "price": 5.25},
        {"name": "Mocha", "price": 5.50},
        {"name": "Macchiato", "price": 4.25},
    ],
    "Pastry": [
        {"name": "Croissant", "price": 4.50},
        {"name": "Muffin", "price": 4.00},
        {"name": "Cookie", "price": 3.00},
        {"name": "Danish", "price": 4.75},
        {"name": "Scone", "price": 4.25},
        {"name": "Brownie", "price": 4.50},
    ],
    "Food": [
        {"name": "Sandwich", "price": 9.50},
        {"name": "Salad", "price": 10.50},
        {"name": "Bagel", "price": 5.50},
        {"name": "Wrap", "price": 9.00},
        {"name": "Panini", "price": 10.00},
    ]
}

# Calculate how many transactions we need
AVERAGE_TRANSACTION = 11.50  # Average basket size
NUM_TRANSACTIONS = int(TARGET_REVENUE / AVERAGE_TRANSACTION)
TRANSACTIONS_PER_DAY = NUM_TRANSACTIONS // NUM_DAYS

# Generate customer pool
NUM_CUSTOMERS = 800
CUSTOMERS = [f"CUST{str(i+1).zfill(4)}" for i in range(NUM_CUSTOMERS)]

# Weight for returning customers (70% returning, 30% new)
RETURNING_CUSTOMER_WEIGHT = 0.7

def generate_transaction_time(date, hour_weights):
    """Generate a realistic transaction time."""
    hour = random.choices(range(7, 19), weights=hour_weights)[0]
    minute = random.randint(0, 59)
    return date.replace(hour=hour, minute=minute, second=0)

def generate_items():
    """Generate items for a transaction."""
    items = []
    
    # Every transaction gets at least one coffee
    items.append(random.choice(PRODUCTS["Coffee"]).copy())
    
    # 60% chance of adding a pastry
    if random.random() < 0.6:
        items.append(random.choice(PRODUCTS["Pastry"]).copy())
    
    # 30% chance of adding food
    if random.random() < 0.3:
        items.append(random.choice(PRODUCTS["Food"]).copy())
    
    # 15% chance of adding another coffee
    if random.random() < 0.15:
        items.append(random.choice(PRODUCTS["Coffee"]).copy())
    
    return items

def generate_mock_data():
    """Generate the complete mock dataset."""
    transactions = []
    transaction_id = 1
    
    # Hour weights (busier during morning rush and lunch)
    hour_weights = [1, 3, 5, 8, 6, 4, 8, 10, 8, 6, 4, 2]  # 7am to 6pm
    
    # Track customer first appearances
    customer_first_seen = {}
    used_customers = set()
    new_customer_index = 0
    
    for day in range(NUM_DAYS):
        current_date = START_DATE + timedelta(days=day)
        
        # Weekend gets 30% more traffic
        day_multiplier = 1.3 if current_date.weekday() in [5, 6] else 1.0
        daily_transactions = int(TRANSACTIONS_PER_DAY * day_multiplier)
        
        for _ in range(daily_transactions):
            # Decide if this is a returning customer or new
            if len(used_customers) > 0 and random.random() < RETURNING_CUSTOMER_WEIGHT:
                customer_id = random.choice(list(used_customers))
            else:
                # New customer
                if new_customer_index < len(CUSTOMERS):
                    customer_id = CUSTOMERS[new_customer_index]
                    used_customers.add(customer_id)
                    customer_first_seen[customer_id] = current_date
                    new_customer_index += 1
                else:
                    customer_id = random.choice(list(used_customers))
            
            # Generate transaction
            timestamp = generate_transaction_time(current_date, hour_weights)
            items = generate_items()
            
            transaction = {
                "transaction_id": f"TXN{str(transaction_id).zfill(5)}",
                "timestamp": timestamp.isoformat(),
                "customer_id": customer_id,
                "items": items
            }
            
            transactions.append(transaction)
            transaction_id += 1
    
    # Sort by timestamp
    transactions.sort(key=lambda x: x["timestamp"])
    
    # Renumber transaction IDs after sorting
    for i, txn in enumerate(transactions, 1):
        txn["transaction_id"] = f"TXN{str(i).zfill(5)}"
    
    return {
        "business_name": "The Daily Grind Cafe",
        "transactions": transactions
    }

if __name__ == "__main__":
    data = generate_mock_data()
    
    # Calculate actual totals
    total_revenue = sum(
        sum(item["price"] for item in txn["items"]) 
        for txn in data["transactions"]
    )
    num_transactions = len(data["transactions"])
    num_customers = len(set(txn["customer_id"] for txn in data["transactions"]))
    
    print(f"Generated {num_transactions} transactions")
    print(f"Total revenue: ${total_revenue:,.2f}")
    print(f"Number of unique customers: {num_customers}")
    print(f"Average transaction value: ${total_revenue/num_transactions:.2f}")
    
    # Write to file
    with open("data/mock_data.json", "w") as f:
        json.dump(data, f, indent=2)
    
    print("\nMock data saved to data/mock_data.json")
