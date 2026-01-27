import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CURRENT_USER_ID = 'abubakar';

const MyGifts = () => {
    const [gifts, setGifts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserGifts();
    }, []);

    const fetchUserGifts = async () => {
        try {
            const res = await fetch(`/api/user/${CURRENT_USER_ID}`);
            const data = await res.json();
            if (data.gifts) {
                // Show purchased/owned gifts
                setGifts(data.gifts.filter(g => g.status === 'deposited' || g.status === 'owned'));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-4 border-b border-sepia/20 pb-2">
                <h2 className="text-2xl font-bold text-espresso">مجموعتي</h2>
                <span className="text-sm font-sans text-sepia font-bold">
                    {gifts.length} مقتنيات
                </span>
            </div>

            {gifts.length === 0 ? (
                <div className="text-center py-10 bg-white/50 rounded-xl border border-dashed border-sepia/20">
                    <p className="text-sepia font-bold mb-2">لا تملك أي هدايا بعد.</p>
                    <button onClick={() => navigate('/')} className="text-sm text-espresso underline">تصفح المتجر</button>
                </div>
            ) : (
                <div className="space-y-4">
                    {gifts.map((item) => (
                        <div key={item.id} className="card flex gap-4 items-center hover:bg-white transition-colors">
                            <div className="w-20 h-20 bg-sepia/10 rounded-lg overflow-hidden shrink-0 border border-sepia/10">
                                <img src={item.image_url || `https://placehold.co/200`} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                                <h3 className="font-bold text-lg text-espresso truncate" dir="ltr">{item.name}</h3>
                                <p className="text-xs text-sepia mb-2 font-bold">القيمة التقريبية: {item.price || 'غير محدد'} TON</p>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => navigate('/sell')}
                                        className="btn-secondary text-xs py-1.5 px-3 border-none bg-espresso/5 text-espresso hover:bg-espresso hover:text-white"
                                    >
                                        إهداء
                                    </button>
                                    <button
                                        onClick={() => navigate('/sell')}
                                        className="btn-secondary text-xs py-1.5 px-3 border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white font-bold"
                                    >
                                        عرض للبيع
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default MyGifts;
