import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CURRENT_USER_ID = 'abubakar';

const Marketplace = () => {
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchGifts();
    }, []);

    const fetchGifts = async () => {
        try {
            const res = await fetch('/api/gifts');
            const data = await res.json();
            if (data.data) {
                setGifts(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async (gift) => {
        try {
            const res = await fetch('/api/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buyerId: CURRENT_USER_ID, giftId: gift.id })
            });
            const data = await res.json();
            if (res.ok) {
                alert("تم الشراء بنجاح! 🎉");
                fetchGifts(); // Refresh
            } else {
                alert("خطأ: " + data.error);
            }
        } catch (err) {
            alert("فشل في الشراء");
        }
    };

    return (
        <section>
            <div className="text-center mb-8 pt-4">
                <h2 className="text-3xl font-bold text-espresso mb-2 title-font">هدايا مميزة</h2>
                <div className="h-1 w-24 bg-sepia/20 mx-auto rounded-full"></div>
            </div>

            {/* Filter / Search Placeholder */}
            <div className="flex justify-between items-center mb-6 px-2">
                <button className="text-xs font-bold text-sepia flex items-center gap-1 hover:text-espresso transition-colors">
                    <span className="material-icons-outlined text-sm">filter_list</span> فلتر
                </button>
                <span className="text-xs text-sepia/60">{gifts.length} هدية متاحة</span>
            </div>

            {loading ? (
                <div className="text-center py-10">
                    <div className="animate-spin w-8 h-8 border-4 border-sepia border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sepia text-sm">جاري تحميل المتجر...</p>
                </div>
            ) : gifts.length === 0 ? (
                <div className="text-center py-12 bg-white/50 rounded-xl border border-dashed border-sepia/20">
                    <p className="text-sepia italic mb-2">لا توجد هدايا معروضة للبيع حالياً.</p>
                    <p className="text-xs text-sepia/60">كن أول من يعرض هدية!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {gifts.map((gift) => (
                        <div key={gift.id} className="card group hover:-translate-y-1 transition-transform duration-300">
                            <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-cream-light">
                                <span className="absolute top-2 right-2 bg-white/90 backdrop-blur text-espresso text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-10">
                                    {gift.price} TON
                                </span>
                                <img
                                    src={gift.image_url || "https://placehold.co/300"}
                                    alt={gift.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>

                            <h3 className="font-bold text-sm text-espresso truncate mb-1" dir="ltr">{gift.name}</h3>
                            <p className="text-[10px] text-sepia mb-3 truncate">{gift.description || "هدية تيليجرام نادرة"}</p>

                            {gift.owner_id === CURRENT_USER_ID ? (
                                <button disabled className="w-full bg-sepia/20 text-sepia font-bold py-2 rounded text-xs cursor-not-allowed">
                                    أنت المالك
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleBuy(gift)}
                                    className="btn-primary w-full text-xs py-2 shadow-sm hover:shadow-md"
                                >
                                    شراء الآن
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default Marketplace;
