import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
    buildInstallEventBody,
    buildInstallEventUrl,
    createInstallClientEventId,
    flushInstallInteractions,
    INSTALL_EVENT_RETRY_LIMITS,
    normalizeInstallReasonCode,
    reportInstallInteraction,
} from '../src/lib/installEvents.js'

const STATE = 'signed.state/value'
const EVENT_ID = `iev_${'a'.repeat(32)}`

class MemoryStorage {
    constructor() {
        this.values = new Map()
    }

    getItem(key) {
        return this.values.get(key) ?? null
    }

    setItem(key, value) {
        this.values.set(key, value)
    }

    removeItem(key) {
        this.values.delete(key)
    }
}

const nextTurn = () => new Promise(resolve => setTimeout(resolve, 0))

test('builds only the strict server ingest allowlist', () => {
    assert.deepEqual(buildInstallEventBody({
        state: STATE,
        client_event_id: EVENT_ID,
        event_type: 'install_option_selected',
        distribution_region_choice: 'not_observed',
        option_id: 'play-global:v2',
        distribution_channel: 'google_play',
        availability_status: 'available',
        artifact_id: 'must-be-derived-by-server',
        terminal_outcome: 'must-not-be-sent',
        utm_source: 'must-not-be-sent',
        full_url: 'https://example.test/private',
    }), {
        state: STATE,
        client_event_id: EVENT_ID,
        event_type: 'install_option_selected',
        distribution_region_choice: 'not_observed',
        option_id: 'play-global:v2',
    })

    assert.deepEqual(buildInstallEventBody({
        state: STATE,
        client_event_id: EVENT_ID,
        event_type: 'install_region_selected',
        distribution_region_choice: 'cn',
        option_id: 'ignored-for-region',
    }), {
        state: STATE,
        client_event_id: EVENT_ID,
        event_type: 'install_region_selected',
        distribution_region_choice: 'cn',
    })
})

test('rejects malformed ids, choices, actions, options and signed state', () => {
    const valid = {
        state: STATE,
        client_event_id: EVENT_ID,
        event_type: 'install_recovery_action_clicked',
        distribution_region_choice: 'global',
        recovery_action: 'reload_options',
    }
    assert.ok(buildInstallEventBody(valid))
    assert.equal(buildInstallEventBody({ ...valid, client_event_id: 'iev_not-hex' }), null)
    assert.equal(buildInstallEventBody({ ...valid, distribution_region_choice: 'us' }), null)
    assert.equal(buildInstallEventBody({ ...valid, recovery_action: 'open_arbitrary_url' }), null)
    assert.equal(buildInstallEventBody({ ...valid, state: ` ${STATE}` }), null)
    assert.equal(buildInstallEventBody({
        ...valid,
        event_type: 'install_option_selected',
        option_id: 'bad option/id',
    }), null)
    assert.equal(buildInstallEventBody({
        ...valid,
        reason_code: 'unexpected_raw_error',
    }).reason_code, 'unknown')
})

test('creates a lowercase 128-bit opaque client id', () => {
    const id = createInstallClientEventId({
        getRandomValues(bytes) {
            bytes.fill(0xab)
            return bytes
        },
    })
    assert.equal(id, `iev_${'ab'.repeat(16)}`)
})

test('normalizes recovery reasons without exposing local or raw error text', () => {
    assert.equal(normalizeInstallReasonCode('returned_from_handoff'), 'returned_from_handoff')
    assert.equal(normalizeInstallReasonCode('terminal_missing_state'), 'unknown')
    assert.equal(normalizeInstallReasonCode('raw fetch error'), 'unknown')
})

test('posts with privacy-safe keepalive settings and retries the same event id', async () => {
    const storage = new MemoryStorage()
    const requests = []
    let shouldFail = true
    const fetchFn = async (url, init) => {
        requests.push({ url, init })
        if (shouldFail) throw new Error('offline')
        return {
            ok: true,
            status: 200,
            json: async () => ({ data: { journey_recorded: true } }),
        }
    }

    const returnedId = reportInstallInteraction({
        base: '/api/v1/public/attribution/install-event?remove=me',
        origin: 'https://lutaai.com',
        state: STATE,
        client_event_id: EVENT_ID,
        event_type: 'install_option_selected',
        distribution_region_choice: 'not_observed',
        option_id: 'apk-cn',
    }, { fetchFn, storage, now: () => 1000 })
    assert.equal(returnedId, EVENT_ID)
    await nextTurn()

    assert.equal(requests.length, 1)
    assert.equal(requests[0].url, 'https://lutaai.com/api/v1/public/attribution/install-event')
    assert.deepEqual({
        method: requests[0].init.method,
        credentials: requests[0].init.credentials,
        cache: requests[0].init.cache,
        keepalive: requests[0].init.keepalive,
        referrerPolicy: requests[0].init.referrerPolicy,
    }, {
        method: 'POST',
        credentials: 'omit',
        cache: 'no-store',
        keepalive: true,
        referrerPolicy: 'no-referrer',
    })

    shouldFail = false
    await flushInstallInteractions({
        base: '/api/v1/public/attribution/install-event',
        origin: 'https://lutaai.com',
    }, { fetchFn, storage, now: () => 1001 })
    assert.equal(requests.length, 2)
    assert.equal(JSON.parse(requests[0].init.body).client_event_id, EVENT_ID)
    assert.equal(JSON.parse(requests[1].init.body).client_event_id, EVENT_ID)

    await flushInstallInteractions({
        base: '/api/v1/public/attribution/install-event',
        origin: 'https://lutaai.com',
    }, { fetchFn, storage, now: () => 1002 })
    assert.equal(requests.length, 2)
})

