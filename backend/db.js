const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite (creates file if missing)
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.serialize(() => {
  // Users table
  // Transactions table
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id TEXT,
    seller_id TEXT,
    gift_id INTEGER,
    amount REAL,
    commission REAL,
    type TEXT, -- 'buy', 'sell'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(buyer_id) REFERENCES users(telegram_id),
    FOREIGN KEY(seller_id) REFERENCES users(telegram_id),
    FOREIGN KEY(gift_id) REFERENCES gifts(id)
  )`);
});

// Seed data is removed/simplified to avoid cluttering with non-NFT items automatically
// or we can keep some legacy seed items for visual testing.
/*
const seed = () => {
   // Legacy seed...
}
// setTimeout(seed, 1000);
*/

module.exports = db;
