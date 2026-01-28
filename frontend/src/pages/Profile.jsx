import React, { useEffect, useState } from 'react';
import { getTelegramUser } from '../utils/telegram';

const Profile = () => {
    const user = getTelegramUser();
    const [balance, setBalance] = useState(0);
    const [stats, setStats] = useState({ deposits: 0, withdrawals: 0 });

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, []);

    const fetchUserData = async () => {
        try {
            // Fetch basic user data
            const res = await fetch(`/api/user/${user.id}`);
            const data = await res.json();
            if (data.user) {
                setBalance(data.user.balance);
            }

            // Fetch stats (optional, could be calculated from transactions)
            const txRes = await fetch(`/api/transactions/${user.id}`);
            const txData = await txRes.json();
            if (txData.data) {
                const dep = txData.data.filter(t => t.type === 'deposit').reduce((acc, t) => acc + t.amount, 0);
                const withdr = txData.data.filter(t => t.type === 'withdraw').reduce((acc, t) => acc + Math.abs(t.amount), 0);
                setStats({ deposits: dep, withdrawals: withdr });
            }

        } catch (err) { console.error(err); }
    };

    const copyId = () => {
        navigator.clipboard.writeText(user.id);
        alert("تم نسخ معرف المستخدم (ID)!");
    };

    return (
        <section className="pb-20">
            <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-2xl font-bold text-espresso">الملف الشخصي</h2>
            </div>

            {/* Mock Data Warning */}
            {user.is_mock && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start mb-6">
                    <span className="material-icons-outlined text-amber-600">warning</span>
                    <div className="text-sm text-amber-800">
                        <p className="font-bold mb-1">وضع التطوير (Dev Mode)</p>
                        <p className="opacity-80 leading-relaxed text-xs">
                            يتم عرض بيانات وهمية لأن التطبيق مفتوح خارج تيليجرام.
                            افتح التطبيق من <strong>داخل بوت تيليجرام</strong> لرؤية بياناتك الحقيقية.
                        </p>
                    </div>
                </div>
            )}

            {/* Profile Card */}
            <div className="card mb-6 bg-white border border-sepia/10 shadow-lg relative overflow-hidden text-center p-6">
                <div className="w-24 h-24 bg-gradient-to-tr from-espresso to-[#6F4E37] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg border-4 border-white">
                    <span className="text-4xl font-bold text-gold uppercase">
                        {user.first_name ? user.first_name.charAt(0) : 'U'}
                    </span>
                </div>

                <h3 className="text-xl font-bold text-espresso mb-1">
                    {user.first_name} {user.last_name || ''}
                </h3>
                <p className="text-sepia/70 text-sm mb-4">@{user.username || 'unknown'}</p>

                <div className="bg-cream-light p-3 rounded-xl border border-sepia/10 inline-flex items-center gap-2 cursor-pointer hover:bg-sepia/10 transition-colors" onClick={copyId}>
                    <span className="text-xs font-bold text-sepia uppercase tracking-widest">ID:</span>
                    <code className="text-espresso font-mono font-bold">{user.id}</code>
                    <span className="material-icons-outlined text-sm text-sepia">content_copy</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl border border-sepia/10 shadow-sm text-center">
                    <div className="text-sepia/60 text-xs font-bold mb-1">الرصيد الحالي</div>
                    <div className="text-xl font-bold text-espresso font-serif">{balance.toFixed(2)} TON</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-sepia/10 shadow-sm text-center">
                    <div className="text-sepia/60 text-xs font-bold mb-1">مجموع الإيداعات</div>
                    <div className="text-xl font-bold text-green-700 font-serif">{stats.deposits.toFixed(2)}</div>
                </div>
            </div>

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                <span className="material-icons-outlined text-blue-600">info</span>
                <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">كيف يعمل الإيداع؟</p>
                    <p className="opacity-80 leading-relaxed text-xs">
                        عند إرسال الأموال يدوياً، يجب وضع رقم الـ ID الخاص بك
                        (<span className="font-mono font-bold">{user.id}</span>)
                        في خانة الملاحظات (Comment/Memo) لكي يعرف النظام أن الرصيد لك.
                    </p>
                </div>
            </div>

        </section>
    );
};

export default Profile;
