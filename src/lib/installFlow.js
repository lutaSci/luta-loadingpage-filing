const AVAILABLE_STATUSES = new Set(['available', 'active', 'ready', 'live'])
const UNVERIFIED_STATUSES = new Set(['unverified', 'stale', 'pending_verification'])

const MARKET_ALIASES = {
    cn: 'cn',
    china: 'cn',
    mainland: 'cn',
    china_mainland: 'cn',
    domestic: 'cn',
    global: 'global',
    overseas: 'global',
    international: 'global',
    other: 'global',
    other_regions: 'global',
}

const CHANNEL_ALIASES = {
    app_store: 'apple_app_store',
    apple: 'apple_app_store',
    apple_store: 'apple_app_store',
    google: 'google_play',
    play_store: 'google_play',
    android_apk: 'apk',
    notify: 'waitlist',
    notification: 'waitlist',
    website: 'web',
}

function cleanString(value, maxLength = 160) {
    if (typeof value !== 'string' && typeof value !== 'number') return null
    const normalized = String(value).trim()
    if (!normalized) return null
    return normalized.slice(0, maxLength)
}

function firstObject(...values) {
    return values.find(value => value && typeof value === 'object' && !Array.isArray(value)) || {}
}

export function normalizeMarket(value) {
    const normalized = cleanString(value, 32)?.toLowerCase()
    return normalized ? MARKET_ALIASES[normalized] || null : null
}

/** A campaign is a recommendation signal; relation is based on explicit choice only. */
export function resolveMarketChoiceRelation(campaignTargetMarket, distributionRegionChoice) {
    const campaign = normalizeMarket(campaignTargetMarket)
    const choice = normalizeMarket(distributionRegionChoice)
    if (!campaign || !choice) return 'unknown'
    return campaign === choice ? 'same' : 'different'
}

export function normalizeChannel(value) {
    const normalized = cleanString(value, 48)?.toLowerCase()
    return normalized ? CHANNEL_ALIASES[normalized] || normalized : 'unknown'
}

function normalizeStatus(option) {
    const availability = firstObject(option.availability)
    const rawStatus = cleanString(
        option.status ?? availability.status ?? option.availability_status,
        40,
    )?.toLowerCase()

    if (rawStatus) return rawStatus
    if (option.available === true || option.enabled === true || availability.available === true) {
        return 'available'
    }
    return 'unavailable'
}

function normalizeApkMetadata(option) {
    const metadata = firstObject(option.apk, option.artifact, option.metadata)
    const rawSize = metadata.size_bytes ?? metadata.sizeBytes ?? option.size_bytes ?? option.sizeBytes
    const sizeBytes = Number(rawSize)
    const sha256 = cleanString(metadata.sha256 ?? metadata.sha_256 ?? option.sha256 ?? option.sha_256, 128)

    return {
        version: cleanString(metadata.version ?? option.version, 64),
        sizeBytes: Number.isFinite(sizeBytes) && sizeBytes > 0 ? Math.round(sizeBytes) : null,
        sha256: sha256?.replace(/\s+/g, '').toLowerCase() || null,
    }
}

function normalizeOption(option, index) {
    if (!option || typeof option !== 'object') return null
    const optionId = cleanString(option.option_id ?? option.optionId ?? option.id, 65)
    if (!optionId || optionId.length > 64) return null

    const channel = normalizeChannel(option.channel ?? option.type ?? option.destination)
    return {
        optionId,
        artifactId: cleanString(option.artifact_id ?? option.artifactId, 128),
        platform: cleanString(option.platform ?? option.os, 32)?.toLowerCase() || 'unknown',
        region: normalizeMarket(option.region ?? option.market ?? option.store_region),
        channel,
        status: normalizeStatus(option),
        label: cleanString(option.label ?? option.display_name ?? option.title, 100),
        description: cleanString(option.description ?? option.subtitle, 240),
        recommended: option.recommended === true || option.is_recommended === true,
        order: Number.isFinite(Number(option.order)) ? Number(option.order) : index,
        apk: channel === 'apk' ? normalizeApkMetadata(option) : null,
    }
}

