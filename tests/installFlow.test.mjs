import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
    buildAppOpenUrl,
    buildControlledOutUrl,
    buildInstallContextUrl,
    buildInstallContinuationUrl,
    buildLegacyControlledOutUrl,
    buildLegacyInstallContextUrl,
    formatBytes,
    isApkMetadataComplete,
    isOptionCompatibleWithDevice,
    normalizeInstallContext,
    parseLegacyInstallEntry,
    resolveMarketChoiceRelation,
    selectDirectInstallChoices,
    sortInstallOptions,
} from '../src/lib/installFlow.js'
import {
    config,
    DEFAULT_LUTA_API_BASE,
    resolveLutaApiBase,
} from '../src/config/index.js'
import { INSTALL_WEB_EVENT_NAMES, sanitizeInstallProperties } from '../src/lib/analytics.js'
import { getInstallCopy } from '../src/lib/installCopy.js'

const SHA256 = 'a'.repeat(64)
const LEGACY_CLICK_ID = `lclk_${'c'.repeat(32)}`

test('Google Analytics pageview strips signed state and every query parameter', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
    assert.match(html, /window\.location\.pathname !== '\/install'/)
    assert.match(html, /page_location:\s*window\.location\.origin \+ window\.location\.pathname/)
    assert.match(html, /page_path:\s*window\.location\.pathname/)
    assert.equal(html.includes('page_location: window.location.href'), false)
})

test('iPhone choices use user-facing edition language rather than account terminology', () => {
    const copy = getInstallCopy('zh')
    assert.equal(copy.pageDescription, '选择你要安装的版本')
    assert.equal(copy.cnEdition, '大陆版')
    assert.equal(copy.globalEdition, '海外版')
    assert.equal(copy.globalWaitlist, '当前暂未开放 · 开放后通知我')
    assert.equal(JSON.stringify(copy).includes('Apple ID'), false)
})

test('uses the approved public install-context and controlled out bases', () => {
    assert.equal(config.api.base, 'https://api.lutaai.com')
    assert.equal(config.api.appInfo, 'https://api.lutaai.com/api/v1/app/info')
    assert.equal(config.smartLink.installContextBase, 'https://api.lutaai.com/api/v1/public/attribution/install-context')
    assert.equal(config.smartLink.legacyInstallContextBase, 'https://api.lutaai.com/api/v1/public/attribution/legacy-install-context')
    assert.equal(config.smartLink.installEventBase, 'https://api.lutaai.com/api/v1/public/attribution/install-event')
    assert.equal(config.smartLink.appLinkBase, 'https://link.lutaai.com/l')
    assert.equal(config.smartLink.outBase, 'https://go.lutaai.com/out')
    assert.equal(config.smartLink.legacyOutBase, 'https://go.lutaai.com/r')
    assert.equal(
        config.downloads.iosOverseasWaitlistFormUrl,
        'https://gcnrjk2sw7wg.feishu.cn/share/base/shrcn2HYMn0YfFKUUtle6orQqIh',
    )
})

test('API base is HTTPS by default and only permits HTTP for local development', () => {
    assert.equal(DEFAULT_LUTA_API_BASE, 'https://api.lutaai.com')
    assert.equal(resolveLutaApiBase(), DEFAULT_LUTA_API_BASE)
    assert.equal(resolveLutaApiBase('https://qa-api.lutaai.com/api/v1/'), 'https://qa-api.lutaai.com')
    assert.equal(resolveLutaApiBase('http://localhost:8000/api'), 'http://localhost:8000')
    assert.equal(resolveLutaApiBase('http://47.76.135.140:8000'), DEFAULT_LUTA_API_BASE)
    assert.equal(resolveLutaApiBase('https://user:secret@api.lutaai.com'), DEFAULT_LUTA_API_BASE)
    assert.equal(resolveLutaApiBase('not-a-url'), DEFAULT_LUTA_API_BASE)
})

