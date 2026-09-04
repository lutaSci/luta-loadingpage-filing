import { config } from '../config/index.js'
import {
    getAttributionEntryType,
    getAttributionState,
    getTrafficPurpose,
    resolveRouteContext,
} from './attributionState.js'
import { detectDevice, detectIsMainlandChina } from './deviceDetection.js'
import { hasSmartLinkBearer } from './smartLinkEntry.js'
import {
    MEASUREMENT_CONSENT_VALUES,
    readMeasurementConsent,
    subscribeMeasurementConsent,
} from './measurementConsent.js'

export const GOOGLE_ANALYTICS_ID = 'G-5QE6T3L0LD'
export const GOOGLE_CTA_EVENT_NAME = 'website_download_cta_clicked'
export const META_CTA_EVENT_NAME = 'WebsiteDownloadCtaClicked'

let posthogClientPromise = null
let googleAnalyticsInitialized = false
let lastPosthogPageViewSignature = null
let lastPosthogNativePageViewLocation = null
let previousPosthogPageLocation = null
let lastGooglePageViewLocation = null
let previousGooglePageLocation = null
let metaPixelInitialized = false
let lastMetaPageViewLocation = null
let latestAdvertisingPageProperties = null
let measurementConsentUnsubscribe = null

export const WEBSITE_EVENT_NAMES = Object.freeze([
    'website_page_viewed',
    'website_download_option_viewed',
    GOOGLE_CTA_EVENT_NAME,
])
const WEBSITE_EVENT_NAME_SET = new Set(WEBSITE_EVENT_NAMES)

export const INSTALL_WEB_EVENT_NAMES = Object.freeze([
    'install_gate_viewed',
    'install_option_selected',
    'install_recovery_action_clicked',
])
const INSTALL_EVENT_NAMES = new Set(INSTALL_WEB_EVENT_NAMES)
// deep_link_handled is part of the approved dictionary but is emitted only by
// the mobile client after it receives and resolves the link.

const TRAFFIC_PURPOSES = new Set([
    'production',
    'qa',
    'smoke',
    'internal',
    'development',
    'unknown',
])
const ENTRY_TYPES = new Set(['direct', 'direct_utm', 'shortlink'])
const ROUTE_MARKETS = new Set(['cn', 'global', 'unknown'])
const ROUTE_MARKET_SOURCES = new Set([
    'slug',
    'attribution_param',
    'legacy_slug_map',
    'heuristic',
    'smart_link_context',
    'unknown',
])
const DEVICE_OS_VALUES = new Set([
    'ios',
    'android',
    'harmonyos',
    'harmonyos_next',
    'desktop',
    'unknown',
])
const TOKEN_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const CAMPAIGN_TOKEN_RE = /^[A-Za-z0-9][A-Za-z0-9._~+:/-]*$/

const WEBSITE_PROPERTY_KEYS = new Set([
    'surface',
    'page_path',
    'entry_type',
    'route_market',
    'route_market_source',
    'traffic_purpose',
    'device_os',
    'locale',
    'slug',
    'click_id',
    'link_id',
    'option_id',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'content_id',
    'operator',
    'acquisition_platform',
    'cta_target',
    'placement',
    'experiment_key',
    'experiment_variant',
])

const INSTALL_PROPERTY_KEYS = new Set([
    'surface',
    'page_path',
    'device_os',
    'locale',
    'wechat_environment',
    'has_state',
    'load_status',
    'contract_version',
    'traffic_purpose',
    'campaign_target_market',
    'recommended_region',
    'distribution_region_choice',
    'option_id',
    'distribution_channel',
    'option_region',
    'availability_status',
    'market_choice_relation',
    'option_count',
    'decision_reason',
    'recovery_action',
    'terminal_outcome',
    'entry_context',
    'artifact_id',
    'link_id',
    'click_id',
])

function normalizeEnum(value, allowed, fallback = 'unknown') {
    return typeof value === 'string' && allowed.has(value) ? value : fallback
}

function sanitizeText(value, maxLength) {
    if (typeof value !== 'string' && typeof value !== 'number') return null
    const normalized = String(value).trim()
    if (!normalized || normalized.length > maxLength) return null
    if (Array.from(normalized).some(character => {
        const codePoint = character.codePointAt(0)
        return codePoint <= 31 || codePoint === 127
    })) return null
    return normalized
}

function sanitizeToken(value, maxLength = 128) {
    const normalized = sanitizeText(value, maxLength)
    return normalized && TOKEN_RE.test(normalized) ? normalized : null
}

