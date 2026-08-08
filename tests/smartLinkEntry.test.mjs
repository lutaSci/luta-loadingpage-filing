import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
    SMART_LINK_ENTRY_MAX_AGE_MS,
    SMART_LINK_ENTRY_SESSION_KEY,
    captureSmartLinkEntry,
    hasSmartLinkBearer,
    parseSmartLinkEntry,
    readSmartLinkEntrySession,
    resolveSmartLinkCleanupLocation,
    updateSmartLinkEntryChoice,
} from '../src/lib/smartLinkEntry.js'

const LEGACY_CLICK_ID = `lclk_${'d'.repeat(32)}`

function createStorage() {
    const values = new Map()
    return {
        getItem: key => values.get(key) || null,
        removeItem: key => values.delete(key),
        setItem: (key, value) => values.set(key, String(value)),
    }
}

test('accepts one signed state and discards every unrelated query field', () => {
    const entry = parseSmartLinkEntry(
        '?state=signed.state%2Fvalue&choice=china&utm_source=private&operator=alice',
    )
    assert.deepEqual(entry, {
        mode: 'v2',
        stateToken: 'signed.state/value',
        legacyEntry: null,
        choice: 'cn',
    })
    assert.equal(JSON.stringify(entry).includes('utm_source'), false)
    assert.equal(JSON.stringify(entry).includes('operator'), false)
})

test('rejects duplicate, whitespace and ambiguous bearer identities', () => {
    assert.equal(parseSmartLinkEntry('?state=one&state=two'), null)
    assert.equal(parseSmartLinkEntry('?state=%20signed%20'), null)
    assert.equal(parseSmartLinkEntry(
        `?state=signed&legacy_slug=cn-store&click_id=${LEGACY_CLICK_ID}`,
    ), null)
})

test('accepts one strict legacy tuple and optional normalized choice', () => {
    assert.deepEqual(parseSmartLinkEntry(
        `?legacy_slug=cn-store&click_id=${LEGACY_CLICK_ID}&choice=overseas`,
    ), {
        mode: 'legacy',
        stateToken: null,
        legacyEntry: {
            legacySlug: 'cn-store',
            clickId: LEGACY_CLICK_ID,
        },
        choice: 'global',
    })
})

test('persists only within the bounded tab session and updates explicit choice', () => {
    const storage = createStorage()
    const captured = captureSmartLinkEntry({
        search: '?state=signed.state',
        storage,
        now: 1000,
    })
    assert.equal(captured.stateToken, 'signed.state')
    assert.ok(storage.getItem(SMART_LINK_ENTRY_SESSION_KEY))

    const updated = updateSmartLinkEntryChoice(captured, 'global', storage, 1100)
    assert.equal(updated.choice, 'global')
    assert.equal(readSmartLinkEntrySession(storage, 1200).choice, 'global')
    assert.equal(
        readSmartLinkEntrySession(storage, 1100 + SMART_LINK_ENTRY_MAX_AGE_MS + 1),
        null,
    )
})

test('detects every bearer-shaped URL before analytics bootstrap', () => {
    assert.equal(hasSmartLinkBearer('?state=signed'), true)
    assert.equal(hasSmartLinkBearer(`?legacy_slug=cn-store&click_id=${LEGACY_CLICK_ID}`), true)
    assert.equal(hasSmartLinkBearer('?utm_source=owned'), false)
})

test('cleans valid and malformed bearer URLs without restoring hidden identity', () => {
    assert.equal(resolveSmartLinkCleanupLocation({
        pathname: '/install',
        search: '?state=signed.state&choice=global',
        homepageSurfaceEnabled: false,
    }), '/install?choice=global')
    assert.equal(resolveSmartLinkCleanupLocation({
        pathname: '/install',
        search: '?state=signed.state&choice=global',
        homepageSurfaceEnabled: true,
    }), '/')
    assert.equal(resolveSmartLinkCleanupLocation({
        pathname: '/install',
        search: '?state=one&state=two&choice=global',
        homepageSurfaceEnabled: true,
    }), '/install')
    assert.equal(resolveSmartLinkCleanupLocation({
        pathname: '/privacy',
        search: '?legacy_slug=bad&click_id=bad&utm_source=private',
        hash: '#policy',
    }), '/privacy#policy')
})
