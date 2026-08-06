import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'

const moduleUrl = pathToFileURL(
    new URL('../src/lib/attributionState.js', import.meta.url).pathname,
).href

function createSessionStorage() {
    const storage = new Map()
    return {
        clear: () => storage.clear(),
        getItem: (key) => (storage.has(key) ? storage.get(key) : null),
        removeItem: (key) => storage.delete(key),
        setItem: (key, value) => storage.set(key, String(value)),
    }
}

async function loadAttributionModule(rawUrl, label) {
    const url = new URL(rawUrl)
    globalThis.window = {
        location: {
            origin: url.origin,
            hostname: url.hostname,
            pathname: url.pathname,
            search: url.search,
        },
    }
    return import(`${moduleUrl}?case=${label}-${Date.now()}-${Math.random()}`)
}

test('canonical legacy landing builds continue URL with server-issued root identity', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const clickId = `lclk_${'a'.repeat(32)}`
    const mod = await loadAttributionModule(
        `https://lutaai.com/?slug=global-store&click_id=${clickId}&utm_source=xhs&utm_medium=social&utm_campaign=camp_001&content_id=content001&operator=qa_ops&platform=xhs&route_market=global&traffic_purpose=qa`,
        'shortlink',
    )

    const continueUrl = new URL(mod.buildContinueUrl('google', 'homepage_primary_google'))

    assert.equal(continueUrl.origin, 'https://go.lutaai.com')
    assert.equal(continueUrl.pathname, '/r/global-store/continue')
    assert.equal(continueUrl.searchParams.get('store'), 'google')
    assert.equal(continueUrl.searchParams.get('click_id'), clickId)
    assert.equal(continueUrl.searchParams.get('utm_source'), 'xhs')
    assert.equal(continueUrl.searchParams.get('utm_campaign'), 'camp_001')
    assert.equal(continueUrl.searchParams.get('content_id'), 'content001')
    assert.equal(continueUrl.searchParams.get('placement'), 'homepage_primary_google')
    assert.equal(continueUrl.searchParams.get('landing_url'), 'https://lutaai.com/')
    assert.equal(continueUrl.searchParams.get('route_market'), 'global')
    assert.equal(continueUrl.searchParams.get('traffic_purpose'), 'qa')
    assert.deepEqual(mod.resolveRouteContext(true), { market: 'global', source: 'slug' })
})

test('direct UTM landing generates website-direct click id and reuses it for same signature', async () => {
    let uuidCounter = 0
    Object.defineProperty(globalThis, 'crypto', {
        value: { randomUUID: () => `uuid-${++uuidCounter}` },
        configurable: true,
    })
    globalThis.sessionStorage = createSessionStorage()

    const first = await loadAttributionModule(
        'https://lutaai.com/?utm_source=direct_qc&utm_medium=owned&utm_campaign=direct_campaign',
        'direct-first',
    )
    const firstState = first.getAttributionState()
    const apkEntryUrl = new URL(first.buildVerifiedApkEntryUrl('mobile_android_china'))

    assert.match(firstState.click_id, /^clk_web_uuid-/)
    assert.equal(first.buildContinueUrl('google', 'footer_google'), null)
    assert.equal(apkEntryUrl.origin, 'https://go.lutaai.com')
    assert.equal(apkEntryUrl.pathname, '/r/website-direct')
    assert.equal(apkEntryUrl.searchParams.get('utm_source'), 'direct_qc')
    assert.equal(apkEntryUrl.searchParams.get('utm_campaign'), 'direct_campaign')
    assert.equal(apkEntryUrl.searchParams.get('utm_content'), 'mobile_android_china')
    assert.equal(apkEntryUrl.searchParams.get('platform'), 'website')
    assert.equal(apkEntryUrl.searchParams.has('click_id'), false)
    assert.deepEqual(first.resolveRouteContext(true), {
        market: 'cn',
        source: 'heuristic',
    })

    const second = await loadAttributionModule(
        'https://lutaai.com/?utm_source=direct_qc&utm_medium=owned&utm_campaign=direct_campaign',
        'direct-second',
    )
    assert.equal(second.getAttributionState().click_id, firstState.click_id)

    const changed = await loadAttributionModule(
        'https://lutaai.com/?utm_source=direct_qc&utm_medium=owned&utm_campaign=direct_campaign_v2',
        'direct-changed',
    )
    assert.notEqual(changed.getAttributionState().click_id, firstState.click_id)
})

test('direct UTM route_market is reported as an explicit attribution parameter', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule(
        'https://lutaai.com/?utm_source=owned&utm_campaign=global_launch&route_market=global',
        'direct-explicit-market',
    )

    assert.deepEqual(mod.resolveRouteContext(true), {
        market: 'global',
        source: 'attribution_param',
    })
    for (const store of ['google', 'apple', 'apk', 'waitlist', 'testflight_app', 'testflight_beta']) {
        assert.equal(mod.buildContinueUrl(store, 'marketing_hero'), null)
    }
})