function containsLikelyPersonalData(value) {
    return /@/.test(value)
        || /(?:^|\D)(?:\+?\d[\s().-]*){7,}(?:$|\D)/.test(value)
}

export function sanitizeGoogleCampaignValue(value) {
    const normalized = sanitizeText(value, 100)
    if (
        !normalized
        || !CAMPAIGN_TOKEN_RE.test(normalized)
        || containsLikelyPersonalData(normalized)
    ) return null
    return normalized
}

function sanitizePagePath(value) {
    const normalized = sanitizeText(value, 256)
    if (!normalized || !normalized.startsWith('/')) return '/'
    return normalized.split(/[?#]/, 1)[0] || '/'
}

function sanitizeLocale(value) {
    const normalized = sanitizeText(value, 32)
    return normalized && /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(normalized)
        ? normalized
        : 'unknown'
}

function sanitizeApprovedWebsiteValue(key, value) {
    if (key === 'surface') return value === 'official_website' ? value : null
    if (key === 'page_path') return sanitizePagePath(value)
    if (key === 'entry_type') return normalizeEnum(value, ENTRY_TYPES)
    if (key === 'route_market') return normalizeEnum(value, ROUTE_MARKETS)
    if (key === 'route_market_source') return normalizeEnum(value, ROUTE_MARKET_SOURCES)
    if (key === 'traffic_purpose') return normalizeEnum(value, TRAFFIC_PURPOSES)
    if (key === 'device_os') return normalizeEnum(value, DEVICE_OS_VALUES)
    if (key === 'locale') return sanitizeLocale(value)
    if (key === 'slug') return sanitizeToken(value, 80)
    if (['click_id', 'link_id', 'option_id'].includes(key)) return sanitizeToken(value, 128)
    if ([
        'cta_target',
        'placement',
        'acquisition_platform',
        'experiment_key',
        'experiment_variant',
    ].includes(key)) {
        return sanitizeToken(value, 80)
    }
    if (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].includes(key)) {
        const normalized = sanitizeText(value, 128)
        return normalized && !containsLikelyPersonalData(normalized) ? normalized : null
    }
    if (['content_id', 'operator'].includes(key)) {
        const normalized = sanitizeText(value, 128)
        return normalized && !containsLikelyPersonalData(normalized) ? normalized : null
    }
    return null
}

export function sanitizeWebsiteProperties(params) {
    const safe = {}
    for (const [key, value] of Object.entries(params || {})) {
        if (!WEBSITE_PROPERTY_KEYS.has(key)) continue
        const normalized = sanitizeApprovedWebsiteValue(key, value)
        if (normalized !== null) safe[key] = normalized
    }
    return safe
}

export function sanitizeInstallProperties(params) {
    const safe = {}
    Object.entries(params || {}).forEach(([key, value]) => {
        if (!INSTALL_PROPERTY_KEYS.has(key)) return
        if (['artifact_id', 'click_id', 'link_id', 'option_id'].includes(key)) {
            const normalized = sanitizeToken(value, 128)
            if (normalized) safe[key] = normalized
            return
        }
        if (key === 'traffic_purpose') {
            safe[key] = normalizeEnum(value, TRAFFIC_PURPOSES)
            return
        }
        if (key === 'page_path') {
            safe[key] = sanitizePagePath(value)
            return
        }
        if (key === 'locale') {
            safe[key] = sanitizeLocale(value)
            return
        }
        if (typeof value === 'boolean' || typeof value === 'number') {
            safe[key] = value
            return
        }
        const normalized = sanitizeText(value, 160)
        if (normalized && !containsLikelyPersonalData(normalized)) safe[key] = normalized
    })
    return safe
}

function isLocalHostname(hostname) {
    return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)
}

function safePageLocation(pagePath, runtimeWindow = globalThis.window) {
    if (!runtimeWindow?.location) return null
    return `${runtimeWindow.location.origin}${sanitizePagePath(pagePath)}`
}

function safeReferrer(value) {
    if (!value) return null
    try {
        const url = new URL(value)
        if (!['http:', 'https:'].includes(url.protocol)) return null
        return `${url.origin}${url.pathname}`
    } catch {
        return null
    }
}

function safeDomainProperty(value) {
    if (value === '$direct') return value
    const normalized = sanitizeText(value, 253)?.toLowerCase()
    if (
        !normalized
        || normalized.includes('/')
        || normalized.includes('?')
        || normalized.includes('#')
        || normalized.includes('@')
    ) return null
    return normalized
}

