# EcoRide Bangalore - Hardware & IoT

This folder contains the code for the IoT Sensor Node and the Gateway.

## Components

1.  **Arduino Sketch (`sensor_node.ino`)**: Runs on Arduino UNO or ESP32. Reads MQ-135 (AQI) and HC-SR04 (Traffic) sensors.
2.  **Gateway Script (`gateway.py`)**: Reads data from Arduino via Serial (USB) and POSTs it to the backend.
3.  **Simulation Script (`simulate_sensors.py`)**: Generates dummy data for testing without hardware.

## Setup & Run

### Option A: Real Hardware
1.  Upload `sensor_node.ino` to your Arduino.
2.  Connect Arduino to USB.
3.  Update `SERIAL_PORT` in `gateway.py`.
4.  Run Gateway:
    ```bash
    python gateway.py
    ```

### Option B: Simulation (No Hardware)
1.  Run the simulation script:
    ```bash
    python simulate_sensors.py
    ```

## Power Design (Solar Node)

For a standalone renewable-powered node:

**Bill of Materials:**
-   **Solar Panel**: 5V, 5W (approx. 15x15cm)
-   **Battery**: Li-Ion 18650 Cell (3.7V, 2600mAh) x 2 in parallel (5200mAh total)
-   **Charge Controller**: TP4056 Module (with protection)
-   **Boost Converter**: MT3608 (Step up 3.7V to 5V for Arduino)
-   **Microcontroller**: ESP32 (Low power deep-sleep capable)

**Configuration:**
1.  Solar Panel -> TP4056 Input
2.  Battery -> TP4056 Battery Terminals
3.  TP4056 Output -> MT3608 Input
4.  MT3608 Output (5V) -> ESP32 5V Pin

**Energy Calc:**
-   Avg Consumption: ~100mA (Active), ~10uA (Deep Sleep)
-   Duty Cycle: Wake up every 5 mins, measure for 5s, sleep.
-   Daily Consumption: Negligible (< 50mAh/day).
-   Battery Life: > 30 days without sun.
