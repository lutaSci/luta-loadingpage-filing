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

const WEBSITE_ENTRY_FIELDS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'content_id',
    'operator',
    'platform',
    'invite_code',
]

// Mirrors the public `/r/{slug}` query contract. Invalid oversized campaign
// data is dropped instead of truncated so user-controlled URLs cannot turn a
// generic install action into a validation failure or change field identity.
const WEBSITE_ENTRY_FIELD_LIMITS = {
    utm_source: 128,
    utm_medium: 128,
    utm_campaign: 128,
    utm_content: 128,
    utm_term: 128,
    content_id: 128,
    operator: 128,
    platform: 64,
    invite_code: 20,
}

const LEGACY_CLICK_ID_RE = /^lclk_[0-9a-f]{32}$/
const ATTRIBUTION_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/
export const WAITLIST_SYSTEM_FIELDS = [
    // These fields are system-owned attribution context. The Feishu form must
    // never ask a visitor to understand or enter them, including when the
    // landing page has no Smart Link context and uses the direct fallback URL.
    'link_id',
    'click_id',
    'contract_version',
    'slug',
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

function appendValidWebsiteEntryFields(searchParams, state) {
    for (const key of WEBSITE_ENTRY_FIELDS) {
        const value = state?.[key]
        if (value && value.length <= WEBSITE_ENTRY_FIELD_LIMITS[key]) {
            searchParams.set(key, value)
        }
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
        return {
            market: state.route_market,
            source: state.slug && state.slug !== config.attribution.defaultSlug
                ? 'slug'
                : 'attribution_param',
        }
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
        for (const field of WAITLIST_SYSTEM_FIELDS) {
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

/**
 * Route the public homepage's APK action through a server-owned install root.
 * The install page then reads the verified runtime catalog and exposes the
 * current APK metadata; the homepage never owns a mutable package URL.
 */
export function buildVerifiedApkEntryUrl(placement) {
    const state = getAttributionState()

    // A canonical legacy root can continue without creating a second click.
    if (state?.slug && LEGACY_CLICK_ID_RE.test(state.click_id || '')) {
        return buildContinueUrl('apk', placement)
    }

    const qs = new URLSearchParams()
    appendValidWebsiteEntryFields(qs, state)
    if (!qs.has('utm_source')) qs.set('utm_source', 'official_website')
    if (!qs.has('utm_medium')) qs.set('utm_medium', 'owned')
    if (!qs.has('utm_campaign')) qs.set('utm_campaign', 'android_download')
    if (placement && !qs.has('utm_content')) qs.set('utm_content', placement)
    if (!qs.has('platform')) qs.set('platform', 'website')

    return `${config.attribution.continueBase}/r/${encodeURIComponent(config.attribution.defaultSlug)}?${qs.toString()}`
}

/**
 * Build the generic website install entry used by navigation-level CTAs.
 *
 * Unlike a platform CTA, this route does not assume iOS, Android, a market,
 * or an individual store. The server creates or reuses the canonical legacy
 * click root and then hands the visitor to the authoritative /install flow.
 * A bare /install URL is intentionally not used because it has no signed or
 * legacy attribution context and must fall back to missing-state recovery.
 */
export function buildInstallEntryUrl(placement) {
    const state = getAttributionState()
    const stateSlug = state?.slug || ''
    const slug = ATTRIBUTION_SLUG_RE.test(stateSlug)
        ? stateSlug
        : config.attribution.defaultSlug

    const qs = new URLSearchParams()
    appendValidWebsiteEntryFields(qs, state)

    // Reuse only a server-issued legacy root. Browser-generated click ids do
    // not prove a canonical root and must not be forwarded as if they did.
    if (state?.slug && LEGACY_CLICK_ID_RE.test(state.click_id || '')) {
        qs.set('click_id', state.click_id)
    }

    if (!qs.has('utm_source')) qs.set('utm_source', 'official_website')
    if (!qs.has('utm_medium')) qs.set('utm_medium', 'owned')
    if (!qs.has('utm_campaign')) qs.set('utm_campaign', 'app_download')
    if (placement && !qs.has('utm_content')) qs.set('utm_content', placement)
    if (!qs.has('platform')) qs.set('platform', 'website')

    return `${config.attribution.continueBase}/r/${encodeURIComponent(slug)}?${qs.toString()}`
}
