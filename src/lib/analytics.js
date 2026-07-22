import { config } from '../config/index.js'
import {
    getAttributionEntryType,
    getAttributionState,
    getTrafficPurpose,
    resolveRouteContext,
} from './attributionState.js'
import { detectDevice, detectIsMainlandChina } from './deviceDetection.js'

const GA_ID = 'G-5QE6T3L0LD'
let posthogClientPromise = null

export const INSTALL_WEB_EVENT_NAMES = Object.freeze([
    'install_gate_viewed',
    'install_option_selected',
    'install_recovery_action_clicked',
])
const INSTALL_EVENT_NAMES = new Set(INSTALL_WEB_EVENT_NAMES)
// deep_link_handled is part of the approved dictionary but is emitted only by
// the mobile client after it receives and resolves the link.

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

export const initializeAnalytics = () => {
    if (typeof window === 'undefined') return Promise.resolve(null)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
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
        content_id: attribution?.content_id,
        operator: attribution?.operator,
        acquisition_platform: attribution?.platform,
    }
}

export const trackEvent = (eventName, params = {}) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, {
            send_to: GA_ID,
            ...params,
        })
    }
}

export const trackWebsiteEvent = (eventName, params = {}) => {
    const properties = {
        ...websiteContext(),
        ...params,
    }
    initializeAnalytics()
        .then(posthog => posthog?.capture(eventName, properties))
        .catch(() => {})
}

export const trackWebsitePageView = (params = {}) => {
    trackWebsiteEvent('website_page_viewed', params)
}

export function sanitizeInstallProperties(params) {
    const safe = {}
    Object.entries(params || {}).forEach(([key, value]) => {
        if (!INSTALL_PROPERTY_KEYS.has(key)) return
        if (key === 'click_id') {
            if (typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)) {
                safe[key] = value
            }
            return
        }
        if (typeof value === 'boolean' || typeof value === 'number') {
            safe[key] = value
            return
        }
        if (typeof value === 'string' && value.length <= 160) safe[key] = value
    })
    return safe
}

/**
 * Smart Link v2 and legacy-bridge events use a separate surface and allowlist.
 * Signed state, full URLs, UTM free text and user-entered data are never sent.
 */
export const trackInstallEvent = (eventName, params = {}) => {
    if (!INSTALL_EVENT_NAMES.has(eventName)) return
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
}
