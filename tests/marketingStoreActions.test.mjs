import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import {
    buildTestflightExpansionUrl,
    getMarketingStoreActionStates,
    hasExplicitTestflightParam,
    MARKETING_ACTION_KEYS,
    MARKETING_CTA_TARGETS,
    persistTestflightExpansion,
    readTestflightExpansion,
    resolveMarketingDevice,
    TESTFLIGHT_EXPANSION_SESSION_KEY,
} from '../src/lib/marketingStoreActions.js'
import { resolveWebsiteDeviceOs } from '../src/lib/analytics.js'

const base = {
    locale: 'zh-CN',
    market: 'cn',
    device: 'ios',
    placement: 'marketing_hero',
}

const keys = states => states.map(state => state.actionKey)

test('six primary market and device states resolve without URL ownership', () => {
    assert.deepEqual(keys(getMarketingStoreActionStates(base)), [
        MARKETING_ACTION_KEYS.APPLE_STORE,
        MARKETING_ACTION_KEYS.EXPAND_TESTFLIGHT,
    ])
    assert.deepEqual(keys(getMarketingStoreActionStates({ ...base, market: 'global' })), [
        MARKETING_ACTION_KEYS.APPLE_STORE,
    ])
    assert.deepEqual(keys(getMarketingStoreActionStates({ ...base, device: 'android' })), [
        MARKETING_ACTION_KEYS.VERIFIED_APK,
    ])
    assert.deepEqual(keys(getMarketingStoreActionStates({ ...base, market: 'global', device: 'android' })), [
        MARKETING_ACTION_KEYS.GOOGLE_PLAY,
    ])
    assert.deepEqual(keys(getMarketingStoreActionStates({ ...base, device: 'desktop', desktopTab: 'ios' })), [
        MARKETING_ACTION_KEYS.APPLE_STORE,
        MARKETING_ACTION_KEYS.EXPAND_TESTFLIGHT,
    ])
    assert.deepEqual(keys(getMarketingStoreActionStates({ ...base, market: 'global', device: 'desktop', desktopTab: 'android' })), [
        MARKETING_ACTION_KEYS.GOOGLE_PLAY,
    ])
})

test('available marketing actions use the standardized ready status', () => {
    const variants = [
        getMarketingStoreActionStates(base),
        getMarketingStoreActionStates({ ...base, device: 'android' }),
        getMarketingStoreActionStates({ ...base, market: 'global', device: 'android' }),
    ]
    assert.equal(variants.flat().every(state => state.status === 'ready'), true)
    assert.equal(
        getMarketingStoreActionStates({ ...base, market: 'global' })[0].status,
        'ready',
    )
})

test('desktop tabs change platform presentation without rewriting market', () => {
    const ios = getMarketingStoreActionStates({
        ...base,
        locale: 'zh-TW',
        market: 'global',
        device: 'desktop',
        desktopTab: 'ios',
    })
    const android = getMarketingStoreActionStates({
        ...base,
        locale: 'zh-TW',
        market: 'global',
        device: 'desktop',
        desktopTab: 'android',
    })

    assert.equal(ios[0].market, 'global')
    assert.equal(android[0].market, 'global')
    assert.equal(ios[0].locale, 'zh-TW')
    assert.equal(android[0].locale, 'zh-TW')
    assert.deepEqual(keys(ios), [MARKETING_ACTION_KEYS.APPLE_STORE])
    assert.deepEqual(keys(android), [MARKETING_ACTION_KEYS.GOOGLE_PLAY])
})

test('marketing locale changes copy identity without changing market or channel routing', () => {
    const locales = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko']
    const variants = locales.map(locale => getMarketingStoreActionStates({
        ...base,
        locale,
        market: 'global',
        device: 'desktop',
        desktopTab: 'android',
    }))
    const contract = states => states.map(({ actionKey, channel, market, status }) => ({
        actionKey,
        channel,
        market,
        status,
    }))

    for (const states of variants) assert.deepEqual(contract(states), contract(variants[0]))
    assert.deepEqual(variants.map(states => states[0].locale), locales)
})

test('WeChat compatible Android hands off to browser before a store', () => {
    const actions = getMarketingStoreActionStates({
        ...base,
        device: 'android',
        isWeChat: true,
    })
    assert.deepEqual(keys(actions), [MARKETING_ACTION_KEYS.WECHAT_GUIDE])
    assert.equal(actions[0].status, 'recovery')
})

test('HarmonyOS NEXT fails closed for every market', () => {
    for (const market of ['cn', 'global']) {
        const actions = getMarketingStoreActionStates({
            ...base,
            market,
            device: 'harmonyos_next',
            isWeChat: true,
        })
        assert.deepEqual(keys(actions), [MARKETING_ACTION_KEYS.INSTALL_DOCUMENTATION])
        assert.equal(actions[0].channel, 'web_recovery')
        assert.equal(actions[0].status, 'recovery')
    }
})

