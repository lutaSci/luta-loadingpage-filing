const simplifiedChinese = Object.freeze({
    languageKey: 'zh',
    localeKey: 'zh-cn',
    htmlLang: 'zh-CN',
    label: '简体中文',
    path: '/global/zh-cn',
})
const traditionalChinese = Object.freeze({
    languageKey: 'zhTW',
    localeKey: 'zh-tw',
    htmlLang: 'zh-TW',
    label: '繁體中文',
    path: '/global/zh-tw',
})

export const MARKETING_LOCALE_REGISTRY = Object.freeze([
    simplifiedChinese,
    traditionalChinese,
])

// These resources remain in source for a reversible retirement, but are not
// selectable, auto-detected, pre-rendered, or advertised to crawlers.
export const RETIRED_MARKETING_LOCALE_REGISTRY = Object.freeze([
    Object.freeze({ languageKey: 'en', localeKey: 'en', htmlLang: 'en', label: 'English', path: '/global/en' }),
    Object.freeze({ languageKey: 'ja', localeKey: 'ja', htmlLang: 'ja', label: '日本語', path: '/global/ja' }),
    Object.freeze({ languageKey: 'ko', localeKey: 'ko', htmlLang: 'ko', label: '한국어', path: '/global/ko' }),
])

export const ALL_MARKETING_LOCALE_REGISTRY = Object.freeze([
    ...MARKETING_LOCALE_REGISTRY,
    ...RETIRED_MARKETING_LOCALE_REGISTRY,
])

export const MARKETING_LOCALE_KEYS = Object.freeze(
    MARKETING_LOCALE_REGISTRY.map(locale => locale.localeKey),
)

export const RETIRED_MARKETING_LOCALE_KEYS = Object.freeze(
    RETIRED_MARKETING_LOCALE_REGISTRY.map(locale => locale.localeKey),
)

export const MARKETING_LANGUAGE_KEYS = Object.freeze(
    MARKETING_LOCALE_REGISTRY.map(locale => locale.languageKey),
)

export function getMarketingLocaleByLanguage(languageKey) {
    return MARKETING_LOCALE_REGISTRY.find(locale => locale.languageKey === languageKey) || null
}

export function getMarketingLocaleByKey(localeKey) {
    return MARKETING_LOCALE_REGISTRY.find(locale => locale.localeKey === localeKey) || null
}

export function getMarketingLocaleByPath(pathname) {
    const normalizedPath = normalizePath(pathname)
    return MARKETING_LOCALE_REGISTRY.find(locale => locale.path === normalizedPath) || null
}

export function isActiveMarketingLanguage(languageKey) {
    return MARKETING_LANGUAGE_KEYS.includes(languageKey)
}

function normalizePath(pathname) {
    if (typeof pathname !== 'string') return ''
    return pathname.length > 1 && pathname.endsWith('/')
        ? pathname.replace(/\/+$/, '')
        : pathname
}

export function isMarketingPath(pathname) {
    const normalizedPath = normalizePath(pathname)

    return normalizedPath === '/'
        || ALL_MARKETING_LOCALE_REGISTRY.some(locale => locale.path === normalizedPath)
}
