import { MARKETING_LOCALE_REGISTRY } from './marketingLocales.js'

const ROOT_HOMEPAGE_BY_LANGUAGE = Object.freeze(Object.fromEntries(
    MARKETING_LOCALE_REGISTRY.map(locale => [
        locale.languageKey,
        Object.freeze({ experience: 'marketing', locale: locale.localeKey }),
    ]),
))

const LEGACY_ROOT_HOMEPAGE = Object.freeze({ experience: 'legacy' })

/**
 * Active Chinese languages share the Marketing component tree. The defensive
 * Legacy fallback remains for unknown values; stale retired preferences are
 * normalized before this resolver runs.
 */
export function resolveRootHomepage(language) {
    return ROOT_HOMEPAGE_BY_LANGUAGE[language] || LEGACY_ROOT_HOMEPAGE
}
