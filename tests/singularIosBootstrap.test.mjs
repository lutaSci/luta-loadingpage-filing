import test from 'node:test'
import assert from 'node:assert/strict'
import { createPilotBootstrap, createPilotSdkLoader, PILOT_SDK_URL, PILOT_SDK_INTEGRITY } from '../src/pilots/singular-ios/bootstrap.js'
import { pilotConfig } from '../src/pilots/singular-ios/config.js'
import { createPilotDownload } from '../src/pilots/singular-ios/download.js'

const config = { entitlementConfirmed: true, nativeReadConfirmed: true,
    webProductId: 'com.example.qa', supportEvidence: 'offline_fixture',
    pageOrigin: 'https://qa.example.invalid', baseLink: 'https://lutaai.sng.link/QA/TEST' }
const credentials = { sdkKey: 'offline-key', sdkSecret: 'offline-secret' }

function fixture({ url = config.pageOrigin + '/singular-ios-pilot.html?token=must_not_forward&content=QA_FB_01',
    completes = true, throws = false } = {}) {
    const calls = []
    let callback
    const page = { getUrl: () => url, replaceUrl: value => { url = value; calls.push('sanitize') } }
    class Config {
        constructor(_key, _secret, product) { this.product = product }
        withInitFinishedCallback(value) { callback = value; return this }
    }
    const sdk = {
        init(value) { calls.push('init'); assert.equal(value.product, config.webProductId)
            if (completes) callback({ singularDeviceId: 'never_exposed' })
            if (throws) throw Error('must_not_expose_offline-secret')
        },
        buildWebToAppLink: value => value,
        enrichUrlWithClipboardDdlFlow: value => value,
    }
    const loadSdk = async url => { assert.equal(url, PILOT_SDK_URL); calls.push('load')
        assert.equal(new URL(page.getUrl()).searchParams.has('token'), false)
        return { sdk, Config }
    }
    return { page, loadSdk, calls, sdk, Config }
}

test('unapproved, missing credentials, refusal and wrong page cause no vendor load or init', async () => {
    for (const change of [{ config: pilotConfig }, { credentials: {} }, { consent: false },
        { config: { ...config, entitlementConfirmed: false } },
        { config: { ...config, nativeReadConfirmed: false } }, { wrongPage: true }]) {
        const f = fixture(change.wrongPage ? { url: 'https://lutaai.com/' } : {})
        const bootstrap = createPilotBootstrap({ config, credentials, ...f, ...change })
        assert.equal((await bootstrap.start({ consent: change.consent !== false })).status, 'disabled')
        assert.deepEqual(f.calls, [])
    }
})

test('sanitation must visibly take effect before vendor loading', async () => {
    const f = fixture()
    f.page.replaceUrl = () => {}
    const result = await createPilotBootstrap({ config, credentials, ...f }).start({ consent: true })
    assert.equal(result.reason, 'page_not_sanitized')
    assert.deepEqual(f.calls, [])
})

test('repeated preparation loads and initializes once, without copying, and waits for readiness', async () => {
    const f = fixture()
    const bootstrap = createPilotBootstrap({ config, credentials, ...f })
    const first = bootstrap.start({ consent: true })
    assert.equal(bootstrap.start({ consent: true }), first)
    const result = await first
    assert.equal(result.status, 'ready')
    assert.equal(result.sdk, f.sdk)
    assert.deepEqual(f.calls, ['sanitize', 'load', 'init'])
    assert.equal((await bootstrap.start()).sdk, null)
    assert.deepEqual(f.calls, ['sanitize', 'load', 'init'])
})

test('missing callback and loader failures stay unavailable and preserve direct download', async () => {
    for (const behavior of ['no_callback', 'throw', 'load_failure', 'no_api']) {
        const f = fixture({ completes: behavior !== 'no_callback', throws: behavior === 'throw' })
        if (behavior === 'load_failure') f.loadSdk = async () => { throw Error('offline-secret') }
        if (behavior === 'no_api') f.loadSdk = async () => ({ sdk: {}, Config: f.Config })
        const result = await createPilotBootstrap({ config, credentials, timeoutMs: 10, ...f }).start({ consent: true })
        assert.equal(result.status, 'failed')
        assert.equal(result.sdk, null)
        assert.equal(JSON.stringify(result).includes('offline-secret'), false)
        const download = createPilotDownload({ config, sdk: result.sdk, pageUrl: f.page.getUrl() })
        assert.equal(download.ready, false)
        assert.equal(download.prepare({ consent: true }).route, 'direct_store')
    }
})

