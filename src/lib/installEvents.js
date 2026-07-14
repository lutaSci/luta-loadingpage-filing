const INSTALL_EVENT_TYPES = new Set([
    'install_region_selected',
    'install_option_selected',
    'install_recovery_action_clicked',
])

const REGION_CHOICES = new Set(['cn', 'global', 'not_observed'])
const RECOVERY_ACTIONS = new Set([
    'choose_region_again',
    'reload_options',
    'official_website',
    'open_installed_app',
    'copy_for_external_browser',
])
const REASON_CODES = new Set([
    'manual_expand',
    'returned_from_handoff',
    'no_compatible_option_for_choice',
    'wechat_external_browser_required',
    'controlled_handoff_unavailable',
    'copy_continuation_unavailable',
    'terminal_failed',
    'terminal_no_options',
    'unknown',
])
const RETRYABLE_SAFE_REASONS = new Set([
    'journey_record_unavailable',
    'install_event_unavailable',
    'rate_limited',
])

const CLIENT_EVENT_ID_PATTERN = /^iev_[0-9a-f]{32}$/
const OPTION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/
const RETRY_STORAGE_KEY = 'luta-smart-link-install-events-v1'
const RETRY_MAX_ENTRIES = 20
const RETRY_MAX_ATTEMPTS = 20
const RETRY_MAX_AGE_MS = 60 * 60 * 1000

function validState(value) {
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

function defaultSessionStorage() {
    try {
        return globalThis.sessionStorage || null
    } catch {
        return null
    }
}

function readQueue(storage, now = Date.now()) {
    if (!storage) return []
    try {
        const parsed = JSON.parse(storage.getItem(RETRY_STORAGE_KEY) || '[]')
        if (!Array.isArray(parsed)) return []
        return parsed
            .filter(entry => (
                entry
                && Number.isFinite(entry.createdAt)
                && now - entry.createdAt >= 0
                && now - entry.createdAt <= RETRY_MAX_AGE_MS
                && Number.isInteger(entry.attempts)
                && entry.attempts >= 0
                && entry.attempts < RETRY_MAX_ATTEMPTS
                && buildInstallEventBody(entry.body)
            ))
            .map(entry => ({
                body: buildInstallEventBody(entry.body),
                createdAt: entry.createdAt,
                attempts: entry.attempts,
            }))
            .slice(-RETRY_MAX_ENTRIES)
    } catch {
        return []
    }
}

function writeQueue(storage, queue) {
    if (!storage) return false
    try {
        if (queue.length) storage.setItem(RETRY_STORAGE_KEY, JSON.stringify(queue.slice(-RETRY_MAX_ENTRIES)))
        else storage.removeItem(RETRY_STORAGE_KEY)
        return true
    } catch {
        return false
    }
}

function isRetryableStatus(status) {
    return status === 408 || status === 429 || status >= 500
}

export function createInstallClientEventId(cryptoLike = globalThis.crypto) {
    try {
        const bytes = new Uint8Array(16)
        cryptoLike.getRandomValues(bytes)
        return `iev_${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`
    } catch {
        return null
    }
}

export function normalizeInstallReasonCode(value) {
    return REASON_CODES.has(value) ? value : 'unknown'
}

/**
 * Builds the complete public ingest body from an explicit allowlist. Catalog
 * details, marketing parameters, full URLs and raw errors are never accepted.
 */
export function buildInstallEventBody(input = {}) {
    const state = input.state
    const clientEventId = input.client_event_id ?? input.clientEventId
    const eventType = input.event_type ?? input.eventType
    const regionChoice = input.distribution_region_choice ?? input.distributionRegionChoice

    if (
        !validState(state)
        || !CLIENT_EVENT_ID_PATTERN.test(clientEventId || '')
        || !INSTALL_EVENT_TYPES.has(eventType)
        || !REGION_CHOICES.has(regionChoice)
    ) return null

    const body = {
        state,
        client_event_id: clientEventId,
        event_type: eventType,
        distribution_region_choice: regionChoice,
    }

    if (eventType === 'install_option_selected') {
        const optionId = input.option_id ?? input.optionId
        if (!OPTION_ID_PATTERN.test(optionId || '')) return null
        body.option_id = optionId
    }

    if (eventType === 'install_recovery_action_clicked') {
        const recoveryAction = input.recovery_action ?? input.recoveryAction
        if (!RECOVERY_ACTIONS.has(recoveryAction)) return null
        body.recovery_action = recoveryAction
        const suppliedReason = input.reason_code ?? input.reasonCode
        body.reason_code = normalizeInstallReasonCode(suppliedReason)
    }

    return body
}

export function buildInstallEventUrl({ base, origin = 'https://lutaai.com' }) {
    if (typeof base !== 'string' || !base.trim()) return null
    try {
        const url = new URL(base, origin)
        const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
        if (url.protocol !== 'https:' && !localHttp) return null
        url.search = ''
        url.hash = ''
        return url.toString()
    } catch {
        return null
    }
}

async function deliverEntry(entry, {
    endpoint,
    fetchFn,
    storage,
    now,
}) {
    let response = null
    let delivered = false
    let responseParsed = false
    let decisionReason = null
    try {
        response = await fetchFn(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry.body),
            credentials: 'omit',
            cache: 'no-store',
            keepalive: true,
            referrerPolicy: 'no-referrer',
        })
        if (response.ok) {
            const payload = await response.json()
            const data = payload?.data ?? payload
            responseParsed = true
            delivered = data?.journey_recorded === true
            decisionReason = data?.decision_reason
        }
    } catch {
        // A network failure remains queued with the same idempotency key.
    }

    if (!storage) return delivered

    const queue = readQueue(storage, now())
    const current = queue.find(candidate => (
        candidate.body.client_event_id === entry.body.client_event_id
    ))
    if (!current) return delivered

    const retryableSafeFailure = responseParsed && RETRYABLE_SAFE_REASONS.has(decisionReason)
    const shouldDrop = delivered
        || (response?.ok && responseParsed && !retryableSafeFailure)
        || (response && !response.ok && !isRetryableStatus(response.status))
    const nextQueue = queue.filter(candidate => (
        candidate.body.client_event_id !== entry.body.client_event_id
    ))

    if (!shouldDrop && current.attempts + 1 < RETRY_MAX_ATTEMPTS) {
        nextQueue.push({ ...current, attempts: current.attempts + 1 })
    }
    writeQueue(storage, nextQueue)
    return delivered
}

