const { TonClient, WalletContractV4, internal, MnemonicProvider } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");

class TonService {
    constructor() {
        this.client = new TonClient({
            endpoint: "https://toncenter.com/api/v2/jsonRPC",
            apiKey: process.env.TONCENTER_API_KEY // Optional but recommended
        });

        // In-memory key (In production, use secure vault)
        this.keyPair = null;
        this.wallet = null;
        this.walletContract = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        const mnemonic = process.env.WALLET_MNEMONIC; // 24 words
        if (!mnemonic) {
            console.error("No WALLET_MNEMONIC found in .env");
            return;
        }

        try {
            this.keyPair = await mnemonicToPrivateKey(mnemonic.split(" "));
            this.wallet = WalletContractV4.create({ workchain: 0, publicKey: this.keyPair.publicKey });
            this.walletContract = this.client.open(this.wallet);
            this.isInitialized = true;
            console.log("TON Wallet Initialized:", this.wallet.address.toString());
        } catch (error) {
            console.error("Failed to initialize TON Wallet:", error);
        }
    }

    async getBalance() {
        if (!this.isInitialized) await this.init();
        return await this.walletContract.getBalance();
    }

    // Process Withdrawal
    async sendTransfer(toAddress, amountStr, memo) {
        if (!this.isInitialized) await this.init();

        try {
            const seqno = await this.walletContract.getSeqno();
            const amount = BigInt(Math.floor(parseFloat(amountStr) * 1e9)); // Convert TON to Nanoton

            await this.walletContract.sendTransfer({
                secretKey: this.keyPair.secretKey,
                seqno: seqno,
                messages: [
                    internal({
                        to: toAddress,
                        value: amount,
                        body: memo, // Optional comment
                        bounce: false,
                    })
                ]
            });
            console.log(`Sent ${amountStr} TON to ${toAddress}`);
            return true;
        } catch (error) {
            console.error("Transfer failed:", error);
            return false;
        }
    }

    // For polling
    async getTransactions(limit = 20) {
        if (!this.isInitialized) await this.init();
        // This is a simplified fetch; production should track lastLt to avoid duplicates
        return await this.client.getTransactions(this.wallet.address, { limit });
    }
}

module.exports = new TonService();