test('unconfigured APK remains visible but disabled', () => {
    const apk = getMarketingStoreActionStates({
        ...base,
        device: 'android',
        apkAvailable: false,
    })
    assert.equal(apk[0].status, 'disabled')
})

test('expanded China iOS flow exposes the existing two TestFlight steps', () => {
    const actions = getMarketingStoreActionStates({
        ...base,
        testflightExpanded: true,
    })
    assert.deepEqual(keys(actions), [
        MARKETING_ACTION_KEYS.APPLE_STORE,
        MARKETING_ACTION_KEYS.EXPAND_TESTFLIGHT,
        MARKETING_ACTION_KEYS.TESTFLIGHT_APP,
        MARKETING_ACTION_KEYS.TESTFLIGHT_BETA,
    ])
})

test('China iOS exposes the beta guide by default and restores only an exact expanded state', () => {
    assert.equal(hasExplicitTestflightParam(''), false)
    assert.equal(hasExplicitTestflightParam('?testflight=0'), false)
    assert.equal(hasExplicitTestflightParam('?testflight=1&testflight=1'), false)
    assert.equal(hasExplicitTestflightParam('?testflight=1'), true)

    assert.deepEqual(keys(getMarketingStoreActionStates(base)), [
        MARKETING_ACTION_KEYS.APPLE_STORE,
        MARKETING_ACTION_KEYS.EXPAND_TESTFLIGHT,
    ])

    assert.deepEqual(keys(getMarketingStoreActionStates({
        ...base,
        market: 'global',
        testflightExpanded: true,
    })), [MARKETING_ACTION_KEYS.APPLE_STORE])

    assert.deepEqual(keys(getMarketingStoreActionStates({
        ...base,
        market: 'unknown',
        testflightExpanded: true,
    })), [MARKETING_ACTION_KEYS.APPLE_STORE])
})

test('expanded TestFlight state preserves other route parameters and supports recovery after reload', () => {
    assert.equal(
        buildTestflightExpansionUrl(
            'https://lutaai.com/global/zh-cn?route_market=cn&utm_source=wechat#download-options',
            true,
        ),
        '/global/zh-cn?route_market=cn&utm_source=wechat&testflight=1#download-options',
    )
    assert.equal(
        buildTestflightExpansionUrl(
            'https://lutaai.com/global/zh-cn?route_market=cn&testflight=1#download-options',
            false,
        ),
        '/global/zh-cn?route_market=cn#download-options',
    )
    assert.equal(
        buildTestflightExpansionUrl('http://[', true),
        'http://[',
    )
})

test('interactive TestFlight expansion persists per path without changing browser history', () => {
    const values = new Map()
    const storage = {
        getItem: key => values.get(key) || null,
        setItem: (key, value) => values.set(key, String(value)),
    }

    persistTestflightExpansion('/global/zh-cn', true, storage)
    assert.equal(readTestflightExpansion('/global/zh-cn', storage), true)
    assert.equal(readTestflightExpansion('/global/en', storage), false)
    assert.deepEqual(JSON.parse(values.get(TESTFLIGHT_EXPANSION_SESSION_KEY)), {
        pathname: '/global/zh-cn',
        expanded: true,
    })

    persistTestflightExpansion('/global/zh-cn', false, storage)
    assert.equal(readTestflightExpansion('/global/zh-cn', storage), false)
})

test('store action states expose only the normalized rendering contract', () => {
    const [state] = getMarketingStoreActionStates({ ...base, market: 'global' })
    assert.deepEqual(Object.keys(state), [
        'locale',
        'market',
        'device',
        'channel',
        'status',
        'placement',
        'actionKey',
    ])
    assert.equal(Object.values(state).some(value => /https?:|\.apk/i.test(String(value))), false)
})

test('existing CTA target names remain unchanged', () => {
    assert.deepEqual(MARKETING_CTA_TARGETS, {
        open_apple_store: 'apple_store',
        open_google_play: 'google_play',
        open_verified_apk: 'apk',
        open_testflight_app: 'testflight_app',
        open_testflight_beta: 'testflight_beta',
        show_wechat_guide: 'wechat_guide',
        open_install_documentation: 'install_documentation',
    })
})

test('direct overseas iOS uses the global App Store fallback without a waitlist route', async () => {
    const [configSource, adapterSource] = await Promise.all([
        readFile(new URL('../src/config/index.js', import.meta.url), 'utf8'),
        readFile(new URL('../src/components/marketing/useStoreActionAdapter.js', import.meta.url), 'utf8'),
    ])

    assert.match(configSource, /appStoreGlobal:\s*'https:\/\/apps\.apple\.com\/app\/id6778084383'/)
    assert.match(adapterSource, /state\.market === 'global'[\s\S]{0,120}config\.downloads\.appStoreGlobal/)
    assert.doesNotMatch(adapterSource, /WAITLIST|iosOverseasWaitlist|buildWaitlistFallbackUrl/)
})

