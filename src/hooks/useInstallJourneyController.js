import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { config } from '../config/index.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import { trackInstallEvent } from '../lib/analytics.js'
import { detectDevice, detectIsWeChat } from '../lib/deviceDetection.js'
import { getInstallCopy } from '../lib/installCopy.js'
import {
    flushInstallInteractions,
    normalizeInstallReasonCode,
    reportInstallInteraction,
} from '../lib/installEvents.js'
import {
    buildAppOpenUrl,
    buildControlledOutUrl,
    buildInstallContextUrl,
    buildInstallContinuationUrl,
    buildLegacyControlledOutUrl,
    buildLegacyInstallContextUrl,
    normalizeInstallContext,
    resolveDeviceOs,
    resolveMarketChoiceRelation,
    selectDirectInstallChoices,
} from '../lib/installFlow.js'

const HANDOFF_SESSION_KEY = 'luta-install-handoff-pending-at'
const HANDOFF_MAX_AGE_MS = 30 * 60 * 1000

const LOCALE_BY_LANGUAGE = {
    zh: 'zh-CN',
    zhTW: 'zh-TW',
    en: 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR',
}

function getEntryKey(entry) {
    if (entry?.mode === 'v2') return `v2:${entry.stateToken}`
    if (entry?.mode === 'legacy') {
        return `legacy:${entry.legacyEntry?.legacySlug}:${entry.legacyEntry?.clickId}`
    }
    return 'none'
}

