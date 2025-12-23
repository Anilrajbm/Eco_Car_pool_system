import serial
import requests
import json
import time
import sys

# Configuration
SERIAL_PORT = 'COM6' # Change to your Arduino port (e.g., /dev/ttyUSB0 on Linux)
BAUD_RATE = 9600
BACKEND_URL = 'http://localhost:3000/api/updateSensor'
LOCATION_ID = 9 # Demo Zone ID (from seed_data.js)

def run_gateway():
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"Connected to {SERIAL_PORT}")
    except Exception as e:
        print(f"Error opening serial port: {e}")
        print("Ensure Arduino is connected and port is correct.")
        return

    while True:
        try:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').strip()
                if not line:
                    continue
                
                try:
                    # Parse format: Vehicles:176,Air:692
                    parts = line.split(',')
                    vehicle_part = parts[0].split(':')
                    air_part = parts[1].split(':')
                    
                    vehicle_count = int(vehicle_part[1])
                    aqi = int(air_part[1])

                    payload = {
                        "locationId": LOCATION_ID,
                        "aqi": aqi,
                        "vehicle_count": vehicle_count
                    }
                    
                    response = requests.post(BACKEND_URL, json=payload)
                    print(f"Sent: {payload} | Status: {response.status_code}")
                    
                except (IndexError, ValueError) as e:
                    print(f"Invalid data format received: {line} | Error: {e}")
                except requests.RequestException as e:
                    print(f"Backend error: {e}")
                    
        except KeyboardInterrupt:
            print("Exiting...")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    run_gateway()