test('a privacy-safe HTTP 200 is not an acknowledgement until journey_recorded is true', async () => {
    const storage = new MemoryStorage()
    const ids = []
    let recorded = false
    const fetchFn = async (_url, init) => {
        ids.push(JSON.parse(init.body).client_event_id)
        return {
            ok: true,
            status: 200,
            json: async () => ({
                data: {
                    journey_recorded: recorded,
                    decision_reason: recorded ? 'journey_recorded' : 'journey_record_unavailable',
                },
            }),
        }
    }
    reportInstallInteraction({
        base: '/api/v1/public/attribution/install-event',
        origin: 'https://lutaai.com',
        state: STATE,
        client_event_id: EVENT_ID,
        event_type: 'install_region_selected',
        distribution_region_choice: 'global',
    }, { fetchFn, storage, now: () => 1000 })
    await nextTurn()

    recorded = true
    await flushInstallInteractions({
        base: '/api/v1/public/attribution/install-event',
        origin: 'https://lutaai.com',
    }, { fetchFn, storage, now: () => 1001 })
    assert.deepEqual(ids, [EVENT_ID, EVENT_ID])
    assert.equal(storage.values.size, 0)
})

test('safe permanent failures are dropped instead of retrying 20 times', async () => {
    const storage = new MemoryStorage()
    let calls = 0
    const fetchFn = async () => {
        calls += 1
        return {
            ok: true,
            status: 200,
            json: async () => ({
                data: {
                    journey_recorded: false,
                    decision_reason: 'state_expired',
                },
            }),
        }
    }
    reportInstallInteraction({
        base: '/api/v1/public/attribution/install-event',
        origin: 'https://lutaai.com',
        state: STATE,
        client_event_id: EVENT_ID,
        event_type: 'install_region_selected',
        distribution_region_choice: 'cn',
    }, { fetchFn, storage, now: () => 1000 })
    await nextTurn()
    await flushInstallInteractions({
        base: '/api/v1/public/attribution/install-event',
        origin: 'https://lutaai.com',
    }, { fetchFn, storage, now: () => 1001 })
    assert.equal(calls, 1)
    assert.equal(storage.values.size, 0)
})

test('retry queue is session-bounded to 20 events and expires after one hour', async () => {
    const storage = new MemoryStorage()
    const neverSettles = () => new Promise(() => {})
    for (let index = 0; index < INSTALL_EVENT_RETRY_LIMITS.maxEntries + 5; index += 1) {
        reportInstallInteraction({
            base: '/api/v1/public/attribution/install-event',
            origin: 'https://lutaai.com',
            state: STATE,
            client_event_id: `iev_${index.toString(16).padStart(32, '0')}`,
            event_type: 'install_region_selected',
            distribution_region_choice: 'cn',
        }, { fetchFn: neverSettles, storage, now: () => 10 })
    }
    const queueKey = [...storage.values.keys()][0]
    assert.equal(JSON.parse(storage.getItem(queueKey)).length, INSTALL_EVENT_RETRY_LIMITS.maxEntries)

    let calls = 0
    await flushInstallInteractions({
        base: '/api/v1/public/attribution/install-event',
        origin: 'https://lutaai.com',
    }, {
        fetchFn: async () => {
            calls += 1
            return {
                ok: true,
                status: 200,
                json: async () => ({ data: { journey_recorded: true } }),
            }
        },
        storage,
        now: () => 10 + INSTALL_EVENT_RETRY_LIMITS.maxAgeMs + 1,
    })
    assert.equal(calls, 0)
    assert.equal(storage.values.size, 0)
})

test('event URL rejects insecure non-local transport', () => {
    assert.equal(buildInstallEventUrl({
        base: 'http://api.lutaai.com/api/v1/public/attribution/install-event',
    }), null)
    assert.equal(buildInstallEventUrl({
        base: 'http://localhost:8000/api/v1/public/attribution/install-event',
    }), 'http://localhost:8000/api/v1/public/attribution/install-event')
})

test('shared install controller prevents legacy mode from calling the v2 interaction ingest', () => {
    const source = readFileSync(
        new URL('../src/hooks/useInstallJourneyController.js', import.meta.url),
        'utf8',
    )
    assert.match(source, /if \(isLegacyMode \|\| !stateToken\) return null/)
    assert.match(source, /if \(!hasEntry \|\| isLegacyMode\) return undefined/)
    assert.doesNotMatch(source, /legacySlug[\s\S]{0,100}installEventBase/)
})
