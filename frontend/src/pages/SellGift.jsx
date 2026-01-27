import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CURRENT_USER_ID = 'abubakar';

const SellGift = () => {
    const navigate = useNavigate();
    const [depositedGifts, setDepositedGifts] = useState([]);
    const [selectedGift, setSelectedGift] = useState(null);
    const [price, setPrice] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDepositedGifts();
    }, []);

    const fetchDepositedGifts = async () => {
        try {
            const res = await fetch(`/api/user/${CURRENT_USER_ID}`);
            const data = await res.json();
            if (data.gifts) {
                setDepositedGifts(data.gifts.filter(g => g.status === 'deposited' || g.status === 'owned'));
            }
        } catch (e) { console.error(e); }
    }

    const handleList = async (e) => {
        e.preventDefault();
        if (!selectedGift || !price) return;
        setLoading(true);

        try {
            const res = await fetch('/api/list-item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: CURRENT_USER_ID,
                    giftId: selectedGift.id,
                    price: parseFloat(price)
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert('تم عرض الهدية في المتجر بنجاح!');
                navigate('/');
            } else {
                alert('خطأ: ' + data.error);
            }
        } catch (err) {
            alert('فشل في عرض الهدية');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-6 border-b border-sepia/20 pb-2">
                <h2 className="text-2xl font-bold text-espresso">عرض هدية للبيع</h2>
            </div>

            <div className="mb-6">
                <p className="text-sm text-sepia mb-4 leading-relaxed">
                    اختر هدية من مخزونك لبيعها. <br />
                    (يجب إيداع الهدايا أولاً من صفحة المحفظة)
                </p>

                {depositedGifts.length === 0 ? (
                    <div className="text-center py-8 bg-sepia/5 rounded-lg border border-dashed border-sepia/20">
                        <p className="font-serif text-espresso italic">لا توجد هدايا متاحة للبيع.</p>
                        <button onClick={() => navigate('/wallet')} className="text-xs text-porcelain mt-2 hover:underline font-bold">الذهاب للمحفظة للإيداع</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {depositedGifts.map(gift => (
                            <div
                                key={gift.id}
                                onClick={() => setSelectedGift(gift)}
                                className={`card cursor-pointer transition-all ${selectedGift?.id === gift.id ? 'ring-2 ring-porcelain bg-cream-light transform scale-105' : 'hover:bg-white'}`}
                            >
                                <div className="aspect-square bg-sepia/10 rounded mb-2 overflow-hidden shadow-inner">
                                    <img src={gift.image_url || "https://placehold.co/100"} className="w-full h-full object-cover" />
                                </div>
                                <div className="font-bold text-sm truncate text-center">{gift.name}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedGift && (
                <form onSubmit={handleList} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white p-4 rounded-lg border border-sepia/20 shadow-sm">
                        <div className="font-bold text-espresso mb-3 text-lg border-b border-sepia/10 pb-2">بيع: {selectedGift.name}</div>

                        <label className="block text-xs font-bold text-sepia mb-2">حدد السعر (TON)</label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                required
                                className="w-full bg-cream-paper border border-sepia/30 rounded-lg p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-porcelain font-bold text-lg"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                            <span className="absolute left-3 top-3 text-sepia font-bold text-sm">TON</span>
                        </div>
                        <p className="text-xs text-sepia mt-2 bg-cream-light p-2 rounded">
                            العمولة: 3% <br />
                            ستحصل على: <span className="font-bold text-espresso">{(price * 0.97 || 0).toFixed(2)} TON</span>
                        </p>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-3 shadow-vintage text-lg">
                        {loading ? 'جاري العرض...' : 'تأكيد البيع'}
                    </button>
                </form>
            )}
        </section>
    );
};

export default SellGift;