test('market-choice relation compares campaign intent with explicit user choice only', () => {
    assert.equal(resolveMarketChoiceRelation('cn', 'cn'), 'same')
    assert.equal(resolveMarketChoiceRelation('cn', 'global'), 'different')
    assert.equal(resolveMarketChoiceRelation('global', null), 'unknown')
    assert.equal(resolveMarketChoiceRelation('global', 'not_observed'), 'unknown')
})

test('web install analytics emits only the three approved web-owned events', () => {
    assert.deepEqual(INSTALL_WEB_EVENT_NAMES, [
        'install_gate_viewed',
        'install_option_selected',
        'install_recovery_action_clicked',
    ])
    assert.equal(INSTALL_WEB_EVENT_NAMES.includes('deep_link_handled'), false)
    assert.deepEqual(sanitizeInstallProperties({
        click_id: 'clk_opaque.01:restore',
        state: 'signed-secret',
        full_url: 'https://lutaai.com/install?state=signed-secret',
        utm_source: 'secret-source',
        operator: 'secret-operator',
        content_id: 'secret-content',
    }), { click_id: 'clk_opaque.01:restore' })
    assert.deepEqual(sanitizeInstallProperties({ click_id: 'bad click/id' }), {})
})

test('normalizes the install-context contract and discards destination URLs', () => {
    const context = normalizeInstallContext({
        data: {
            link_id: 'link-1',
            click_id: 'clk_opaque.01:restore',
            contract_version: '2',
            campaign_target_market: 'china_mainland',
            install_options: [
                {
                    option_id: 'apk-cn',
                    platform: 'android',
                    region: 'cn',
                    channel: 'android_apk',
                    status: 'available',
                    url: 'https://untrusted.example/file.apk',
                    apk: { version: '2.0.0', size_bytes: 52428800, sha256: SHA256 },
                },
            ],
        },
    })

    assert.equal(context.linkId, 'link-1')
    assert.equal(context.clickId, 'clk_opaque.01:restore')
    assert.equal(context.campaignTargetMarket, 'cn')
    assert.equal(context.options[0].channel, 'apk')
    assert.equal(context.options[0].url, undefined)
    assert.equal(isApkMetadataComplete(context.options[0]), true)
})

test('builds an installed-app handoff with opaque ids only', () => {
    const openUrl = new URL(buildAppOpenUrl({
        base: config.smartLink.appLinkBase,
        linkId: 'lnk_123',
        clickId: 'clk_opaque.01:restore',
    }))

    assert.equal(openUrl.origin, 'https://link.lutaai.com')
    assert.equal(openUrl.pathname, '/l/lnk_123')
    assert.deepEqual([...openUrl.searchParams.keys()], ['click_id'])
    assert.equal(openUrl.searchParams.get('click_id'), 'clk_opaque.01:restore')
    assert.equal(openUrl.searchParams.has('state'), false)
    assert.equal(openUrl.searchParams.has('utm_source'), false)

    assert.equal(buildAppOpenUrl({
        base: config.smartLink.appLinkBase,
        linkId: 'lnk_123',
        clickId: 'bad click/id',
    }), null)
    assert.equal(buildAppOpenUrl({
        base: config.smartLink.appLinkBase,
        linkId: 'lnk_123',
        clickId: ' clk_123 ',
    }), null)
    assert.equal(buildAppOpenUrl({
        base: 'https://evil.example/l',
        linkId: 'lnk_123',
        clickId: 'clk_123',
    }), null)
})

test('campaign and selected region reorder options without dropping any channel', () => {
    const options = normalizeInstallContext({
        options: [
            { option_id: 'apple-cn', channel: 'apple', platform: 'ios', region: 'cn', status: 'available' },
            { option_id: 'apple-global', channel: 'apple', platform: 'ios', region: 'global', status: 'available' },
            { option_id: 'waitlist', channel: 'waitlist', platform: 'ios', region: 'global', status: 'available' },
        ],
    }).options

    const sorted = sortInstallOptions(options, {
        deviceOs: 'ios',
        selectedRegion: 'global',
        campaignTargetMarket: 'cn',
    })

    assert.equal(sorted.length, 3)
    assert.equal(sorted[0].optionId, 'apple-global')
    assert.deepEqual(new Set(sorted.map(option => option.optionId)), new Set(['apple-cn', 'apple-global', 'waitlist']))
})

