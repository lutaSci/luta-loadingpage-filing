import test from 'node:test'
import assert from 'node:assert/strict'
import { mountPilotPage } from '../src/pilots/singular-ios/page-controller.js'
import { pilotConfig } from '../src/pilots/singular-ios/config.js'
import { IOS_STORE_URL } from '../src/pilots/singular-ios/download.js'

const config = { entitlementConfirmed: true, nativeReadConfirmed: true,
    webProductId: 'com.example.qa', supportEvidence: 'offline_fixture',
    pageOrigin: 'https://qa.example.invalid', baseLink: 'https://lutaai.sng.link/QA/TEST' }
const credentials = { sdkKey: 'offline-key', sdkSecret: 'offline-secret' }

function target() {
    const handlers = new Map()
    return { disabled: false, checked: false, textContent: '',
        addEventListener: (event, handler) => handlers.set(event, handler),
        removeEventListener: event => handlers.delete(event),
        fire: event => handlers.get(event)?.() }
}
function fixture({ activeConfig = config, keys = credentials,
    url = config.pageOrigin + '/singular-ios-pilot.html?token=must_not_forward&content=QA_FB_01',
    loadFails = false, buildFails = false, copyFails = false, timeoutMs = 1000 } = {}) {
    const elements = Object.fromEntries(['copy-consent', 'measured-download', 'status', 'direct-download']
        .map(id => [id, target()]))
    const calls = []
    const navigations = []
    const scripts = []
    let ready
    const window = { ...target(), location: { href: url, assign: value => navigations.push(value) },
        history: { replaceState: (_state, _title, value) => { window.location.href = value } } }
    const document = { getElementById: id => elements[id], createElement: () => ({}),
        head: { appendChild: value => scripts.push(value) } }
    class Config {
        withInitFinishedCallback(value) { ready = value; return this }
    }
    const sdk = {
        init() { calls.push('init') },
        buildWebToAppLink(value) {
            calls.push('build')
            if (buildFails) throw Error('failure')
            const result = new URL(value)
            result.search = new URL(window.location.href).search
            return result.toString()
        },
        enrichUrlWithClipboardDdlFlow(value) {
            calls.push('copy')
            if (copyFails) throw Error('refused')
            const result = new URL(value)
            result.searchParams.set('ecid', config.pageOrigin + '/_ecid/offline')
            return result.toString()
        },
    }
    const loadSdk = async () => {
        calls.push('load')
        assert.equal(new URL(window.location.href).searchParams.has('token'), false)
        if (loadFails) throw Error('offline-secret')
        return { Config, sdk }
    }
    const controller = mountPilotPage({ config: activeConfig, credentials: keys, window,
        document, loadSdk, timeoutMs })
    const consent = elements['copy-consent'], button = elements['measured-download'], direct = elements['direct-download']
    return { window, document, consent, button, direct, controller, calls, scripts, navigations, sdk, Config,
        choose(value = true) { consent.checked = value; consent.fire('change') },
        async loaded() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() },
        ready() { ready?.() } }
}

test('wired page stays inert on default gates, missing keys and unapproved origin', async () => {
    for (const change of [{ activeConfig: pilotConfig }, { keys: {} },
        { url: 'https://lutaai.com/singular-ios-pilot.html?entitlementConfirmed=true&sdkKey=evil' }]) {
        const f = fixture(change)
        f.choose()
        f.button.fire('click')
        await f.controller.whenSettled()
        assert.equal(f.consent.disabled, true)
        assert.equal(f.button.disabled, true)
        assert.deepEqual(f.calls, [])
        assert.deepEqual(f.navigations, [])
        f.controller.dispose()
    }
})

test('page mounting and direct download without a choice never load or initialize', () => {
    const f = fixture()
    assert.equal(f.consent.disabled, false)
    f.direct.fire('click')
    f.choose()
    assert.deepEqual(f.calls, [])
    assert.equal(f.button.disabled, true)
    assert.equal(f.direct.disabled, false)
    f.controller.dispose()
})