test('the production China route override cannot create a legacy continue handoff', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule(
        'https://lutaai.com/global/zh-cn?route_market=cn&testflight=1',
        'china-route-override',
    )

    assert.deepEqual(mod.resolveRouteContext(false), {
        market: 'cn',
        source: 'attribution_param',
    })
    assert.match(mod.getAttributionState().click_id, /^clk_web_/)
    assert.equal(mod.buildContinueUrl('testflight_app', 'marketing_hero'), null)
    assert.equal(mod.buildContinueUrl('testflight_beta', 'marketing_hero'), null)
})

test('unattributed landing returns null so buttons use original store URL', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule('https://lutaai.com/', 'unattributed')

    assert.equal(mod.getAttributionState(), null)
    assert.equal(mod.buildContinueUrl('google', 'homepage_primary_google'), null)

    const apkEntryUrl = new URL(mod.buildVerifiedApkEntryUrl('mobile_android_china'))
    assert.equal(apkEntryUrl.origin, 'https://go.lutaai.com')
    assert.equal(apkEntryUrl.pathname, '/r/website-direct')
    assert.equal(apkEntryUrl.searchParams.get('utm_source'), 'official_website')
    assert.equal(apkEntryUrl.searchParams.get('utm_medium'), 'owned')
    assert.equal(apkEntryUrl.searchParams.get('utm_campaign'), 'android_download')
    assert.equal(apkEntryUrl.searchParams.get('utm_content'), 'mobile_android_china')
    assert.equal(apkEntryUrl.searchParams.get('platform'), 'website')

    const installEntryUrl = new URL(mod.buildInstallEntryUrl('marketing_header'))
    assert.equal(installEntryUrl.origin, 'https://go.lutaai.com')
    assert.equal(installEntryUrl.pathname, '/r/website-direct')
    assert.equal(installEntryUrl.searchParams.get('utm_source'), 'official_website')
    assert.equal(installEntryUrl.searchParams.get('utm_medium'), 'owned')
    assert.equal(installEntryUrl.searchParams.get('utm_campaign'), 'app_download')
    assert.equal(installEntryUrl.searchParams.get('utm_content'), 'marketing_header')
    assert.equal(installEntryUrl.searchParams.get('platform'), 'website')
    assert.equal(installEntryUrl.searchParams.has('click_id'), false)
})

test('generic install entry preserves approved acquisition fields without leaking routing state', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule(
        'https://lutaai.com/?slug=global-store&click_id=clk_browser&utm_source=xhs&utm_medium=social&utm_campaign=summer&utm_content=hero&content_id=content001&operator=qa_ops&platform=xhs&invite_code=invite001&route_market=global&traffic_purpose=qa&email=private%40example.com',
        'install-entry-attributed',
    )

    const installEntryUrl = new URL(mod.buildInstallEntryUrl('marketing_header'))
    assert.equal(installEntryUrl.pathname, '/r/global-store')
    assert.equal(installEntryUrl.searchParams.get('utm_source'), 'xhs')
    assert.equal(installEntryUrl.searchParams.get('utm_medium'), 'social')
    assert.equal(installEntryUrl.searchParams.get('utm_campaign'), 'summer')
    assert.equal(installEntryUrl.searchParams.get('utm_content'), 'hero')
    assert.equal(installEntryUrl.searchParams.get('content_id'), 'content001')
    assert.equal(installEntryUrl.searchParams.get('operator'), 'qa_ops')
    assert.equal(installEntryUrl.searchParams.get('platform'), 'xhs')
    assert.equal(installEntryUrl.searchParams.get('invite_code'), 'invite001')
    assert.equal(installEntryUrl.searchParams.has('click_id'), false)
    assert.equal(installEntryUrl.searchParams.has('route_market'), false)
    assert.equal(installEntryUrl.searchParams.has('traffic_purpose'), false)
    assert.equal(installEntryUrl.searchParams.has('email'), false)
})

test('generic install entry reuses only canonical legacy click roots', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const clickId = `lclk_${'b'.repeat(32)}`
    const mod = await loadAttributionModule(
        `https://lutaai.com/?slug=cn-store&click_id=${clickId}&utm_source=owned`,
        'install-entry-canonical',
    )

    const installEntryUrl = new URL(mod.buildInstallEntryUrl('marketing_header'))
    assert.equal(installEntryUrl.pathname, '/r/cn-store')
    assert.equal(installEntryUrl.searchParams.get('click_id'), clickId)
})

test('generic install entry rejects an invalid inbound slug', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule(
        'https://lutaai.com/?slug=..%2Fadmin&utm_source=owned',
        'install-entry-invalid-slug',
    )

    const installEntryUrl = new URL(mod.buildInstallEntryUrl('marketing_header'))
    assert.equal(installEntryUrl.pathname, '/r/website-direct')
})

