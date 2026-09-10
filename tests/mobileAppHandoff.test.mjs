import test from 'node:test'
import assert from 'node:assert/strict'
import { buildHandoffAppUrl, canContinueToStore, MOBILE_HANDOFF_KEY, readHandoff,
    resolveMobileHandoff, selectGlobalHandoffOption, writeHandoff } from '../src/lib/mobileAppHandoff.js'
import { sanitizeMobileHandoffProperties } from '../src/lib/analytics.js'
import { resolveMarketingCtaCopyExperiment } from '../src/lib/marketingCtaExperiment.js'

const ios = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15 Safari/604.1'
const android = 'Mozilla/5.0 (Linux; Android 15) Chrome/140.0 Mobile Safari/537.36'
const input = { enabled: true, pathname: '/', market: 'global', userAgent: ios, hasEntry: false }
const storage = () => { const map = new Map(); return { getItem: key => map.get(key), setItem: (key, v) => map.set(key, v) } }

test('covers overseas mobile home and marketing routes, preserving purpose-specific pages', () => {
    for (const pathname of ['/', '/global/zh-cn', '/global/zh-tw/']) {
        assert.equal(resolveMobileHandoff({ ...input, pathname }).eligible, true)
    }
    for (const pathname of ['/privacy', '/terms', '/contact', '/delete-account', '/help', '/unknown', '/install']) {
        assert.equal(resolveMobileHandoff({ ...input, pathname }).eligible, false)
    }
    for (const override of [{ enabled: false }, { market: 'cn' }, { market: 'unknown' },
        { userAgent: 'Windows Chrome/140' }, { userAgent: 'Macintosh; Intel Mac OS X' },
        { userAgent: 'Mozilla/5.0 (Phone; OpenHarmony 5.0) Mobile' }]) {
        assert.equal(resolveMobileHandoff({ ...input, ...override }).eligible, false)
    }
    assert.equal(resolveMobileHandoff({ ...input, userAgent: android }).platform, 'android')
})

test('a signed/legacy entry waits for verified install context; webviews retain a gesture fallback', () => {
    for (const loadStatus of ['loading', 'failed', 'no_options', 'missing_state']) {
        assert.equal(resolveMobileHandoff({ ...input, hasEntry: true, loadStatus }).eligible, false)
    }
    assert.equal(resolveMobileHandoff({ ...input, pathname: '/install', hasEntry: true, loadStatus: 'ready' }).eligible, true)
    for (const token of ['MicroMessenger', 'FBAN', 'FBAV', 'Instagram', 'Line/1', '; wv)']) {
        assert.equal(resolveMobileHandoff({ ...input, userAgent: `${ios} ${token}` }).requiresBrowser, true)
    }
})

test('only a compatible available global product is selected', () => {
    const options = [
        { optionId: 'cn', channel: 'apple_app_store', platform: 'ios', region: 'cn', status: 'available' },
        { optionId: 'stale', channel: 'apple_app_store', platform: 'ios', region: 'global', status: 'stale' },
        { optionId: 'tf', channel: 'testflight', platform: 'ios', region: 'global', status: 'available' },
        { optionId: 'play', channel: 'google_play', platform: 'android', region: 'global', status: 'available' },
    ]
    assert.equal(selectGlobalHandoffOption(options, 'ios'), null)
    assert.equal(selectGlobalHandoffOption(options, 'android')?.optionId, 'play')
    assert.equal(selectGlobalHandoffOption(options, 'harmonyos_next'), null)
})

test('app URLs strip bearer, destination and provider data, preserving only a valid canonical click', () => {
    const click = `clk_${'a'.repeat(32)}`
    const target = new URL(buildHandoffAppUrl(`https://link.lutaai.com/l/test?click_id=${click}&state=secret&next=https://evil.test&fbclid=private#fragment`))
    assert.equal(target.search, `?click_id=${click}&web_handoff=automatic`)
    assert.equal(target.hash, '')
    assert.equal(buildHandoffAppUrl('https://evil.test/l/test'), null)
    assert.equal(buildHandoffAppUrl('http://link.lutaai.com/l/test'), null)
    assert.equal(buildHandoffAppUrl('https://user:secret@link.lutaai.com/l/test'), null)
    assert.equal(buildHandoffAppUrl('https://link.lutaai.com/out/test'), null)
    assert.equal(buildHandoffAppUrl('https://link.lutaai.com/l/test'), null)
    assert.equal(buildHandoffAppUrl('https://link.lutaai.com/l/test?click_id=malformed'), null)
    assert.equal(buildHandoffAppUrl(`https://link.lutaai.com/l/test?click_id=${click}&click_id=${click}`), null)
    assert.equal(new URL(buildHandoffAppUrl(undefined, 'continue')).pathname, '/l/open/app')
})

test('session opt-out survives route changes and blocked storage fails safely', () => {
    const state = storage()
    assert.equal(readHandoff(state), null)
    assert.equal(writeHandoff(state, 'browse', 'direct', 10), true)
    assert.equal(readHandoff(state).phase, 'browse')
    state.setItem(MOBILE_HANDOFF_KEY, '{broken')
    assert.equal(readHandoff(state), null)
    assert.equal(writeHandoff(null, 'attempted'), false)
    assert.equal(readHandoff({ getItem() { throw new Error('denied') } }), null)
})

test('only a recent explicit continue plus a resolver return can proceed to store', () => {
    const record = { phase: 'continue_pending', journey: 'link:click', at: 100 }
    const args = { record, returnedByResolver: true, journey: 'link:click', now: 200 }
    assert.equal(canContinueToStore(args), true)
    for (const override of [{ returnedByResolver: false }, { journey: 'direct' }, { now: 99 }, { now: 60_101 },
        { record: { ...record, phase: 'attempted' } }, { record: { ...record, phase: 'store' } }]) {
        assert.equal(canContinueToStore({ ...args, ...override }), false)
    }
})

test('automatic telemetry has its own bounded semantics and does not claim installation', () => {
    assert.deepEqual(sanitizeMobileHandoffProperties('automatic_attempt', { state: 'secret', url: 'https://secret',
        page_path: '/?state=secret', installation_state: 'not_installed', handoff_action: 'store_clicked' }), {
        page_path: '/', handoff_action: 'automatic_attempt', handoff_policy: 'global_mobile_v1', installation_state: 'unknown',
    })
    assert.equal(sanitizeMobileHandoffProperties('app_opened', {}), null)
    assert.equal(resolveMarketingCtaCopyExperiment({ trafficPurpose: 'production', mobileHandoffEligible: true }).eligible, false)
})
