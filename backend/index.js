require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Telegraf, Markup } = require('telegraf');
const db = require('./db');
const tonService = require('./services/tonService');

const app = express();
const PORT = 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

app.use(cors());
app.use(bodyParser.json());

// --- Bot Logic ---
const bot = new Telegraf(BOT_TOKEN);
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://example.com';

bot.start((ctx) => {
    ctx.reply(
        "مرحباً بك في متجر إسراء للهدايا! 🎁✨\nاضغط على الزر بالأسفل لفتح المتجر:",
        Markup.keyboard([
            Markup.button.webApp("🛍️ فتح المتجر", WEB_APP_URL)
        ]).resize()
    );
});

bot.launch()
    .then(() => console.log('Bot started!'))
    .catch(err => console.error('Bot launch failed:', err));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


// Initialize TON Service
tonService.init();

// --- Polling for Deposits (Mainnet) ---
async function pollDeposits() {
    try {
        const transactions = await tonService.getTransactions(20);

        for (const tx of transactions) {
            if (tx.inMessage && tx.inMessage.info.type === 'internal') {
                const amount = Number(tx.inMessage.info.value.coins) / 1e9;

                // Try to parse comment (Memo)
                let memo = '';
                try {
                    if (tx.inMessage.body) {
                        let slice = tx.inMessage.body.beginParse();
                        if (slice.remainingBits >= 32) {
                            const op = slice.loadUint(32);
                            if (op === 0) { // Text comment opcode
                                memo = slice.loadStringTail();
                            }
                        }
                    }
                } catch (e) { /* ignore parse error */ }

                // Check if it's a User Deposit
                if (amount > 0 && memo.startsWith('user_')) {
                    const userId = memo.split('user_')[1].trim();
                    console.log(`REAL DEPOSIT DETECTED: ${amount} TON for ${userId}`);

                    // Naive Balance Update (In prod, use transactions table to prevent doubles)
                    db.run("UPDATE users SET balance = balance + ? WHERE telegram_id = ?", [amount, userId], (err) => {
                        if (!err) console.log(`Credited ${amount} to ${userId}`);
                    });
                }
            }
        }
    } catch (err) {
        console.error("Polling error:", err.message);
    }
    setTimeout(pollDeposits, 15000);
}
pollDeposits();


// --- API Routes ---

app.get('/api/gifts', (req, res) => {
    db.all("SELECT * FROM gifts WHERE status = 'listed'", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ data: rows });
    });
});

app.get('/api/deposit-address', (req, res) => {
    if (tonService.wallet) {
        res.json({ address: tonService.wallet.address.toString() });
    } else {
        res.status(503).json({ error: "Initializing..." });
    }
});

app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    db.run("INSERT OR IGNORE INTO users (telegram_id) VALUES (?)", [userId], (err) => {
        if (err) console.error(err);
        db.get("SELECT * FROM users WHERE telegram_id = ?", [userId], (err, user) => {
            if (err) return res.status(400).json({ error: err.message });
            db.all("SELECT * FROM gifts WHERE owner_id = ?", [userId], (err, gifts) => {
                if (err) return res.status(400).json({ error: err.message });
                res.json({ user, gifts });
            });
        });
    });
});

app.post('/api/list-item', (req, res) => {
    const { userId, giftId, price } = req.body;
    db.run("UPDATE gifts SET status = 'listed', price = ? WHERE id = ? AND owner_id = ?", [price, giftId, userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/buy', (req, res) => {
    const { buyerId, giftId } = req.body;
    db.get("SELECT * FROM gifts WHERE id = ?", [giftId], (err, gift) => {
        if (err || !gift) return res.status(404).json({ error: "Gift not found" });
        if (gift.status !== 'listed') return res.status(400).json({ error: "Gift not for sale" });
        if (gift.owner_id === buyerId) return res.status(400).json({ error: "Cannot buy your own gift" });

        db.get("SELECT * FROM users WHERE telegram_id = ?", [buyerId], (err, buyer) => {
            if (err || !buyer) return res.status(400).json({ error: "Buyer not found" });
            if (buyer.balance < gift.price) return res.status(400).json({ error: "Insufficient balance" });

            const price = gift.price;
            const commission = price * 0.03;
            const sellerReceive = price - commission;

            db.serialize(() => {
                db.run("BEGIN TRANSACTION");
                db.run("UPDATE users SET balance = balance - ? WHERE telegram_id = ?", [price, buyerId]);
                db.run("UPDATE users SET balance = balance + ? WHERE telegram_id = ?", [sellerReceive, gift.owner_id]);
                db.run("UPDATE gifts SET owner_id = ?, status = 'deposited', price = NULL WHERE id = ?", [buyerId, giftId]);
                db.run("COMMIT", (err) => {
                    if (err) res.status(500).json({ error: "Transaction failed" });
                    else res.json({ success: true });
                });
            });
        });
    });
});

app.post('/api/withdraw', async (req, res) => {
    const { userId, amount, address } = req.body;
    db.get("SELECT balance FROM users WHERE telegram_id = ?", [userId], async (err, row) => {
        if (err || !row) return res.status(400).json({ error: "User not found" });
        if (row.balance < amount) return res.status(400).json({ error: "Insufficient balance" });

        const fee = 0.04;
        const netAmount = amount - fee;
        if (netAmount <= 0) return res.status(400).json({ error: "Amount too small" });

        const txSuccess = await tonService.sendTransfer(address, netAmount.toString(), `Withdrawal info`);
        if (txSuccess) {
            db.run("UPDATE users SET balance = balance - ? WHERE telegram_id = ?", [amount, userId], (err) => {
                res.json({ success: true });
            });
        } else {
            res.status(500).json({ error: "Transfer failed" });
        }
    });
});

const path = require('path');

// ... (API Routes above)

// --- Serve Frontend (Production) ---
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
