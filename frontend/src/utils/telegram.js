// Telegram WebApp User Utility - Enhanced Debugging

export const initTelegramWebApp = () => {
    console.log('===== TELEGRAM WEBAPP DEBUG START =====');
    console.log('window.Telegram exists:', !!window.Telegram);
    console.log('window.Telegram.WebApp exists:', !!window.Telegram?.WebApp);

    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;

        // Initialize
        tg.ready();
        tg.expand();

        console.log('Platform:', tg.platform);
        console.log('Version:', tg.version);
        console.log('initData (raw string):', tg.initData);
        console.log('initData length:', tg.initData?.length || 0);
        console.log('initDataUnsafe (full object):', JSON.stringify(tg.initDataUnsafe, null, 2));
        console.log('initDataUnsafe.user:', JSON.stringify(tg.initDataUnsafe?.user, null, 2));
        console.log('colorScheme:', tg.colorScheme);
        console.log('themeParams:', JSON.stringify(tg.themeParams, null, 2));

        // Check if we're in an iframe
        console.log('In iframe:', window.self !== window.top);

    } else {
        console.warn('[TG SDK] Not running inside Telegram WebApp environment');
    }
    console.log('===== TELEGRAM WEBAPP DEBUG END =====');
};

export const getTelegramUser = () => {
    const tg = window.Telegram?.WebApp;

    // Debug output
    console.log('[getTelegramUser] Checking for Telegram user...');
    console.log('[getTelegramUser] tg object:', !!tg);
    console.log('[getTelegramUser] initDataUnsafe:', tg?.initDataUnsafe);
    console.log('[getTelegramUser] user:', tg?.initDataUnsafe?.user);

    // Check if running inside Telegram WebApp AND has user data
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        console.log('[getTelegramUser] ✅ Real user found:', user);
        return {
            id: user.id.toString(),
            first_name: user.first_name || 'مستخدم',
            last_name: user.last_name || '',
            username: user.username || '',
            photo_url: user.photo_url || null,
            is_mock: false
        };
    }

    // Try to parse initData manually if initDataUnsafe is empty but initData exists
    if (tg && tg.initData && tg.initData.length > 0) {
        console.log('[getTelegramUser] initData exists, trying to parse...');
        try {
            const params = new URLSearchParams(tg.initData);
            const userStr = params.get('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                console.log('[getTelegramUser] ✅ Parsed user from initData:', user);
                return {
                    id: user.id.toString(),
                    first_name: user.first_name || 'مستخدم',
                    last_name: user.last_name || '',
                    username: user.username || '',
                    photo_url: user.photo_url || null,
                    is_mock: false
                };
            }
        } catch (e) {
            console.error('[getTelegramUser] Failed to parse initData:', e);
        }
    }

    // Fallback for development/browser
    console.warn('[getTelegramUser] ⚠️ Falling back to mock user');
    console.warn('[getTelegramUser] Reason: initDataUnsafe.user is empty');
    console.warn('[getTelegramUser] This happens when:');
    console.warn('  1. App is opened in browser (not Telegram)');
    console.warn('  2. Bot is not properly configured');
    console.warn('  3. Mini App URL in BotFather is incorrect');

    return {
        id: 'dev_123456',
        first_name: 'مستخدم تجريبي',
        last_name: '',
        username: 'dev_test',
        photo_url: null,
        is_mock: true
    };
};
