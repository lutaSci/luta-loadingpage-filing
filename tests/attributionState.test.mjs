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

test('shortlink landing builds continue URL with original slug click id and UTM', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule(
        'https://lutaai.com/?slug=global-store&click_id=clk_short_001&utm_source=xhs&utm_medium=social&utm_campaign=camp_001&content_id=content001&operator=qa_ops&platform=xhs&route_market=global&traffic_purpose=qa',
        'shortlink',
    )

    const continueUrl = new URL(mod.buildContinueUrl('google', 'homepage_primary_google'))

    assert.equal(continueUrl.origin, 'https://go.lutaai.com')
    assert.equal(continueUrl.pathname, '/r/global-store/continue')
    assert.equal(continueUrl.searchParams.get('store'), 'google')
    assert.equal(continueUrl.searchParams.get('click_id'), 'clk_short_001')
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
    const firstUrl = new URL(first.buildContinueUrl('google', 'footer_google'))

    assert.equal(firstUrl.pathname, '/r/website-direct/continue')
    assert.match(firstState.click_id, /^clk_web_uuid-/)
    assert.equal(firstUrl.searchParams.get('slug'), 'website-direct')
    assert.equal(firstUrl.searchParams.get('click_id'), firstState.click_id)
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
})

test('unattributed landing returns null so buttons use original store URL', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule('https://lutaai.com/', 'unattributed')

    assert.equal(mod.getAttributionState(), null)
    assert.equal(mod.buildContinueUrl('google', 'homepage_primary_google'), null)
})

test('waitlist fallback hides every system attribution field', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule('https://lutaai.com/', 'waitlist-fallback')
    const waitlistUrl = new URL(
        mod.buildWaitlistFallbackUrl('https://example.feishu.cn/share/base/form-id'),
    )

    for (const field of [
        'click_id',
        'slug',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'content_id',
        'operator',
        'platform',
        'route_market',
        'traffic_purpose',
        'placement',
    ]) {
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

test('attributed TestFlight handoff uses backend continue route', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule(
        'https://lutaai.com/?slug=cn-store&click_id=clk_beta&utm_source=owned&route_market=cn',
        'testflight',
    )

    const continueUrl = new URL(mod.buildContinueUrl('testflight_beta', 'mobile_ios'))
    assert.equal(continueUrl.pathname, '/r/cn-store/continue')
    assert.equal(continueUrl.searchParams.get('store'), 'testflight_beta')
    assert.equal(continueUrl.searchParams.get('click_id'), 'clk_beta')
})
