import React, { useEffect, useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { beginCell } from '@ton/ton';
import MyWalletNFTs from '../components/MyWalletNFTs';
import ErrorBoundary from '../components/ErrorBoundary';

const CURRENT_USER_ID = 'abubakar';

const WalletContent = () => {
    const [balance, setBalance] = useState(0);
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();
    const [depositAddress, setDepositAddress] = useState('');
    const [depositAmount, setDepositAmount] = useState('1');
    const [withdrawAmount, setWithdrawAmount] = useState('');

    useEffect(() => {
        fetchUserData();
        fetchDepositAddress();
    }, []);

    const fetchUserData = async () => {
        try {
            const res = await fetch(`/api/user/${CURRENT_USER_ID}`);
            const data = await res.json();
            if (data.user) setBalance(data.user.balance);
        } catch (err) { console.error(err); }
    };

    const fetchDepositAddress = async () => {
        try {
            const res = await fetch('/api/deposit-address');
            const data = await res.json();
            if (data.address) setDepositAddress(data.address);
        } catch (e) { console.error(e); }
    }

    const handleDepositTon = async () => {
        if (!wallet || !depositAddress) return;

        try {
            const body = beginCell()
                .storeUint(0, 32)
                .storeStringTail(`user_${CURRENT_USER_ID}`)
                .endCell();

            const payload = body.toBoc().toString('base64');
            const nanoAmount = (parseFloat(depositAmount) * 1e9).toString();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 60,
                messages: [
                    {
                        address: depositAddress,
                        amount: nanoAmount,
                        payload: payload
                    }
                ]
            };

            await tonConnectUI.sendTransaction(transaction);
            alert("تم إرسال المعاملة! سيتم تحديث الرصيد بعد التاكيد.");
        } catch (e) {
            console.error(e);
            alert("خطأ: " + e.message);
        }
    }

    const handleWithdraw = async () => {
        if (!wallet) return alert("يرجى ربط المحفظة");
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return alert("يرجى إدخال مبلغ صحيح");

        try {
            const userAddress = wallet.account.address;

            const res = await fetch('/api/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: CURRENT_USER_ID,
                    type: 'ton',
                    amount: parseFloat(withdrawAmount),
                    address: userAddress
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert("تم تنفيذ السحب بنجاح! 💸");
                fetchUserData();
                setWithdrawAmount('');
            } else {
                alert("فشل السحب: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("حدث خطأ أثناء الاتصال بالسيرفر");
        }
    }

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-espresso">المحفظة</h2>
            </div>

            {/* Balance Card */}
            <div className="card mb-6 bg-gradient-to-br from-cream-light to-[#EAE4D3] shadow-lg border-none relative overflow-hidden">
                <div className="absolute top-0 left-0 w-20 h-20 bg-white/20 rounded-full -translate-x-10 -translate-y-10 blur-xl"></div>

                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <div className="text-sepia text-xs font-bold mb-1">الرصيد الحالي</div>
                        <div className="font-bold text-3xl text-espresso font-serif" dir="ltr">{balance.toFixed(2)} TON</div>
                    </div>
                    <div className="bg-white/30 p-2 rounded-full">
                        <span className="material-icons-outlined text-2xl text-espresso">account_balance_wallet</span>
                    </div>
                </div>
            </div>

            {/* Deposit TON Section */}
            <div className="card mb-6">
                <h3 className="font-bold mb-3 text-espresso flex items-center gap-2">
                    <span className="material-icons-outlined text-sm">add_card</span>
                    شحن رصيد (TON)
                </h3>
                {!wallet ? (
                    <div className="text-sm text-sepia/80 bg-sepia/5 p-3 rounded-lg text-center border border-dashed border-sepia/20">
                        قم بربط المحفظة (Connect Wallet) للشحن التلقائي
                    </div>
                ) : (
                    <div className="flex gap-2 items-center">
                        <div className="relative w-24">
                            <input
                                type="number"
                                step="0.1"
                                value={depositAmount}
                                onChange={e => setDepositAmount(e.target.value)}
                                className="border border-sepia/30 p-2 rounded-lg w-full text-center bg-cream-paper focus:ring-1 focus:ring-porcelain font-bold"
                            />
                        </div>
                        <button
                            onClick={handleDepositTon}
                            className="btn-primary flex-1 shadow-vintage text-sm py-2.5"
                        >
                            إيداع فوري
                        </button>
                    </div>
                )}
            </div>

            {/* Deposit NFT Section */}
            <MyWalletNFTs />

            {/* Withdraw Section */}
            <div className="card mt-6 border-t-4 border-espresso">
                <h3 className="font-bold mb-4 text-espresso flex items-center gap-2">
                    <span className="material-icons-outlined text-sm">outbound</span>
                    سحب الرصيد (Withdraw)
                </h3>

                {!wallet ? (
                    <div className="text-sm text-sepia/80 bg-sepia/5 p-3 rounded-lg text-center border border-dashed border-sepia/20">
                        للسحب التلقائي، يرجى ربط المحفظة أولاً.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-cream-light p-3 rounded-lg border border-sepia/10">
                            <div className="text-[10px] text-sepia uppercase font-bold mb-1">سيتم السحب إلى محفظتك المتصلة:</div>
                            <div className="font-mono text-xs text-espresso font-bold truncate" dir="ltr">
                                {wallet.account.address}
                            </div>
                        </div>

                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-[10px] text-sepia font-bold mb-1 block">المبلغ (TON)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="0.0"
                                    value={withdrawAmount}
                                    onChange={e => setWithdrawAmount(e.target.value)}
                                    className="border border-sepia/30 p-2 rounded-lg w-full bg-cream-paper focus:ring-1 focus:ring-porcelain font-bold text-lg"
                                />
                            </div>
                            <button
                                onClick={handleWithdraw}
                                className="btn-secondary h-[46px] px-6 font-bold shadow-sm bg-espresso text-cream-paper hover:bg-espresso/90 border-none"
                            >
                                تأكيد السحب
                            </button>
                        </div>
                        <p className="text-[10px] text-sepia mt-2">
                            * رسوم الشبكة: 0.04 TON (تخصم من الرصيد). <br />
                            * السحب يتم فوراً عبر العقد الذكي.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};

// Wrap with ErrorBoundary
const Wallet = () => (
    <ErrorBoundary>
        <WalletContent />
    </ErrorBoundary>
);

export default Wallet;
