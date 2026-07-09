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
            pathname: url.pathname,
            search: url.search,
        },
    }
    return import(`${moduleUrl}?case=${label}-${Date.now()}-${Math.random()}`)
}

test('shortlink landing builds continue URL with original slug click id and UTM', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule(
        'https://lutaai.com/?slug=global-store&click_id=clk_short_001&utm_source=xhs&utm_medium=social&utm_campaign=camp_001&content_id=content001&operator=qa_ops&platform=xhs',
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
    assert.match(continueUrl.searchParams.get('landing_url'), /slug=global-store/)
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

test('unattributed landing returns null so buttons use original store URL', async () => {
    globalThis.sessionStorage = createSessionStorage()
    const mod = await loadAttributionModule('https://lutaai.com/', 'unattributed')

    assert.equal(mod.getAttributionState(), null)
    assert.equal(mod.buildContinueUrl('google', 'homepage_primary_google'), null)
})