test('website install entries drop oversized campaign fields before the backend contract', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const over128 = 'x'.repeat(129)
    const over64 = 'p'.repeat(65)
    const over20 = 'i'.repeat(21)
    const mod = await loadAttributionModule(
        `https://lutaai.com/?utm_source=${over128}&utm_medium=${over128}&utm_campaign=${over128}&utm_content=${over128}&utm_term=${over128}&content_id=${over128}&operator=${over128}&platform=${over64}&invite_code=${over20}`,
        'install-entry-oversized',
    )

    const installEntryUrl = new URL(mod.buildInstallEntryUrl('marketing_header'))
    assert.equal(installEntryUrl.searchParams.get('utm_source'), 'official_website')
    assert.equal(installEntryUrl.searchParams.get('utm_medium'), 'owned')
    assert.equal(installEntryUrl.searchParams.get('utm_campaign'), 'app_download')
    assert.equal(installEntryUrl.searchParams.get('utm_content'), 'marketing_header')
    assert.equal(installEntryUrl.searchParams.get('platform'), 'website')
    assert.equal(installEntryUrl.searchParams.has('utm_term'), false)
    assert.equal(installEntryUrl.searchParams.has('content_id'), false)
    assert.equal(installEntryUrl.searchParams.has('operator'), false)
    assert.equal(installEntryUrl.searchParams.has('invite_code'), false)

    const apkEntryUrl = new URL(mod.buildVerifiedApkEntryUrl('mobile_android_china'))
    assert.equal(apkEntryUrl.searchParams.get('utm_source'), 'official_website')
    assert.equal(apkEntryUrl.searchParams.get('utm_campaign'), 'android_download')
    assert.equal(apkEntryUrl.searchParams.get('platform'), 'website')
})

test('canonical legacy APK entry continues the existing server-owned click', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const clickId = `lclk_${'a'.repeat(32)}`
    const mod = await loadAttributionModule(
        `https://lutaai.com/?slug=cn-store&click_id=${clickId}&utm_source=owned`,
        'canonical-apk',
    )

    const apkEntryUrl = new URL(mod.buildVerifiedApkEntryUrl('desktop_android_tab'))
    assert.equal(apkEntryUrl.pathname, '/r/cn-store/continue')
    assert.equal(apkEntryUrl.searchParams.get('store'), 'apk')
    assert.equal(apkEntryUrl.searchParams.get('click_id'), clickId)
    assert.equal(apkEntryUrl.searchParams.get('placement'), 'desktop_android_tab')
})

test('waitlist fallback hides every system attribution field', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule('https://lutaai.com/', 'waitlist-fallback')
    const waitlistUrl = new URL(
        mod.buildWaitlistFallbackUrl('https://example.feishu.cn/share/base/form-id'),
    )

    assert.deepEqual(mod.WAITLIST_SYSTEM_FIELDS, [
        'link_id',
        'click_id',
        'contract_version',
        'slug',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'content_id',
        'operator',
        'platform',
        'invite_code',
        'route_market',
        'traffic_purpose',
        'placement',
    ])
    for (const field of mod.WAITLIST_SYSTEM_FIELDS) {
        assert.equal(waitlistUrl.searchParams.get(`hide_${field}`), '1')
    }
})

test('legacy production slugs remain authoritative before route_market rollout completes', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule(
        'https://lutaai.com/?slug=cn-store&click_id=clk_legacy&utm_source=legacy',
        'legacy-market',
    )

    assert.deepEqual(mod.resolveRouteContext(false), {
        market: 'cn',
        source: 'legacy_slug_map',
    })
})

test('browser-generated TestFlight attribution never enters the legacy continue contract', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule(
        'https://lutaai.com/?slug=cn-store&click_id=clk_beta&utm_source=owned&route_market=cn',
        'testflight',
    )

    assert.equal(mod.buildContinueUrl('testflight_app', 'mobile_ios'), null)
    assert.equal(mod.buildContinueUrl('testflight_beta', 'mobile_ios'), null)
})

test('canonical legacy TestFlight handoff can use the backend compatibility bridge', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const clickId = `lclk_${'c'.repeat(32)}`
    const mod = await loadAttributionModule(
        `https://lutaai.com/?slug=cn-store&click_id=${clickId}&utm_source=owned&route_market=cn`,
        'canonical-testflight',
    )

    const continueUrl = new URL(mod.buildContinueUrl('testflight_beta', 'mobile_ios'))
    assert.equal(continueUrl.pathname, '/r/cn-store/continue')
    assert.equal(continueUrl.searchParams.get('store'), 'testflight_beta')
    assert.equal(continueUrl.searchParams.get('click_id'), clickId)
})
