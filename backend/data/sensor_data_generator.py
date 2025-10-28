"""
Script to generate realistic LiDAR sensor mock data for foot traffic analytics.
This simulates data from a LiDAR sensor tracking people entering the store.
Data is always generated for the last 30 days from today.
"""
import json
import random
from datetime import datetime, timedelta

# Dynamic date calculation - always last 30 days
END_DATE = datetime.now().replace(hour=23, minute=59, second=59, microsecond=0)
START_DATE = (END_DATE - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
NUM_DAYS = 30

# Foot traffic patterns (realistic for a cafe)
# Peak hours: 7-9 AM (morning rush), 12-2 PM (lunch), 3-4 PM (afternoon break)
HOURLY_PATTERNS = {
    6: 5,   # Early morning
    7: 25,  # Morning rush start
    8: 40,  # Peak morning
    9: 30,  # Morning taper
    10: 15, # Mid-morning
    11: 20, # Pre-lunch
    12: 35, # Lunch rush
    13: 30, # Lunch continuation
    14: 20, # Post-lunch
    15: 25, # Afternoon break
    16: 20, # Late afternoon
    17: 15, # Early evening
    18: 10, # Evening
    19: 5,  # Late evening
}

# Day of week multipliers (weekends are busier)
DAY_MULTIPLIERS = {
    0: 1.0,   # Monday
    1: 1.05,  # Tuesday
    2: 1.1,   # Wednesday
    3: 1.15,  # Thursday
    4: 1.2,   # Friday
    5: 1.35,  # Saturday (busiest)
    6: 1.25,  # Sunday
}

def generate_sensor_data():
    """Generate realistic foot traffic data from LiDAR sensor."""
    sensor_readings = []
    entry_id = 1
    
    current_date = START_DATE
    while current_date <= END_DATE:
        day_of_week = current_date.weekday()
        day_multiplier = DAY_MULTIPLIERS[day_of_week]
        
        # Generate hourly foot traffic for this day
        for hour, base_count in HOURLY_PATTERNS.items():
            # Apply day multiplier and add randomness
            expected_count = int(base_count * day_multiplier)
            actual_count = random.randint(
                int(expected_count * 0.7),
                int(expected_count * 1.3)
            )
            
            # Generate individual entries throughout the hour
            for _ in range(actual_count):
                # Random minute within the hour
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                
                entry_time = current_date.replace(
                    hour=hour,
                    minute=minute,
                    second=second
                )
                
                sensor_readings.append({
                    "entry_id": f"ENTRY{entry_id:05d}",
                    "timestamp": entry_time.isoformat(),
                    "sensor_id": "LIDAR_001",
                    "direction": "in"  # Could be "in" or "out" for more sophisticated tracking
                })
                
                entry_id += 1
        
        current_date += timedelta(days=1)
    
    # Calculate daily summaries
    daily_summary = {}
    for reading in sensor_readings:
        date_key = reading["timestamp"][:10]  # YYYY-MM-DD
        if date_key not in daily_summary:
            daily_summary[date_key] = 0
        daily_summary[date_key] += 1
    
    # Create the data structure
    sensor_data = {
        "sensor_info": {
            "sensor_id": "LIDAR_001",
            "sensor_type": "LiDAR People Counter",
            "location": "Main Entrance",
            "installation_date": "2025-09-01",
            "accuracy_rate": 0.98
        },
        "date_range": {
            "start_date": START_DATE.strftime("%Y-%m-%d"),
            "end_date": END_DATE.strftime("%Y-%m-%d"),
            "total_days": NUM_DAYS
        },
        "summary": {
            "total_entries": len(sensor_readings),
            "average_daily_traffic": len(sensor_readings) // NUM_DAYS,
            "peak_day": max(daily_summary.items(), key=lambda x: x[1])[0] if daily_summary else None,
            "daily_breakdown": [
                {
                    "date": date,
                    "count": count
                }
                for date, count in sorted(daily_summary.items())
            ]
        },
        "entries": sensor_readings
    }
    
    return sensor_data

def main():
    """Generate and save sensor data."""
    print("Generating LiDAR sensor mock data...")
    sensor_data = generate_sensor_data()
    
    # Save to JSON file
    output_path = "sensor_mock_data.json"
    with open(output_path, "w") as f:
        json.dump(sensor_data, f, indent=2)
    
    print(f"[OK] Generated {sensor_data['summary']['total_entries']:,} sensor readings")
    print(f"[OK] Date range: {sensor_data['date_range']['start_date']} to {sensor_data['date_range']['end_date']}")
    print(f"[OK] Average daily traffic: {sensor_data['summary']['average_daily_traffic']} visitors")
    print(f"[OK] Saved to {output_path}")

if __name__ == "__main__":
    main()