test('cancel or timeout during loading prevents a late library response from initializing', async () => {
    for (const action of ['cancel', 'timeout']) {
        const f = fixture()
        let resolveLoad
        f.loadSdk = () => new Promise(resolve => { resolveLoad = resolve })
        const bootstrap = createPilotBootstrap({ config, credentials, timeoutMs: 10, ...f })
        const waiting = bootstrap.start({ consent: true })
        await Promise.resolve()
        if (action === 'cancel') bootstrap.cancel()
        const result = await waiting
        assert.equal(result.sdk, null)
        resolveLoad({ sdk: f.sdk, Config: f.Config })
        await Promise.resolve()
        assert.deepEqual(f.calls, ['sanitize'])
    }
})

test('cancellation before preparation is terminal for this page coordinator', async () => {
    const f = fixture()
    const bootstrap = createPilotBootstrap({ config, credentials, ...f })
    bootstrap.cancel()
    assert.equal((await bootstrap.start({ consent: true })).reason, 'preparation_cancelled')
    assert.deepEqual(f.calls, [])
})

test('cancellation before the loader starts prevents the script request', async () => {
    const f = fixture()
    const bootstrap = createPilotBootstrap({ config, credentials, ...f })
    const waiting = bootstrap.start({ consent: true })
    bootstrap.cancel()
    assert.equal((await waiting).sdk, null)
    await Promise.resolve()
    assert.deepEqual(f.calls, ['sanitize'])
})

test('URL changes while loading prevent initialization with a different or private source', async () => {
    const f = fixture()
    f.loadSdk = async () => {
        f.page.replaceUrl(config.pageOrigin + '/singular-ios-pilot.html?token=must_not_forward')
        return { sdk: f.sdk, Config: f.Config }
    }
    const result = await createPilotBootstrap({ config, credentials, ...f }).start({ consent: true })
    assert.equal(result.reason, 'page_changed_during_load')
    assert.equal(f.calls.includes('init'), false)
})

test('the browser loader pins official bytes and loads once without initializing or copying', async () => {
    const scripts = []
    const f = fixture()
    const document = { createElement: () => ({}), head: { appendChild: script => scripts.push(script) } }
    const loader = createPilotSdkLoader({ document, sdkGlobal: { singularSdk: f.sdk, SingularConfig: f.Config } })
    assert.equal(scripts.length, 0)
    await assert.rejects(loader('https://other.invalid/sdk.js'), /unsupported_sdk_source/)
    assert.equal(scripts.length, 0)
    const waiting = loader(PILOT_SDK_URL)
    assert.equal(loader(PILOT_SDK_URL), waiting)
    assert.equal(scripts.length, 1)
    assert.equal(scripts[0].src, PILOT_SDK_URL)
    assert.equal(scripts[0].integrity, PILOT_SDK_INTEGRITY)
    assert.equal(scripts[0].crossOrigin, 'anonymous')
    assert.equal(scripts[0].referrerPolicy, 'no-referrer')
    scripts[0].onload()
    assert.equal((await waiting).sdk, f.sdk)
    assert.deepEqual(f.calls, [])
})

test('a blocked or mismatched SDK script fails without exposing vendor globals', async () => {
    let script
    const document = { createElement: () => ({}), head: { appendChild: value => { script = value } } }
    const loader = createPilotSdkLoader({ document, sdkGlobal: {} })
    const waiting = loader(PILOT_SDK_URL)
    script.onerror()
    await assert.rejects(waiting, /sdk_script_unavailable/)
})

test('a changed measurement choice while loading prevents late initialization', async () => {
    const f = fixture()
    let resolveLoad
    f.loadSdk = () => new Promise(resolve => { resolveLoad = resolve })
    const bootstrap = createPilotBootstrap({ config, credentials, ...f })
    const waiting = bootstrap.start({ consent: true })
    await Promise.resolve()
    assert.equal((await bootstrap.start({ consent: false })).reason, 'measurement_not_requested')
    assert.equal((await waiting).sdk, null)
    resolveLoad({ sdk: f.sdk, Config: f.Config })
    await Promise.resolve()
    assert.deepEqual(f.calls, ['sanitize'])
})
