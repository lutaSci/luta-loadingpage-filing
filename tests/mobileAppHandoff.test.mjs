import test from 'node:test'
import assert from 'node:assert/strict'
import { legacyHandoffReturn, latestHandoffRecord, buildHandoffAppUrl, canContinueToStore, MOBILE_HANDOFF_KEY, readHandoff,
    readHistoryHandoff, resolveHandoffAction, resolveHandoffMarket,
    resolveMobileHandoff, selectGlobalHandoffOption, writeHandoff, writeHistoryHandoff } from '../src/lib/mobileAppHandoff.js'
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

test('a signed/legacy entry waits for verified install context and identifies embedded browsers', () => {
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

test('automatic and explicit app attempts may return directly to the store once', () => {
    const record = { phase: 'continue_pending', journey: 'link:click', at: 100 }
    const args = { record, returnedByResolver: true, journey: 'link:click', now: 200 }
    assert.equal(canContinueToStore(args), true)
    assert.equal(canContinueToStore({ ...args, record: { ...record, phase: 'attempted' } }), true)
    for (const override of [{ returnedByResolver: false }, { journey: 'direct' }, { now: 99 }, { now: 60_101 },
        { record: { ...record, phase: 'returned' } }, { record: { ...record, phase: 'store' } }]) {
        assert.equal(canContinueToStore({ ...args, ...override }), false)
    }
})

test('automatic telemetry has its own bounded semantics and does not claim installation', () => {
    assert.deepEqual(sanitizeMobileHandoffProperties('automatic_attempt', { state: 'secret', url: 'https://secret',
        page_path: '/?state=secret', installation_state: 'not_installed', handoff_action: 'store_clicked' }), {
        page_path: '/', handoff_action: 'automatic_attempt', handoff_policy: 'global_mobile_v2', installation_state: 'unknown',
    })
    assert.equal(sanitizeMobileHandoffProperties('automatic_store_attempt', {}).handoff_action, 'automatic_store_attempt')
    assert.equal(sanitizeMobileHandoffProperties('app_opened', {}), null)
    assert.equal(resolveMarketingCtaCopyExperiment({ trafficPurpose: 'production', mobileHandoffEligible: true }).eligible, false)
})

test('trusted link routing outranks website heuristics, while explicit visitor choice stays authoritative', () => {
    assert.equal(resolveHandoffMarket({ campaignTargetMarket: 'global', defaultMarket: 'cn' }), 'global')
    assert.equal(resolveHandoffMarket({ campaignTargetMarket: 'cn', defaultMarket: 'global' }), 'cn')
    assert.equal(resolveHandoffMarket({ entryChoice: 'cn', campaignTargetMarket: 'global' }), 'cn')
    assert.equal(resolveHandoffMarket({ recommendedRegion: 'global', defaultMarket: 'cn' }), 'global')
    assert.equal(resolveHandoffMarket({ campaignTargetMarket: 'unknown', defaultMarket: 'global', utm_source: 'cn' }), 'global')
    assert.equal(resolveHandoffMarket({ utm_source: 'meta', defaultMarket: 'unknown' }), null)
})

test('catalog recommendations win within the compatible available official store choices', () => {
    const product = { channel: 'apple_app_store', platform: 'ios', region: 'global', status: 'available' }
    const options = [
        { ...product, optionId: 'first', order: 0 },
        { ...product, optionId: 'recommended', recommended: true, order: 20 },
        { ...product, optionId: 'disabled', recommended: true, routeAvailable: false, order: -1 },
        { ...product, optionId: 'wrong_device', channel: 'google_play', platform: 'android', recommended: true },
    ]
    assert.equal(selectGlobalHandoffOption(options, 'ios').optionId, 'recommended')
    assert.equal(selectGlobalHandoffOption(options.slice(2, 3), 'ios'), null)
})

test('normal app-to-browser round trip goes straight to store without a confirmation step', () => {
    const input = { journey: 'direct', canOpenApp: true, canOpenStore: true, now: 200 }
    assert.equal(resolveHandoffAction(input), 'app')
    const record = { phase: 'attempted', journey: 'direct', at: 100 }
    assert.equal(resolveHandoffAction({ ...input, record, returnedByResolver: true }), 'store')
    assert.equal(resolveHandoffAction({ ...input, requiresBrowser: true }), 'store')
    assert.equal(resolveHandoffAction({ ...input, canOpenApp: false }), 'store')
    assert.equal(resolveHandoffAction({ ...input, canOpenApp: false, canOpenStore: false }), 'recover')
})

test('Back, refresh, interrupted attempts, stale returns and browse opt-out never repeat automatic routing', () => {
    const input = { journey: 'direct', canOpenApp: true, canOpenStore: true, now: 200 }
    for (const phase of ['attempted', 'store', 'returned']) {
        assert.equal(resolveHandoffAction({ ...input, record: { phase, journey: 'direct', at: 100 } }), 'recover')
    }
    assert.equal(resolveHandoffAction({ ...input, historyReturn: true }), 'recover')
    assert.equal(resolveHandoffAction({ ...input, returnedByResolver: true }), 'recover')
    assert.equal(resolveHandoffAction({ ...input, returnedByResolver: true,
        record: { phase: 'attempted', journey: 'another-link', at: 100 } }), 'recover')
    assert.equal(resolveHandoffAction({ ...input, returnedByResolver: true, now: 60_101,
        record: { phase: 'attempted', journey: 'direct', at: 100 } }), 'recover')
    assert.equal(resolveHandoffAction({ ...input, record: { phase: 'browse', journey: 'another-link', at: 100 } }), 'browse')
    assert.equal(resolveHandoffAction({ ...input, record: { phase: 'store', journey: 'another-link', at: 100 } }), 'app')
})

test('history receipt supports storage-blocked browser returns without overwriting router state', () => {
    const history = { state: { key: 'router-key', idx: 3, usr: { own: 'value' } },
        replaceState(value) { this.state = value } }
    assert.equal(writeHistoryHandoff(history, 'store', 'direct', 100), true)
    assert.deepEqual(readHistoryHandoff(history.state), { phase: 'store', journey: 'direct', at: 100 })
    assert.equal(history.state.key, 'router-key')
    assert.equal(history.state.idx, 3)
    assert.deepEqual(history.state.usr, { own: 'value' })
    assert.equal(writeHistoryHandoff({ replaceState() { throw new Error('denied') } }, 'store', 'direct'), false)
    assert.equal(readHistoryHandoff({ lutaMobileHandoff: { phase: 'store', at: 100 } }), null)
})

test('history receipt wins when a later session write fails, while browse remains respected', () => {
    const old = { phase: 'attempted', journey: 'old', at: 10 }
    const current = { phase: 'store', journey: 'new', at: 20 }
    assert.equal(latestHandoffRecord(old, current), current)
    assert.equal(latestHandoffRecord(null, current), current)
    const browse = { phase: 'browse', journey: 'old', at: 5 }
    assert.equal(latestHandoffRecord(browse, current), browse)
})

test('old API returns require a fresh matching automatic journey and forward navigation', () => {
    const neutral = { search: '?smart_link_status=invalid_request', pathname: '/', record: {phase:'attempted',journey:'direct',at:100}, navigationType:'navigate', now:200 }
    assert.equal(legacyHandoffReturn(neutral), 'neutral')
    for (const patch of [{record:null},{navigationType:'reload'},{navigationType:'back_forward'},{now:70000},{pathname:'/privacy'},{search:'?smart_link_status=link_expired'},{search:'?smart_link_status=invalid_request&state=bad'},{record:{phase:'store',journey:'direct',at:100}}]) {
        assert.equal(legacyHandoffReturn({...neutral,...patch}), null)
    }
    const signed={...neutral,search:'?state=signed',record:{phase:'attempted',journey:'link:click',at:100}}
    assert.equal(legacyHandoffReturn(signed),'signed')
    assert.equal(legacyHandoffReturn({...signed,search:'?state=a&state=b'}),null)
    assert.equal(resolveHandoffAction({record:signed.record,journey:'other:click',returnedByResolver:true,canOpenStore:true,now:200}),'recover')
})
