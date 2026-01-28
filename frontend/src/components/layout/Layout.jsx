import React from 'react';
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();

    return (
        <div className="min-h-screen pb-24 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-cream-paper/90 backdrop-blur-md border-b border-sepia/10 px-4 py-3 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-bold text-espresso font-serif tracking-wide">متجر إسراء للهدايا</h1>
                <div className="flex items-center gap-2" dir="ltr">
                    {!wallet ? (
                        <button
                            onClick={() => tonConnectUI.openModal()}
                            className="bg-espresso text-cream-paper hover:bg-espresso/90 text-sm font-bold px-4 py-2 rounded-full shadow-md transition-transform active:scale-95 flex items-center gap-2"
                        >
                            <span className="material-icons-outlined text-sm">account_balance_wallet</span>
                            ربط المحفظة
                        </button>
                    ) : (
                        <TonConnectButton className="scale-90" />
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                {children}
            </main>

            {/* Modern Floating Bottom Nav */}
            <nav className="fixed bottom-4 left-4 right-4 bg-espresso/90 backdrop-blur-xl rounded-2xl shadow-2xl flex justify-around p-3 z-50 text-cream-light border border-white/10 ring-1 ring-black/5">
                <NavButton icon="storefront" label="المتجر" path="/" />
                <NavButton icon="inventory_2" label="هداياي" path="/gifts" />
                <NavButton icon="sell" label="بيع" path="/sell" />
                <NavButton icon="account_balance_wallet" label="المحفظة" path="/wallet" />
                <NavButton icon="person" label="حسابي" path="/profile" />
            </nav>
        </div>
    );
};

const NavButton = ({ icon, label, path }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const active = location.pathname === path;

    return (
        <button
            onClick={() => navigate(path)}
            className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-gold scale-110' : 'text-cream-light/60 hover:text-cream-light'}`}
        >
            <div className={`p-1 rounded-xl ${active ? 'bg-white/10' : ''}`}>
                <span className="material-icons-outlined text-2xl">{icon}</span>
            </div>
            <span className="text-[10px] font-bold tracking-wide">{label}</span>

            {/* Active Dot */}
            {active && <span className="absolute -bottom-1 w-1 h-1 bg-gold rounded-full shadow-[0_0_8px_rgba(255,215,0,0.8)]"></span>}
        </button>
    );
};

export default Layout;
