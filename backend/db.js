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

  // Gifts table (Updated for NFT support)
  db.run(`CREATE TABLE IF NOT EXISTS gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL, -- Can be NULL if deposited but not listed for sale
    image_url TEXT,
    nft_address TEXT UNIQUE, -- The On-Chain Address of the NFT Item (Telegram Gift)
    owner_id TEXT NOT NULL,
    status TEXT DEFAULT 'deposited', -- 'deposited' (in bot inv), 'listed' (on market), 'sold', 'withdrawn'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_id) REFERENCES users(telegram_id)
  )`);

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
