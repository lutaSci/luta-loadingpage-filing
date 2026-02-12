// ============================================
// 设备与地区检测工具
// ============================================

/**
 * 检测用户设备类型
 * @returns {{ isIOS: boolean, isAndroid: boolean, isHarmonyOS: boolean, isMobile: boolean, isDesktop: boolean }}
 */
export const detectDevice = () => {
    const ua = navigator.userAgent || '';

    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isHarmonyOS = /HarmonyOS/i.test(ua);

    const isMobile = isIOS || isAndroid || isHarmonyOS;
    const isDesktop = !isMobile;

    return { isIOS, isAndroid, isHarmonyOS, isMobile, isDesktop };
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

        // 时区为 Asia/Shanghai 或 Asia/Chongqing 或 Asia/Urumqi 等中国大陆时区
        const chinaTimezones = ['Asia/Shanghai', 'Asia/Chongqing', 'Asia/Urumqi', 'Asia/Harbin'];
        const isChinaTimezone = chinaTimezones.includes(timezone);

        // 语言为简体中文（排除 zh-TW、zh-HK 等）
        const isSimplifiedChinese =
            language === 'zh' ||
            language === 'zh-cn' ||
            language.startsWith('zh-hans');

        return isChinaTimezone && isSimplifiedChinese;
    } catch {
        // 检测失败时保守判断为非大陆
        return false;
    }
};