test('iPhone direct choices are one-tap mainland store and overseas waitlist', () => {
    const options = normalizeInstallContext({
        options: [
            { option_id: 'apple-cn', channel: 'apple', platform: 'ios', region: 'cn', status: 'available' },
            { option_id: 'waitlist-global', channel: 'waitlist', platform: 'any', region: 'global', status: 'available' },
            { option_id: 'play-global', channel: 'google_play', platform: 'android', region: 'global', status: 'available' },
        ],
    }).options

    const choices = selectDirectInstallChoices(options, {
        deviceOs: 'ios',
        campaignTargetMarket: 'cn',
    })

    assert.deepEqual(choices.map(choice => ({
        key: choice.key,
        region: choice.region,
        optionId: choice.option.optionId,
    })), [
        { key: 'cn', region: 'cn', optionId: 'apple-cn' },
        { key: 'global', region: 'global', optionId: 'waitlist-global' },
    ])
})

test('a verified overseas App Store automatically replaces the waitlist choice', () => {
    const options = normalizeInstallContext({
        options: [
            { option_id: 'apple-cn', channel: 'apple', platform: 'ios', region: 'cn', status: 'available' },
            { option_id: 'apple-global', channel: 'apple', platform: 'ios', region: 'global', status: 'available' },
            { option_id: 'waitlist-global', channel: 'waitlist', platform: 'any', region: 'global', status: 'available' },
        ],
    }).options

    const choices = selectDirectInstallChoices(options, {
        deviceOs: 'ios',
        campaignTargetMarket: 'global',
    })

    assert.equal(choices[0].key, 'global')
    assert.equal(choices[0].option.optionId, 'apple-global')
    assert.equal(choices.length, 2)
})

test('Android direct choices keep APK and Google Play while campaign only changes priority', () => {
    const options = normalizeInstallContext({
        options: [
            {
                option_id: 'apk-cn',
                channel: 'apk',
                platform: 'android',
                region: 'cn',
                status: 'available',
                apk: { version: '1.8.9', size_bytes: 120000000, sha256: SHA256 },
            },
            { option_id: 'play-global', channel: 'google_play', platform: 'android', region: 'global', status: 'available' },
        ],
    }).options

    const choices = selectDirectInstallChoices(options, {
        deviceOs: 'android',
        campaignTargetMarket: 'global',
    })

    assert.deepEqual(choices.map(choice => choice.key), ['google_play', 'apk'])
})

test('a degraded published channel stays visible while an available alternative is prioritized', () => {
    const options = normalizeInstallContext({
        options: [
            {
                option_id: 'apk-cn',
                channel: 'apk',
                platform: 'android',
                region: 'cn',
                status: 'stale',
                route_available: false,
                route_status: 'degraded',
                degradation_reason: 'distribution_verification_stale',
                apk: { version: '1.8.9', size_bytes: 120000000, sha256: SHA256 },
            },
            {
                option_id: 'play-global',
                channel: 'google_play',
                platform: 'android',
                region: 'global',
                status: 'available',
                route_available: true,
            },
        ],
    }).options

    const choices = selectDirectInstallChoices(options, {
        deviceOs: 'android',
        campaignTargetMarket: 'cn',
    })

    assert.deepEqual(choices.map(choice => choice.option.optionId), ['play-global', 'apk-cn'])
    assert.equal(choices[1].option.routeAvailable, false)
    assert.equal(choices[1].option.routeStatus, 'degraded')
    assert.equal(choices[1].option.degradationReason, 'distribution_verification_stale')
})

