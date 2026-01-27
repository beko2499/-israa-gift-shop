import React, { useEffect, useState } from 'react';
import { useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { fetchAccountNfts } from '../utils/tonUtils';

const CURRENT_USER_ID = 'abubakar';

const MyWalletNFTs = () => {
    const wallet = useTonWallet();
    const [tonConnectUI] = useTonConnectUI();
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [botAddress, setBotAddress] = useState('');

    useEffect(() => {
        if (wallet) {
            loadNfts();
            fetch('/api/deposit-address').then(r => r.json()).then(d => setBotAddress(d.address));
        }
    }, [wallet]);

    const loadNfts = async () => {
        setLoading(true);
        const userAddr = wallet.account.address;
        const items = await fetchAccountNfts(userAddr);
        setNfts(items);
        setLoading(false);
    }

    const handleDepositNft = async (nft) => {
        if (!botAddress) return alert("خطأ في إعدادات البوت");

        try {
            // Dynamic import to allow code splitting if needed, though vite handles standard imports fine.
            const bodyBoc = await import('../utils/tonUtils').then(m =>
                m.createNftTransferBody(botAddress, "user_" + CURRENT_USER_ID)
            );

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 60,
                messages: [
                    {
                        address: nft.address,
                        amount: "50000000",
                        payload: bodyBoc
                    }
                ]
            };

            await tonConnectUI.sendTransaction(transaction);
            alert("تم إرسال طلب الإيداع! يرجى الانتظار.");

        } catch (e) {
            console.error(e);
            alert("فشل الإرسال: " + e.message);
        }
    }

    if (!wallet) return null;

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-espresso text-sm flex items-center gap-2">
                    <span className="material-icons-outlined text-sm">collections</span>
                    هدايا في محفظتك
                </h3>
                <button onClick={loadNfts} className="text-xs text-sepia hover:text-porcelain flex items-center gap-1">
                    <span className="material-icons-outlined text-[10px]">refresh</span> تحديث
                </button>
            </div>

            {loading && <div className="text-center text-xs text-sepia py-4">جاري تحميل الهدايا...</div>}

            <div className="grid grid-cols-2 gap-3">
                {nfts.map(nft => (
                    <div key={nft.address} className="card p-2 text-center border border-sepia/10 hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-cream-light rounded-lg mb-2 overflow-hidden relative">
                            <img src={nft.metadata?.image || "https://placehold.co/100"} className="w-full h-full object-cover" />
                        </div>
                        <div className="font-bold text-xs truncate mb-2 text-espresso" dir="ltr">{nft.metadata?.name || "NFT"}</div>
                        <button
                            onClick={() => handleDepositNft(nft)}
                            className="btn-primary w-full text-[10px] py-2 font-bold bg-espresso text-cream-paper hover:bg-espresso/90 shadow-none"
                        >
                            إيداع في المتجر
                        </button>
                    </div>
                ))}
            </div>
            {nfts.length === 0 && !loading && <div className="text-xs text-center text-sepia/50 italic py-4 border border-dashed rounded bg-white/50">لا توجد هدايا (NFTs) في المحفظة حالياً.</div>}
        </div>
    );
};

export default MyWalletNFTs;
