const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = './ecoride.db';

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database(DB_PATH);

// Initialize Twilio client
const twilio = require('twilio');
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// --- Helper Functions ---
function getEcoScore(distanceKm, trafficLevel, aqi) {
    // Normalize metrics (simplistic logic)
    // Traffic: 0 (low) to 100 (high)
    // AQI: 0 (good) to 500 (hazardous)
    // Distance: km

    const normPollution = Math.min(aqi / 300, 1); // Cap at 300 for normalization
    const normTraffic = Math.min(trafficLevel / 100, 1);

    // Weights: Pollution 0.5, Traffic 0.3, Time/Dist 0.2
    // Lower score is better
    return (normPollution * 0.5) + (normTraffic * 0.3) + (distanceKm * 0.05);
}

// --- Endpoints ---

// 0. Authentication
app.post('/api/register', (req, res) => {
    const { username, password, has_car } = req.body;
    const stmt = db.prepare("INSERT INTO users (username, password, has_car) VALUES (?, ?, ?)");
    stmt.run(username, password, has_car ? 1 : 0, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: "Username already exists" });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "User registered successfully", id: this.lastID });
    });
    stmt.finalize();
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: "Invalid credentials" });

        res.json({
            message: "Login successful",
            user: { id: row.id, username: row.username, has_car: row.has_car, role: row.role }
        });
    });
});

// 1. Locations & Hotspots
app.get('/api/locations', (req, res) => {
    db.all("SELECT * FROM locations", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Sensor Data (Live & History)
app.post('/api/updateSensor', (req, res) => {
    const { locationId, aqi, vehicle_count, timestamp } = req.body;
    // If locationId is not provided, assume Demo Zone (find ID for type='demo')

    const insert = (locId) => {
        const stmt = db.prepare("INSERT INTO sensors (location_id, aqi, vehicle_count, timestamp) VALUES (?, ?, ?, ?)");
        stmt.run(locId, aqi, vehicle_count, timestamp || new Date().toISOString(), function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Check for high emissions (simple threshold)
            if (aqi > 200) {
                // Log a potential violation or alert (simplified)
                console.log(`HIGH EMISSION ALERT at Location ${locId}: AQI ${aqi}`);
            }

            res.json({ message: "Sensor data updated", id: this.lastID });
        });
        stmt.finalize();
    };

    if (!locationId) {
        db.get("SELECT id FROM locations WHERE type = 'demo'", (err, row) => {
            if (err || !row) return res.status(500).json({ error: "Demo zone not found" });
            insert(row.id);
        });
    } else {
        insert(locationId);
    }
});

app.get('/api/sensor', (req, res) => {
    const { locationId } = req.query;
    let query = "SELECT * FROM sensors";
    let params = [];

    if (locationId) {
        query += " WHERE location_id = ? ORDER BY timestamp DESC LIMIT 20";
        params.push(locationId);
    } else {
        query += " ORDER BY timestamp DESC LIMIT 50";
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 3. Rides & Community
app.post('/api/createRideOffer', (req, res) => {
    const { owner, src_id, dst_id, capacity, time } = req.body;
    const stmt = db.prepare("INSERT INTO rides (owner, src_id, dst_id, capacity, time) VALUES (?, ?, ?, ?, ?)");
    stmt.run(owner, src_id, dst_id, capacity, time, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Ride offer created", id: this.lastID });
    });
    stmt.finalize();
});

app.get('/api/community', (req, res) => {
    const { src, dst } = req.query;
    let query = `
    SELECT r.*, l1.name as src_name, l2.name as dst_name 
    FROM rides r
    JOIN locations l1 ON r.src_id = l1.id
    JOIN locations l2 ON r.dst_id = l2.id
    WHERE r.status = 'active' AND r.capacity > 0
  `;
    const params = [];

    if (src) {
        query += " AND r.src_id = ?";
        params.push(src);
    }
    if (dst) {
        query += " AND r.dst_id = ?";
        params.push(dst);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Filter out expired rides (simple HH:MM comparison for today)
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const activeRides = rows.filter(ride => {
            if (!ride.time) return true;
            const [hours, minutes] = ride.time.split(':').map(Number);
            const rideMinutes = hours * 60 + minutes;
            return rideMinutes >= currentMinutes;
        });

        res.json(activeRides);
    });
});

app.post('/api/joinRide', (req, res) => {
    const { rideId, userId } = req.body;

    // 1. Check if already booked
    db.get("SELECT id FROM bookings WHERE ride_id = ? AND user_id = ?", [rideId, userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: "You have already joined this ride" });

        // 2. Check capacity and join
        db.get("SELECT capacity, status FROM rides WHERE id = ?", [rideId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: "Ride not found" });
            if (row.capacity <= 0 || row.status !== 'active') {
                return res.status(400).json({ error: "Ride is full or no longer active" });
            }

            const newCapacity = row.capacity - 1;
            const newStatus = newCapacity === 0 ? 'full' : 'active';

            const stmt = db.prepare("UPDATE rides SET capacity = ?, status = ? WHERE id = ?");
            stmt.run(newCapacity, newStatus, rideId, function (err) {
                if (err) return res.status(500).json({ error: err.message });

                // 3. Record booking
                const bookingStmt = db.prepare("INSERT INTO bookings (ride_id, user_id) VALUES (?, ?)");
                bookingStmt.run(rideId, userId);
                bookingStmt.finalize();

                res.json({ message: "Joined ride successfully", newCapacity, status: newStatus });
            });
            stmt.finalize();
        });
    });
});

