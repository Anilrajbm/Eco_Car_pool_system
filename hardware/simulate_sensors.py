import requests
import time
import random
import json

# Configuration
BACKEND_URL = 'http://localhost:3000/api/updateSensor'
LOCATION_ID = 10 # Demo Zone ID (Changed to 10 to avoid conflict with Hardware at 9)

def simulate():
    print(f"Starting Simulation for Location ID {LOCATION_ID}...")
    print("Press Ctrl+C to stop.")
    
    while True:
        try:
            # Generate dummy data
            # AQI: Random fluctuation around 100-200 (Moderate to Poor)
            aqi = random.randint(80, 220)
            
            # Vehicle Count: Random traffic burst
            vehicle_count = random.randint(0, 15)
            
            payload = {
                "locationId": LOCATION_ID,
                "aqi": aqi,
                "vehicle_count": vehicle_count
            }
            
            response = requests.post(BACKEND_URL, json=payload)
            print(f"Simulated Data Sent: {payload} | Status: {response.status_code}")
            
            time.sleep(5) # Send every 5 seconds
            
        except KeyboardInterrupt:
            print("\nSimulation stopped.")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    simulate()
