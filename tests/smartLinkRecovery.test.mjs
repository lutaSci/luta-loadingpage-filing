import assert from 'node:assert/strict'
import test from 'node:test'

import {
    resolveSmartLinkRecovery,
    withoutSmartLinkRecovery,
} from '../src/lib/smartLinkRecovery.js'

test('maps only supported recovery statuses to user-facing groups', () => {
    assert.deepEqual(
        resolveSmartLinkRecovery('?smart_link_status=link_draft'),
        { group: 'preparing' },
    )
    assert.deepEqual(
        resolveSmartLinkRecovery('?smart_link_status=link_paused'),
        { group: 'paused' },
    )
    assert.deepEqual(
        resolveSmartLinkRecovery('?smart_link_status=link_expired'),
        { group: 'unavailable' },
    )
})

test('ignores unknown or missing values instead of exposing raw server text', () => {
    assert.equal(resolveSmartLinkRecovery(''), null)
    assert.equal(resolveSmartLinkRecovery('?smart_link_status=GoException'), null)
    assert.equal(resolveSmartLinkRecovery('?smart_link_status=%3Cscript%3E'), null)
})

test('removes only the recovery status when the notice is dismissed', () => {
    assert.equal(
        withoutSmartLinkRecovery('https://lutaai.com/?smart_link_status=link_draft&utm_source=qr#install'),
        '/?utm_source=qr#install',
    )
})