/**
 * Normalizes the Smart Link v2 install-context response. Destination URLs are
 * intentionally discarded: every outbound handoff must go through /out.
 */
export function normalizeInstallContext(payload) {
    const root = firstObject(payload?.data, payload)
    const legacySlug = normalizeLegacySlug(root.legacy_slug ?? root.legacySlug)
    const rawOptions = Array.isArray(root.options)
        ? root.options
        : Array.isArray(root.install_options)
            ? root.install_options
            : Array.isArray(root.channels)
                ? root.channels
                : []

    return {
        linkId: normalizeOpaqueId(root.link_id ?? root.linkId),
        clickId: legacySlug
            ? normalizeLegacyClickId(root.click_id ?? root.clickId)
            : normalizeOpaqueId(root.click_id ?? root.clickId),
        legacySlug,
        contractVersion: cleanString(root.contract_version ?? root.contractVersion, 40),
        trafficPurpose: cleanString(root.traffic_purpose ?? root.trafficPurpose, 64),
        campaignTargetMarket: normalizeMarket(
            root.campaign_target_market ?? root.target_market ?? root.campaign_market,
        ),
        recommendedRegion: normalizeMarket(root.recommended_region ?? root.recommendedRegion),
        options: rawOptions.map(normalizeOption).filter(Boolean),
    }
}

export function normalizeOpaqueId(value) {
    return typeof value === 'string'
        && value.length >= 1
        && value.length <= 128
        && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
        ? value
        : null
}

export function normalizeLegacySlug(value) {
    return typeof value === 'string'
        && value.length >= 1
        && value.length <= 80
        && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value)
        ? value
        : null
}

export function normalizeLegacyClickId(value) {
    return typeof value === 'string' && /^lclk_[0-9a-f]{32}$/.test(value) ? value : null
}

/**
 * A legacy bridge is selected only when exactly one strict slug and click id
 * are present. Every other query parameter is intentionally ignored.
 */
export function parseLegacyInstallEntry(search = '') {
    try {
        const params = new URLSearchParams(search)
        const slugs = params.getAll('legacy_slug')
        const clickIds = params.getAll('click_id')
        if (slugs.length !== 1 || clickIds.length !== 1) return null

        const legacySlug = normalizeLegacySlug(slugs[0])
        const clickId = normalizeLegacyClickId(clickIds[0])
        return legacySlug && clickId ? { legacySlug, clickId } : null
    } catch {
        return null
    }
}

export function isOptionAvailable(option) {
    return AVAILABLE_STATUSES.has(option?.status)
}

export function isOptionUnverified(option) {
    return UNVERIFIED_STATUSES.has(option?.status)
}

export function isApkMetadataComplete(option) {
    if (option?.channel !== 'apk' || !option.apk) return false
    return Boolean(
        option.apk.version
        && option.apk.sizeBytes
        && /^[a-f0-9]{64}$/i.test(option.apk.sha256 || ''),
    )
}

/**
 * The catalog may contain choices for more than one operating system. Keep
 * them in the response for auditability, but never present a store or package
 * for another device as an actionable choice.
 */
export function isOptionCompatibleWithDevice(option, deviceOs = 'desktop') {
    if (!option) return false

    const channel = option.channel
    const platform = option.platform
    const crossPlatformChannel = channel === 'waitlist' || channel === 'web'

    if (deviceOs === 'ios') {
        if (channel === 'google_play' || channel === 'apk') return false
        return crossPlatformChannel
            || channel === 'apple_app_store'
            || channel === 'testflight'
            || platform === 'ios'
    }
    if (deviceOs === 'android') {
        if (channel === 'apple_app_store' || channel === 'testflight') return false
        return crossPlatformChannel
            || channel === 'google_play'
            || channel === 'apk'
            || platform === 'android'
    }
    if (deviceOs === 'harmonyos_next') {
        if (['apple_app_store', 'testflight', 'google_play', 'apk'].includes(channel)) return false
        return crossPlatformChannel
            || platform === 'harmonyos_next'
            || platform === 'harmonyos'
    }
    return true
}

