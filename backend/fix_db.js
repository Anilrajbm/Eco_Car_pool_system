const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use absolute path to ensure we hit the right DB
const dbPath = path.resolve(__dirname, 'ecoride.db');
console.log(`Connecting to database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Attempting to create 'messages' table...");

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ride_id INTEGER,
        user_id INTEGER,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(ride_id) REFERENCES rides(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error("Error creating table:", err.message);
        } else {
            console.log("Success: 'messages' table created (or already exists).");
        }
    });

    // Verify it exists
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'", (err, rows) => {
        if (err) {
            console.error("Verification failed:", err);
        } else {
            console.log("Verification result:", rows);
            if (rows.length > 0) {
                console.log("CONFIRMED: Table 'messages' exists.");
            } else {
                console.error("FAILED: Table 'messages' still does not exist.");
            }
        }
    });
});

db.close();
