export const getTelegramUser = () => {
    // Check if running inside Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        return window.Telegram.WebApp.initDataUnsafe.user;
    }

    // Fallback for local development (Browser)
    // We persist a mock ID in localStorage to simulate a "session"
    const storedMockObj = localStorage.getItem('mock_telegram_user');
    if (storedMockObj) {
        return JSON.parse(storedMockObj);
    }

    const mockUser = {
        id: 'abubakar', // Default mock ID
        first_name: 'Abubakar (Dev)',
        username: 'dev_account',
        is_mock: true
    };

    // In dev, we just return the mock. In prod, this should ideally be null or prompt login if not in TG.
    return mockUser; // Return mock for now to keep the app usable in browser
};
