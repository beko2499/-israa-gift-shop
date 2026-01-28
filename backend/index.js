require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Telegraf, Markup } = require('telegraf');
const db = require('./db');
const tonService = require('./services/tonService');

const app = express();
const PORT = process.env.PORT || 3000;
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
                // Generate a unique transaction ID (using lt and hash)
                const txHash = `${tx.lt}_${tx.hash().toString('hex')}`;

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

                    // CHECK IF ALREADY PROCESSED (PREVENT DUPLICATES)
                    db.get("SELECT tx_hash FROM processed_txs WHERE tx_hash = ?", [txHash], (err, row) => {
                        if (row) {
                            // Already processed, skip
                            return;
                        }

                        console.log(`NEW DEPOSIT DETECTED: ${amount} TON for ${userId} (tx: ${txHash})`);

                        // Mark as processed FIRST to prevent race conditions
                        db.run("INSERT INTO processed_txs (tx_hash) VALUES (?)", [txHash], (err) => {
                            if (err) {
                                console.error("Failed to mark tx as processed:", err);
                                return; // Don't credit if we can't mark as processed
                            }

                            // Now safely credit the balance
                            db.run("UPDATE users SET balance = balance + ? WHERE telegram_id = ?", [amount, userId], (err) => {
                                if (!err) {
                                    console.log(`Credited ${amount} to ${userId}`);
                                    // Log Deposit
                                    db.run("INSERT INTO transactions (user_id, type, amount, related_id) VALUES (?, 'deposit', ?, ?)", [userId, amount, txHash]);
                                    // Notify User
                                    bot.telegram.sendMessage(userId, `💎 **تم استلام إيداع!**\n\n✅ المبلغ: ${amount} TON\nرصيدك الآن محدث.`).catch(e => { });
                                }
                            });
                        });
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
        // Use bounceable: false (UQ...) to prevent bounces for uninitialized wallets
        res.json({ address: tonService.wallet.address.toString({ bounceable: false }) });
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

// Transaction History Endpoint
app.get('/api/transactions/:id', (req, res) => {
    const userId = req.params.id;
    db.all("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", [userId], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ data: rows || [] });
    });
});

// User Profile Photo Endpoint (via Telegram Bot API)
app.get('/api/user-photo/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        // Get user profile photos from Telegram
        const photos = await bot.telegram.getUserProfilePhotos(userId, 0, 1);

        if (photos.total_count > 0) {
            // Get the file_id of the smallest photo (first in the array)
            const fileId = photos.photos[0][0].file_id;

            // Get the file path
            const file = await bot.telegram.getFile(fileId);

            // Construct the full URL
            const photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;

            res.json({ photo_url: photoUrl });
        } else {
            res.json({ photo_url: null });
        }
    } catch (err) {
        console.error("Error fetching user photo:", err.message);
        res.json({ photo_url: null });
    }
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

                // 1. Money Transfer
                db.run("UPDATE users SET balance = balance - ? WHERE telegram_id = ?", [price, buyerId]);
                db.run("UPDATE users SET balance = balance + ? WHERE telegram_id = ?", [sellerReceive, gift.owner_id]);

                // 2. Transfer Ownership
                db.run("UPDATE gifts SET owner_id = ?, status = 'deposited', price = NULL WHERE id = ?", [buyerId, giftId]);

                // 3. Log Transactions (Ledger)
                db.run("INSERT INTO transactions (user_id, type, amount, related_id) VALUES (?, 'buy', ?, ?)", [buyerId, -price, giftId]);
                db.run("INSERT INTO transactions (user_id, type, amount, related_id) VALUES (?, 'sell', ?, ?)", [gift.owner_id, sellerReceive, giftId]);

                // 4. Track Revenue
                db.run("INSERT INTO platform_stats (key, value) VALUES ('revenue', ?) ON CONFLICT(key) DO UPDATE SET value = value + ?", [commission, commission]);

                db.run("COMMIT", (err) => {
                    if (err) return res.status(500).json({ error: "Transaction failed" });

                    // 5. Professional Notification
                    bot.telegram.sendMessage(gift.owner_id, `✅ **مبروك! تم بيع هديتك!** 🎁\n\n💰 المبلغ المستلم: ${sellerReceive.toFixed(2)} TON\n👤 المشتري: معجب سري\n\nرصيدك الحالي قد زاد! 📈`).catch(e => console.error("Failed to notify seller:", e));

                    res.json({ success: true });
                });
            });
        });
    });
});

app.post('/api/withdraw', async (req, res) => {
    const { userId, amount, address } = req.body;

    // Validate input
    if (!userId || !amount || !address) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const fee = 0.04;
    const netAmount = amount - fee;
    if (netAmount <= 0) return res.status(400).json({ error: "Amount too small" });

    // Use a transaction-like approach: deduct first, then transfer
    db.get("SELECT balance FROM users WHERE telegram_id = ?", [userId], async (err, row) => {
        if (err || !row) return res.status(400).json({ error: "User not found" });
        if (row.balance < amount) return res.status(400).json({ error: "Insufficient balance" });

        // STEP 1: Deduct balance IMMEDIATELY to prevent double-spend
        db.run("UPDATE users SET balance = balance - ? WHERE telegram_id = ?", [amount, userId], async (err) => {
            if (err) return res.status(500).json({ error: "Database error" });

            // STEP 2: Attempt blockchain transfer
            try {
                const txSuccess = await tonService.sendTransfer(address, netAmount.toString(), `Withdrawal`);

                if (txSuccess) {
                    // Log successful withdrawal
                    db.run("INSERT INTO transactions (user_id, type, amount, related_id) VALUES (?, 'withdraw', ?, ?)",
                        [userId, -amount, 'blockchain_transfer']);
                    res.json({ success: true });
                } else {
                    // ROLLBACK: Restore balance if transfer failed
                    db.run("UPDATE users SET balance = balance + ? WHERE telegram_id = ?", [amount, userId]);
                    res.status(500).json({ error: "Transfer failed, balance restored" });
                }
            } catch (txErr) {
                // ROLLBACK on exception
                console.error("Withdrawal error:", txErr);
                db.run("UPDATE users SET balance = balance + ? WHERE telegram_id = ?", [amount, userId]);
                res.status(500).json({ error: "Transfer error, balance restored" });
            }
        });
    });
});


const path = require('path');

// ... (API Routes above)

// --- Serve Frontend (Production) ---
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