function safeReferringDomain(value) {
    const referrer = safeReferrer(value)
    if (!referrer) return '$direct'
    try {
        return safeDomainProperty(new URL(referrer).hostname) || '$direct'
    } catch {
        return '$direct'
    }
}

function safeUrlProperty(value) {
    if (!value || value === '$direct') return value || null
    try {
        const url = new URL(value)
        if (!['http:', 'https:'].includes(url.protocol)) return null
        return `${url.origin}${url.pathname}`
    } catch {
        return null
    }
}

const POSTHOG_URL_PROPERTIES = new Set([
    '$current_url',
    '$initial_current_url',
    '$referrer',
    '$initial_referrer',
    '$session_entry_url',
    '$session_entry_referrer',
])
const POSTHOG_DOMAIN_PROPERTIES = new Set([
    '$host',
    '$referring_domain',
    '$initial_referring_domain',
    '$session_entry_referring_domain',
])
const POSTHOG_PATH_PROPERTIES = new Set(['$pathname'])

const POSTHOG_CAMPAIGN_PROPERTY_RE = /^(?:\$initial_|\$session_entry_)?utm_(?:source|medium|campaign|content|term)$/
const POSTHOG_SENSITIVE_ATTRIBUTION_RE = /^(?:\$initial_|\$session_entry_)?(?:state|legacy_slug|invite_code|gclid|dclid|fbclid|msclkid|ttclid|twclid|li_fat_id)$/i

export function sanitizePosthogCapture(data) {
    if (!data?.properties || typeof data.properties !== 'object') return data

    const properties = { ...data.properties }
    for (const [key, value] of Object.entries(properties)) {
        if (POSTHOG_URL_PROPERTIES.has(key)) {
            const safe = safeUrlProperty(value)
            if (safe) properties[key] = safe
            else delete properties[key]
            continue
        }
        if (POSTHOG_DOMAIN_PROPERTIES.has(key)) {
            const safe = safeDomainProperty(value)
            if (safe) properties[key] = safe
            else delete properties[key]
            continue
        }
        if (POSTHOG_PATH_PROPERTIES.has(key)) {
            properties[key] = sanitizePagePath(value)
            continue
        }
        if (POSTHOG_CAMPAIGN_PROPERTY_RE.test(key)) {
            const safe = sanitizeText(value, 128)
            if (safe && !containsLikelyPersonalData(safe)) properties[key] = safe
            else delete properties[key]
            continue
        }
        if (POSTHOG_SENSITIVE_ATTRIBUTION_RE.test(key)) delete properties[key]
    }

    return { ...data, properties }
}

const POSTHOG_PAGEVIEW_CONTEXT_KEYS = [
    'surface',
    'page_path',
    'traffic_purpose',
    'device_os',
    'locale',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
]

export function buildPosthogPageViewPayload(
    properties,
    {
        documentReferrer = globalThis.document?.referrer || '',
        previousPageLocation = null,
        runtimeWindow = globalThis.window,
    } = {},
) {
    const safe = sanitizeWebsiteProperties(properties)
    const pageLocation = safePageLocation(safe.page_path, runtimeWindow)
    const host = safeDomainProperty(runtimeWindow?.location?.hostname)
    if (!pageLocation || !host) return null

    const payload = {}
    for (const key of POSTHOG_PAGEVIEW_CONTEXT_KEYS) {
        if (safe[key] !== undefined) payload[key] = safe[key]
    }
    const referrer = safeReferrer(previousPageLocation || documentReferrer)
    return {
        ...payload,
        $current_url: pageLocation,
        $host: host,
        $pathname: safe.page_path || '/',
        $referrer: referrer && referrer !== pageLocation ? referrer : '$direct',
        $referring_domain: referrer && referrer !== pageLocation
            ? safeReferringDomain(referrer)
            : '$direct',
    }
}

function hasAnalyticsBearer(runtimeWindow = globalThis.window) {
    return Boolean(runtimeWindow?.location && hasSmartLinkBearer(runtimeWindow.location.search))
}

export function shouldCaptureGoogleAnalytics(
    properties,
    runtimeWindow = globalThis.window,
) {
    if (!runtimeWindow?.location || runtimeWindow.location.protocol !== 'https:') return false
    if (!['lutaai.com', 'www.lutaai.com'].includes(runtimeWindow.location.hostname)) return false
    if (hasAnalyticsBearer(runtimeWindow)) return false
    return properties?.traffic_purpose === 'production'
}