// 4. Routes (Google Maps Integration)
app.get('/api/getRoute', async (req, res) => {
    const { srcLat, srcLng, dstLat, dstLng } = req.query;
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        // Fallback to mock if no key
        console.log("Using Mock Routes (No API Key provided)");

        // Define target coordinates for Real-time Data (Kengeri <-> Whitefield)
        const KENGERI = { lat: 12.9177, lng: 77.4833 };
        const WHITEFIELD = { lat: 12.9698, lng: 77.7500 };

        // Helper to check proximity (approx 1km radius)
        const isClose = (lat1, lng1, lat2, lng2) => {
            return Math.abs(lat1 - lat2) < 0.01 && Math.abs(lng1 - lng2) < 0.01;
        };

        // Check if requested route is Kengeri <-> Whitefield
        const isRealTimeRoute = (
            (isClose(srcLat, srcLng, KENGERI.lat, KENGERI.lng) && isClose(dstLat, dstLng, WHITEFIELD.lat, WHITEFIELD.lng)) ||
            (isClose(srcLat, srcLng, WHITEFIELD.lat, WHITEFIELD.lng) && isClose(dstLat, dstLng, KENGERI.lat, KENGERI.lng))
        );

        console.log("Is Real-time Route (Kengeri <-> Whitefield)?", isRealTimeRoute);

        // Fetch latest sensor data for the "Real-time" route (assuming Location ID 9)
        db.get("SELECT * FROM sensors WHERE location_id = 9 ORDER BY timestamp DESC LIMIT 1", (err, row) => {
            let realTimeAQI = 80; // Default fallback
            let realTimeTraffic = 30; // Default fallback

            if (row && isRealTimeRoute) {
                console.log("✅ Using Real-time Sensor Data for Kengeri-Whitefield:", row);
                realTimeAQI = row.aqi;
                realTimeTraffic = row.vehicle_count; // Assuming vehicle count maps roughly to traffic level 0-100
            } else {
                console.log("ℹ️ Using Simulated Data (Not Kengeri-Whitefield route)");
                // Randomize slightly for demo effect if not real-time route
                realTimeAQI = Math.floor(Math.random() * 50) + 50;
                realTimeTraffic = Math.floor(Math.random() * 40) + 20;
            }

            // Parse coordinates
            const srcLatNum = parseFloat(srcLat);
            const srcLngNum = parseFloat(srcLng);
            const dstLatNum = parseFloat(dstLat);
            const dstLngNum = parseFloat(dstLng);

            // Generate 3 different routes dynamically
            const mockRoutes = [
                {
                    id: 1,
                    summary: "Fastest Route (Main Road)",
                    distance: "12 km",
                    duration: "35 mins",
                    traffic_level: 80, // High traffic
                    aqi_avg: 150,      // High pollution
                    eco_score: getEcoScore(12, 80, 150),
                    is_recommended: false,
                    path: [
                        { lat: srcLatNum, lng: srcLngNum },
                        { lat: srcLatNum + (dstLatNum - srcLatNum) * 0.3, lng: srcLngNum + (dstLngNum - srcLngNum) * 0.2 },
                        { lat: srcLatNum + (dstLatNum - srcLatNum) * 0.6, lng: srcLngNum + (dstLngNum - srcLngNum) * 0.5 },
                        { lat: srcLatNum + (dstLatNum - srcLatNum) * 0.8, lng: srcLngNum + (dstLngNum - srcLngNum) * 0.8 },
                        { lat: dstLatNum, lng: dstLngNum }
                    ]
                },
                {
                    id: 2,
                    summary: "Eco Route (Low Pollution)",
                    distance: "14 km",
                    duration: "40 mins",
                    traffic_level: realTimeTraffic, // FROM HARDWARE
                    aqi_avg: realTimeAQI,           // FROM HARDWARE
                    eco_score: getEcoScore(14, realTimeTraffic, realTimeAQI),
                    is_recommended: false,
                    path: [
                        { lat: srcLatNum, lng: srcLngNum },
                        { lat: srcLatNum + (dstLatNum - srcLatNum) * 0.25, lng: srcLngNum + (dstLngNum - srcLngNum) * 0.4 },
                        { lat: srcLatNum + (dstLatNum - srcLatNum) * 0.5, lng: srcLngNum + (dstLngNum - srcLngNum) * 0.7 },
                        { lat: srcLatNum + (dstLatNum - srcLatNum) * 0.75, lng: srcLngNum + (dstLngNum - srcLngNum) * 0.9 },
                        { lat: dstLatNum, lng: dstLngNum }
                    ]
                },
                {
                    id: 3,
                    summary: "Scenic Route (Less Traffic)",
                    distance: "15 km",
                    duration: "42 mins",
                    traffic_level: 40, // Low traffic
                    aqi_avg: 90,       // Medium pollution
                    eco_score: getEcoScore(15, 40, 90),
                    is_recommended: false,
                    path: [
                        { lat: srcLatNum, lng: srcLngNum },
                        { lat: srcLatNum + (dstLatNum - srcLatNum) * 0.2, lng: srcLngNum + (dstLngNum - srcLngNum) * 0.6 },
                        { lat: srcLatNum + (dstLatNum - srcLatNum) * 0.5, lng: srcLngNum + (dstLngNum - srcLngNum) * 0.3 },
                        { lat: srcLatNum + (dstLatNum - srcLatNum) * 0.8, lng: srcLngNum + (dstLngNum - srcLngNum) * 0.6 },
                        { lat: dstLatNum, lng: dstLngNum }
                    ]
                }
            ];

            // Recalculate recommendation based on score
            mockRoutes.sort((a, b) => a.eco_score - b.eco_score);
            mockRoutes[0].is_recommended = true;
            // Ensure others are false
            for (let i = 1; i < mockRoutes.length; i++) mockRoutes[i].is_recommended = false;

            return res.json(mockRoutes);
        });
        return; // Ensure we don't fall through
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${srcLat},${srcLng}&destination=${dstLat},${dstLng}&alternatives=true&key=${API_KEY}`;
        const response = await axios.get(url);

        if (response.data.status !== 'OK') {
            throw new Error(response.data.error_message || 'Google Maps API Error');
        }

        const routes = response.data.routes.map((route, index) => {
            const leg = route.legs[0];
            const distanceKm = leg.distance.value / 1000;

            // Simulate AQI and Traffic
            const simulatedAQI = Math.floor(Math.random() * 100) + 50 + (index * 20);
            const trafficFactor = (leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value) / leg.duration.value * 100;

            // Extract path from route steps
            const path = [];
            leg.steps.forEach(step => {
                path.push(step.start_location);
            });
            // Add the final destination
            path.push(leg.end_location);

            return {
                id: index,
                summary: route.summary,
                distance: leg.distance.text,
                duration: leg.duration.text,
                traffic_level: trafficFactor || 50,
                aqi_avg: simulatedAQI,
                eco_score: getEcoScore(distanceKm, trafficFactor || 50, simulatedAQI),
                is_recommended: false, // Initialize to false, will calculate after sort
                path: path
            };
        });

        routes.sort((a, b) => a.eco_score - b.eco_score);
        if (routes.length > 0) routes[0].is_recommended = true;

        res.json(routes);

    } catch (error) {
        console.error("Route Error:", error.message);
        res.status(500).json({ error: "Failed to fetch routes" });
    }
});

app.post('/api/reportFine', (req, res) => {
    const { vehicleId, amount, reason } = req.body;
    const stmt = db.prepare("INSERT INTO violations (vehicle_id, amount, reason) VALUES (?, ?, ?)");
    stmt.run(vehicleId, amount, reason, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Fine reported", id: this.lastID });
    });
    stmt.finalize();
});

// 6. Chat Messenger
app.post('/api/messages', (req, res) => {
    const { rideId, userId, content } = req.body;
    const stmt = db.prepare("INSERT INTO messages (ride_id, user_id, content) VALUES (?, ?, ?)");
    stmt.run(rideId, userId, content, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Message sent", id: this.lastID });
    });
    stmt.finalize();
});

app.get('/api/messages', (req, res) => {
    const { rideId } = req.query;
    db.all(`
        SELECT m.*, u.username 
        FROM messages m 
        JOIN users u ON m.user_id = u.id 
        WHERE m.ride_id = ? 
        ORDER BY m.timestamp ASC
    `, [rideId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 7. ML Integration (Emission Analysis)


// 7. Emission Test (Progressive Fines)
app.post('/api/checkEmission', (req, res) => {
    const { vehicleNo } = req.body;
    // Default/Dummy Data
    const ownerName = "Anil raj B M";
    const phone = "9113699158";

    // Simulate AQI fluctuation (mostly high for demo purposes)
    // 70% chance of being > 80
    const isHigh = Math.random() > 0.3;
    const aqi = isHigh ? Math.floor(Math.random() * 100) + 81 : Math.floor(Math.random() * 50) + 30;

    if (aqi <= 80) {
        return res.json({
            status: "Pass",
            aqi,
            message: "Emission levels are within normal limits.",
            owner: ownerName,
            vehicle: vehicleNo
        });
    }

    // If High Emission (> 80), check previous violations
    db.all("SELECT * FROM violations WHERE vehicle_id = ?", [vehicleNo], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const violationCount = rows.length;
        let fineAmount = 0;
        let action = "Warning";
        let isBlocked = false;

        // Progressive Logic
        // 0 prev -> Warning
        // 1 prev -> 200
        // 2 prev -> 500
        // 3 prev -> 1000
        // 4 prev -> 2000
        // 5+ prev -> Block

        if (violationCount === 0) {
            action = "Warning";
            fineAmount = 0;
        } else if (violationCount === 1) {
            action = "Fine";
            fineAmount = 200;
        } else if (violationCount === 2) {
            action = "Fine";
            fineAmount = 500;
        } else if (violationCount === 3) {
            action = "Fine";
            fineAmount = 1000;
        } else if (violationCount === 4) {
            action = "Fine";
            fineAmount = 2000;
        } else {
            action = "Blocked";
            isBlocked = true;
        }

        // Record the new violation
        const stmt = db.prepare("INSERT INTO violations (vehicle_id, amount, reason, status) VALUES (?, ?, ?, ?)");
        stmt.run(vehicleNo, fineAmount, `High Emission (AQI: ${aqi})`, isBlocked ? 'blocked' : 'pending', function (err) {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                status: "Fail",
                aqi,
                action,
                fineAmount,
                isBlocked,
                violationCount: violationCount + 1,
                owner: ownerName,
                phone: phone,
                message: isBlocked
                    ? `Vehicle Registration BLOCKED due to repeated violations.`
                    : `High Emission detected! Action: ${action} ${fineAmount > 0 ? '₹' + fineAmount : ''}`
            });
        });
        stmt.finalize();
    });
});

// 8. Safety Alert System
app.post('/api/triggerSOS', async (req, res) => {
    const { rideId, userId, latitude, longitude, keywordsDetected } = req.body;

    // Record the SOS alert
    const stmt = db.prepare("INSERT INTO safety_alerts (ride_id, user_id, latitude, longitude, keywords_detected) VALUES (?, ?, ?, ?, ?)");
    stmt.run(rideId, userId, latitude, longitude, keywordsDetected, function (err) {
        if (err) {
            console.error("Error recording SOS alert:", err);
            return res.status(500).json({ error: err.message });
        }

        const alertId = this.lastID;
        console.log(`🚨 SOS ALERT TRIGGERED - Alert ID: ${alertId}`);
        console.log(`   Ride: ${rideId}, User: ${userId}`);
        console.log(`   Location: ${latitude}, ${longitude}`);
        console.log(`   Keywords: ${keywordsDetected}`);

        // Get user and ride details
        db.get("SELECT username FROM users WHERE id = ?", [userId], (err, user) => {
            if (err || !user) {
                console.error("Error fetching user:", err);
                return res.json({
                    message: "SOS alert recorded",
                    alertId,
                    notification: "failed"
                });
            }

            db.get(`
                SELECT r.*, l1.name as src_name, l2.name as dst_name 
                FROM rides r
                JOIN locations l1 ON r.src_id = l1.id
                JOIN locations l2 ON r.dst_id = l2.id
                WHERE r.id = ?
            `, [rideId], async (err, ride) => {
                if (err || !ride) {
                    console.error("Error fetching ride:", err);
                }

                // Prepare emergency message
                const emergencyMessage = `🚨 EMERGENCY ALERT 🚨\nUser: ${user.username}\nRide: ${ride ? `${ride.src_name} → ${ride.dst_name}` : rideId}\nLocation: https://maps.google.com/?q=${latitude},${longitude}\nKeywords: ${keywordsDetected}\nTime: ${new Date().toLocaleString()}`;

                console.log("\n" + "=".repeat(60));
                console.log(emergencyMessage);
                console.log("=".repeat(60) + "\n");

                // Send SMS via Twilio
                let smsStatus = "logged";
                if (twilioClient && process.env.TWILIO_PHONE_NUMBER && process.env.EMERGENCY_CONTACT) {
                    try {
                        await twilioClient.messages.create({
                            body: emergencyMessage,
                            from: process.env.TWILIO_PHONE_NUMBER,
                            to: process.env.EMERGENCY_CONTACT
                        });
                        console.log("✅ SMS sent to", process.env.EMERGENCY_CONTACT);
                        smsStatus = "sent";
                    } catch (smsError) {
                        console.error("❌ SMS failed:", smsError.message);
                        smsStatus = "failed";
                    }
                } else {
                    console.log("⚠️ Twilio not configured - SMS not sent");
                    console.log("   Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and EMERGENCY_CONTACT in .env");
                }

                res.json({
                    message: "SOS alert triggered successfully",
                    alertId,
                    location: `https://maps.google.com/?q=${latitude},${longitude}`,
                    notification: smsStatus
                });
            });
        });
    });
    stmt.finalize();
});

app.get('/api/safetyAlerts', (req, res) => {
    const { rideId, userId } = req.query;
    let query = `
        SELECT sa.*, u.username, r.owner
        FROM safety_alerts sa
        JOIN users u ON sa.user_id = u.id
        LEFT JOIN rides r ON sa.ride_id = r.id
        WHERE 1=1
    `;
    const params = [];

    if (rideId) {
        query += " AND sa.ride_id = ?";
        params.push(rideId);
    }
    if (userId) {
        query += " AND sa.user_id = ?";
        params.push(userId);
    }

    query += " ORDER BY sa.timestamp DESC LIMIT 50";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// Start Server
app.listen(PORT, () => {
    console.log(`EcoRide Backend running on http://localhost:${PORT}`);
});
