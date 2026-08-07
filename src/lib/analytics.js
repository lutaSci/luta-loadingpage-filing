import { config } from '../config/index.js'
import {
    getAttributionEntryType,
    getAttributionState,
    getTrafficPurpose,
    resolveRouteContext,
} from './attributionState.js'
import { detectDevice, detectIsMainlandChina } from './deviceDetection.js'

let posthogClientPromise = null
let googleAnalyticsInitialized = false

export const WEBSITE_EVENT_NAMES = Object.freeze([
    'website_page_viewed',
    'website_download_option_viewed',
    'website_download_cta_clicked',
])
const WEBSITE_EVENTS = new Set(WEBSITE_EVENT_NAMES)

export const INSTALL_WEB_EVENT_NAMES = Object.freeze([
    'install_gate_viewed',
    'install_option_selected',
    'install_recovery_action_clicked',
])
const INSTALL_EVENT_NAMES = new Set(INSTALL_WEB_EVENT_NAMES)
// deep_link_handled is part of the approved dictionary but is emitted only by
// the mobile client after it receives and resolves the link.

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
    'option_id',
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

const LEGACY_GA_PROPERTY_KEYS = new Set([
    'click_id',
    'utm_campaign',
    'content_id',
    'source',
    'tab',
    'expanded',
    'placement',
])

const OPAQUE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const CAMPAIGN_PROPERTY_LIMITS = Object.freeze({
    utm_source: 128,
    utm_medium: 128,
    utm_campaign: 128,
    utm_content: 128,
    utm_term: 128,
})

function isLocalHostname(hostname) {
    return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)
}

function hasControlCharacter(value) {
    return [...value].some(character => {
        const codePoint = character.codePointAt(0)
        return codePoint <= 31 || codePoint === 127
    })
}

function sanitizeProperties(params, allowedKeys) {
    const safe = {}
    Object.entries(params || {}).forEach(([key, value]) => {
        if (!allowedKeys.has(key) || value === undefined || value === null) return
        if (key === 'click_id' || key === 'link_id') {
            if (typeof value === 'string' && OPAQUE_ID_RE.test(value)) safe[key] = value
            return
        }
        if (key === 'page_path') {
            if (
                typeof value === 'string'
                && value.startsWith('/')
                && value.length <= 256
                && !value.includes('?')
                && !value.includes('#')
                && !hasControlCharacter(value)
            ) safe[key] = value
            return
        }
        if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
            safe[key] = value
            return
        }
        const limit = CAMPAIGN_PROPERTY_LIMITS[key] || 160
        if (
            typeof value === 'string'
            && value.length <= limit
            && !hasControlCharacter(value)
        ) safe[key] = value
    })
    return safe
}

export function sanitizeWebsiteProperties(params) {
    return sanitizeProperties(params, WEBSITE_PROPERTY_KEYS)
}

export function sanitizeInstallProperties(params) {
    return sanitizeProperties(params, INSTALL_PROPERTY_KEYS)
}

function sanitizeLegacyGaProperties(params) {
    return sanitizeProperties(params, LEGACY_GA_PROPERTY_KEYS)
}

export const initializeAnalytics = () => {
    if (typeof window === 'undefined') return Promise.resolve(null)
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
            })
            return posthog
        })
    }
    return posthogClientPromise
}

export function shouldCaptureGoogleAnalytics(
    properties,
    hostname = typeof window === 'undefined' ? '' : window.location.hostname,
    captureDevelopment = config.analytics.captureGaDevelopment,
) {
    if (!config.analytics.gaId) return false
    if (properties?.traffic_purpose !== 'production') return false
    return !isLocalHostname(hostname) || captureDevelopment
}

