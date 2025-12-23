const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ecoride.db');

const hotspots = [
    { name: "Koramangala", lat: 12.9352, lng: 77.6245 },
    { name: "MG Road", lat: 12.9716, lng: 77.5946 },
    { name: "Whitefield", lat: 12.9698, lng: 77.7500 },
    { name: "Electronic City", lat: 12.8452, lng: 77.6602 },
    { name: "Yelahanka", lat: 13.1007, lng: 77.5963 },
    { name: "Hebbal", lat: 13.0354, lng: 77.5988 },
    { name: "Indiranagar", lat: 12.9784, lng: 77.6408 },
    { name: "Jayanagar", lat: 12.9308, lng: 77.5838 },
    { name: "BMS College Road (Demo Zone)", lat: 12.9410, lng: 77.5655, type: 'demo' },
    { name: "Kengeri", lat: 12.9177, lng: 77.4833 },
    { name: "Banashankari", lat: 12.9255, lng: 77.5468 },
    { name: "Malleshwaram", lat: 13.0031, lng: 77.5643 }
];

db.serialize(() => {
    // Clear existing locations to avoid duplicates on re-run
    db.run("DELETE FROM locations");
    db.run("DELETE FROM sensors");

    const stmt = db.prepare("INSERT INTO locations (name, lat, lng, type) VALUES (?, ?, ?, ?)");

    hotspots.forEach(loc => {
        stmt.run(loc.name, loc.lat, loc.lng, loc.type || 'hotspot');
    });

    stmt.finalize();

    // Seed initial sensor data for hotspots (simulated)
    // Demo zone will be updated by live hardware/simulation script
    db.all("SELECT id, type FROM locations", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }

        const sensorStmt = db.prepare("INSERT INTO sensors (location_id, aqi, vehicle_count) VALUES (?, ?, ?)");

        rows.forEach(row => {
            // Random initial values
            const aqi = Math.floor(Math.random() * (150 - 50) + 50); // 50-150 AQI
            const vehicle_count = Math.floor(Math.random() * (50 - 10) + 10); // 10-50 vehicles
            sensorStmt.run(row.id, aqi, vehicle_count);
        });

        sensorStmt.finalize(() => {
            console.log("Seeded locations and initial sensor data.");
            db.close();
        });
    });
});
