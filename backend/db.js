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
  db.run(`CREATE TABLE IF NOT EXISTS users (
    telegram_id TEXT PRIMARY KEY,
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Gifts table (NFT support)
  db.run(`CREATE TABLE IF NOT EXISTS gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL,
    image_url TEXT,
    nft_address TEXT UNIQUE,
    owner_id TEXT NOT NULL,
    status TEXT DEFAULT 'deposited',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_id) REFERENCES users(telegram_id)
  )`);

  // Transaction Ledger (for history)
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    type TEXT,
    amount REAL,
    related_id TEXT,
    status TEXT DEFAULT 'success',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(telegram_id)
  )`);

  // Platform Revenue Tracking
  db.run(`CREATE TABLE IF NOT EXISTS platform_stats (
    key TEXT PRIMARY KEY,
    value REAL DEFAULT 0
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
