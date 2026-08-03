import { MARKETING_LOCALE_REGISTRY } from './marketingLocales.js'

export const MARKETING_ORIGIN = 'https://lutaai.com'
export const MARKETING_SOCIAL_IMAGE_URL = `${MARKETING_ORIGIN}/twitter_meta_img.png`

const OPEN_GRAPH_LOCALES = Object.freeze({
    'zh-cn': 'zh_CN',
    'zh-tw': 'zh_TW',
    en: 'en_US',
    ja: 'ja_JP',
    ko: 'ko_KR',
})

function normalizePathname(pathname) {
    if (!pathname || pathname === '/') return '/'
    return pathname.replace(/\/+$/, '') || '/'
}

export function getMarketingSeoModel(content, pathname = content.path) {
    const normalizedPath = normalizePathname(pathname)
    const canonicalPath = normalizedPath === '/' ? '/' : content.path
    const ogLocale = OPEN_GRAPH_LOCALES[content.localeKey]

    if (!ogLocale) throw new Error(`Unsupported Open Graph locale: ${content.localeKey}`)

    return Object.freeze({
        canonicalUrl: `${MARKETING_ORIGIN}${canonicalPath}`,
        description: content.metadata.description,
        imageAlt: content.metadata.title,
        imageUrl: MARKETING_SOCIAL_IMAGE_URL,
        keywords: content.metadata.keywords,
        ogLocale,
        ogLocaleAlternates: Object.entries(OPEN_GRAPH_LOCALES)
            .filter(([localeKey]) => localeKey !== content.localeKey)
            .map(([, locale]) => locale),
        title: content.metadata.title,
    })
}

function setMeta(documentRef, selector, attribute, value) {
    documentRef.querySelector(selector)?.setAttribute(attribute, value)
}

export function applyMarketingMetadata(
    content,
    {
        documentRef = globalThis.document,
        pathname = globalThis.location?.pathname || content.path,
    } = {},
) {
    if (!documentRef) return

    const seo = getMarketingSeoModel(content, pathname)
    documentRef.documentElement.lang = content.locale
    documentRef.title = seo.title

    setMeta(documentRef, 'link[rel="canonical"]', 'href', seo.canonicalUrl)
    setMeta(documentRef, 'meta[name="description"]', 'content', seo.description)
    setMeta(documentRef, 'meta[name="keywords"]', 'content', seo.keywords)
    setMeta(documentRef, 'meta[property="og:title"]', 'content', seo.title)
    setMeta(documentRef, 'meta[property="og:description"]', 'content', seo.description)
    setMeta(documentRef, 'meta[property="og:image"]', 'content', seo.imageUrl)
    setMeta(documentRef, 'meta[property="og:image:alt"]', 'content', seo.imageAlt)
    setMeta(documentRef, 'meta[property="og:url"]', 'content', seo.canonicalUrl)
    setMeta(documentRef, 'meta[property="og:locale"]', 'content', seo.ogLocale)
    setMeta(documentRef, 'meta[name="twitter:title"]', 'content', seo.title)
    setMeta(documentRef, 'meta[name="twitter:description"]', 'content', seo.description)
    setMeta(documentRef, 'meta[name="twitter:image"]', 'content', seo.imageUrl)
    setMeta(documentRef, 'meta[name="twitter:image:alt"]', 'content', seo.imageAlt)

    for (const tag of documentRef.querySelectorAll('meta[property="og:locale:alternate"]')) {
        tag.remove()
    }
    for (const locale of seo.ogLocaleAlternates) {
        const tag = documentRef.createElement('meta')
        tag.setAttribute('property', 'og:locale:alternate')
        tag.setAttribute('content', locale)
        documentRef.head.appendChild(tag)
    }
}

export const MARKETING_HREFLANG_LINKS = Object.freeze([
    ...MARKETING_LOCALE_REGISTRY.map(locale => Object.freeze({
        hreflang: locale.htmlLang,
        href: `${MARKETING_ORIGIN}${locale.path}`,
    })),
    Object.freeze({ hreflang: 'x-default', href: `${MARKETING_ORIGIN}/` }),
])
