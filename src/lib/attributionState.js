import { config } from '../config/index.js'

const DIRECT_CLICK_ID_STORAGE_KEY = 'luta_direct_attribution_click'

const ATTRIBUTION_FIELDS = [
    'slug',
    'click_id',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'content_id',
    'operator',
    'platform',
    'invite_code',
    'route_market',
    'traffic_purpose',
]
const WAITLIST_HIDDEN_FIELDS = [
    'click_id',
    'slug',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'content_id',
    'operator',
    'platform',
    'route_market',
    'traffic_purpose',
    'placement',
]

let _cached = null

function createDirectClickId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `clk_web_${crypto.randomUUID()}`
    }
    return `clk_web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function attributionSignature(state) {
    const parts = []
    for (const key of ATTRIBUTION_FIELDS) {
        if (key === 'click_id') continue
        if (state[key]) parts.push(`${key}=${state[key]}`)
    }
    return parts.join('&')
}

function getOrCreateDirectClickId(state) {
    const signature = attributionSignature(state)

    try {
        const stored = JSON.parse(sessionStorage.getItem(DIRECT_CLICK_ID_STORAGE_KEY) || 'null')
        if (stored?.signature === signature && stored?.click_id) {
            return stored.click_id
        }

        const clickId = createDirectClickId()
        sessionStorage.setItem(
            DIRECT_CLICK_ID_STORAGE_KEY,
            JSON.stringify({ signature, click_id: clickId }),
        )
        return clickId
    } catch {
        return createDirectClickId()
    }
}

export function getAttributionState() {
    if (_cached) return _cached

    const params = new URLSearchParams(window.location.search)
    const state = {}
    let hasAny = false

    for (const key of ATTRIBUTION_FIELDS) {
        const val = params.get(key)
        if (val) {
            state[key] = val
            hasAny = true
        }
    }

    if (hasAny && !state.click_id) {
        state.click_id = getOrCreateDirectClickId(state)
    }

    _cached = hasAny ? state : null
    return _cached
}

export function isAttributedSession() {
    const s = getAttributionState()
    return s !== null && (s.click_id || s.utm_source || s.utm_medium || s.utm_campaign)
}

export function getAttributionEntryType() {
    const state = getAttributionState()
    if (!state) return 'direct'
    if (state.slug && state.slug !== config.attribution.defaultSlug) return 'shortlink'
    return 'direct_utm'
}

export function resolveRouteContext(heuristicIsMainland) {
    const state = getAttributionState()
    if (state?.route_market === 'cn' || state?.route_market === 'global') {
        return { market: state.route_market, source: 'slug' }
    }

    const legacyMarket = state?.slug
        ? config.attribution.legacySlugMarkets[state.slug]
        : null
    if (legacyMarket) {
        return { market: legacyMarket, source: 'legacy_slug_map' }
    }

    return {
        market: heuristicIsMainland ? 'cn' : 'global',
        source: 'heuristic',
    }
}

export function getTrafficPurpose() {
    const state = getAttributionState()
    if (state?.traffic_purpose) return state.traffic_purpose
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'development'
    }
    return 'production'
}

export function buildWaitlistFallbackUrl(waitlistUrl) {
    if (!waitlistUrl) return waitlistUrl
    try {
        const url = new URL(waitlistUrl)
        for (const field of WAITLIST_HIDDEN_FIELDS) {
            url.searchParams.set(`hide_${field}`, '1')
        }
        return url.toString()
    } catch {
        return waitlistUrl
    }
}

/**
 * Build a continue-redirect URL that the backend will 302 to the final
 * store target with proper Install Referrer / campaign-link params.
 *
 * @param {'google'|'apple'|'apk'|'waitlist'|'testflight_app'|'testflight_beta'} store
 * @param {string} placement - button location identifier
 * @returns {string|null} full URL or null if no attribution context
 */
export function buildContinueUrl(store, placement) {
    const state = getAttributionState()
    if (!state) return null

    const slug = state.slug || config.attribution.defaultSlug

    const qs = new URLSearchParams()
    qs.set('store', store)
    if (placement) qs.set('placement', placement)
    qs.set('landing_url', window.location.origin + window.location.pathname)

    for (const key of ATTRIBUTION_FIELDS) {
        if (key === 'slug') continue
        if (state[key]) qs.set(key, state[key])
    }
    qs.set('slug', slug)
    if (!qs.has('traffic_purpose')) qs.set('traffic_purpose', getTrafficPurpose())

    return `${config.attribution.continueBase}/r/${encodeURIComponent(slug)}/continue?${qs.toString()}`
}
