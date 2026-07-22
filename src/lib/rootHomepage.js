const ROOT_HOMEPAGE_BY_LANGUAGE = Object.freeze({
    zh: Object.freeze({ experience: 'marketing', locale: 'zh-cn' }),
    zhTW: Object.freeze({ experience: 'marketing', locale: 'zh-tw' }),
})

const LEGACY_ROOT_HOMEPAGE = Object.freeze({ experience: 'legacy' })

/**
 * The new marketing homepage is approved only for Simplified and Traditional
 * Chinese. Keep the existing localized homepage for English, Japanese and
 * Korean until those marketing content versions have their own approval.
 */
export function resolveRootHomepage(language) {
    return ROOT_HOMEPAGE_BY_LANGUAGE[language] || LEGACY_ROOT_HOMEPAGE
}