test('initialization callback enables a separate synchronous copy/download click only once', async () => {
    const f = fixture()
    f.choose()
    f.button.fire('click')
    await f.loaded()
    assert.deepEqual(f.calls, ['load', 'init'])
    assert.equal(f.button.disabled, true)
    assert.deepEqual(f.navigations, [])
    f.ready()
    await f.controller.whenSettled()
    assert.equal(f.button.disabled, false)
    assert.deepEqual(f.calls, ['load', 'init'])
    f.button.fire('click')
    // No await between user action and copy/navigation.
    assert.deepEqual(f.calls, ['load', 'init', 'build', 'copy'])
    assert.equal(f.navigations.length, 1)
    const result = new URL(f.navigations[0])
    assert.equal(result.searchParams.get('pcn'), 'qa_owned_media')
    assert.equal(result.searchParams.get('pcrid'), 'QA_FB_01')
    assert.equal(result.searchParams.has('ecid'), true)
    f.button.fire('click')
    assert.equal(f.navigations.length, 1)
    f.controller.dispose()
})

test('refusal during initialization or after readiness prevents copy and late hand-off', async () => {
    for (const beforeReady of [true, false]) {
        const f = fixture()
        f.choose()
        await f.loaded()
        if (!beforeReady) { f.ready(); await f.controller.whenSettled() }
        f.choose(false)
        f.ready()
        await f.controller.whenSettled()
        f.button.fire('click')
        f.choose()
        assert.equal(f.button.disabled, true)
        assert.deepEqual(f.calls, ['load', 'init'])
        assert.deepEqual(f.navigations, [])
        f.controller.dispose()
    }
})

test('direct download cancels a pending script before late initialization', async () => {
    const f = fixture()
    const controller = mountPilotPage({ config, credentials, window: f.window, document: f.document })
    f.choose()
    await f.loaded()
    assert.equal(f.scripts.length, 1)
    f.direct.fire('click')
    f.window.singularSdk = f.sdk
    f.window.SingularConfig = f.Config
    f.scripts[0].onload()
    await controller.whenSettled()
    assert.equal(f.button.disabled, true)
    assert.deepEqual(f.calls, [])
    assert.deepEqual(f.navigations, [])
    controller.dispose()
    f.controller.dispose()
})

test('load failure and missing readiness preserve direct-store access without code work', async () => {
    for (const loadFails of [true, false]) {
        const f = fixture({ loadFails, timeoutMs: 10 })
        f.choose()
        await f.controller.whenSettled()
        f.ready()
        f.button.fire('click')
        assert.equal(f.button.disabled, true)
        assert.equal(f.direct.disabled, false)
        assert.equal(f.calls.includes('copy'), false)
        assert.deepEqual(f.navigations, [])
        f.controller.dispose()
    }
})

test('copy refusal preserves ordinary Singular download and build failure preserves App Store', async () => {
    for (const change of [{ copyFails: true }, { buildFails: true }]) {
        const f = fixture(change)
        f.choose()
        await f.loaded()
        f.ready()
        await f.controller.whenSettled()
        f.button.fire('click')
        assert.equal(f.navigations.length, 1)
        assert.equal(new URL(f.navigations[0]).searchParams.has('ecid'), false)
        if (change.buildFails) assert.equal(f.navigations[0], IOS_STORE_URL)
        else assert.equal(new URL(f.navigations[0]).hostname, 'lutaai.sng.link')
        f.controller.dispose()
    }
})

test('URL changed after readiness cannot forward new private fields or copy a stale source', async () => {
    const f = fixture()
    f.choose()
    await f.loaded()
    f.ready()
    await f.controller.whenSettled()
    f.window.location.href += '&token=must_not_forward'
    f.button.fire('click')
    assert.equal(f.button.disabled, true)
    assert.deepEqual(f.calls, ['load', 'init'])
    assert.deepEqual(f.navigations, [])
    f.controller.dispose()
})

test('page exit and disposal cannot revive a late ready callback', async () => {
    for (const exit of ['pagehide', 'dispose']) {
        const f = fixture()
        f.choose()
        await f.loaded()
        if (exit === 'pagehide') f.window.fire('pagehide')
        else f.controller.dispose()
        f.ready()
        await f.controller.whenSettled()
        f.button.fire('click')
        assert.equal(f.button.disabled, true)
        assert.deepEqual(f.navigations, [])
        f.controller.dispose()
    }
})