test('China TestFlight prerequisite opens the China App Store storefront', async () => {
    const [configSource, adapterSource, legacySource] = await Promise.all([
        readFile(new URL('../src/config/index.js', import.meta.url), 'utf8'),
        readFile(new URL('../src/components/marketing/useStoreActionAdapter.js', import.meta.url), 'utf8'),
        readFile(new URL('../src/components/DownloadButtons.jsx', import.meta.url), 'utf8'),
    ])

    assert.match(
        configSource,
        /testFlightAppStore:\s*'https:\/\/apps\.apple\.com\/cn\/app\/testflight\/id899247664\?mt=8'/,
    )
    assert.doesNotMatch(configSource, /apps\.apple\.com\/us\/app\/testflight/)
    assert.doesNotMatch(adapterSource, /buildContinueUrl\('testflight_app'/)
    assert.doesNotMatch(legacySource, /buildContinueUrl\('testflight_app'/)
})

test('device normalization distinguishes HarmonyOS NEXT before Android compatibility', () => {
    assert.equal(resolveMarketingDevice({ isHarmonyOS: true, isHarmonyOSNext: true }), 'harmonyos_next')
    assert.equal(resolveMarketingDevice({ isHarmonyOS: true, isAndroid: true }), 'android')
    assert.equal(resolveMarketingDevice({ isHarmonyOS: true }), 'harmonyos')
    assert.equal(resolveMarketingDevice({}), 'desktop')
})

test('website analytics classifies HarmonyOS NEXT before compatible platform flags', () => {
    assert.equal(
        resolveWebsiteDeviceOs({
            isHarmonyOSNext: true,
            isHarmonyOS: true,
            isAndroid: true,
        }),
        'harmonyos_next',
    )
    assert.equal(resolveWebsiteDeviceOs({ isHarmonyOS: true, isAndroid: true }), 'android')
    assert.equal(resolveWebsiteDeviceOs({ isHarmonyOS: true }), 'harmonyos')
})

test('StoreActionGroup presentation source owns no destination URL', async () => {
    const source = await readFile(
        new URL('../src/components/marketing/StoreActionGroup.jsx', import.meta.url),
        'utf8',
    )
    assert.doesNotMatch(source, /https?:\/\//)
    assert.doesNotMatch(source, /apps\.apple|play\.google|feishu|\.apk(?:\W|$)|testflight\.apple/i)
})

test('header get-app preserves direct journey creation but reuses the stateful homepage actions', async () => {
    const [header, pageShell, landing] = await Promise.all([
        readFile(new URL('../src/components/marketing/MarketingHeader.jsx', import.meta.url), 'utf8'),
        readFile(new URL('../src/components/marketing/PageShell.jsx', import.meta.url), 'utf8'),
        readFile(new URL('../src/pages/MarketingLanding.jsx', import.meta.url), 'utf8'),
    ])

    assert.match(header, /href=\{installHref\}/)
    assert.doesNotMatch(header, /href="#download-options"/)
    assert.doesNotMatch(header, /go\.lutaai\.com|\/install(?:\W|$)/)
    assert.match(pageShell, /installHref=\{headerInstallHref\}/)
    assert.match(landing, /buildInstallEntryUrl\('marketing_header'\)/)
    assert.match(
        landing,
        /const headerInstallHref = usesHomepageSurface[\s\S]{0,120}\? '#download-options'[\s\S]{0,120}: buildInstallEntryUrl\('marketing_header'\)/,
    )
})

test('stateful Hero and final CTA consume one shared journey controller', async () => {
    const [landing, provider] = await Promise.all([
        readFile(new URL('../src/pages/MarketingLanding.jsx', import.meta.url), 'utf8'),
        readFile(new URL('../src/contexts/SmartLinkJourneyContext.jsx', import.meta.url), 'utf8'),
    ])

    assert.equal(landing.match(/<SmartLinkStoreActionGroup/g)?.length, 2)
    assert.equal(landing.match(/controller=\{controller\}/g)?.length, 2)
    assert.equal(provider.match(/useInstallJourneyController\(\{/g)?.length, 1)
    assert.match(provider, /surface: usesHomepageSurface \? 'official_homepage' : 'install_gate'/)
    assert.match(provider, /pagePath: usesHomepageSurface \? '\/' : '\/install'/)
})

test('StoreActionGroup exposes a non-interactive accessible loading state', async () => {
    const source = await readFile(
        new URL('../src/components/marketing/StoreActionGroup.jsx', import.meta.url),
        'utf8',
    )
    assert.match(source, /state\.status === 'loading'/)
    assert.match(source, /disabled=\{unavailable\}/)
    assert.match(source, /aria-busy=\{pending \|\| undefined\}/)
    assert.match(source, /pending \? copy\.loading/)
})

test('marketing option impressions are deduplicated by locale and market', async () => {
    const source = await readFile(
        new URL('../src/components/marketing/useStoreActionAdapter.js', import.meta.url),
        'utf8',
    )
    assert.equal(source.match(/website_download_option_viewed/g)?.length, 1)
    assert.match(source, /state\.locale.*state\.market.*state\.placement.*state\.actionKey/)
    assert.doesNotMatch(source, /setTestflightExpanded\(current\s*=>/)
})

test('StoreActionGroup records option views only after viewport evidence', async () => {
    const source = await readFile(
        new URL('../src/components/marketing/StoreActionGroup.jsx', import.meta.url),
        'utf8',
    )
    assert.match(source, /IntersectionObserver/)
    assert.match(source, /ref=\{actionRef\}/)
    assert.match(source, /onVisible\(state\)/)
    assert.match(source, /threshold: 0\.5/)
    assert.doesNotMatch(source, /recordVisibleOptions/)
})

test('hero and final CTA share one controlled desktop platform tab', async () => {
    const source = await readFile(
        new URL('../src/pages/MarketingLanding.jsx', import.meta.url),
        'utf8',
    )
    assert.match(source, /const \[desktopTab, setDesktopTab\] = useState\('ios'\)/)
    assert.equal(
        source.match(/\n\s+desktopTab,\n\s+onDesktopTabChange: setDesktopTab/g)?.length,
        2,
    )
    assert.equal(source.match(/onDesktopTabChange: setDesktopTab/g)?.length, 2)
})

test('hero and final CTA share TestFlight state without manufacturing page history', async () => {
    const source = await readFile(
        new URL('../src/pages/MarketingLanding.jsx', import.meta.url),
        'utf8',
    )

    assert.match(source, /hasExplicitTestflightParam\(window\.location\.search\)/)
    assert.match(source, /readTestflightExpansion\(window\.location\.pathname\)/)
    assert.match(source, /persistTestflightExpansion\(window\.location\.pathname, testflightExpanded\)/)
    assert.doesNotMatch(source, /buildTestflightExpansionUrl\(window\.location\.href, testflightExpanded\)/)
    assert.doesNotMatch(source, /history\.replaceState/)
    assert.equal(source.match(/onTestflightExpandedChange: setTestflightExpanded/g)?.length, 2)
    assert.equal(source.match(/\n\s+testflightExpanded,\n/g)?.length, 2)
})

test('desktop platform state ignores repeated activation of the selected tab', async () => {
    const source = await readFile(
        new URL('../src/components/marketing/useStoreActionAdapter.js', import.meta.url),
        'utf8',
    )
    assert.match(source, /if \(nextTab === desktopTab\) return/)
})

test('light dialogs restore a visible action-colored focus ring', async () => {
    const source = await readFile(
        new URL('../src/components/marketing/marketing.css', import.meta.url),
        'utf8',
    )
    assert.match(
        source,
        /\.luta-marketing \.luta-marketing-dialog :where\(a, button\):focus-visible\s*\{[^}]*outline-color: var\(--luta-marketing-color-action\)/s,
    )
    assert.match(
        source,
        /\) \[tabindex="-1"\]:focus-visible\s*\{[^}]*outline-color: var\(--luta-marketing-color-focus-on-dark\)/s,
    )
})

test('marketing UX layer keeps sticky navigation, relational layouts and reduced-motion fallback', async () => {
    const css = await readFile(
        new URL('../src/components/marketing/marketing.css', import.meta.url),
        'utf8',
    )
    const pageShell = await readFile(
        new URL('../src/components/marketing/PageShell.jsx', import.meta.url),
        'utf8',
    )

    assert.match(css, /\.luta-marketing-header\s*\{[^}]*position: sticky/s)
    assert.match(css, /\.luta-marketing-feature-map\[data-variant="reading"\]/)
    assert.match(css, /\.luta-marketing-feature-map\[data-variant="practice"\]/)
    assert.match(css, /\.luta-marketing-feature-map\[data-variant="history"\]/)
    assert.match(css, /\.luta-marketing-principle-field\s*\{[^}]*display: grid/s)
    assert.match(css, /\.luta-marketing-final-cta\s*\{[^}]*display: grid;[^}]*align-items: center/s)
    assert.match(css, /\.luta-marketing-footer-layout\s*\{[^}]*align-content: center/s)
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
    assert.match(css, /\[data-reveal-state="hidden"\]/)
    assert.match(pageShell, /new IntersectionObserver/)
    assert.match(pageShell, /observer\.unobserve\(entry\.target\)/)
})
