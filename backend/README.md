# EcoRide Bangalore - Backend

Node.js + Express backend for the EcoRide system.

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Initialize Database:
    ```bash
    node init_db.js
    ```
3.  Seed Data:
    ```bash
    node seed_data.js
    ```

## Run

Start the server:
```bash
node server.js
```
Server runs on `http://localhost:3000`.

## API Endpoints

-   `GET /api/locations`: List all Bangalore hotspots.
-   `POST /api/updateSensor`: Update sensor data (AQI, Vehicle Count).
    -   Body: `{ "locationId": 1, "aqi": 120, "vehicle_count": 15 }`
-   `GET /api/sensor?locationId=1`: Get sensor history.
-   `GET /api/getRoute?srcLat=...&dstLat=...`: Get route options with EcoScore.
-   `POST /api/createRideOffer`: Create a carpool offer.
-   `GET /api/community`: Find ride offers.
