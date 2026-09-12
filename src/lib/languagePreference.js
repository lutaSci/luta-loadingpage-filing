import { isActiveMarketingLanguage } from './marketingLocales.js'

const MAINLAND_TIME_ZONES = new Set([
    'asia/shanghai',
    'asia/chongqing',
    'asia/urumqi',
    'asia/harbin',
    'asia/chungking',
    'prc',
])

export function resolvePreferredLanguage({
    explicitLanguage,
    savedLanguage,
    timeZone,
} = {}) {
    if (isActiveMarketingLanguage(explicitLanguage)) return explicitLanguage
    if (isActiveMarketingLanguage(savedLanguage)) return savedLanguage

    // Timezone is a local region signal, not proof of the visitor's IP location.
    // Browser language must not override the region default in either direction.
    const isMainland = MAINLAND_TIME_ZONES.has(String(timeZone || '').trim().toLowerCase())
    return isMainland ? 'zh' : 'zhTW'
}
