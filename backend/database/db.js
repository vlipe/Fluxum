const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rfid.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS containers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      containerId TEXT,
      location TEXT,
      status TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;