export function useInstallJourneyController({
    entry,
    missingStateIsTerminal = false,
    surface = 'install_gate',
    pagePath = '/install',
    onChoiceChange,
    onExitJourney,
}) {
    const { currentLanguage } = useLanguage()
    const copy = useMemo(() => getInstallCopy(currentLanguage), [currentLanguage])
    const locale = LOCALE_BY_LANGUAGE[currentLanguage] || 'zh-CN'
    const device = useMemo(() => detectDevice(), [])
    const deviceOs = useMemo(() => resolveDeviceOs(device), [device])
    const isWeChat = useMemo(() => detectIsWeChat(), [])
    const entryKey = getEntryKey(entry)
    const legacyEntry = entry?.mode === 'legacy' ? entry.legacyEntry : null
    const isLegacyMode = Boolean(legacyEntry)
    const stateToken = entry?.mode === 'v2' ? entry.stateToken : null
    const hasEntry = Boolean(stateToken || legacyEntry)

    const [selectedRegion, setSelectedRegion] = useState(entry?.choice || null)
    const [activePlatform, setActivePlatform] = useState(() => (
        deviceOs === 'android' ? 'android' : 'ios'
    ))
    const [loadStatus, setLoadStatus] = useState(() => (
        hasEntry ? 'loading' : missingStateIsTerminal ? 'missing_state' : 'idle'
    ))
    const [installContext, setInstallContext] = useState(null)
    const [reloadNonce, setReloadNonce] = useState(0)
    const [recoveryOpen, setRecoveryOpen] = useState(false)
    const [wechatEmphasis, setWechatEmphasis] = useState(false)
    const [busyOptionId, setBusyOptionId] = useState(null)
    const [announcement, setAnnouncement] = useState('')
    const choicesRef = useRef(null)
    const wechatCardRef = useRef(null)
    const viewTrackedKeyRef = useRef(null)
    const recoveryReasonRef = useRef('unknown')

    const displayOs = deviceOs === 'desktop' ? activePlatform : deviceOs
    const isTerminalState = ['missing_state', 'failed', 'no_options'].includes(loadStatus)

    useEffect(() => {
        setSelectedRegion(entry?.choice || null)
        setInstallContext(null)
        setRecoveryOpen(false)
        setWechatEmphasis(false)
        setBusyOptionId(null)
        setAnnouncement('')
        setLoadStatus(hasEntry ? 'loading' : missingStateIsTerminal ? 'missing_state' : 'idle')
    }, [entryKey, entry?.choice, hasEntry, missingStateIsTerminal])

    useEffect(() => {
        if (!hasEntry) {
            setInstallContext(null)
            setLoadStatus(missingStateIsTerminal ? 'missing_state' : 'idle')
            return undefined
        }

        const contextUrl = legacyEntry
            ? buildLegacyInstallContextUrl({
                base: config.smartLink.legacyInstallContextBase,
                legacySlug: legacyEntry.legacySlug,
                clickId: legacyEntry.clickId,
                origin: window.location.origin,
            })
            : buildInstallContextUrl({
                base: config.smartLink.installContextBase,
                state: stateToken,
                origin: window.location.origin,
            })
        if (!contextUrl) {
            setLoadStatus('failed')
            return undefined
        }

        const controller = new AbortController()
        setLoadStatus('loading')
        fetch(contextUrl, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            credentials: 'omit',
            cache: 'no-store',
            referrerPolicy: 'no-referrer',
            signal: controller.signal,
        })
            .then(response => {
                if (!response.ok) throw new Error('install-context unavailable')
                return response.json()
            })
            .then(payload => {
                const normalized = normalizeInstallContext(payload)
                if (
                    legacyEntry
                    && (
                        normalized.legacySlug !== legacyEntry.legacySlug
                        || normalized.clickId !== legacyEntry.clickId
                    )
                ) throw new Error('legacy install-context identity mismatch')
                setInstallContext(normalized)
                setLoadStatus(normalized.options.length ? 'ready' : 'no_options')
            })
            .catch(error => {
                if (error.name === 'AbortError') return
                setInstallContext(null)
                setLoadStatus('failed')
            })

        return () => controller.abort()
    }, [
        entryKey,
        hasEntry,
        legacyEntry,
        missingStateIsTerminal,
        reloadNonce,
        stateToken,
    ])

    useEffect(() => {
        if (!hasEntry || isLegacyMode) return undefined
        const flushPending = () => {
            if (document.visibilityState === 'hidden') return
            void flushInstallInteractions({
                base: config.smartLink.installEventBase,
                origin: window.location.origin,
            })
        }
        flushPending()
        window.addEventListener('online', flushPending)
        window.addEventListener('pageshow', flushPending)
        document.addEventListener('visibilitychange', flushPending)
        return () => {
            window.removeEventListener('online', flushPending)
            window.removeEventListener('pageshow', flushPending)
            document.removeEventListener('visibilitychange', flushPending)
        }
    }, [hasEntry, isLegacyMode])

    const analyticsContext = useMemo(() => ({
        surface,
        page_path: pagePath,
        wechat_environment: isWeChat,
        has_state: Boolean(stateToken),
        load_status: loadStatus,
        contract_version: installContext?.contractVersion || 'unknown',
        traffic_purpose: installContext?.trafficPurpose || 'unknown',
        campaign_target_market: installContext?.campaignTargetMarket || 'unknown',
        recommended_region: installContext?.recommendedRegion || 'unknown',
        option_count: installContext?.options.length || 0,
        link_id: installContext?.linkId || 'unknown',
        click_id: installContext?.clickId || legacyEntry?.clickId || 'unknown',
        entry_context: isWeChat ? 'wechat_webview' : 'browser',
    }), [
        installContext,
        isWeChat,
        legacyEntry?.clickId,
        loadStatus,
        pagePath,
        stateToken,
        surface,
    ])

    useEffect(() => {
        if (loadStatus === 'idle' || loadStatus === 'loading') return
        const viewKey = `${entryKey}:${surface}`
        if (viewTrackedKeyRef.current === viewKey) return
        viewTrackedKeyRef.current = viewKey
        trackInstallEvent('install_gate_viewed', analyticsContext)
    }, [analyticsContext, entryKey, loadStatus, surface])

    const showRecovery = useCallback(reason => {
        recoveryReasonRef.current = reason
        setRecoveryOpen(true)
        setBusyOptionId(null)
    }, [])

    useEffect(() => {
        if (loadStatus === 'failed' || loadStatus === 'missing_state') showRecovery('terminal_failed')
        if (loadStatus === 'no_options') showRecovery('terminal_no_options')
    }, [loadStatus, showRecovery])

    useEffect(() => {
        if (!hasEntry) return undefined
        const recoverAfterHandoff = () => {
            if (document.visibilityState === 'hidden') return
            let attemptedAt = 0
            try {
                attemptedAt = Number(sessionStorage.getItem(HANDOFF_SESSION_KEY))
                if (attemptedAt) sessionStorage.removeItem(HANDOFF_SESSION_KEY)
            } catch {
                return
            }
            if (attemptedAt && Date.now() - attemptedAt <= HANDOFF_MAX_AGE_MS) {
                showRecovery('returned_from_handoff')
            }
        }
        window.addEventListener('pageshow', recoverAfterHandoff)
        document.addEventListener('visibilitychange', recoverAfterHandoff)
        recoverAfterHandoff()
        return () => {
            window.removeEventListener('pageshow', recoverAfterHandoff)
            document.removeEventListener('visibilitychange', recoverAfterHandoff)
        }
    }, [hasEntry, showRecovery])

    const directChoices = useMemo(() => selectDirectInstallChoices(
        installContext?.options || [],
        {
            deviceOs: displayOs,
            campaignTargetMarket: installContext?.campaignTargetMarket,
        },
    ), [displayOs, installContext])

    useEffect(() => {
        if (
            loadStatus === 'ready'
            && deviceOs !== 'desktop'
            && directChoices.length === 0
        ) showRecovery('no_compatible_option_for_choice')
    }, [deviceOs, directChoices.length, loadStatus, showRecovery])

    const openAppUrl = useMemo(() => (
        isLegacyMode
            ? null
            : buildAppOpenUrl({
                base: config.smartLink.appLinkBase,
                linkId: installContext?.linkId,
                clickId: installContext?.clickId,
            })
    ), [installContext?.clickId, installContext?.linkId, isLegacyMode])

    const reportServerInteraction = useCallback((eventType, regionChoice, properties = {}) => {
        if (isLegacyMode || !stateToken) return null
        return reportInstallInteraction({
            base: config.smartLink.installEventBase,
            origin: window.location.origin,
            state: stateToken,
            event_type: eventType,
            distribution_region_choice: regionChoice || 'not_observed',
            ...properties,
        })
    }, [isLegacyMode, stateToken])

    const replaceVisibleUrl = useCallback(region => {
        onChoiceChange?.(region)
        if (surface === 'official_homepage') return
        const continuationUrl = buildInstallContinuationUrl({
            origin: window.location.origin,
            state: stateToken,
            legacySlug: legacyEntry?.legacySlug,
            clickId: legacyEntry?.clickId,
            choice: region,
        })
        if (!continuationUrl) return
        const url = new URL(continuationUrl)
        window.history.replaceState({}, '', `${url.pathname}${url.search}`)
    }, [
        legacyEntry?.clickId,
        legacyEntry?.legacySlug,
        onChoiceChange,
        stateToken,
        surface,
    ])

    const selectChoice = useCallback(choice => {
        const option = choice.option
        const region = choice.region === 'cn' || choice.region === 'global'
            ? choice.region
            : 'not_observed'
        const relation = resolveMarketChoiceRelation(
            installContext?.campaignTargetMarket,
            region,
        )

        setSelectedRegion(region === 'not_observed' ? null : region)
        setBusyOptionId(option.optionId)
        replaceVisibleUrl(region)
        reportServerInteraction('install_region_selected', region)
        reportServerInteraction('install_option_selected', region, { option_id: option.optionId })
        trackInstallEvent('install_option_selected', {
            ...analyticsContext,
            distribution_region_choice: region,
            option_id: option.optionId,
            distribution_channel: option.channel,
            option_region: option.region || 'unknown',
            availability_status: option.status,
            route_status: option.routeStatus,
            market_choice_relation: relation,
            artifact_id: option.artifactId || 'unknown',
            decision_reason: 'distribution_option_selected',
        })

        const needsExternalBrowser = isWeChat
            && (displayOs === 'android' || displayOs === 'harmonyos_next')
            && ['apk', 'google_play'].includes(option.channel)
        if (needsExternalBrowser) {
            setWechatEmphasis(true)
            setBusyOptionId(null)
            recoveryReasonRef.current = 'wechat_external_browser_required'
            requestAnimationFrame(() => {
                wechatCardRef.current?.focus()
                wechatCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            })
            return
        }

        const outUrl = isLegacyMode
            ? buildLegacyControlledOutUrl({
                base: config.smartLink.legacyOutBase,
                legacySlug: legacyEntry?.legacySlug,
                clickId: legacyEntry?.clickId,
                optionId: option.optionId,
            })
            : buildControlledOutUrl({
                base: config.smartLink.outBase,
                state: stateToken,
                optionId: option.optionId,
                linkId: installContext?.linkId,
            })
        if (!outUrl) {
            showRecovery('controlled_handoff_unavailable')
            return
        }

        try {
            sessionStorage.setItem(HANDOFF_SESSION_KEY, String(Date.now()))
        } catch {
            // Navigation remains safe even when private storage is unavailable.
        }
        window.location.assign(outUrl)
    }, [
        analyticsContext,
        displayOs,
        installContext?.campaignTargetMarket,
        installContext?.linkId,
        isLegacyMode,
        isWeChat,
        legacyEntry?.clickId,
        legacyEntry?.legacySlug,
        replaceVisibleUrl,
        reportServerInteraction,
        showRecovery,
        stateToken,
    ])

    const handleRecoveryAction = useCallback(action => {
        const region = selectedRegion || 'not_observed'
        const decisionReason = normalizeInstallReasonCode(recoveryReasonRef.current)
        reportServerInteraction('install_recovery_action_clicked', region, {
            recovery_action: action,
            reason_code: decisionReason,
        })
        trackInstallEvent('install_recovery_action_clicked', {
            ...analyticsContext,
            distribution_region_choice: region,
            decision_reason: decisionReason,
            recovery_action: action,
            ...(action === 'official_website' ? { terminal_outcome: 'branded_recovery' } : {}),
        })
    }, [analyticsContext, reportServerInteraction, selectedRegion])

    const copyInstallLink = useCallback(async () => {
        const url = buildInstallContinuationUrl({
            origin: window.location.origin,
            state: stateToken,
            legacySlug: legacyEntry?.legacySlug,
            clickId: legacyEntry?.clickId,
            choice: selectedRegion,
        })
        handleRecoveryAction('copy_for_external_browser')
        if (!url) {
            showRecovery('copy_continuation_unavailable')
            return
        }
        try {
            await navigator.clipboard.writeText(url)
            setAnnouncement(copy.copied)
        } catch {
            const textarea = document.createElement('textarea')
            textarea.value = url
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            document.body.appendChild(textarea)
            textarea.select()
            const copied = document.execCommand('copy')
            document.body.removeChild(textarea)
            setAnnouncement(copied ? copy.copied : copy.copyFailed)
        }
    }, [
        copy.copied,
        copy.copyFailed,
        handleRecoveryAction,
        legacyEntry?.clickId,
        legacyEntry?.legacySlug,
        selectedRegion,
        showRecovery,
        stateToken,
    ])

    const chooseAnother = useCallback(() => {
        handleRecoveryAction('choose_region_again')
        setRecoveryOpen(false)
        setWechatEmphasis(false)
        requestAnimationFrame(() => {
            choicesRef.current?.focus()
            choicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        })
    }, [handleRecoveryAction])

    const reloadOptions = useCallback(() => {
        handleRecoveryAction('reload_options')
        setRecoveryOpen(false)
        setReloadNonce(value => value + 1)
    }, [handleRecoveryAction])

    const openInstalledApp = useCallback(() => {
        handleRecoveryAction('open_installed_app')
    }, [handleRecoveryAction])

    const exitToWebsite = useCallback(() => {
        handleRecoveryAction('official_website')
        onExitJourney?.()
    }, [handleRecoveryAction, onExitJourney])

    const switchPlatform = useCallback(platform => {
        if (!['ios', 'android'].includes(platform) || platform === activePlatform) return
        setActivePlatform(platform)
        setSelectedRegion(null)
        setRecoveryOpen(false)
        setWechatEmphasis(false)
        replaceVisibleUrl(null)
    }, [activePlatform, replaceVisibleUrl])

    return {
        activePlatform,
        analyticsContext,
        announcement,
        busyOptionId,
        choicesRef,
        copy,
        copyInstallLink,
        deviceOs,
        directChoices,
        displayOs,
        entry,
        exitToWebsite,
        hasEntry,
        installContext,
        isLegacyMode,
        isTerminalState,
        locale,
        loadStatus,
        openAppUrl,
        openInstalledApp,
        recoveryOpen,
        reloadOptions,
        selectChoice,
        selectedRegion,
        showRecovery,
        switchPlatform,
        wechatCardRef,
        wechatEmphasis,
        chooseAnother,
    }
}
