export const DEFAULT_LUTA_API_BASE = 'https://api.lutaai.com'

export function resolveLutaApiBase(value) {
    const candidate = typeof value === 'string' && value.trim()
        ? value.trim()
        : DEFAULT_LUTA_API_BASE

    try {
        const url = new URL(candidate)
        const isLocalDevelopment = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)
        const usesAllowedProtocol = url.protocol === 'https:'
            || (url.protocol === 'http:' && isLocalDevelopment)
        const normalizedPath = url.pathname.replace(/\/+$/, '')
        const usesAllowedPath = ['', '/api', '/api/v1'].includes(normalizedPath)

        if (
            !usesAllowedProtocol
            || !usesAllowedPath
            || url.username
            || url.password
            || url.search
            || url.hash
        ) {
            return DEFAULT_LUTA_API_BASE
        }

        return url.origin
    } catch {
        return DEFAULT_LUTA_API_BASE
    }
}

const lutaApiBase = resolveLutaApiBase(
    import.meta.env?.VITE_LUTA_API_BASE
    || import.meta.env?.VITE_API_BASE,
)

export const config = {
    api: {
        base: lutaApiBase,
    },
    app: {
        name: '汝塔APP',
        description: '读经伴侣 - 让每个读经都充满生机'
    },
    downloads: {
        appStore: 'https://apps.apple.com/cn/app/%E6%B1%9D%E5%A1%94/id6752280249',
        appStoreGlobal: 'https://apps.apple.com/app/id6778084383',
        iosTestFlight: 'itms-beta://testflight.apple.com/join/48vCAeVp',
        iosTestFlightWeb: 'https://testflight.apple.com/join/48vCAeVp',
        testFlightAppStore: 'https://apps.apple.com/cn/app/testflight/id899247664?mt=8',
        googlePlay: 'https://play.google.com/store/apps/details?id=com.luta.reader',
        installDoc: 'https://gcnrjk2sw7wg.feishu.cn/docx/GvqHdM6ikoXXhhxcavYcq0owndb'
    },
    attribution: {
        continueBase: import.meta.env?.VITE_ATTRIBUTION_CONTINUE_BASE || 'https://go.lutaai.com',
        defaultSlug: import.meta.env?.VITE_ATTRIBUTION_DEFAULT_SLUG || 'website-direct',
        legacySlugMarkets: {
            'cn-store': 'cn',
            'global-store': 'global',
        },
    },
    smartLink: {
        installContextBase: `${lutaApiBase}/api/v1/public/attribution/install-context`,
        legacyInstallContextBase: `${lutaApiBase}/api/v1/public/attribution/legacy-install-context`,
        installEventBase: `${lutaApiBase}/api/v1/public/attribution/install-event`,
        appLinkBase: 'https://link.lutaai.com/l',
        outBase: 'https://go.lutaai.com/out',
        legacyOutBase: 'https://go.lutaai.com/r',
        // Opt-in until QA proves state privacy, routing continuity and rollback.
        // Existing links continue to land on /install when this is disabled.
        homepageSurfaceEnabled: import.meta.env?.VITE_SMART_LINK_HOMEPAGE_SURFACE === 'true',
    },
    analytics: {
        posthogKey: import.meta.env?.VITE_POSTHOG_KEY || 'phc_AJ9WrJztG6H87z7xD7Xfa97abfCau4EbYXMSDUxo6Rsv',
        posthogHost: import.meta.env?.VITE_POSTHOG_HOST || 'https://posthog.lutaai.com',
        captureDevelopment: import.meta.env?.VITE_POSTHOG_CAPTURE_DEVELOPMENT === 'true',
    },
    springFestival: {
        puzzleUrl: 'https://game.lutaai.com',
    },
    support: {
        wechatId: 'aiyoooxin',
    },
    pages: {
        privacy: '/privacy',
        terms: '/terms',
        contact: '/contact'
    },
    social: {
        twitter: 'https://x.com/yooxin_tech',
        github: 'https://github.com/lutaSci',
        email: 'aivor@lutaai.com'
    },
    wecomQrCode: 'https://luta-app.oss-cn-beijing.aliyuncs.com/assets/%E6%B1%9D%E5%A1%94%E5%86%85%E6%B5%8B%E9%80%9A%E7%9F%A5%E7%BE%A4.png'
} 
