import React, { useEffect, useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { beginCell } from '@ton/ton';
import MyWalletNFTs from '../components/MyWalletNFTs';
import ErrorBoundary from '../components/ErrorBoundary';

import { getTelegramUser } from '../utils/telegram';

const currentUser = getTelegramUser();
const CURRENT_USER_ID = currentUser.id.toString();


const WalletContent = () => {
    const [balance, setBalance] = useState(0);
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();
    const [depositAddress, setDepositAddress] = useState('');
    const [depositAmount, setDepositAmount] = useState('1');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [activeTab, setActiveTab] = useState(null); // 'deposit' or 'withdraw' or null
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        fetchUserData();
        fetchDepositAddress();
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await fetch(`/api/transactions/${CURRENT_USER_ID}`);
            const data = await res.json();
            if (data.data) setTransactions(data.data);
        } catch (e) { console.error(e); }
    };

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
            setActiveTab(null); // Close tab
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
                setActiveTab(null); // Close tab
            } else {
                alert("فشل السحب: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("حدث خطأ أثناء الاتصال بالسيرفر");
        }
    }

    return (
        <section className="pb-20">
            {/* Header / Status */}
            <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-2xl font-bold text-espresso">المحفظة</h2>
                <div className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${wallet ? 'bg-green-100 text-green-700' : 'bg-sepia/10 text-sepia'}`}>
                    <span className={`w-2 h-2 rounded-full ${wallet ? 'bg-green-500' : 'bg-sepia'}`}></span>
                    {wallet ? 'متصل' : 'غير متصل'}
                </div>
            </div>

            {/* Main Balance Card */}
            <div className="mb-8 relative transform transition-all hover:scale-[1.01]">
                {/* Decorative Blur */}
                <div className="absolute inset-0 bg-espresso opacity-20 blur-xl rounded-[2rem] translate-y-2"></div>

                <div className="relative bg-gradient-to-br from-[#4B3621] to-[#6F4E37] text-cream-paper rounded-[2rem] p-6 shadow-2xl border border-white/10 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl translate-y-10 -translate-x-5 pointer-events-none"></div>

                    <div className="flex flex-col items-center text-center relative z-10 py-2">
                        <span className="text-white/70 text-sm font-medium tracking-wider mb-2 uppercase">رصيد المحفظة</span>
                        <h1 className="text-5xl font-bold font-serif mb-8 drop-shadow-sm" dir="ltr">
                            {balance.toFixed(2)} <span className="text-2xl text-gold">TON</span>
                        </h1>

                        <div className="flex gap-4 w-full px-2">
                            <button
                                onClick={() => setActiveTab(activeTab === 'deposit' ? null : 'deposit')}
                                className="flex-1 bg-white text-espresso font-bold py-3.5 px-4 rounded-xl shadow-lg hover:bg-cream-light active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-outlined text-lg">add</span>
                                إيداع
                            </button>
                            <button
                                onClick={() => setActiveTab(activeTab === 'withdraw' ? null : 'withdraw')}
                                className="flex-1 bg-white/10 backdrop-blur-md text-white border border-white/30 font-bold py-3.5 px-4 rounded-xl shadow-lg hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-outlined text-lg text-gold">north_east</span>
                                سحب
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Panels (Conditional) */}
            {activeTab === 'deposit' && (
                <div className="animate-fade-in-up mb-8 bg-white/50 border border-sepia/10 p-5 rounded-2xl backdrop-blur-sm">
                    <h3 className="text-espresso font-bold mb-3 flex items-center gap-2">
                        <span className="material-icons-outlined">add_card</span>
                        شحن الرصيد
                    </h3>
                    {!wallet ? (
                        <div className="text-sm text-sepia/80 text-center py-4">يرجى ربط المحفظة أولاً</div>
                    ) : (
                        <div className="flex gap-3">
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={e => setDepositAmount(e.target.value)}
                                className="flex-1 border border-sepia/20 p-3 rounded-xl bg-white text-center font-bold focus:ring-2 focus:ring-espresso/20 outline-none"
                                placeholder="0.0"
                            />
                            <button onClick={handleDepositTon} className="btn-primary py-3 px-6 rounded-xl shadow-md">
                                تأكيد
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'withdraw' && (
                <div className="animate-fade-in-up mb-8 bg-white/50 border border-sepia/10 p-5 rounded-2xl backdrop-blur-sm">
                    <h3 className="text-espresso font-bold mb-3 flex items-center gap-2">
                        <span className="material-icons-outlined">account_balance_wallet</span>
                        سحب الرصيد
                    </h3>
                    {!wallet ? (
                        <div className="text-sm text-sepia/80 text-center py-4">يرجى ربط المحفظة أولاً</div>
                    ) : (
                        <div className="space-y-3">
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={e => setWithdrawAmount(e.target.value)}
                                className="w-full border border-sepia/20 p-3 rounded-xl bg-white text-center font-bold focus:ring-2 focus:ring-espresso/20 outline-none"
                                placeholder="المبلغ المراد سحبه"
                            />
                            <button onClick={handleWithdraw} className="w-full btn-secondary py-3 rounded-xl shadow-md">
                                طلب سحب
                            </button>
                            <p className="text-xs text-sepia/60 text-center">* رسوم الشبكة: 0.04 TON</p>
                        </div>
                    )}
                </div>
            )}

            {/* Recent Actions Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-lg font-bold text-espresso">سجل المعاملات</h3>
                    <button className="text-sepia/80 text-sm hover:text-espresso flex items-center gap-1 bg-white/50 px-3 py-1 rounded-lg border border-sepia/10 shadow-sm">
                        <span className="material-icons-outlined text-base">filter_list</span>
                        تصفية
                    </button>
                </div>

                {transactions.length === 0 ? (
                    // Empty State
                    <div className="bg-white/40 border border-sepia/5 rounded-2xl p-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-gradient-to-tr from-cream-dark to-white rounded-full flex items-center justify-center shadow-inner mb-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-noise opacity-20"></div>
                            <span className="material-icons-outlined text-4xl text-sepia/40">history</span>
                        </div>
                        <h4 className="text-espresso font-bold mb-1">لا توجد معاملات بعد</h4>
                        <p className="text-sepia/70 text-sm mb-6 max-w-[200px]">قم بإجراء أول عملية إيداع أو شراء لبدء التداول!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map(tx => (
                            <div key={tx.id} className="bg-white/60 border border-sepia/5 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' || tx.type === 'sell' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        <span className="material-icons-outlined text-lg">
                                            {tx.type === 'deposit' ? 'south_west' :
                                                tx.type === 'withdraw' ? 'north_east' :
                                                    tx.type === 'buy' ? 'shopping_bag' : 'sell'}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-espresso text-sm">
                                            {tx.type === 'deposit' ? 'إيداع TON' :
                                                tx.type === 'withdraw' ? 'سحب رصيد' :
                                                    tx.type === 'buy' ? 'شراء هدية' : 'بيع هدية'}
                                        </div>
                                        <div className="text-[10px] text-sepia/60 font-mono">
                                            {new Date(tx.created_at).toLocaleString('en-US')}
                                        </div>
                                    </div>
                                </div>
                                <div className={`font-bold font-mono text-sm ${tx.type === 'deposit' || tx.type === 'sell' ? 'text-green-600' : 'text-espresso'
                                    }`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} TON
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Features / NFTs */}
            <div className="opacity-80 hover:opacity-100 transition-opacity">
                <MyWalletNFTs />
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
