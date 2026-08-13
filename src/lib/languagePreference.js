import { isActiveMarketingLanguage } from './marketingLocales.js'

const TRADITIONAL_REGIONS = Object.freeze(new Set(['tw', 'hk', 'mo']))
const SIMPLIFIED_REGIONS = Object.freeze(new Set(['cn', 'sg']))
const TRADITIONAL_TIME_ZONES = Object.freeze(new Set([
    'asia/taipei',
    'asia/hong_kong',
    'asia/macau',
    'asia/macao',
]))

function normalizeLanguageTag(language) {
    return String(language || '')
        .trim()
        .toLowerCase()
        .replaceAll('_', '-')
}

function classifyChineseTag(language) {
    const parts = normalizeLanguageTag(language).split('-').filter(Boolean)
    if (parts[0] !== 'zh') return null

    if (parts.includes('hant') || parts.some(part => TRADITIONAL_REGIONS.has(part))) {
        return 'zhTW'
    }

    if (parts.includes('hans') || parts.some(part => SIMPLIFIED_REGIONS.has(part))) {
        return 'zh'
    }

    return null
}

function hasTraditionalRegion(language) {
    const parts = normalizeLanguageTag(language).split('-').filter(Boolean)
    return parts.some(part => TRADITIONAL_REGIONS.has(part))
}

function collectBrowserLanguages(browserLanguages, browserLanguage) {
    const languages = Array.isArray(browserLanguages) ? browserLanguages : []
    const fallbackLanguage = normalizeLanguageTag(browserLanguage)
    const normalizedLanguages = languages.map(normalizeLanguageTag).filter(Boolean)

    if (fallbackLanguage && !normalizedLanguages.includes(fallbackLanguage)) {
        normalizedLanguages.push(fallbackLanguage)
    }

    return normalizedLanguages
}

export function resolvePreferredLanguage({
    explicitLanguage,
    savedLanguage,
    browserLanguages,
    browserLanguage,
    timeZone,
} = {}) {
    if (isActiveMarketingLanguage(explicitLanguage)) return explicitLanguage
    if (isActiveMarketingLanguage(savedLanguage)) return savedLanguage

    const languages = collectBrowserLanguages(browserLanguages, browserLanguage)

    for (const language of languages) {
        const chinesePreference = classifyChineseTag(language)
        if (chinesePreference) return chinesePreference
    }

    if (languages.some(hasTraditionalRegion)) return 'zhTW'

    if (TRADITIONAL_TIME_ZONES.has(String(timeZone || '').trim().toLowerCase())) {
        return 'zhTW'
    }

    return 'zh'
}
