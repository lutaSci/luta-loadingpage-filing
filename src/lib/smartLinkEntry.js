import {
    normalizeMarket,
    parseLegacyInstallEntry,
} from './installFlow.js'

export const SMART_LINK_ENTRY_SESSION_KEY = 'luta-smart-link-homepage-entry-v1'
export const SMART_LINK_ENTRY_MAX_AGE_MS = 30 * 60 * 1000

function defaultSessionStorage() {
    try {
        return globalThis.sessionStorage || null
    } catch {
        return null
    }
}

function validStateToken(value) {
    if (
        typeof value !== 'string'
        || value.length < 1
        || value.length > 4096
        || value.trim() !== value
    ) return false

    return !Array.from(value).some(character => {
        const codePoint = character.codePointAt(0)
        return codePoint <= 31 || codePoint === 127
    })
}

function normalizeEntry(value) {
    if (!value || typeof value !== 'object') return null
    const choice = normalizeMarket(value.choice)

    if (value.mode === 'v2' && validStateToken(value.stateToken)) {
        return {
            mode: 'v2',
            stateToken: value.stateToken,
            legacyEntry: null,
            choice,
        }
    }

    const legacyEntry = value.mode === 'legacy'
        ? parseLegacyInstallEntry(
            `?legacy_slug=${encodeURIComponent(value.legacyEntry?.legacySlug || '')}`
            + `&click_id=${encodeURIComponent(value.legacyEntry?.clickId || '')}`,
        )
        : null
    if (!legacyEntry) return null

    return {
        mode: 'legacy',
        stateToken: null,
        legacyEntry,
        choice,
    }
}

/**
 * Smart Link state is a bearer capability. Accept one unambiguous signed state
 * or one strict legacy tuple, never both and never arbitrary query fields.
 */
export function parseSmartLinkEntry(search = '') {
    try {
        const params = new URLSearchParams(search)
        const states = params.getAll('state')
        const hasLegacyField = params.has('legacy_slug') || params.has('click_id')
        const legacyEntry = parseLegacyInstallEntry(search)

        if (
            states.length === 1
            && validStateToken(states[0])
            && !hasLegacyField
        ) {
            return {
                mode: 'v2',
                stateToken: states[0],
                legacyEntry: null,
                choice: normalizeMarket(params.get('choice')),
            }
        }

        if (states.length === 0 && legacyEntry) {
            return {
                mode: 'legacy',
                stateToken: null,
                legacyEntry,
                choice: normalizeMarket(params.get('choice')),
            }
        }
    } catch {
        return null
    }

    return null
}

export function readSmartLinkEntrySession(
    storage,
    now = Date.now(),
) {
    const resolvedStorage = storage === undefined ? defaultSessionStorage() : storage
    if (!resolvedStorage) return null
    try {
        const value = JSON.parse(resolvedStorage.getItem(SMART_LINK_ENTRY_SESSION_KEY) || 'null')
        if (
            !value
            || !Number.isFinite(value.capturedAt)
            || now - value.capturedAt < 0
            || now - value.capturedAt > SMART_LINK_ENTRY_MAX_AGE_MS
        ) {
            resolvedStorage.removeItem(SMART_LINK_ENTRY_SESSION_KEY)
            return null
        }
        return normalizeEntry(value.entry)
    } catch {
        return null
    }
}

export function persistSmartLinkEntry(
    entry,
    storage,
    now = Date.now(),
) {
    const normalized = normalizeEntry(entry)
    const resolvedStorage = storage === undefined ? defaultSessionStorage() : storage
    if (!normalized || !resolvedStorage) return normalized
    try {
        resolvedStorage.setItem(SMART_LINK_ENTRY_SESSION_KEY, JSON.stringify({
            capturedAt: now,
            entry: normalized,
        }))
    } catch {
        // The journey still works in memory when private storage is unavailable.
    }
    return normalized
}

export function captureSmartLinkEntry({
    search = globalThis.location?.search || '',
    storage,
    now = Date.now(),
} = {}) {
    const inbound = parseSmartLinkEntry(search)
    if (inbound) return persistSmartLinkEntry(inbound, storage, now)
    return readSmartLinkEntrySession(storage, now)
}

export function updateSmartLinkEntryChoice(
    entry,
    choice,
    storage,
    now = Date.now(),
) {
    return persistSmartLinkEntry({
        ...entry,
        choice: normalizeMarket(choice),
    }, storage, now)
}

export function clearSmartLinkEntrySession(storage) {
    const resolvedStorage = storage === undefined ? defaultSessionStorage() : storage
    try {
        resolvedStorage?.removeItem(SMART_LINK_ENTRY_SESSION_KEY)
    } catch {
        // No-op: storage is only a continuity aid.
    }
}

export function hasSmartLinkBearer(search = '') {
    try {
        const params = new URLSearchParams(search)
        return params.has('state') || params.has('legacy_slug') || params.has('click_id')
    } catch {
        return false
    }
}

export function resolveSmartLinkCleanupLocation({
    pathname,
    search = '',
    hash = '',
    homepageSurfaceEnabled = false,
}) {
    if (!hasSmartLinkBearer(search) || typeof pathname !== 'string') return null

    const inbound = parseSmartLinkEntry(search)
    if (pathname === '/install') {
        const usesHomepageSurface = homepageSurfaceEnabled && Boolean(inbound)
        const safeChoice = !usesHomepageSurface && inbound?.choice
            ? `?choice=${encodeURIComponent(inbound.choice)}`
            : ''
        return `${usesHomepageSurface ? '/' : '/install'}${safeChoice}${hash}`
    }

    // Bearer-shaped query parameters are never retained on non-install routes,
    // even when malformed or when the homepage bridge is disabled.
    return `${pathname}${hash}`
}
