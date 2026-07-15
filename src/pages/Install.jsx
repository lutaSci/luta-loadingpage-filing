import {
    Apple,
    Bell,
    ChevronRight,
    Copy,
    Download,
    ExternalLink,
    Globe2,
    RefreshCw,
    Smartphone,
    Store,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import logo from '../assets/logo_1.png'
import LanguageSwitch from '../components/LanguageSwitch'
import Silk from '../components/Silk'
import { config } from '../config'
import { useLanguage } from '../contexts/LanguageContext'
import { Colors } from '../design/colors'
import { trackInstallEvent } from '../lib/analytics'
import { detectDevice, detectIsWeChat } from '../lib/deviceDetection'
import { getInstallCopy } from '../lib/installCopy'
import {
    flushInstallInteractions,
    normalizeInstallReasonCode,
    reportInstallInteraction,
} from '../lib/installEvents'
import {
    buildAppOpenUrl,
    buildControlledOutUrl,
    buildInstallContextUrl,
    buildInstallContinuationUrl,
    buildLegacyControlledOutUrl,
    buildLegacyInstallContextUrl,
    formatBytes,
    normalizeInstallContext,
    normalizeMarket,
    parseLegacyInstallEntry,
    resolveDeviceOs,
    resolveMarketChoiceRelation,
    selectDirectInstallChoices,
} from '../lib/installFlow'

const HANDOFF_SESSION_KEY = 'luta-install-handoff-pending-at'
const HANDOFF_MAX_AGE_MS = 30 * 60 * 1000

const LOCALE_BY_LANGUAGE = {
    zh: 'zh-CN',
    zhTW: 'zh-TW',
    en: 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR',
}

function getInitialRegion() {
    if (typeof window === 'undefined') return null
    return normalizeMarket(new URLSearchParams(window.location.search).get('choice'))
}

function getStateToken() {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('state')?.trim() || null
}

function getChoicePresentation(copy, choice, locale) {
    if (choice.key === 'cn') {
        return { Icon: Apple, title: copy.cnEdition, subtitle: copy.cnStore }
    }
    if (choice.key === 'global') {
        return {
            Icon: choice.option.channel === 'waitlist' ? Bell : Apple,
            title: copy.globalEdition,
            subtitle: choice.option.channel === 'waitlist' ? copy.globalWaitlist : copy.globalStore,
        }
    }
    if (choice.key === 'apk') {
        const metadata = [
            choice.option.apk?.version,
            formatBytes(choice.option.apk?.sizeBytes, locale),
        ].filter(Boolean).join(' · ')
        return {
            Icon: Download,
            title: copy.officialApk,
            subtitle: metadata || copy.officialApkFallback,
        }
    }
    if (choice.key === 'google_play') {
        return { Icon: Store, title: copy.googlePlay, subtitle: copy.googlePlayDescription }
    }
    return {
        Icon: Globe2,
        title: copy.otherChannel,
        subtitle: choice.option.label || copy.otherChannel,
    }
}

function InstallChoice({ choice, copy, locale, primary, busy, onSelect }) {
    const { Icon, title, subtitle } = getChoicePresentation(copy, choice, locale)
    const isApk = choice.option.channel === 'apk'

    return (
        <div>
            <button
                type="button"
                className={`group flex min-h-20 w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 disabled:cursor-wait disabled:opacity-70 ${primary
                    ? 'border-white bg-white text-emerald-950 shadow-xl shadow-black/20 hover:bg-emerald-50'
                    : 'border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20'}`}
                disabled={busy}
                onClick={() => onSelect(choice)}
            >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${primary ? 'bg-emerald-100 text-emerald-800' : 'bg-white/12 text-white'}`} aria-hidden="true">
                    {busy ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Icon className="h-6 w-6" />}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-black tracking-tight">{title}</span>
                        {primary && (
                            <span className="rounded-full bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white">
                                {copy.recommended}
                            </span>
                        )}
                    </span>
                    <span className={`mt-1 block text-sm leading-5 ${primary ? 'text-emerald-900/70' : 'text-white/70'}`}>
                        {busy ? copy.opening : subtitle}
                    </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>

            {isApk && choice.option.apk?.sha256 && (
                <details className="mt-2 rounded-xl border border-white/15 bg-black/10 px-4 text-sm text-white/70">
                    <summary className="flex min-h-11 cursor-pointer items-center font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40">
                        {copy.apkDetails}
                    </summary>
                    <dl className="space-y-2 pb-4 text-xs leading-5">
                        <div className="flex justify-between gap-3">
                            <dt>{copy.apkVersion}</dt>
                            <dd className="font-semibold text-white">{choice.option.apk.version}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt>{copy.apkSize}</dt>
                            <dd className="font-semibold text-white">{formatBytes(choice.option.apk.sizeBytes, locale)}</dd>
                        </div>
                        <div>
                            <dt>{copy.apkSha256}</dt>
                            <dd className="mt-1 break-all font-mono text-[11px] text-white/85">{choice.option.apk.sha256}</dd>
                        </div>
                    </dl>
                </details>
            )}
        </div>
    )
}

function CompactRecovery({ copy, terminal, canRetry, onChoose, onRetry, onWebsite }) {
    return (
        <section className="mt-4 rounded-2xl border border-white/20 bg-black/20 p-4 text-left backdrop-blur-md" role="status">
            <h2 className="text-base font-black text-white">
                {terminal ? copy.terminalTitle : copy.recoveryTitle}
            </h2>
            {terminal && <p className="mt-1 text-sm leading-5 text-white/65">{copy.terminalDescription}</p>}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {terminal && canRetry ? (
                    <button
                        type="button"
                        className="min-h-12 rounded-xl bg-white px-4 py-3 font-bold text-emerald-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
                        onClick={onRetry}
                    >
                        {copy.retry}
                    </button>
                ) : !terminal ? (
                    <button
                        type="button"
                        className="min-h-12 rounded-xl bg-white px-4 py-3 font-bold text-emerald-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
                        onClick={onChoose}
                    >
                        {copy.recoveryChoose}
                    </button>
                ) : null}
                <a
                    className={`flex min-h-12 items-center justify-center rounded-xl px-4 py-3 text-center font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 ${terminal && !canRetry ? 'bg-white text-emerald-950' : 'border border-white/30 text-white hover:bg-white/10'}`}
                    href="/"
                    onClick={onWebsite}
                >
                    {copy.recoveryWebsite}
                </a>
            </div>
        </section>
    )
}

export default function Install() {
    const { currentLanguage } = useLanguage()
    const copy = useMemo(() => getInstallCopy(currentLanguage), [currentLanguage])
    const locale = LOCALE_BY_LANGUAGE[currentLanguage] || 'zh-CN'
    const device = useMemo(() => detectDevice(), [])
    const deviceOs = useMemo(() => resolveDeviceOs(device), [device])
    const isWeChat = useMemo(() => detectIsWeChat(), [])
    const legacyEntry = useMemo(() => parseLegacyInstallEntry(window.location.search), [])
    const isLegacyMode = Boolean(legacyEntry)
    const stateToken = useMemo(() => (legacyEntry ? null : getStateToken()), [legacyEntry])
    const [selectedRegion, setSelectedRegion] = useState(getInitialRegion)
    const [activePlatform, setActivePlatform] = useState(() => (
        deviceOs === 'android' ? 'android' : 'ios'
    ))
    const [loadStatus, setLoadStatus] = useState(
        stateToken || legacyEntry ? 'loading' : 'missing_state',
    )
    const [installContext, setInstallContext] = useState(null)
    const [reloadNonce, setReloadNonce] = useState(0)
    const [recoveryOpen, setRecoveryOpen] = useState(false)
    const [wechatEmphasis, setWechatEmphasis] = useState(false)
    const [busyOptionId, setBusyOptionId] = useState(null)
    const [announcement, setAnnouncement] = useState('')
    const choicesRef = useRef(null)
    const wechatCardRef = useRef(null)
    const viewTrackedRef = useRef(false)
    const recoveryReasonRef = useRef('unknown')

    const displayOs = deviceOs === 'desktop' ? activePlatform : deviceOs
    const isTerminalState = ['missing_state', 'failed', 'no_options'].includes(loadStatus)

    useEffect(() => {
        document.title = copy.metaTitle
    }, [copy.metaTitle])

    useEffect(() => {
        if (!stateToken && !legacyEntry) {
            setLoadStatus('missing_state')
            setInstallContext(null)
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
    }, [legacyEntry, reloadNonce, stateToken])

    useEffect(() => {
        if (isLegacyMode) return undefined
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
    }, [isLegacyMode])

    const analyticsContext = useMemo(() => ({
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
    }), [installContext, isWeChat, legacyEntry?.clickId, loadStatus, stateToken])

    useEffect(() => {
        if (viewTrackedRef.current || loadStatus === 'loading') return
        viewTrackedRef.current = true
        trackInstallEvent('install_gate_viewed', analyticsContext)
    }, [analyticsContext, loadStatus])

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
    }, [showRecovery])

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

    const replaceInstallUrl = useCallback(region => {
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
    }, [legacyEntry?.clickId, legacyEntry?.legacySlug, stateToken])

    const handleChoiceSelect = useCallback(choice => {
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
        replaceInstallUrl(region)
        reportServerInteraction('install_region_selected', region)
        reportServerInteraction('install_option_selected', region, { option_id: option.optionId })
        trackInstallEvent('install_option_selected', {
            ...analyticsContext,
            distribution_region_choice: region,
            option_id: option.optionId,
            distribution_channel: option.channel,
            option_region: option.region || 'unknown',
            availability_status: option.status,
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
    }, [analyticsContext, displayOs, installContext?.campaignTargetMarket, installContext?.linkId, isLegacyMode, isWeChat, legacyEntry?.clickId, legacyEntry?.legacySlug, replaceInstallUrl, reportServerInteraction, showRecovery, stateToken])

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
    }, [copy.copied, copy.copyFailed, handleRecoveryAction, legacyEntry?.clickId, legacyEntry?.legacySlug, selectedRegion, showRecovery, stateToken])

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

    const handleOpenInstalledApp = useCallback(() => {
        handleRecoveryAction('open_installed_app')
    }, [handleRecoveryAction])

    const switchPlatform = useCallback(platform => {
        setActivePlatform(platform)
        setSelectedRegion(null)
        setRecoveryOpen(false)
        setWechatEmphasis(false)
        replaceInstallUrl(null)
    }, [replaceInstallUrl])

    return (
        <div className="relative flex min-h-[100svh] flex-col overflow-x-hidden bg-emerald-950 text-white">
            <div className="absolute inset-0 z-0">
                <Silk
                    speed={Colors.background.silkParams.speed}
                    scale={Colors.background.silkParams.scale}
                    color={Colors.background.silk}
                    noiseIntensity={Colors.background.silkParams.noiseIntensity}
                    rotation={Colors.background.silkParams.rotation}
                />
            </div>
            <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/10 via-emerald-950/15 to-black/45" aria-hidden="true" />
            <div aria-live="polite" className="sr-only">{announcement}</div>

            <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pb-4 sm:pt-6">
                <a href="/" className="flex min-h-11 items-center gap-2 rounded-xl pr-2 font-black tracking-tight focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50">
                    <img src={logo} alt="" className="h-10 w-10 rounded-xl" />
                    <span>{copy.brand}</span>
                </a>
                <LanguageSwitch />
            </header>

            <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-4 pt-[clamp(2.25rem,6svh,3.75rem)] sm:px-6 sm:pb-8 sm:pt-10">
                <section className="w-full rounded-[28px] border border-white/20 bg-black/20 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
                    <div className="text-center">
                        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{copy.pageTitle}</h1>
                        <p className="mt-2 text-base text-white/70 sm:text-lg">{copy.pageDescription}</p>
                    </div>

                    {deviceOs === 'desktop' && (
                        <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 rounded-2xl border border-white/15 bg-black/15 p-1" role="tablist" aria-label={copy.pageDescription}>
                            {[
                                { value: 'ios', label: copy.iphone, icon: <Apple className="h-4 w-4" aria-hidden="true" /> },
                                { value: 'android', label: copy.android, icon: <Smartphone className="h-4 w-4" aria-hidden="true" /> },
                            ].map(({ value, label, icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    role="tab"
                                    aria-selected={activePlatform === value}
                                    className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 ${activePlatform === value ? 'bg-white text-emerald-950' : 'text-white/65 hover:text-white'}`}
                                    onClick={() => switchPlatform(value)}
                                >
                                    {icon}
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {loadStatus === 'loading' && (
                        <div className="flex min-h-44 flex-col items-center justify-center" aria-live="polite" aria-busy="true">
                            <RefreshCw className="h-7 w-7 animate-spin text-white/80" aria-hidden="true" />
                            <p className="mt-3 text-sm font-semibold text-white/70">{copy.loading}</p>
                        </div>
                    )}

                    {loadStatus === 'ready' && (
                        <div ref={choicesRef} tabIndex={-1} className="mt-5 space-y-3 focus-visible:outline-none sm:mt-6">
                            {directChoices.map((choice, index) => (
                                <InstallChoice
                                    key={`${displayOs}-${choice.option.optionId}`}
                                    choice={choice}
                                    copy={copy}
                                    locale={locale}
                                    primary={index === 0}
                                    busy={busyOptionId === choice.option.optionId}
                                    onSelect={handleChoiceSelect}
                                />
                            ))}

                            {directChoices.length === 0 && (
                                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-center">
                                    <h2 className="font-black">{copy.noOptionsTitle}</h2>
                                    <p className="mt-1 text-sm text-white/65">{copy.noOptionsDescription}</p>
                                </div>
                            )}

                            {openAppUrl && (
                                <a
                                    className="mx-auto flex min-h-12 w-fit items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white/85 underline decoration-white/35 underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
                                    href={openAppUrl}
                                    onClick={handleOpenInstalledApp}
                                >
                                    <Smartphone className="h-4 w-4" aria-hidden="true" />
                                    {copy.openInstalledApp}
                                </a>
                            )}
                        </div>
                    )}

                    {wechatEmphasis && (
                        <section ref={wechatCardRef} tabIndex={-1} className="mt-4 rounded-2xl border border-white/25 bg-white/10 p-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50">
                            <h2 className="flex items-center gap-2 font-black">
                                <ExternalLink className="h-5 w-5" aria-hidden="true" />
                                {copy.wechatTitle}
                            </h2>
                            <p className="mt-1 text-sm leading-5 text-white/70">{copy.wechatDescription}</p>
                            <button type="button" className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-emerald-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50" onClick={copyInstallLink}>
                                <Copy className="h-4 w-4" aria-hidden="true" />
                                {copy.copyLink}
                            </button>
                        </section>
                    )}

                    {(recoveryOpen || isTerminalState) && (
                        <CompactRecovery
                            copy={copy}
                            terminal={isTerminalState}
                            canRetry={Boolean(stateToken || legacyEntry)}
                            onChoose={chooseAnother}
                            onRetry={reloadOptions}
                            onWebsite={() => handleRecoveryAction('official_website')}
                        />
                    )}
                </section>
            </main>

            <footer className="relative z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 text-center text-sm text-white/55 sm:pb-6">
                <nav className="flex min-h-11 items-center justify-center gap-5" aria-label="Footer">
                    <a className="rounded-lg px-2 py-2 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50" href="/">{copy.officialWebsite}</a>
                    <span aria-hidden="true">·</span>
                    <a className="rounded-lg px-2 py-2 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50" href="/privacy">{copy.privacy}</a>
                </nav>
            </footer>
        </div>
    )
}