function platformScore(option, deviceOs) {
    if (deviceOs === 'ios') return option.platform === 'ios' ? 80 : 0
    if (deviceOs === 'android') return option.platform === 'android' ? 80 : 0
    if (deviceOs === 'harmonyos_next') {
        if (option.channel === 'waitlist') return 110
        if (option.channel === 'apk' || option.channel === 'google_play') return -500
        return option.platform === 'harmonyos_next' || option.platform === 'harmonyos' ? 80 : 0
    }
    return option.platform === 'web' || option.platform === 'desktop' ? 50 : 0
}

function channelScore(option, deviceOs) {
    const priorities = deviceOs === 'ios'
        ? ['apple_app_store', 'testflight', 'waitlist', 'web']
        : deviceOs === 'android'
            ? ['google_play', 'apk', 'waitlist', 'web']
            : deviceOs === 'harmonyos_next'
                ? ['waitlist', 'web', 'apk', 'google_play']
                : ['web', 'apple_app_store', 'google_play', 'apk', 'waitlist']
    const position = priorities.indexOf(option.channel)
    return position === -1 ? 0 : (priorities.length - position) * 8
}

/** Campaign targeting only changes order; it never removes an option. */
export function sortInstallOptions(options, {
    deviceOs = 'desktop',
    selectedRegion = null,
    campaignTargetMarket = null,
} = {}) {
    const selectedMarket = normalizeMarket(selectedRegion)
    const campaignMarket = normalizeMarket(campaignTargetMarket)

    return [...(Array.isArray(options) ? options : [])]
        .map((option, index) => {
            let score = 0
            if (isOptionAvailable(option)) score += 300
            if (selectedMarket && option.region === selectedMarket) score += 160
            if (campaignMarket && option.region === campaignMarket) score += 35
            if (option.recommended) score += 20
            score += platformScore(option, deviceOs)
            score += channelScore(option, deviceOs)
            return { option, index, score }
        })
        .sort((left, right) => (
            right.score - left.score
            || left.option.order - right.option.order
            || left.index - right.index
        ))
        .map(entry => entry.option)
}

export function buildInstallContextUrl({ base, state, origin = 'https://lutaai.com' }) {
    const stateToken = cleanString(state, 4097)
    if (!stateToken || stateToken.length > 4096) return null
    try {
        const url = new URL(base, origin)
        if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) return null
        url.search = ''
        url.hash = ''
        url.searchParams.set('state', stateToken)
        return url.toString()
    } catch {
        return null
    }
}

export function buildLegacyInstallContextUrl({
    base,
    legacySlug,
    clickId,
    origin = 'https://lutaai.com',
}) {
    const normalizedLegacySlug = normalizeLegacySlug(legacySlug)
    const normalizedClickId = normalizeLegacyClickId(clickId)
    if (!normalizedLegacySlug || !normalizedClickId) return null

    try {
        const url = new URL(base, origin)
        if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) return null
        url.search = ''
        url.hash = ''
        url.searchParams.set('slug', normalizedLegacySlug)
        url.searchParams.set('click_id', normalizedClickId)
        return url.toString()
    } catch {
        return null
    }
}

export function buildControlledOutUrl({ base, state, optionId, linkId }) {
    const stateToken = cleanString(state, 4097)
    const normalizedOptionId = cleanString(optionId, 65)
    const normalizedLinkId = cleanString(linkId, 65)
    const safeIdentifier = /^[a-zA-Z0-9._:-]+$/
    if (
        !stateToken
        || stateToken.length > 4096
        || !normalizedOptionId
        || normalizedOptionId.length > 64
        || !normalizedLinkId
        || normalizedLinkId.length > 64
        || !safeIdentifier.test(normalizedOptionId)
        || !safeIdentifier.test(normalizedLinkId)
    ) {
        return null
    }

    try {
        const url = new URL(base)
        if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) return null
        url.search = ''
        url.hash = ''
        url.pathname = `${url.pathname.replace(/\/+$/, '')}/${encodeURIComponent(normalizedLinkId)}`
        url.searchParams.set('state', stateToken)
        url.searchParams.set('option_id', normalizedOptionId)
        return url.toString()
    } catch {
        return null
    }
}