test('APK cannot be treated as verified when any integrity field is missing', () => {
    const [option] = normalizeInstallContext({
        options: [{
            option_id: 'apk-cn',
            channel: 'apk',
            platform: 'android',
            region: 'cn',
            status: 'available',
            apk: { version: '2.0.0', size_bytes: 52428800 },
        }],
    }).options

    assert.equal(isApkMetadataComplete(option), false)
})

test('an iPhone never presents Google Play or an APK as a compatible install choice', () => {
    assert.equal(isOptionCompatibleWithDevice({ channel: 'google_play', platform: 'android' }, 'ios'), false)
    assert.equal(isOptionCompatibleWithDevice({ channel: 'apk', platform: 'android' }, 'ios'), false)
    assert.equal(isOptionCompatibleWithDevice({ channel: 'apple_app_store', platform: 'ios' }, 'ios'), true)
    assert.equal(isOptionCompatibleWithDevice({ channel: 'waitlist', platform: 'web' }, 'ios'), true)
})

test('Android presents download channels directly and never an Apple-only channel', () => {
    assert.equal(isOptionCompatibleWithDevice({ channel: 'google_play', platform: 'android' }, 'android'), true)
    assert.equal(isOptionCompatibleWithDevice({ channel: 'apk', platform: 'android' }, 'android'), true)
    assert.equal(isOptionCompatibleWithDevice({ channel: 'apple_app_store', platform: 'ios' }, 'android'), false)
    assert.equal(isOptionCompatibleWithDevice({ channel: 'oem_store', platform: 'android' }, 'android'), true)
})

test('HarmonyOS NEXT fails closed to verified web or notification paths', () => {
    assert.equal(isOptionCompatibleWithDevice({ channel: 'apk', platform: 'android' }, 'harmonyos_next'), false)
    assert.equal(isOptionCompatibleWithDevice({ channel: 'google_play', platform: 'android' }, 'harmonyos_next'), false)
    assert.equal(isOptionCompatibleWithDevice({ channel: 'waitlist', platform: 'harmonyos_next' }, 'harmonyos_next'), true)
})

test('controlled URLs preserve signed state and accept only safe option identifiers', () => {
    const contextUrl = new URL(buildInstallContextUrl({
        base: '/api/v1/public/attribution/install-context?ignored=1',
        state: 'signed.state/value',
        origin: 'https://lutaai.com',
    }))
    assert.equal(contextUrl.origin, 'https://lutaai.com')
    assert.equal(contextUrl.pathname, '/api/v1/public/attribution/install-context')
    assert.equal(contextUrl.searchParams.get('state'), 'signed.state/value')
    assert.equal(contextUrl.searchParams.has('ignored'), false)

    const apiContextUrl = new URL(buildInstallContextUrl({
        base: 'https://api.lutaai.com/api/v1/public/attribution/install-context',
        state: 'signed.state/value',
    }))
    assert.equal(apiContextUrl.origin, 'https://api.lutaai.com')
    assert.equal(apiContextUrl.pathname, '/api/v1/public/attribution/install-context')

    const outUrl = new URL(buildControlledOutUrl({
        base: 'https://go.lutaai.com/out',
        state: 'signed.state/value',
        optionId: 'apple-cn:v2',
        linkId: 'link-1',
    }))
    assert.equal(outUrl.pathname, '/out/link-1')
    assert.equal(outUrl.searchParams.get('option_id'), 'apple-cn:v2')
    assert.equal(outUrl.searchParams.get('state'), 'signed.state/value')
    assert.equal(outUrl.searchParams.has('link_id'), false)

    assert.equal(buildControlledOutUrl({
        base: 'https://go.lutaai.com/out',
        state: 'signed',
        optionId: 'bad option/id',
        linkId: 'link-1',
    }), null)

    assert.equal(buildControlledOutUrl({
        base: 'https://go.lutaai.com/out',
        state: 'signed',
        optionId: 'apple-cn',
    }), null)
})

