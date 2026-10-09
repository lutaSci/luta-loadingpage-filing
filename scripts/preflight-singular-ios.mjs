// Offline compatibility check against a separately obtained official Web SDK.
// The vendor bundle is not copied into this repository or loaded by the page.
import fs from 'node:fs'
import vm from 'node:vm'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import process from 'node:process'
import { createPilotDownload, sanitizePilotPageUrl } from '../src/pilots/singular-ios/download.js'
import { createPilotBootstrap, PILOT_SDK_URL, PILOT_SDK_INTEGRITY } from '../src/pilots/singular-ios/bootstrap.js'

const source = fs.readFileSync(process.argv[2], 'utf8')
const sha256 = crypto.createHash('sha256').update(source).digest('hex')
assert.equal(sha256, '625702db3e68156606779293b789fec6ce74f16ca9684017c80d04bccb1e9d77', 'Use the reviewed official 1.4.8 bundle')
assert.equal(PILOT_SDK_INTEGRITY, 'sha256-' + crypto.createHash('sha256').update(source).digest('base64'))
const pageUrl = sanitizePilotPageUrl('https://qa.example.invalid/singular-ios-pilot.html?entry=profile&content=QA_FB_01&token=must_not_forward&email=must_not_forward')
const store = new Map()
const effects = { networkAttempts: 0, copies: [], opened: [], copyAccepted: true }
const storage = { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, String(value)), removeItem: key => store.delete(key) }
const selection = { rangeCount: 0, addRange() {}, removeAllRanges() {}, removeRange() {}, getRangeAt() { return {} } }
const document = {
    referrer: '', cookie: '', readyState: 'complete', visibilityState: 'visible', location: { href: pageUrl },
    addEventListener() {}, removeEventListener() {}, getSelection: () => selection,
    createRange: () => ({ selectNodeContents() {} }), activeElement: { tagName: 'BODY' },
    createElement: () => ({ style: {}, firstChild: { getElementsByClassName() { return [{}] } },
        content: { firstChild: { getElementsByClassName() { return [{}] } } },
        firstElementChild: { getElementsByClassName() { return [{}] } }, setAttribute() {}, appendChild() {}, select() {} }),
    body: { appendChild(node) { effects.copies.push(node.textContent) }, removeChild() {} },
    execCommand: command => command === 'copy' && effects.copyAccepted, querySelector: () => null,
}
const context = {
    URL, URLSearchParams, navigator: { userAgent: 'offline-fixture', platform: 'MacIntel', language: 'en-US' },
    screen: { width: 390, height: 844 }, document, localStorage: storage, sessionStorage: storage,
    location: document.location, crypto: crypto.webcrypto, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    addEventListener() {}, removeEventListener() {}, performance: { now: () => 0, timing: { navigationStart: 0 }, navigation: { type: 0 } },
    open: url => effects.opened.push(url),
    XMLHttpRequest: class { open() { effects.networkAttempts++ } setRequestHeader() {} send() {} },
    fetch: () => { effects.networkAttempts++; throw Error('OFFLINE_NETWORK_BLOCKED') },
    btoa: value => Buffer.from(value, 'binary').toString('base64'), atob: value => Buffer.from(value, 'base64').toString('binary'),
}
context.window = context
context.self = context
vm.createContext(context)
vm.runInContext(source, context, { timeout: 3000 })
const sdk = context.singularSdk
const config = { entitlementConfirmed: true, nativeReadConfirmed: true, webProductId: 'com.example.qa',
    supportEvidence: 'offline_fixture', pageOrigin: 'https://qa.example.invalid', baseLink: 'https://lutaai.sng.link/QA/TEST' }
// These mock credentials cannot authorize live service use. Network APIs above
// are inert, and this Node VM is not a browser or a phone acceptance result.
const bootstrap = createPilotBootstrap({ config, credentials: { sdkKey: 'offline-key', sdkSecret: 'offline-secret' },
    page: { getUrl: () => context.location.href, replaceUrl: value => { context.location.href = value } },
    loadSdk: async url => {
        assert.equal(url, PILOT_SDK_URL)
        return { sdk, Config: context.SingularConfig }
    }, timeoutMs: 50,
})
const initialized = await bootstrap.start({ consent: true })
assert.equal(initialized.status, 'ready')
assert.equal(initialized.sdk, sdk)
const first = createPilotDownload({ config, sdk, pageUrl }).prepare({ consent: true })
const link = new URL(first.url)
assert.equal(first.route, 'singular')
assert.equal(first.copyStatus, 'unknown')
assert.equal(effects.copies.at(-1), link.searchParams.get('ecid'))
const marketing = new URLSearchParams(link.searchParams.get('_web_params'))
assert.equal(marketing.get('pscn'), 'facebook__luta_official')
assert.equal(marketing.get('pcrid'), 'QA_FB_01')
assert.equal(marketing.has('token'), false)
assert.equal(marketing.has('email'), false)
effects.copyAccepted = false
const denied = createPilotDownload({ config, sdk, pageUrl }).prepare({ consent: true })
assert.equal(new URL(denied.url).searchParams.has('ecid'), true)
assert.equal(denied.copyStatus, 'unknown')
assert.equal(effects.opened.length, 0)
process.stdout.write(JSON.stringify({ sdkVersion: '1.4.8', sha256, separateMethodsCompatible: true,
    initializationCallbackCompatible: true, pinnedIntegrityMatches: true,
    sanitizedMarketingForwarded: true, refusedCopyNotClaimedSuccessful: true,
    networkAttempts: effects.networkAttempts, realNetworkRequests: 0, realClipboardWrites: 0,
    realNavigations: 0, deviceAcceptance: 'not_run' }, null, 2) + '\n')
