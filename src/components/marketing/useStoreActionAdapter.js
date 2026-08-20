import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { config } from '../../config/index.js'
import { trackWebsiteEvent } from '../../lib/analytics.js'
import {
    buildContinueUrl,
    buildVerifiedApkEntryUrl,
    resolveRouteContext,
} from '../../lib/attributionState.js'
import {
    detectDevice,
    detectIsMainlandChina,
    detectIsWeChat,
} from '../../lib/deviceDetection.js'
import { isInstallPlatformSelectable } from '../../lib/installFlow.js'
import {
    getMarketingStoreActionStates,
    MARKETING_ACTION_KEYS,
    MARKETING_CTA_TARGETS,
    resolvePrimaryMarketingAction,
    resolveMarketingDevice,
} from '../../lib/marketingStoreActions.js'

function openExternal(url) {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
}

const EMPTY_ANALYTICS_CONTEXT = Object.freeze({})

export function useStoreActionAdapter({
    locale,
    placement,
    analyticsContext = EMPTY_ANALYTICS_CONTEXT,
    desktopTab: controlledDesktopTab,
    onDesktopTabChange,
    testflightExpanded: controlledTestflightExpanded,
    onTestflightExpandedChange,
}) {
    const device = useMemo(() => detectDevice(), [])
    const deviceKey = useMemo(() => resolveMarketingDevice(device), [device])
    const route = useMemo(
        () => resolveRouteContext(detectIsMainlandChina()),
        [],
    )
    const isWeChat = useMemo(() => detectIsWeChat(), [])
    const apkEntryUrl = useMemo(
        () => buildVerifiedApkEntryUrl(placement),
        [placement],
    )

    const [internalDesktopTab, setInternalDesktopTab] = useState('ios')
    const desktopTab = controlledDesktopTab ?? internalDesktopTab
    const selectedPlatform = desktopTab === 'android' ? 'android' : 'ios'
    const platformSelectable = isInstallPlatformSelectable(deviceKey)
    const presentedDeviceKey = platformSelectable ? selectedPlatform : deviceKey
    const [internalTestflightExpanded, setInternalTestflightExpanded] = useState(false)
    const testflightExpanded = controlledTestflightExpanded ?? internalTestflightExpanded
    const [testflightConfirmVisible, setTestflightConfirmVisible] = useState(false)
    const [wechatGuideVisible, setWechatGuideVisible] = useState(false)
    const viewedOptions = useRef(new Set())

    const changeTestflightExpanded = useCallback((nextExpanded) => {
        if (controlledTestflightExpanded === undefined) {
            setInternalTestflightExpanded(nextExpanded)
        }
        onTestflightExpandedChange?.(nextExpanded)
    }, [controlledTestflightExpanded, onTestflightExpandedChange])

    useEffect(() => {
        if (!testflightExpanded) return
        if (desktopTab === 'ios' && route.market === 'cn') return
        changeTestflightExpanded(false)
    }, [changeTestflightExpanded, desktopTab, route.market, testflightExpanded])

    const states = useMemo(
        () => getMarketingStoreActionStates({
            locale,
            market: route.market,
            device: presentedDeviceKey,
            placement,
            isWeChat,
            desktopTab,
            testflightExpanded,
            apkAvailable: Boolean(apkEntryUrl),
        }),
        [
            apkEntryUrl,
            desktopTab,
            isWeChat,
            locale,
            placement,
            presentedDeviceKey,
            route.market,
            testflightExpanded,
        ],
    )

    const recordVisibleOption = useCallback((state) => {
        const ctaTarget = MARKETING_CTA_TARGETS[state.actionKey]
        if (!ctaTarget) return
        const signature = `${state.locale}:${state.market}:${state.placement}:${state.actionKey}`
        if (viewedOptions.current.has(signature)) return
        viewedOptions.current.add(signature)
        trackWebsiteEvent('website_download_option_viewed', {
            ...analyticsContext,
            locale: state.locale,
            cta_target: ctaTarget,
            placement: state.placement,
        })
    }, [analyticsContext])

    const trackCta = useCallback((state) => {
        const ctaTarget = MARKETING_CTA_TARGETS[state.actionKey]
        if (!ctaTarget) return
        trackWebsiteEvent('website_download_cta_clicked', {
            ...analyticsContext,
            locale,
            cta_target: ctaTarget,
            placement: state.placement,
        })
    }, [analyticsContext, locale])

    const activate = useCallback((actionKey) => {
        const state = states.find(candidate => candidate.actionKey === actionKey)
        if (!state || ['disabled', 'loading'].includes(state.status)) return

        switch (actionKey) {
        case MARKETING_ACTION_KEYS.APPLE_STORE:
            trackCta(state)
            openExternal(
                buildContinueUrl('apple', placement)
                || (state.market === 'global'
                    ? config.downloads.appStoreGlobal
                    : config.downloads.appStore),
            )
            break
        case MARKETING_ACTION_KEYS.GOOGLE_PLAY:
            trackCta(state)
            openExternal(buildContinueUrl('google', placement) || config.downloads.googlePlay)
            break
        case MARKETING_ACTION_KEYS.VERIFIED_APK:
            if (!apkEntryUrl) return
            trackCta(state)
            openExternal(apkEntryUrl)
            break
        case MARKETING_ACTION_KEYS.EXPAND_TESTFLIGHT:
            {
                const nextExpanded = !testflightExpanded
                changeTestflightExpanded(nextExpanded)
            }
            break
        case MARKETING_ACTION_KEYS.TESTFLIGHT_APP:
            setTestflightConfirmVisible(true)
            break
        case MARKETING_ACTION_KEYS.TESTFLIGHT_BETA:
            trackCta(state)
            window.location.href = buildContinueUrl('testflight_beta', placement)
                || config.downloads.iosTestFlight
            break
        case MARKETING_ACTION_KEYS.WECHAT_GUIDE:
            trackCta(state)
            setWechatGuideVisible(true)
            break
        case MARKETING_ACTION_KEYS.INSTALL_DOCUMENTATION:
            trackCta(state)
            openExternal(config.downloads.installDoc)
            break
        default:
            break
        }
    }, [
        apkEntryUrl,
        changeTestflightExpanded,
        placement,
        states,
        testflightExpanded,
        trackCta,
    ])

    const primaryAction = useMemo(
        () => resolvePrimaryMarketingAction(states),
        [states],
    )

    const activatePrimary = useCallback(() => {
        if (!primaryAction) return false
        activate(primaryAction.actionKey)
        return true
    }, [activate, primaryAction])

    const confirmTestflightApp = useCallback(() => {
        const state = states.find(
            candidate => candidate.actionKey === MARKETING_ACTION_KEYS.TESTFLIGHT_APP,
        )
        if (!state) return
        trackCta(state)
        setTestflightConfirmVisible(false)
        openExternal(config.downloads.testFlightAppStore)
    }, [states, trackCta])

    const changeDesktopTab = useCallback((nextTab) => {
        if (!['ios', 'android'].includes(nextTab)) return
        if (!platformSelectable) return
        if (nextTab === desktopTab) return
        if (controlledDesktopTab === undefined) setInternalDesktopTab(nextTab)
        onDesktopTabChange?.(nextTab)
    }, [controlledDesktopTab, desktopTab, onDesktopTabChange, platformSelectable])

    const openSupport = useCallback(() => {
        trackWebsiteEvent('website_download_cta_clicked', {
            locale,
            cta_target: 'install_documentation',
            placement: `${placement}_help`,
        })
        openExternal(config.downloads.installDoc)
    }, [locale, placement])

    return {
        desktopTab,
        device: deviceKey,
        isDesktop: deviceKey === 'desktop',
        market: route.market,
        platformSelectable,
        primaryAction,
        selectedPlatform,
        states,
        testflightConfirmVisible,
        testflightExpanded,
        wechatGuideVisible,
        activate,
        activatePrimary,
        changeDesktopTab,
        closeTestflightConfirm: () => setTestflightConfirmVisible(false),
        closeWechatGuide: () => setWechatGuideVisible(false),
        confirmTestflightApp,
        openSupport,
        recordVisibleOption,
    }
}