test('formats verified APK size for the user', () => {
    assert.equal(formatBytes(52428800, 'en-US'), '50 MB')
    assert.equal(formatBytes(null), null)
})

test('HarmonyOS NEXT keeps Android channels visible but orders recovery first', () => {
    const options = normalizeInstallContext({
        options: [
            {
                option_id: 'apk-cn',
                channel: 'apk',
                platform: 'android',
                region: 'cn',
                status: 'available',
                apk: { version: '2.0.0', size_bytes: 52428800, sha256: SHA256 },
            },
            { option_id: 'notify', channel: 'waitlist', platform: 'harmonyos_next', region: 'global', status: 'available' },
        ],
    }).options

    const sorted = sortInstallOptions(options, {
        deviceOs: 'harmonyos_next',
        selectedRegion: 'cn',
        campaignTargetMarket: 'cn',
    })

    assert.deepEqual(sorted.map(option => option.optionId), ['notify', 'apk-cn'])
})

test('controlled endpoints reject insecure non-local HTTP bases', () => {
    assert.equal(buildInstallContextUrl({
        base: 'http://go.lutaai.com/api/v1/public/attribution/install-context',
        state: 'signed',
    }), null)
    assert.equal(buildControlledOutUrl({
        base: 'http://go.lutaai.com/out',
        state: 'signed',
        optionId: 'apple-cn',
        linkId: 'link-1',
    }), null)
})

test('v2 URL builders reject values beyond the backend contract instead of truncating', () => {
    const oversizedState = 's'.repeat(4097)
    assert.equal(buildInstallContextUrl({
        base: '/api/v1/public/attribution/install-context',
        state: oversizedState,
        origin: 'https://lutaai.com',
    }), null)
    assert.equal(buildControlledOutUrl({
        base: 'https://go.lutaai.com/out',
        state: 'signed',
        optionId: 'o'.repeat(65),
        linkId: 'link-1',
    }), null)
})

test('legacy entry accepts one opaque pair and ignores every marketing parameter', () => {
    const entry = parseLegacyInstallEntry(
        `?legacy_slug=cn-store&click_id=${LEGACY_CLICK_ID}&utm_source=wechat&operator=alice&content_id=sutra_01`,
    )

    assert.deepEqual(entry, {
        legacySlug: 'cn-store',
        clickId: LEGACY_CLICK_ID,
    })
    assert.deepEqual(Object.keys(entry).sort(), ['clickId', 'legacySlug'])
})

test('legacy entry rejects partial, duplicate, whitespace and path-like identities', () => {
    assert.equal(parseLegacyInstallEntry('?legacy_slug=cn-store'), null)
    assert.equal(parseLegacyInstallEntry('?click_id=clk_1'), null)
    assert.equal(parseLegacyInstallEntry(`?legacy_slug=cn-store&legacy_slug=global-store&click_id=${LEGACY_CLICK_ID}`), null)
    assert.equal(parseLegacyInstallEntry(`?legacy_slug=cn-store&click_id=${LEGACY_CLICK_ID}&click_id=${LEGACY_CLICK_ID}`), null)
    assert.equal(parseLegacyInstallEntry(`?legacy_slug=%20cn-store%20&click_id=${LEGACY_CLICK_ID}`), null)
    assert.equal(parseLegacyInstallEntry(`?legacy_slug=cn%2Fstore&click_id=${LEGACY_CLICK_ID}`), null)
    assert.equal(parseLegacyInstallEntry('?legacy_slug=cn-store&click_id=bad%20click'), null)
})

test('legacy install-context request contains only slug and opaque click id', () => {
    const contextUrl = new URL(buildLegacyInstallContextUrl({
        base: '/api/v1/public/attribution/legacy-install-context?state=remove-me&utm_source=remove-me',
        legacySlug: 'cn-store',
        clickId: LEGACY_CLICK_ID,
        origin: 'https://lutaai.com',
    }))

    assert.equal(contextUrl.pathname, '/api/v1/public/attribution/legacy-install-context')
    assert.deepEqual([...contextUrl.searchParams.keys()], ['slug', 'click_id'])
    assert.equal(contextUrl.searchParams.get('slug'), 'cn-store')
    assert.equal(contextUrl.searchParams.get('click_id'), LEGACY_CLICK_ID)
})

