import { config } from '../config'
import {
    getAttributionEntryType,
    getAttributionState,
    getTrafficPurpose,
    resolveRouteContext,
} from './attributionState'
import { detectDevice, detectIsMainlandChina } from './deviceDetection'

const GA_ID = 'G-5QE6T3L0LD'
let posthogClientPromise = null

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
                disable_session_recording: true,
                person_profiles: 'identified_only',
                persistence: 'localStorage+cookie',
            })
            return posthog
        })
    }
    return posthogClientPromise
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
        device_os: device.isIOS ? 'ios' : device.isAndroid ? 'android' : device.isHarmonyOS ? 'harmonyos' : 'desktop',
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

export const trackWebsitePageView = () => {
    trackWebsiteEvent('website_page_viewed')
}
