import test from 'node:test'
import assert from 'node:assert/strict'
import { createPilotDownload, sanitizePilotPageUrl, IOS_STORE_URL } from '../src/pilots/singular-ios/download.js'
import { pilotConfig } from '../src/pilots/singular-ios/config.js'

const pageUrl = 'https://qa.example.invalid/singular-ios-pilot.html'
const config = { entitlementConfirmed: true, nativeReadConfirmed: true,
    webProductId: 'com.example.qa', supportEvidence: 'offline_fixture',
    pageOrigin: 'https://qa.example.invalid', baseLink: 'https://lutaai.sng.link/QA/TEST' }

function fixture({ buildFails = false, copyThrows = false, noCode = false, wrongCodeOrigin = false } = {}) {
    const calls = []
    const sdk = {
        buildWebToAppLink(value) {
            calls.push('build')
            if (buildFails) return null
            return value + '?pcn=qa_owned_media'
        },
        enrichUrlWithClipboardDdlFlow(value) {
            calls.push('copy_attempt')
            if (copyThrows) throw new Error('copy blocked')
            if (noCode) return value
            const url = new URL(value)
            url.searchParams.set('ecid', `${wrongCodeOrigin ? 'https://other.invalid' : config.pageOrigin}/_ecid/fixture`)
            return url.toString()
        },
    }
    return { sdk, calls }
}

test('preparation defaults never initialize the SDK or attempt clipboard work', () => {
    const f = fixture()
    const flow = createPilotDownload({ config: pilotConfig, sdk: f.sdk, pageUrl })
    assert.equal(flow.ready, false)
    assert.equal(flow.prepare({ consent: true }).url, IOS_STORE_URL)
    assert.deepEqual(f.calls, [])
})

test('source sanitation strips private/redirect fields and pins QA campaign before SDK use', () => {
    const url = new URL(sanitizePilotPageUrl(`${pageUrl}?platform=instagram&entry=story&content=QA_REEL_01&email=private&token=secret&fbclid=private&next=https://evil.invalid&pcn=owned_social#secret`))
    assert.equal(url.searchParams.get('pscn'), 'facebook__luta_official')
    assert.equal(url.searchParams.get('pcn'), 'qa_owned_media')
    assert.equal(url.searchParams.get('pcrid'), 'QA_REEL_01')
    assert.equal(url.searchParams.get('pcrn'), 'story')
    assert.deepEqual([...url.searchParams.keys()], ['pcn', 'pcid', 'pscn', 'pscid', 'pcrn', 'pcrid'])
    assert.equal(url.hash, '')
    for (const content of ['person@example.invalid', '15900000000', 'QA_1&content=QA_2']) {
        assert.equal(new URL(sanitizePilotPageUrl(`${pageUrl}?content=${content}`)).searchParams.has('pcrid'), false)
    }
})

test('the first QA entry always uses its fixed Facebook account, never caller-supplied sources', () => {
    for (const platform of ['facebook', 'instagram', 'youtube', 'tiktok', '__proto__']) {
        const url = new URL(sanitizePilotPageUrl(`${pageUrl}?platform=${platform}&pscn=arbitrary&entry=evil`))
        assert.equal(url.searchParams.get('pscn'), 'facebook__luta_official')
        assert.equal(url.searchParams.get('pcrn'), 'profile')
    }
})

test('refresh retains cleaned entry/content while conflicting aliases cannot choose a label', () => {
    for (const entry of ['profile', 'post', 'story', 'description']) {
        const clean = sanitizePilotPageUrl(`${pageUrl}?entry=${entry}&content=QA_FB_01`)
        assert.equal(sanitizePilotPageUrl(clean), clean)
    }
    const ambiguous = new URL(sanitizePilotPageUrl(`${pageUrl}?entry=story&pcrn=post&content=QA_1&pcrid=QA_2`))
    assert.equal(ambiguous.searchParams.get('pcrn'), 'profile')
    assert.equal(ambiguous.searchParams.has('pcrid'), false)
})

test('consent, entitlement, native boundary and exact QA origin are independent prerequisites', () => {
    for (const change of [{ entitlementConfirmed: false }, { nativeReadConfirmed: false },
        { supportEvidence: '' }, { webProductId: '' }, { pageOrigin: 'http://qa.example.invalid' },
        { baseLink: 'https://other.sng.link/QA/TEST' }, { baseLink: 'https://lutaai.sng.link/QA/TEST?override=true' },
        { baseLink: 'https://secret@lutaai.sng.link/QA/TEST' }]) {
        const f = fixture()
        const flow = createPilotDownload({ config: { ...config, ...change }, sdk: f.sdk, pageUrl })
        assert.equal(flow.ready, false)
        assert.equal(flow.prepare({ consent: true }).route, 'direct_store')
        assert.deepEqual(f.calls, [])
    }
    const f = fixture()
    const flow = createPilotDownload({ config, sdk: f.sdk, pageUrl })
    assert.equal(flow.ready, true)
    assert.equal(flow.prepare().reason, 'copy_not_requested')
    assert.deepEqual(f.calls, [])
    assert.equal(createPilotDownload({ config, sdk: f.sdk, pageUrl: 'https://lutaai.com/' }).ready, false)
})

test('a connecting URL remains unknown copy status, never installation or source success', () => {
    const f = fixture()
    const flow = createPilotDownload({ config, sdk: f.sdk, pageUrl })
    const result = flow.prepare({ consent: true })
    assert.equal(result.route, 'singular')
    assert.equal(result.copyStatus, 'unknown')
    assert.equal(result.reason, 'sdk_has_no_copy_receipt')
    assert.equal(new URL(result.url).searchParams.has('ecid'), true)
    assert.deepEqual(f.calls, ['build', 'copy_attempt'])
    assert.equal(flow.prepare({ consent: true }), result)
    assert.deepEqual(f.calls, ['build', 'copy_attempt'])
    assert.equal(flow.prepare({ consent: false }).route, 'direct_store')
})

test('copy failure, unsupported flow and mismatched code origin preserve ordinary download', () => {
    for (const behavior of [{ copyThrows: true }, { noCode: true }, { wrongCodeOrigin: true }]) {
        const f = fixture(behavior)
        const result = createPilotDownload({ config, sdk: f.sdk, pageUrl }).prepare({ consent: true })
        assert.equal(result.route, 'singular')
        assert.equal(result.copyStatus, 'unknown')
        assert.equal(new URL(result.url).searchParams.has('ecid'), false)
        assert.equal(result.reason, 'clipboard_flow_unconfirmed')
    }
    const f = fixture({ buildFails: true })
    assert.equal(createPilotDownload({ config, sdk: f.sdk, pageUrl }).prepare({ consent: true }).url, IOS_STORE_URL)
    assert.deepEqual(f.calls, ['build'])
})

test('SDK redirects cannot swap the destination and no convenience wrapper is required', () => {
    const sdk = { buildWebToAppLink: () => 'https://evil.invalid/',
        enrichUrlWithClipboardDdlFlow: () => { throw Error('must not run') } }
    assert.equal(createPilotDownload({ config, sdk, pageUrl }).prepare({ consent: true }).url, IOS_STORE_URL)
    const f = fixture()
    f.sdk.enrichUrlWithClipboardDdlFlow = () => 'https://evil.invalid/?ecid=private'
    const result = createPilotDownload({ config, sdk: f.sdk, pageUrl }).prepare({ consent: true })
    assert.equal(new URL(result.url).origin, 'https://lutaai.sng.link')
    assert.equal(new URL(result.url).searchParams.has('ecid'), false)
})