test('legacy context normalizes echoed identity and discards destinations and marketing fields', () => {
    const context = normalizeInstallContext({
        legacy_slug: 'cn-store',
        click_id: LEGACY_CLICK_ID,
        contract_version: 'legacy_r_v1',
        utm_source: 'must-not-survive',
        operator: 'must-not-survive',
        options: [{
            option_id: 'apple-cn',
            channel: 'apple',
            platform: 'ios',
            region: 'cn',
            status: 'available',
            url: 'https://untrusted.example/store',
        }],
    })

    assert.equal(context.legacySlug, 'cn-store')
    assert.equal(context.clickId, LEGACY_CLICK_ID)
    assert.equal(context.contractVersion, 'legacy_r_v1')
    assert.equal(context.utm_source, undefined)
    assert.equal(context.operator, undefined)
    assert.equal(context.options[0].url, undefined)
})

test('legacy controlled handoff uses the web-only route and exactly two query keys', () => {
    const outUrl = new URL(buildLegacyControlledOutUrl({
        base: 'https://go.lutaai.com/r?state=remove-me&utm_source=remove-me',
        legacySlug: 'cn-store',
        clickId: LEGACY_CLICK_ID,
        optionId: 'apple-cn:v2',
    }))

    assert.equal(outUrl.origin, 'https://go.lutaai.com')
    assert.equal(outUrl.pathname, '/r/cn-store/out')
    assert.deepEqual([...outUrl.searchParams.keys()], ['click_id', 'option_id'])
    assert.equal(outUrl.searchParams.get('click_id'), LEGACY_CLICK_ID)
    assert.equal(outUrl.searchParams.get('option_id'), 'apple-cn:v2')
    assert.equal(buildLegacyControlledOutUrl({
        base: 'https://evil.example/r',
        legacySlug: 'cn-store',
        clickId: LEGACY_CLICK_ID,
        optionId: 'apple-cn',
    }), null)
    assert.equal(buildLegacyControlledOutUrl({
        base: 'https://go.lutaai.com/not-r',
        legacySlug: 'cn-store',
        clickId: LEGACY_CLICK_ID,
        optionId: 'apple-cn',
    }), null)
})

test('legacy browser continuation keeps only slug, click and user choice', () => {
    const continuationUrl = new URL(buildInstallContinuationUrl({
        origin: 'https://lutaai.com',
        state: 'must-not-survive',
        legacySlug: 'cn-store',
        clickId: LEGACY_CLICK_ID,
        choice: 'other_regions',
    }))

    assert.equal(continuationUrl.pathname, '/install')
    assert.deepEqual([...continuationUrl.searchParams.keys()], ['legacy_slug', 'click_id', 'choice'])
    assert.equal(continuationUrl.searchParams.get('legacy_slug'), 'cn-store')
    assert.equal(continuationUrl.searchParams.get('click_id'), LEGACY_CLICK_ID)
    assert.equal(continuationUrl.searchParams.get('choice'), 'global')
    assert.equal(continuationUrl.searchParams.has('state'), false)
})

test('v2 browser continuation keeps only signed state and user choice', () => {
    const continuationUrl = new URL(buildInstallContinuationUrl({
        origin: 'https://lutaai.com',
        state: 'signed.state/value',
        legacySlug: 'invalid/slug',
        clickId: 'clk_123',
        choice: 'china_mainland',
    }))

    assert.deepEqual([...continuationUrl.searchParams.keys()], ['state', 'choice'])
    assert.equal(continuationUrl.searchParams.get('state'), 'signed.state/value')
    assert.equal(continuationUrl.searchParams.get('choice'), 'cn')
    assert.equal(continuationUrl.searchParams.has('click_id'), false)
})
