// Telegram WebApp User Utility

export const initTelegramWebApp = () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand(); // Expand to full height
        console.log('[TG SDK] WebApp initialized. initData:', window.Telegram.WebApp.initData);
        console.log('[TG SDK] initDataUnsafe:', JSON.stringify(window.Telegram.WebApp.initDataUnsafe));
    } else {
        console.warn('[TG SDK] Not running inside Telegram WebApp');
    }
};

export const getTelegramUser = () => {
    // Check if running inside Telegram WebApp
    const tg = window.Telegram?.WebApp;

    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        console.log('[TG SDK] Real user detected:', user);
        return {
            id: user.id.toString(),
            first_name: user.first_name || 'مستخدم',
            last_name: user.last_name || '',
            username: user.username || '',
            photo_url: user.photo_url || null,
            is_mock: false
        };
    }

    // Fallback for local development (Browser)
    console.warn('[TG SDK] Falling back to mock user. initDataUnsafe:', tg?.initDataUnsafe);

    return {
        id: 'dev_123456',
        first_name: 'مستخدم تجريبي',
        last_name: '',
        username: 'dev_test',
        photo_url: null,
        is_mock: true
    };
};

// Get user's Telegram photo URL (requires bot API call for full resolution)
export const getUserPhotoPlaceholder = (firstName) => {
    // Generate a gradient avatar with first letter
    const letter = firstName?.charAt(0)?.toUpperCase() || 'U';
    return { letter };
};
