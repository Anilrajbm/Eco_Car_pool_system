const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ecoride.db');

db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user',
    has_car INTEGER DEFAULT 0
  )`);

  // Locations table (Hotspots)
  db.run(`CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    lat REAL,
    lng REAL,
    type TEXT DEFAULT 'hotspot' -- 'hotspot' or 'demo'
  )`);

  // Sensor Data table
  db.run(`CREATE TABLE IF NOT EXISTS sensors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER,
    aqi INTEGER,
    vehicle_count INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(location_id) REFERENCES locations(id)
  )`);

  // Rides table
  db.run(`CREATE TABLE IF NOT EXISTS rides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner TEXT,
    src_id INTEGER,
    dst_id INTEGER,
    capacity INTEGER,
    time TEXT,
    status TEXT DEFAULT 'active',
    FOREIGN KEY(src_id) REFERENCES locations(id),
    FOREIGN KEY(dst_id) REFERENCES locations(id)
  )`);

  // Violations table
  db.run(`CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id TEXT,
    reason TEXT,
    amount INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending'
  )`);

  // Bookings table (Prevent duplicate joins)
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ride_id INTEGER,
    user_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ride_id) REFERENCES rides(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(ride_id, user_id)
  )`);

  // Messages table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ride_id INTEGER,
    user_id INTEGER,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ride_id) REFERENCES rides(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Safety Alerts table
  db.run(`CREATE TABLE IF NOT EXISTS safety_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ride_id INTEGER,
    user_id INTEGER,
    latitude REAL,
    longitude REAL,
    keywords_detected TEXT,
    status TEXT DEFAULT 'triggered',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ride_id) REFERENCES rides(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  console.log("Database initialized with tables: users, locations, sensors, rides, violations, bookings, messages, safety_alerts.");
});

db.close();