/** Legacy handoffs remain web-only and carry opaque identity only. */
export function buildLegacyControlledOutUrl({ base, legacySlug, clickId, optionId }) {
    const normalizedLegacySlug = normalizeLegacySlug(legacySlug)
    const normalizedClickId = normalizeLegacyClickId(clickId)
    const normalizedOptionId = normalizeOpaqueId(optionId)
    if (!normalizedLegacySlug || !normalizedClickId || !normalizedOptionId) return null

    try {
        const url = new URL(base)
        if (url.protocol !== 'https:' || url.hostname !== 'go.lutaai.com') return null
        url.search = ''
        url.hash = ''
        const basePath = url.pathname.replace(/\/+$/, '')
        if (basePath !== '/r') return null
        url.pathname = `${basePath}/${encodeURIComponent(normalizedLegacySlug)}/out`
        url.searchParams.set('click_id', normalizedClickId)
        url.searchParams.set('option_id', normalizedOptionId)
        return url.toString()
    } catch {
        return null
    }
}

/**
 * Canonical install-page URL for browser continuation. This helper never
 * copies arbitrary query parameters from the current page.
 */
export function buildInstallContinuationUrl({
    origin = 'https://lutaai.com',
    state,
    legacySlug,
    clickId,
    choice,
}) {
    const normalizedChoice = normalizeMarket(choice)
    const normalizedLegacySlug = normalizeLegacySlug(legacySlug)
    const normalizedClickId = normalizedLegacySlug
        ? normalizeLegacyClickId(clickId)
        : normalizeOpaqueId(clickId)
    const stateToken = cleanString(state, 4097)

    if (
        (!normalizedLegacySlug || !normalizedClickId)
        && (!stateToken || stateToken.length > 4096)
    ) return null

    try {
        const url = new URL('/install', origin)
        if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) return null
        if (normalizedLegacySlug && normalizedClickId) {
            url.searchParams.set('legacy_slug', normalizedLegacySlug)
            url.searchParams.set('click_id', normalizedClickId)
        } else {
            url.searchParams.set('state', stateToken)
        }
        if (normalizedChoice) url.searchParams.set('choice', normalizedChoice)
        return url.toString()
    } catch {
        return null
    }
}

/**
 * Builds the only browser-to-installed-app handoff shape. It carries opaque
 * journey identity only; signed state, campaign fields and the current page
 * URL must never enter the Universal/App Link.
 */
export function buildAppOpenUrl({ base, linkId, clickId }) {
    const normalizedLinkId = normalizeOpaqueId(linkId)
    const normalizedClickId = normalizeOpaqueId(clickId)
    if (!normalizedLinkId || normalizedLinkId.length > 64 || !normalizedClickId) return null

    try {
        const url = new URL(base)
        if (url.protocol !== 'https:' || url.hostname !== 'link.lutaai.com') return null
        url.search = ''
        url.hash = ''
        url.pathname = `${url.pathname.replace(/\/+$/, '')}/${encodeURIComponent(normalizedLinkId)}`
        url.searchParams.set('click_id', normalizedClickId)
        return url.toString()
    } catch {
        return null
    }
}

export function formatBytes(bytes, locale = 'zh-CN') {
    if (!Number.isFinite(bytes) || bytes <= 0) return null
    const units = ['B', 'KB', 'MB', 'GB']
    let value = bytes
    let unitIndex = 0
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024
        unitIndex += 1
    }
    const maximumFractionDigits = unitIndex === 0 ? 0 : value >= 100 ? 0 : 1
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value)} ${units[unitIndex]}`
}

export function resolveDeviceOs(device) {
    if (device?.isIOS) return 'ios'
    if (device?.isHarmonyOSNext) return 'harmonyos_next'
    if (device?.isAndroid) return 'android'
    if (device?.isHarmonyOS) return 'harmonyos_next'
    return 'desktop'
}