export function buildGoogleAnalyticsConfig(
    properties = {},
    location = typeof window === 'undefined' ? null : window.location,
    pageTitle = typeof document === 'undefined' ? '' : document.title,
) {
    const pagePath = properties.page_path || location?.pathname || '/'
    const result = {
        send_page_view: false,
        page_location: location ? `${location.origin}${pagePath}` : pagePath,
        page_path: pagePath,
    }
    if (pageTitle) result.page_title = pageTitle

    const campaignMappings = {
        utm_source: 'campaign_source',
        utm_medium: 'campaign_medium',
        utm_campaign: 'campaign_name',
        utm_term: 'campaign_term',
        utm_content: 'campaign_content',
    }
    Object.entries(campaignMappings).forEach(([property, gaField]) => {
        if (properties[property]) result[gaField] = properties[property]
    })
    return result
}

function initializeGoogleAnalytics(properties) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false
    if (!shouldCaptureGoogleAnalytics(properties)) return false

    window.dataLayer = window.dataLayer || []
    window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments)
    }

    if (!document.querySelector('script[data-luta-ga4]')) {
        const gaScript = document.createElement('script')
        gaScript.async = true
        gaScript.dataset.lutaGa4 = 'true'
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.analytics.gaId)}`
        document.head.appendChild(gaScript)
    }

    if (!googleAnalyticsInitialized) {
        googleAnalyticsInitialized = true
        window.gtag('js', new Date())
        window.gtag('config', config.analytics.gaId, buildGoogleAnalyticsConfig(properties))
    }
    return true
}

function sendGoogleAnalyticsEvent(eventName, properties) {
    if (!initializeGoogleAnalytics(properties)) return
    window.gtag('event', eventName, {
        send_to: config.analytics.gaId,
        transport_type: 'beacon',
        ...properties,
    })
}

function sendGoogleAnalyticsPageView(properties) {
    if (!initializeGoogleAnalytics(properties)) return
    const pageConfig = buildGoogleAnalyticsConfig(properties)
    window.gtag('event', 'page_view', {
        send_to: config.analytics.gaId,
        transport_type: 'beacon',
        page_location: pageConfig.page_location,
        page_path: pageConfig.page_path,
        ...(pageConfig.page_title ? { page_title: pageConfig.page_title } : {}),
    })
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

    return {
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
    }
}

export const trackEvent = (eventName, params = {}) => {
    if (typeof window === 'undefined') return
    const context = sanitizeWebsiteProperties(websiteContext())
    sendGoogleAnalyticsEvent(eventName, {
        ...context,
        ...sanitizeLegacyGaProperties(params),
    })
}

export const trackWebsiteEvent = (eventName, params = {}) => {
    if (!WEBSITE_EVENTS.has(eventName) || typeof window === 'undefined') return
    const properties = sanitizeWebsiteProperties({
        ...websiteContext(),
        ...params,
    })
    initializeAnalytics()
        .then(posthog => posthog?.capture(eventName, properties))
        .catch(() => {})
    sendGoogleAnalyticsEvent(eventName, properties)
}

export const trackWebsitePageView = (params = {}) => {
    if (typeof window === 'undefined') return
    const properties = sanitizeWebsiteProperties({
        ...websiteContext(),
        ...params,
    })
    initializeAnalytics()
        .then(posthog => posthog?.capture('website_page_viewed', properties))
        .catch(() => {})
    sendGoogleAnalyticsEvent('website_page_viewed', properties)
    sendGoogleAnalyticsPageView(properties)
}

/**
 * Smart Link v2 and legacy-bridge events use a separate surface and allowlist.
 * Signed state, full URLs, UTM free text and user-entered data are never sent.
 */
export const trackInstallEvent = (eventName, params = {}) => {
    if (!INSTALL_EVENT_NAMES.has(eventName) || typeof window === 'undefined') return
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

    initializeAnalytics()
        .then(posthog => posthog?.capture(eventName, properties))
        .catch(() => {})
    sendGoogleAnalyticsEvent(eventName, properties)
    if (eventName === 'install_gate_viewed' && properties.surface === 'install_gate') {
        sendGoogleAnalyticsPageView(properties)
    }
}
