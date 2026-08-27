// ============================================
// 设备与地区检测工具
// ============================================

/**
 * Classify a browser User-Agent without coupling the result to a page or entry source.
 * OpenHarmony's documented UA uses the `OpenHarmony` OS token rather than `HarmonyOS`.
 *
 * @param {string} userAgent
 * @returns {{ isIOS: boolean, isAndroid: boolean, isOpenHarmony: boolean, isHarmonyOS: boolean, isHarmonyOSNext: boolean, isMobile: boolean, isDesktop: boolean }}
 */
export const detectDeviceFromUserAgent = (userAgent = '') => {
    const ua = typeof userAgent === 'string' ? userAgent : '';

    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isOpenHarmony = /\bOpenHarmony\b/i.test(ua);
    const isLegacyHarmonyOS = /\bHarmonyOS\b/i.test(ua);
    const isHarmonyOS = isOpenHarmony || isLegacyHarmonyOS;

    // OpenHarmony is the positive signal for the non-Android NEXT platform.
    // Legacy HarmonyOS UAs that explicitly include Android remain compatible
    // with the Android distribution path.
    const isHarmonyOSNext = isOpenHarmony || (isLegacyHarmonyOS && !isAndroid);

    // OpenHarmony documents Phone, Tablet and PC as device types. Prefer that
    // explicit field over the generic Mobile compatibility token so 2-in-1
    // devices retain desktop layout while still using NEXT-safe distribution.
    const openHarmonyDeviceType = isOpenHarmony
        ? ua.match(/\(\s*(Phone|Tablet|PC)(?=;|\))/i)?.[1]?.toLowerCase() || null
        : null;
    const isOpenHarmonyMobile = isOpenHarmony && (
        openHarmonyDeviceType
            ? openHarmonyDeviceType !== 'pc'
            : /\bMobile\b/i.test(ua)
    );

    const isMobile = isIOS
        || isAndroid
        || isOpenHarmonyMobile
        || (isLegacyHarmonyOS && !isOpenHarmony);
    const isDesktop = !isMobile;

    return {
        isIOS,
        isAndroid,
        isOpenHarmony,
        isHarmonyOS,
        isHarmonyOSNext,
        isMobile,
        isDesktop,
    };
};

/**
 * 检测用户设备类型
 * @returns {{ isIOS: boolean, isAndroid: boolean, isOpenHarmony: boolean, isHarmonyOS: boolean, isHarmonyOSNext: boolean, isMobile: boolean, isDesktop: boolean }}
 */
export const detectDevice = () => detectDeviceFromUserAgent(navigator.userAgent || '');

/**
 * 检测是否在微信内置浏览器中
 * 微信 UA 包含 "MicroMessenger"
 * @returns {boolean}
 */
export const detectIsWeChat = () => {
    const ua = navigator.userAgent || '';
    return /MicroMessenger/i.test(ua);
};

/**
 * 检测用户是否在中国大陆
 * 基于时区 + 浏览器语言的启发式判断：
 * - 时区为 Asia/Shanghai（大陆统一时区）
 * - 浏览器语言为简体中文 (zh / zh-CN / zh-Hans)
 *
 * 台湾 (Asia/Taipei)、香港 (Asia/Hong_Kong)、新加坡 (Asia/Singapore) 不会命中
 *
 * @returns {boolean}
 */
export const detectIsMainlandChina = () => {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = (navigator.language || '').toLowerCase();

        const chinaTimezones = ['Asia/Shanghai', 'Asia/Chongqing', 'Asia/Urumqi', 'Asia/Harbin'];
        const isChinaTimezone = chinaTimezones.includes(timezone);

        const isSimplifiedChinese =
            language === 'zh' ||
            language === 'zh-cn' ||
            language.startsWith('zh-hans');

        return isChinaTimezone && isSimplifiedChinese;
    } catch {
        return false;
    }
};