export function shouldCaptureAdvertisingMeasurement(
    properties,
    runtimeWindow = globalThis.window,
    consent = readMeasurementConsent(),
) {
    return consent === MEASUREMENT_CONSENT_VALUES.granted
        && shouldCaptureGoogleAnalytics(properties, runtimeWindow)
}

export function buildGooglePageViewPayload(
    properties,
    {
        documentTitle = globalThis.document?.title || '',
        documentReferrer = globalThis.document?.referrer || '',
        previousPageLocation = null,
        runtimeWindow = globalThis.window,
    } = {},
) {
    const safe = sanitizeWebsiteProperties(properties)
    const pageLocation = safePageLocation(safe.page_path, runtimeWindow)
    if (!pageLocation) return null

    const payload = {
        send_to: GOOGLE_ANALYTICS_ID,
        page_location: pageLocation,
        page_title: sanitizeText(documentTitle, 300) || pageLocation,
    }
    const referrer = safeReferrer(previousPageLocation || documentReferrer)
    if (referrer && referrer !== pageLocation) payload.page_referrer = referrer

    const campaignFields = {
        campaign_source: safe.utm_source,
        campaign_medium: safe.utm_medium,
        campaign_name: safe.utm_campaign,
        campaign_content: safe.utm_content,
        campaign_term: safe.utm_term,
    }
    for (const [key, value] of Object.entries(campaignFields)) {
        const normalized = sanitizeGoogleCampaignValue(value)
        if (normalized) payload[key] = normalized
    }
    return payload
}

export function buildGoogleCtaPayload(
    properties,
    { runtimeWindow = globalThis.window } = {},
) {
    const safe = sanitizeWebsiteProperties(properties)
    const payload = { send_to: GOOGLE_ANALYTICS_ID }
    const pageLocation = safePageLocation(safe.page_path, runtimeWindow)
    if (pageLocation) payload.page_location = pageLocation
    for (const key of [
        'cta_target',
        'placement',
        'entry_type',
        'route_market',
        'device_os',
        'locale',
        'page_path',
    ]) {
        if (safe[key] !== undefined) payload[key] = safe[key]
    }
    return payload
}

export function buildMetaCtaPayload(properties) {
    const safe = sanitizeWebsiteProperties(properties)
    const payload = {}
    for (const key of [
        'cta_target',
        'placement',
        'entry_type',
        'route_market',
        'device_os',
        'locale',
        'page_path',
    ]) {
        if (safe[key] !== undefined) payload[key] = safe[key]
    }
    return payload
}

function googleAdStorageConsent() {
    return readMeasurementConsent() === MEASUREMENT_CONSENT_VALUES.granted
        ? 'granted'
        : 'denied'
}