export async function flushInstallInteractions({ base, origin }, {
    fetchFn = globalThis.fetch,
    storage = defaultSessionStorage(),
    now = Date.now,
} = {}) {
    const endpoint = buildInstallEventUrl({ base, origin })
    if (!endpoint || typeof fetchFn !== 'function') return []
    const queue = readQueue(storage, now())
    if (!queue.length) {
        writeQueue(storage, [])
        return []
    }
    return Promise.all(queue.map(entry => deliverEntry(entry, {
        endpoint,
        fetchFn,
        storage,
        now,
    })))
}

/**
 * Queues synchronously before starting the keepalive request, so navigation is
 * never delayed and a later page lifecycle can retry with the same event id.
 */
export function reportInstallInteraction({ base, origin, ...input }, {
    fetchFn = globalThis.fetch,
    storage = defaultSessionStorage(),
    now = Date.now,
    cryptoLike = globalThis.crypto,
} = {}) {
    const clientEventId = input.client_event_id
        ?? input.clientEventId
        ?? createInstallClientEventId(cryptoLike)
    const body = buildInstallEventBody({ ...input, client_event_id: clientEventId })
    const endpoint = buildInstallEventUrl({ base, origin })
    if (!body || !endpoint || typeof fetchFn !== 'function') return null

    const entry = { body, createdAt: now(), attempts: 0 }
    if (storage) {
        const queue = readQueue(storage, now())
            .filter(candidate => candidate.body.client_event_id !== clientEventId)
        queue.push(entry)
        writeQueue(storage, queue)
    }

    void deliverEntry(entry, { endpoint, fetchFn, storage, now })
    return clientEventId
}

export const INSTALL_EVENT_RETRY_LIMITS = Object.freeze({
    maxEntries: RETRY_MAX_ENTRIES,
    maxAttempts: RETRY_MAX_ATTEMPTS,
    maxAgeMs: RETRY_MAX_AGE_MS,
})
