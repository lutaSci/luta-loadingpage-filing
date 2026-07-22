import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { config } from '../../config/index.js'
import { trackEvent, trackWebsiteEvent } from '../../lib/analytics.js'
import {
    buildContinueUrl,
    buildVerifiedApkEntryUrl,
    buildWaitlistFallbackUrl,
    getAttributionState,
    resolveRouteContext,
} from '../../lib/attributionState.js'
import {
    detectDevice,
    detectIsMainlandChina,
    detectIsWeChat,
} from '../../lib/deviceDetection.js'
import {
    getMarketingStoreActionStates,
    MARKETING_ACTION_KEYS,
    MARKETING_CTA_TARGETS,
    resolveMarketingDevice,
} from '../../lib/marketingStoreActions.js'

function openExternal(url) {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
}

export function useStoreActionAdapter({
    locale,
    placement,
    desktopTab: controlledDesktopTab,
    onDesktopTabChange,
}) {
    const device = useMemo(() => detectDevice(), [])
    const deviceKey = useMemo(() => resolveMarketingDevice(device), [device])
    const route = useMemo(
        () => resolveRouteContext(detectIsMainlandChina()),
        [],
    )
    const isWeChat = useMemo(() => detectIsWeChat(), [])
    const waitlistUrl = useMemo(
        () => buildWaitlistFallbackUrl(config.downloads.iosOverseasWaitlistFormUrl?.trim()),
        [],
    )
    const apkEntryUrl = useMemo(
        () => buildVerifiedApkEntryUrl(placement),
        [placement],
    )

    const [internalDesktopTab, setInternalDesktopTab] = useState('ios')
    const desktopTab = controlledDesktopTab ?? internalDesktopTab
    const [testflightExpanded, setTestflightExpanded] = useState(false)
    const [testflightConfirmVisible, setTestflightConfirmVisible] = useState(false)
    const [wechatGuideVisible, setWechatGuideVisible] = useState(false)
    const viewedOptions = useRef(new Set())

    useEffect(() => {
        setTestflightExpanded(false)
    }, [desktopTab])

    const states = useMemo(
        () => getMarketingStoreActionStates({
            locale,
            market: route.market,
            device: deviceKey,
            placement,
            isWeChat,
            desktopTab,
            testflightExpanded,
            waitlistAvailable: Boolean(waitlistUrl),
            apkAvailable: Boolean(apkEntryUrl),
        }),
        [
            apkEntryUrl,
            desktopTab,
            deviceKey,
            isWeChat,
            locale,
            placement,
            route.market,
            testflightExpanded,
            waitlistUrl,
        ],
    )

    const recordVisibleOption = useCallback((state) => {
        const ctaTarget = MARKETING_CTA_TARGETS[state.actionKey]
        if (!ctaTarget) return
        const signature = `${state.locale}:${state.market}:${state.placement}:${state.actionKey}`
        if (viewedOptions.current.has(signature)) return
        viewedOptions.current.add(signature)
        trackWebsiteEvent('website_download_option_viewed', {
            locale: state.locale,
            cta_target: ctaTarget,
            placement: state.placement,
        })
    }, [])

    const trackCta = useCallback((state) => {
        const ctaTarget = MARKETING_CTA_TARGETS[state.actionKey]
        if (!ctaTarget) return
        trackWebsiteEvent('website_download_cta_clicked', {
            locale,
            cta_target: ctaTarget,
            placement: state.placement,
        })
    }, [locale])

    const activate = useCallback((actionKey) => {
        const state = states.find(candidate => candidate.actionKey === actionKey)
        if (!state || ['disabled', 'loading'].includes(state.status)) return

        const attrs = getAttributionState()

        switch (actionKey) {
        case MARKETING_ACTION_KEYS.APPLE_STORE:
            trackEvent('ios_appstore_click', {
                click_id: attrs?.click_id,
                utm_campaign: attrs?.utm_campaign,
                content_id: attrs?.content_id,
            })
            trackCta(state)
            openExternal(buildContinueUrl('apple', placement) || config.downloads.appStore)
            break
        case MARKETING_ACTION_KEYS.WAITLIST:
            if (!waitlistUrl) return
            trackEvent('ios_waitlist_click', {
                placement,
                click_id: attrs?.click_id,
                utm_campaign: attrs?.utm_campaign,
                content_id: attrs?.content_id,
            })
            trackCta(state)
            openExternal(buildContinueUrl('waitlist', placement) || waitlistUrl)
            break
        case MARKETING_ACTION_KEYS.GOOGLE_PLAY:
            trackEvent('android_download_click', {
                source: 'google_play',
                click_id: attrs?.click_id,
                utm_campaign: attrs?.utm_campaign,
                content_id: attrs?.content_id,
            })
            trackCta(state)
            openExternal(buildContinueUrl('google', placement) || config.downloads.googlePlay)
            break
        case MARKETING_ACTION_KEYS.VERIFIED_APK:
            if (!apkEntryUrl) return
            trackEvent('android_download_click', {
                source: 'apk',
                click_id: attrs?.click_id,
                utm_campaign: attrs?.utm_campaign,
                content_id: attrs?.content_id,
            })
            trackCta(state)
            openExternal(apkEntryUrl)
            break
        case MARKETING_ACTION_KEYS.EXPAND_TESTFLIGHT:
            trackEvent('ios_beta_toggle', { expanded: !testflightExpanded })
            setTestflightExpanded(!testflightExpanded)
            break
        case MARKETING_ACTION_KEYS.TESTFLIGHT_APP:
            trackEvent('ios_beta_step1_click', { placement })
            setTestflightConfirmVisible(true)
            break
        case MARKETING_ACTION_KEYS.TESTFLIGHT_BETA:
            trackEvent('ios_beta_step2_click', { placement })
            trackCta(state)
            window.location.href = buildContinueUrl('testflight_beta', placement)
                || config.downloads.iosTestFlight
            break
        case MARKETING_ACTION_KEYS.WECHAT_GUIDE:
            trackEvent('wechat_guide_click')
            trackCta(state)
            setWechatGuideVisible(true)
            break
        case MARKETING_ACTION_KEYS.INSTALL_DOCUMENTATION:
            trackEvent('install_doc_click')
            trackCta(state)
            openExternal(config.downloads.installDoc)
            break
        default:
            break
        }
    }, [
        apkEntryUrl,
        placement,
        states,
        testflightExpanded,
        trackCta,
        waitlistUrl,
    ])

    const confirmTestflightApp = useCallback(() => {
        const state = states.find(
            candidate => candidate.actionKey === MARKETING_ACTION_KEYS.TESTFLIGHT_APP,
        )
        if (!state) return
        trackEvent('ios_beta_step1_confirm', { placement })
        trackCta(state)
        setTestflightConfirmVisible(false)
        openExternal(buildContinueUrl('testflight_app', placement)
            || config.downloads.testFlightAppStore)
    }, [placement, states, trackCta])

    const changeDesktopTab = useCallback((nextTab) => {
        if (!['ios', 'android'].includes(nextTab)) return
        if (nextTab === desktopTab) return
        setTestflightExpanded(false)
        if (controlledDesktopTab === undefined) setInternalDesktopTab(nextTab)
        onDesktopTabChange?.(nextTab)
        trackEvent('pc_tab_switch', { tab: nextTab })
    }, [controlledDesktopTab, desktopTab, onDesktopTabChange])

    const openSupport = useCallback(() => {
        trackEvent('install_doc_click')
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
        states,
        testflightConfirmVisible,
        testflightExpanded,
        wechatGuideVisible,
        activate,
        changeDesktopTab,
        closeTestflightConfirm: () => setTestflightConfirmVisible(false),
        closeWechatGuide: () => setWechatGuideVisible(false),
        confirmTestflightApp,
        openSupport,
        recordVisibleOption,
    }
}