function initializeGoogleAnalytics(properties) {
    if (!shouldCaptureGoogleAnalytics(properties)) return false
    if (googleAnalyticsInitialized) return true

    window.dataLayer = window.dataLayer || []
    window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments)
    }
    window.gtag('consent', 'default', {
        ad_storage: googleAdStorageConsent(),
        ad_user_data: 'denied',
        ad_personalization: 'denied',
    })
    window.gtag('js', new Date())
    const pageLocation = safePageLocation(properties.page_path)
    const pageReferrer = safeReferrer(document.referrer)
    window.gtag('config', GOOGLE_ANALYTICS_ID, {
        allow_ad_personalization_signals: false,
        allow_google_signals: false,
        ...(pageLocation ? { page_location: pageLocation } : {}),
        ...(pageReferrer ? { page_referrer: pageReferrer } : {}),
        send_page_view: false,
    })

    const script = document.createElement('script')
    script.async = true
    script.dataset.lutaAnalyticsProvider = 'google'
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`
    document.head.appendChild(script)
    googleAnalyticsInitialized = true
    return true
}

function updateGoogleAdvertisingConsent(value) {
    if (!googleAnalyticsInitialized || typeof globalThis.window?.gtag !== 'function') return false
    globalThis.window.gtag('consent', 'update', {
        ad_storage: value === MEASUREMENT_CONSENT_VALUES.granted ? 'granted' : 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
    })
    return true
}

function initializeMetaPixel(properties) {
    if (
        !config.analytics.metaPixelEnabled
        || !config.analytics.metaPixelId
        || !shouldCaptureAdvertisingMeasurement(properties)
    ) return false
    if (metaPixelInitialized) return true

    const fbq = window.fbq || function fbq() {
        if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments)
        else fbq.queue.push(arguments)
    }
    if (!window.fbq) {
        window.fbq = fbq
        window._fbq = fbq
        fbq.push = fbq
        fbq.loaded = true
        fbq.version = '2.0'
        fbq.queue = []
    }
    window.fbq('init', config.analytics.metaPixelId)

    const script = document.createElement('script')
    script.async = true
    script.dataset.lutaAnalyticsProvider = 'meta'
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
    metaPixelInitialized = true
    return true
}

function trackMetaPageView(properties) {
    if (!shouldCaptureAdvertisingMeasurement(properties)) return false
    const pageLocation = safePageLocation(properties.page_path)
    if (!pageLocation || pageLocation === lastMetaPageViewLocation) return false
    if (!initializeMetaPixel(properties)) return false
    window.fbq('track', 'PageView')
    lastMetaPageViewLocation = pageLocation
    return true
}

function trackMetaCta(properties) {
    if (!shouldCaptureAdvertisingMeasurement(properties)) return false
    if (!initializeMetaPixel(properties)) return false
    window.fbq('trackCustom', META_CTA_EVENT_NAME, buildMetaCtaPayload(properties))
    return true
}

function ensureMeasurementConsentListener() {
    if (measurementConsentUnsubscribe || typeof window === 'undefined') return
    measurementConsentUnsubscribe = subscribeMeasurementConsent(value => {
        updateGoogleAdvertisingConsent(value)
        if (
            value === MEASUREMENT_CONSENT_VALUES.granted
            && latestAdvertisingPageProperties
        ) trackMetaPageView(latestAdvertisingPageProperties)
    })
}

export const initializeAnalytics = () => {
    if (typeof window === 'undefined' || hasAnalyticsBearer(window)) return Promise.resolve(null)
    const isLocal = isLocalHostname(window.location.hostname)
    if (!config.analytics.posthogKey || (isLocal && !config.analytics.captureDevelopment)) {
        return Promise.resolve(null)
    }

    if (!posthogClientPromise) {
        posthogClientPromise = import('posthog-js').then(({ default: posthog }) => {
            posthog.init(config.analytics.posthogKey, {
                api_host: config.analytics.posthogHost,
                ui_host: config.analytics.posthogHost,
                autocapture: false,
                capture_pageview: false,
                capture_pageleave: false,
                before_send: sanitizePosthogCapture,
                // This surface only emits explicit capture calls. Keep optional
                // PostHog features from loading remote config or dependencies so
                // analytics outages never leak browser-console errors into the
                // installation journey.
                disable_external_dependency_loading: true,
                advanced_disable_flags: true,
                disable_surveys: true,
                disable_web_experiments: true,
                disable_session_recording: true,
                person_profiles: 'identified_only',
                persistence: 'localStorage+cookie',
                save_campaign_params: false,
                save_referrer: false,
            })
            return posthog
        }).catch(() => {
            posthogClientPromise = null
            return null
        })
    }
    return posthogClientPromise
}

export function resolveWebsiteDeviceOs(device) {
    if (device?.isHarmonyOSNext) return 'harmonyos_next'
    if (device?.isIOS) return 'ios'
    if (device?.isAndroid) return 'android'
    if (device?.isHarmonyOS) return 'harmonyos'
    return 'desktop'
}

function websiteContext() {
    const attribution = getAttributionState()
    const route = resolveRouteContext(detectIsMainlandChina())
    const device = detectDevice()

    return sanitizeWebsiteProperties({
        surface: 'official_website',
        page_path: window.location.pathname,
        entry_type: getAttributionEntryType(),
        route_market: route.market,
        route_market_source: route.source,
        traffic_purpose: getTrafficPurpose(),
        device_os: resolveWebsiteDeviceOs(device),
        locale: navigator.language || 'unknown',
        slug: attribution?.slug,
        click_id: attribution?.click_id,
        utm_source: attribution?.utm_source,
        utm_medium: attribution?.utm_medium,
        utm_campaign: attribution?.utm_campaign,
        utm_content: attribution?.utm_content,
        utm_term: attribution?.utm_term,
        content_id: attribution?.content_id,
        operator: attribution?.operator,
        acquisition_platform: attribution?.platform,
    })
}

function capturePosthogEvent(eventName, properties) {
    if (hasAnalyticsBearer(window)) return false
    const pageLocation = safePageLocation(properties.page_path)
    initializeAnalytics()
        .then(posthog => posthog?.capture(eventName, {
            ...properties,
            // PostHog adds the current URL automatically. Override it with a
            // canonical path so query parameters never enter the payload.
            ...(pageLocation ? { $current_url: pageLocation } : {}),
        }))
        .catch(() => {})
    return true
}

function capturePosthogPageView(properties) {
    if (hasAnalyticsBearer(window)) return false
    const pageViewPayload = buildPosthogPageViewPayload(properties, {
        previousPageLocation: previousPosthogPageLocation,
    })
    if (!pageViewPayload) return false

    const pageLocation = pageViewPayload.$current_url
    const shouldCaptureNativePageView = pageLocation !== lastPosthogNativePageViewLocation
    initializeAnalytics()
        .then(posthog => {
            if (!posthog) return
            // Keep the native web-analytics fact separate from Luta's richer
            // Smart Link journey event. Ordering lets the standard page view
            // establish the PostHog session before the custom event arrives.
            if (shouldCaptureNativePageView) posthog.capture('$pageview', pageViewPayload)
            posthog.capture('website_page_viewed', {
                ...properties,
                $current_url: pageLocation,
            })
        })
        .catch(() => {})
    if (shouldCaptureNativePageView) {
        lastPosthogNativePageViewLocation = pageLocation
        previousPosthogPageLocation = pageLocation
    }
    return true
}

function trackGooglePageView(properties) {
    if (!shouldCaptureGoogleAnalytics(properties)) return false
    const payload = buildGooglePageViewPayload(properties, {
        previousPageLocation: previousGooglePageLocation,
    })
    if (!payload || payload.page_location === lastGooglePageViewLocation) return false
    if (!initializeGoogleAnalytics(properties)) return false
    window.gtag('event', 'page_view', payload)
    previousGooglePageLocation = payload.page_location
    lastGooglePageViewLocation = payload.page_location
    return true
}

function trackGoogleCta(properties) {
    if (!shouldCaptureGoogleAnalytics(properties)) return false
    if (!initializeGoogleAnalytics(properties)) return false
    window.gtag('event', GOOGLE_CTA_EVENT_NAME, buildGoogleCtaPayload(properties))
    return true
}

export const trackWebsiteEvent = (eventName, params = {}) => {
    if (!WEBSITE_EVENT_NAME_SET.has(eventName) || typeof window === 'undefined') return false
    const properties = sanitizeWebsiteProperties({
        ...websiteContext(),
        ...params,
    })
    const captured = capturePosthogEvent(eventName, properties)
    if (eventName === GOOGLE_CTA_EVENT_NAME) {
        trackGoogleCta(properties)
        trackMetaCta(properties)
    }
    return captured
}

export const trackWebsitePageView = (params = {}) => {
    if (typeof window === 'undefined' || hasAnalyticsBearer(window)) return false
    const properties = sanitizeWebsiteProperties({
        ...websiteContext(),
        ...params,
    })
    latestAdvertisingPageProperties = properties
    ensureMeasurementConsentListener()
    const signature = [
        properties.page_path,
        properties.locale,
        properties.entry_type,
        properties.click_id || '',
    ].join(':')
    if (signature === lastPosthogPageViewSignature) return false

    const captured = capturePosthogPageView(properties)
    if (captured) lastPosthogPageViewSignature = signature
    trackGooglePageView(properties)
    trackMetaPageView(properties)
    return captured
}

/**
 * Smart Link v2 and legacy-bridge events use a separate surface and allowlist.
 * Signed state, full URLs, UTM free text and user-entered data are never sent.
 */
export const trackInstallEvent = (eventName, params = {}) => {
    if (
        !INSTALL_EVENT_NAMES.has(eventName)
        || typeof window === 'undefined'
        || hasAnalyticsBearer(window)
    ) return false
    const device = detectDevice()
    const properties = sanitizeInstallProperties({
        surface: 'install_gate',
        page_path: '/install',
        device_os: device.isIOS
            ? 'ios'
            : device.isHarmonyOSNext
                ? 'harmonyos_next'
                : device.isAndroid
                    ? 'android'
                    : device.isHarmonyOS
                        ? 'harmonyos_next'
                        : 'desktop',
        locale: navigator.language || 'unknown',
        ...params,
    })
    const pageLocation = safePageLocation(properties.page_path)

    initializeAnalytics()
        .then(posthog => posthog?.capture(eventName, {
            ...properties,
            ...(pageLocation ? { $current_url: pageLocation } : {}),
        }))
        .catch(() => {})
    return true
}
