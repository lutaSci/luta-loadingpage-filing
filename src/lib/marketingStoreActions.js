export const MARKETING_ACTION_KEYS = Object.freeze({
    APPLE_STORE: 'open_apple_store',
    GOOGLE_PLAY: 'open_google_play',
    VERIFIED_APK: 'open_verified_apk',
    EXPAND_TESTFLIGHT: 'expand_testflight',
    TESTFLIGHT_APP: 'open_testflight_app',
    TESTFLIGHT_BETA: 'open_testflight_beta',
    WECHAT_GUIDE: 'show_wechat_guide',
    INSTALL_DOCUMENTATION: 'open_install_documentation',
})

export const MARKETING_CTA_TARGETS = Object.freeze({
    [MARKETING_ACTION_KEYS.APPLE_STORE]: 'apple_store',
    [MARKETING_ACTION_KEYS.GOOGLE_PLAY]: 'google_play',
    [MARKETING_ACTION_KEYS.VERIFIED_APK]: 'apk',
    [MARKETING_ACTION_KEYS.TESTFLIGHT_APP]: 'testflight_app',
    [MARKETING_ACTION_KEYS.TESTFLIGHT_BETA]: 'testflight_beta',
    [MARKETING_ACTION_KEYS.WECHAT_GUIDE]: 'wechat_guide',
    [MARKETING_ACTION_KEYS.INSTALL_DOCUMENTATION]: 'install_documentation',
})

export function resolveMarketingDevice(device) {
    if (device?.isHarmonyOSNext) return 'harmonyos_next'
    if (device?.isIOS) return 'ios'
    if (device?.isAndroid) return 'android'
    if (device?.isHarmonyOS) return 'harmonyos'
    return 'desktop'
}

export function hasExplicitTestflightParam(search = '') {
    try {
        const values = new URLSearchParams(search).getAll('testflight')
        return values.length === 1 && values[0] === '1'
    } catch {
        return false
    }
}

function actionState({
    locale,
    market,
    device,
    channel,
    status = 'ready',
    placement,
    actionKey,
}) {
    return Object.freeze({
        locale,
        market,
        device,
        channel,
        status,
        placement,
        actionKey,
    })
}

function iosActions(context, { allowTestflight, testflightExpanded }) {
    if (context.market === 'global') {
        return [actionState({
            ...context,
            channel: 'apple_app_store',
            actionKey: MARKETING_ACTION_KEYS.APPLE_STORE,
        })]
    }

    const actions = [
        actionState({
            ...context,
            channel: 'apple_app_store',
            actionKey: MARKETING_ACTION_KEYS.APPLE_STORE,
        }),
    ]

    if (!allowTestflight) return actions

    actions.push(actionState({
        ...context,
        channel: 'testflight',
        actionKey: MARKETING_ACTION_KEYS.EXPAND_TESTFLIGHT,
    }))

    if (testflightExpanded) {
        actions.push(
            actionState({
                ...context,
                channel: 'testflight',
                actionKey: MARKETING_ACTION_KEYS.TESTFLIGHT_APP,
            }),
            actionState({
                ...context,
                channel: 'testflight',
                actionKey: MARKETING_ACTION_KEYS.TESTFLIGHT_BETA,
            }),
        )
    }

    return actions
}

function androidActions(context, { apkAvailable }) {
    if (context.market === 'global') {
        return [actionState({
            ...context,
            channel: 'google_play',
            actionKey: MARKETING_ACTION_KEYS.GOOGLE_PLAY,
        })]
    }

    return [actionState({
        ...context,
        channel: 'apk',
        status: apkAvailable ? 'ready' : 'disabled',
        actionKey: MARKETING_ACTION_KEYS.VERIFIED_APK,
    })]
}

/**
 * Resolve visible marketing actions without creating or exposing a destination
 * URL. Locale selects copy only; market must already come from the existing
 * attribution route resolver.
 */
export function getMarketingStoreActionStates({
    locale,
    market,
    device,
    placement,
    isWeChat = false,
    desktopTab = 'ios',
    allowTestflight = false,
    testflightExpanded = false,
    apkAvailable = true,
}) {
    const context = { locale, market, device, placement }

    if (device === 'harmonyos_next') {
        return [actionState({
            ...context,
            channel: 'web_recovery',
            status: 'recovery',
            actionKey: MARKETING_ACTION_KEYS.INSTALL_DOCUMENTATION,
        })]
    }

    if (isWeChat && ['android', 'harmonyos'].includes(device)) {
        return [actionState({
            ...context,
            channel: 'browser_handoff',
            status: 'recovery',
            actionKey: MARKETING_ACTION_KEYS.WECHAT_GUIDE,
        })]
    }

    if (device === 'ios') {
        return iosActions(context, { allowTestflight, testflightExpanded })
    }

    if (['android', 'harmonyos'].includes(device)) {
        return androidActions(context, { apkAvailable })
    }

    if (desktopTab === 'android') {
        return androidActions(context, { apkAvailable })
    }

    return iosActions(context, { allowTestflight, testflightExpanded })
}
