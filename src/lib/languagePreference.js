const SUPPORTED_LANGUAGES = Object.freeze(['zh', 'zhTW', 'en', 'ja', 'ko'])

export function resolvePreferredLanguage({ savedLanguage, browserLanguage }) {
    if (SUPPORTED_LANGUAGES.includes(savedLanguage)) return savedLanguage

    const language = String(browserLanguage || '').trim().toLowerCase()

    if (language === 'zh'
        || language.startsWith('zh-cn')
        || language.startsWith('zh-sg')
        || language.startsWith('zh-hans')) {
        return 'zh'
    }

    if (language.startsWith('zh-hant')
        || /^zh-(tw|hk|mo)(?:-|$)/.test(language)) {
        return 'zhTW'
    }

    const primaryLanguage = language.split('-')[0]
    if (['en', 'ja', 'ko'].includes(primaryLanguage)) return primaryLanguage

    return 'zh'
}
