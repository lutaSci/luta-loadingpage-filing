export const MARKETING_LOCALE_REGISTRY = Object.freeze([
    Object.freeze({ languageKey: 'zh', localeKey: 'zh-cn', htmlLang: 'zh-CN', label: '简体中文', path: '/global/zh-cn' }),
    Object.freeze({ languageKey: 'zhTW', localeKey: 'zh-tw', htmlLang: 'zh-TW', label: '繁體中文', path: '/global/zh-tw' }),
    Object.freeze({ languageKey: 'en', localeKey: 'en', htmlLang: 'en', label: 'English', path: '/global/en' }),
    Object.freeze({ languageKey: 'ja', localeKey: 'ja', htmlLang: 'ja', label: '日本語', path: '/global/ja' }),
    Object.freeze({ languageKey: 'ko', localeKey: 'ko', htmlLang: 'ko', label: '한국어', path: '/global/ko' }),
])

export const MARKETING_LOCALE_KEYS = Object.freeze(
    MARKETING_LOCALE_REGISTRY.map(locale => locale.localeKey),
)

export function getMarketingLocaleByLanguage(languageKey) {
    return MARKETING_LOCALE_REGISTRY.find(locale => locale.languageKey === languageKey) || null
}

export function getMarketingLocaleByKey(localeKey) {
    return MARKETING_LOCALE_REGISTRY.find(locale => locale.localeKey === localeKey) || null
}

export function isMarketingPath(pathname) {
    const normalizedPath = pathname.length > 1 && pathname.endsWith('/')
        ? pathname.replace(/\/+$/, '')
        : pathname

    return normalizedPath === '/'
        || MARKETING_LOCALE_REGISTRY.some(locale => locale.path === normalizedPath)
}
