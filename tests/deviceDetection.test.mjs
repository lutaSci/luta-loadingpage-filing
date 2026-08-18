import assert from 'node:assert/strict'
import { test } from 'node:test'

import { resolveWebsiteDeviceOs } from '../src/lib/analytics.js'
import { detectDeviceFromUserAgent } from '../src/lib/deviceDetection.js'
import {
    isInstallPlatformSelectable,
    normalizeInstallContext,
    resolveDeviceOs,
    resolveInstallPlatformPresentation,
    selectDirectInstallChoices,
} from '../src/lib/installFlow.js'
import {
    getMarketingStoreActionStates,
    MARKETING_ACTION_KEYS,
    resolveMarketingDevice,
} from '../src/lib/marketingStoreActions.js'

const OPENHARMONY_PHONE_UA = 'Mozilla/5.0 (Phone; OpenHarmony 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 ArkWeb/4.1.6.1 Mobile'
const OPENHARMONY_PC_UA = 'Mozilla/5.0 (PC; OpenHarmony 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 ArkWeb/4.1.6.1'
const ANDROID_COMPATIBLE_HARMONY_UA = 'Mozilla/5.0 (Linux; Android 12; NOH-AN00) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 HarmonyOS'

function directActions(device, market = 'cn') {
    return getMarketingStoreActionStates({
        locale: 'zh-CN',
        market,
        device,
        placement: 'marketing_hero',
    })
}

test('official OpenHarmony UA is positively classified as HarmonyOS NEXT', () => {
    const device = detectDeviceFromUserAgent(OPENHARMONY_PHONE_UA)

    assert.deepEqual(device, {
        isIOS: false,
        isAndroid: false,
        isOpenHarmony: true,
        isHarmonyOS: true,
        isHarmonyOSNext: true,
        isMobile: true,
        isDesktop: false,
    })
    assert.equal(resolveMarketingDevice(device), 'harmonyos_next')
    assert.equal(resolveDeviceOs(device), 'harmonyos_next')
    assert.equal(resolveWebsiteDeviceOs(device), 'harmonyos_next')
})

test('OpenHarmony keeps NEXT-safe routing for both direct and Smart Link surfaces', () => {
    const deviceOs = resolveDeviceOs(detectDeviceFromUserAgent(OPENHARMONY_PHONE_UA))

    for (const market of ['cn', 'global']) {
        const actions = directActions(deviceOs, market)
        assert.deepEqual(actions.map(action => action.actionKey), [
            MARKETING_ACTION_KEYS.INSTALL_DOCUMENTATION,
        ])
        assert.equal(actions[0].status, 'recovery')
    }

    const options = normalizeInstallContext({
        options: [
            {
                option_id: 'cn-apple',
                channel: 'apple_app_store',
                platform: 'ios',
                region: 'cn',
                status: 'available',
            },
            {
                option_id: 'cn-apk',
                channel: 'apk',
                platform: 'android',
                region: 'cn',
                status: 'available',
                apk: {
                    version: '2.0.0',
                    size_bytes: 52428800,
                    sha256: 'a'.repeat(64),
                },
            },
            {
                option_id: 'global-play',
                channel: 'google_play',
                platform: 'android',
                region: 'global',
                status: 'available',
            },
            {
                option_id: 'harmony-help',
                channel: 'waitlist',
                platform: 'harmonyos_next',
                region: 'global',
                status: 'available',
            },
        ],
    }).options
    const choices = selectDirectInstallChoices(options, { deviceOs })

    assert.deepEqual(choices.map(choice => choice.option.optionId), ['harmony-help'])
    assert.equal(resolveInstallPlatformPresentation(deviceOs), 'android')
    assert.equal(isInstallPlatformSelectable(deviceOs), false)
})

test('Android-compatible Harmony UA retains Android distribution', () => {
    const device = detectDeviceFromUserAgent(ANDROID_COMPATIBLE_HARMONY_UA)

    assert.equal(device.isAndroid, true)
    assert.equal(device.isHarmonyOS, true)
    assert.equal(device.isHarmonyOSNext, false)
    assert.equal(resolveMarketingDevice(device), 'android')
    assert.equal(resolveDeviceOs(device), 'android')
    assert.deepEqual(
        directActions('android').map(action => action.actionKey),
        [MARKETING_ACTION_KEYS.VERIFIED_APK],
    )
    assert.equal(isInstallPlatformSelectable('android'), true)
})

test('OpenHarmony device type controls layout without weakening safe routing', () => {
    const device = detectDeviceFromUserAgent(OPENHARMONY_PC_UA)

    assert.equal(device.isMobile, false)
    assert.equal(device.isDesktop, true)
    assert.equal(resolveDeviceOs(device), 'harmonyos_next')
    assert.equal(isInstallPlatformSelectable(resolveDeviceOs(device)), false)
})

test('ArkWeb alone is not treated as an operating-system identity', () => {
    const device = detectDeviceFromUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36 ArkWeb/4.1.6.1',
    )

    assert.equal(device.isOpenHarmony, false)
    assert.equal(device.isHarmonyOS, false)
    assert.equal(device.isHarmonyOSNext, false)
    assert.equal(resolveDeviceOs(device), 'desktop')
})
