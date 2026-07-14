import {
    Apple,
    Bell,
    CheckCircle2,
    ChevronDown,
    Download,
    ExternalLink,
    Globe2,
    RefreshCw,
    ShieldCheck,
    Smartphone,
    Store,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import logo from '../assets/logo_1.png'
import { config } from '../config'
import { useLanguage } from '../contexts/LanguageContext'
import { trackInstallEvent } from '../lib/analytics'
import { detectDevice, detectIsWeChat } from '../lib/deviceDetection'
import { getInstallCopy, INSTALL_LANGUAGE_OPTIONS } from '../lib/installCopy'
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
    isApkMetadataComplete,
    isOptionAvailable,
    isOptionCompatibleWithDevice,
    isOptionUnverified,
    normalizeInstallContext,
    normalizeMarket,
    parseLegacyInstallEntry,
    resolveDeviceOs,
    resolveMarketChoiceRelation,
    sortInstallOptions,
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

function optionChannelLabel(copy, option) {
    if (option.channel === 'apple_app_store') {
        return option.region === 'cn' ? copy.channelAppleCn : copy.channelAppleGlobal
    }
    if (option.channel === 'google_play') return copy.channelGooglePlay
    if (option.channel === 'apk') return copy.channelApk
    if (option.channel === 'oem_store') return option.label || copy.channelOtherStore
    if (option.channel === 'testflight') return copy.channelTestFlight
    if (option.channel === 'waitlist') return copy.channelWaitlist
    if (option.channel === 'web') return copy.channelWeb
    return option.label || copy.channelUnknown
}

function optionRegionLabel(copy, option) {
    if (option.region === 'cn') return copy.regionCnBadge
    if (option.region === 'global') return copy.regionGlobalBadge
    return copy.regionUnknownBadge
}

function optionStatus(copy, option, forceUnverified = false) {
    if (forceUnverified) return copy.statusUnverified
    if (isOptionUnverified(option)) return copy.statusUnverified
    if (!isOptionAvailable(option)) return copy.statusUnavailable
    if (option.channel === 'apk' && !isApkMetadataComplete(option)) return copy.statusUnverified
    return copy.statusAvailable
}

function optionIcon(channel) {
    if (channel === 'apple_app_store') return Apple
    if (channel === 'google_play') return Store
    if (channel === 'oem_store') return Store
    if (channel === 'apk') return Download
    if (channel === 'waitlist') return Bell
    if (channel === 'web') return Globe2
    return Smartphone
}

function OpenInstalledAppCta({ copy, href, onOpen, className = '' }) {
    if (!href) return null

    return (
        <a
            className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-700 bg-white px-5 py-3 text-center font-bold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 ${className}`}
            href={href}
            onClick={onOpen}
        >
            <Smartphone className="h-5 w-5" aria-hidden="true" />
            {copy.openInstalledApp}
        </a>
    )
}

function OptionCard({
    copy,
    locale,
    option,
    recommended,
    primary,
    selectedRegion,
    onSelect,
    onOpenInstalledApp,
    openAppUrl,
    deviceOs,
}) {
    const Icon = optionIcon(option.channel)
    const apkComplete = option.channel !== 'apk' || isApkMetadataComplete(option)
    const blockedOnHarmonyNext = deviceOs === 'harmonyos_next'
        && ['apk', 'google_play'].includes(option.channel)
    const actionable = isOptionAvailable(option) && apkComplete && !blockedOnHarmonyNext
    const mismatch = Boolean(selectedRegion && option.region && selectedRegion !== option.region)

    return (
        <article className={`rounded-3xl border bg-white p-5 shadow-sm ${recommended ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}>
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700" aria-hidden="true">
                    <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-950">
                            {optionChannelLabel(copy, option)}
                        </h3>
                        {recommended && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                                {copy.recommended}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                        {option.description || copy.optionDefaultDescription}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                            {optionRegionLabel(copy, option)}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 ${actionable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                            {optionStatus(copy, option, blockedOnHarmonyNext)}
                        </span>
                    </div>
                </div>
            </div>

            {mismatch && (
                <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
                    {copy.mismatchHint}
                </p>
            )}

            {option.channel === 'apk' && blockedOnHarmonyNext && (
                <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                    {copy.harmonyDescription}
                </div>
            )}

            {option.channel === 'apk' && !blockedOnHarmonyNext && (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                        {copy.apkVerificationTitle}
                    </h4>
                    {apkComplete ? (
                        <>
                            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-slate-500">{copy.apkVersion}</dt>
                                    <dd className="font-semibold text-slate-950">{option.apk.version}</dd>
                                </div>
                                <div>
                                    <dt className="text-slate-500">{copy.apkSize}</dt>
                                    <dd className="font-semibold text-slate-950">{formatBytes(option.apk.sizeBytes, locale)}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-slate-500">{copy.apkSha256}</dt>
                                    <dd className="mt-1 break-all font-mono text-xs leading-5 text-slate-800">{option.apk.sha256}</dd>
                                </div>
                            </dl>
                            <ol className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                                {[copy.apkStep1, copy.apkStep2, copy.apkStep3].map((step, index) => (
                                    <li key={step} className="flex gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800" aria-hidden="true">
                                            {index + 1}
                                        </span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                            <OpenInstalledAppCta
                                copy={copy}
                                href={openAppUrl}
                                onOpen={onOpenInstalledApp}
                                className="mt-4"
                            />
                        </>
                    ) : (
                        <p className="mt-3 text-sm leading-6 text-amber-900">{copy.apkMissing}</p>
                    )}
                </div>
            )}

            <button
                type="button"
                className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-slate-300 disabled:text-slate-600 ${primary ? 'border border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800' : 'border border-emerald-700 bg-white text-emerald-800 hover:bg-emerald-50'}`}
                disabled={!actionable}
                onClick={() => onSelect(option)}
            >
                {actionable
                    ? mismatch
                        ? copy.mismatchAction
                        : copy.continueAction
                    : copy.unavailableAction}
                {actionable && <ExternalLink className="h-5 w-5" aria-hidden="true" />}
            </button>
        </article>
    )
}

function RecoveryPanel({
    copy,
    isOpen,
    onToggle,
    onChooseAgain,
    onReload,
    onRecoveryAction,
    canChooseAgain,
    canReload,
    onOpenInstalledApp,
    openAppUrl,
    alwaysOpen = false,
}) {
    const contentOpen = alwaysOpen || isOpen

    return (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
            {!alwaysOpen && (
                <button
                    type="button"
                    className="flex min-h-14 w-full items-center justify-between gap-4 rounded-3xl px-5 py-4 text-left font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                    aria-expanded={isOpen}
                    aria-controls="install-recovery-panel"
                    onClick={onToggle}
                >
                    <span>{copy.recoveryToggle}</span>
                    <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
            )}
            {contentOpen && (
                <div id="install-recovery-panel" className={`${alwaysOpen ? '' : 'border-t border-slate-200'} px-5 pb-5 pt-4`}>
                    <h2 className="text-lg font-bold text-slate-950">{copy.recoveryTitle}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{copy.recoveryDescription}</p>
                    <div className="mt-4">
                        {canChooseAgain ? (
                            <button
                                type="button"
                                className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                                onClick={() => {
                                    onRecoveryAction('choose_region_again')
                                    onChooseAgain()
                                }}
                            >
                                {copy.chooseAgain}
                            </button>
                        ) : canReload ? (
                            <button
                                type="button"
                                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                                onClick={() => {
                                    onRecoveryAction('reload_options')
                                    onReload()
                                }}
                            >
                                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                {copy.reloadOptions}
                            </button>
                        ) : (
                            <a
                                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-center font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                                href="/"
                                onClick={() => onRecoveryAction('official_website')}
                            >
                                <Globe2 className="h-4 w-4" aria-hidden="true" />
                                {copy.officialWebsite}
                            </a>
                        )}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {canChooseAgain && canReload && (
                            <button
                                type="button"
                                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                                onClick={() => {
                                    onRecoveryAction('reload_options')
                                    onReload()
                                }}
                            >
                                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                {copy.reloadOptions}
                            </button>
                        )}
                        <OpenInstalledAppCta
                            copy={copy}
                            href={openAppUrl}
                            onOpen={onOpenInstalledApp}
                        />
                        {canReload && !canChooseAgain && (
                            <a
                                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-center font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                                href="/"
                                onClick={() => onRecoveryAction('official_website')}
                            >
                                <Globe2 className="h-4 w-4" aria-hidden="true" />
                                {copy.officialWebsite}
                            </a>
                        )}
                    </div>
                </div>
            )}
        </section>
    )
}

export default function Install() {
    const { currentLanguage, changeLanguage } = useLanguage()
    const copy = useMemo(() => getInstallCopy(currentLanguage), [currentLanguage])
    const locale = LOCALE_BY_LANGUAGE[currentLanguage] || 'zh-CN'
    const device = useMemo(() => detectDevice(), [])
    const deviceOs = useMemo(() => resolveDeviceOs(device), [device])
    const requiresRegionChoice = deviceOs === 'ios'
    const isWeChat = useMemo(() => detectIsWeChat(), [])
    const legacyEntry = useMemo(() => parseLegacyInstallEntry(window.location.search), [])
    const isLegacyMode = Boolean(legacyEntry)
    const stateToken = useMemo(() => (legacyEntry ? null : getStateToken()), [legacyEntry])
    const [selectedRegion, setSelectedRegion] = useState(getInitialRegion)
    const [loadStatus, setLoadStatus] = useState(
        stateToken || legacyEntry ? 'loading' : 'missing_state',
    )
    const [installContext, setInstallContext] = useState(null)
    const [reloadNonce, setReloadNonce] = useState(0)
    const [recoveryOpen, setRecoveryOpen] = useState(false)
    const [wechatEmphasis, setWechatEmphasis] = useState(isWeChat && (deviceOs === 'android' || deviceOs === 'harmonyos_next'))
    const [announcement, setAnnouncement] = useState('')
    const regionFieldRef = useRef(null)
    const wechatCardRef = useRef(null)
    const viewTrackedRef = useRef(false)
    const recoveryReasonRef = useRef(
        isWeChat && (deviceOs === 'android' || deviceOs === 'harmonyos_next')
            ? 'wechat_external_browser_required'
            : 'unknown',
    )

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
                ) {
                    throw new Error('legacy install-context identity mismatch')
                }
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
        // Legacy journeys remain on the legacy server contract and must never
        // be posted to the signed-state v2 ingest endpoint.
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

    const showRecovery = useCallback((reason) => {
        recoveryReasonRef.current = reason
        setRecoveryOpen(true)
    }, [])

    useEffect(() => {
        if (['missing_state', 'failed', 'no_options'].includes(loadStatus)) {
            showRecovery(`terminal_${loadStatus}`)
        }
    }, [loadStatus, showRecovery])

    useEffect(() => {
        const recoverAfterHandoff = () => {
            if (document.visibilityState === 'hidden') return
            const attemptedAt = Number(sessionStorage.getItem(HANDOFF_SESSION_KEY))
            if (!attemptedAt) return
            sessionStorage.removeItem(HANDOFF_SESSION_KEY)
            if (Date.now() - attemptedAt <= HANDOFF_MAX_AGE_MS) {
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

    const effectiveRegionChoice = requiresRegionChoice ? selectedRegion : null
    const marketChoiceRelation = useMemo(() => resolveMarketChoiceRelation(
        installContext?.campaignTargetMarket,
        effectiveRegionChoice,
    ), [effectiveRegionChoice, installContext?.campaignTargetMarket])
    const reportServerInteraction = useCallback((eventType, properties = {}) => {
        if (isLegacyMode || !stateToken) return null
        return reportInstallInteraction({
            base: config.smartLink.installEventBase,
            origin: window.location.origin,
            state: stateToken,
            event_type: eventType,
            distribution_region_choice: effectiveRegionChoice || 'not_observed',
            ...properties,
        })
    }, [effectiveRegionChoice, isLegacyMode, stateToken])
    const sortedOptions = useMemo(() => sortInstallOptions(installContext?.options || [], {
        deviceOs,
        selectedRegion: effectiveRegionChoice,
        campaignTargetMarket: installContext?.campaignTargetMarket,
    }), [deviceOs, effectiveRegionChoice, installContext])
    const compatibleOptions = useMemo(
        () => sortedOptions.filter(option => isOptionCompatibleWithDevice(option, deviceOs)),
        [deviceOs, sortedOptions],
    )
    const openAppUrl = useMemo(() => (
        isLegacyMode
            ? null
            : buildAppOpenUrl({
                base: config.smartLink.appLinkBase,
                linkId: installContext?.linkId,
                clickId: installContext?.clickId,
            })
    ), [installContext?.clickId, installContext?.linkId, isLegacyMode])
    const hasActionableSelectedRegionOption = useMemo(() => {
        if (!effectiveRegionChoice) return true
        return compatibleOptions.some(option => (
            (!option.region || option.region === effectiveRegionChoice)
            && isOptionAvailable(option)
            && (option.channel !== 'apk' || isApkMetadataComplete(option))
            && !(deviceOs === 'harmonyos_next' && ['apk', 'google_play'].includes(option.channel))
        ))
    }, [compatibleOptions, deviceOs, effectiveRegionChoice])

    useEffect(() => {
        if (loadStatus === 'ready' && effectiveRegionChoice && !hasActionableSelectedRegionOption) {
            showRecovery('no_compatible_option_for_choice')
            return
        }
        if (
            hasActionableSelectedRegionOption
            && recoveryReasonRef.current === 'no_compatible_option_for_choice'
        ) {
            recoveryReasonRef.current = 'unknown'
            setRecoveryOpen(false)
        }
    }, [effectiveRegionChoice, hasActionableSelectedRegionOption, loadStatus, showRecovery])

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

    useEffect(() => {
        if (stateToken || legacyEntry) replaceInstallUrl(selectedRegion)
    }, [legacyEntry, replaceInstallUrl, selectedRegion, stateToken])

    const handleRegionSelect = useCallback(region => {
        setSelectedRegion(region)
        replaceInstallUrl(region)
        const relation = resolveMarketChoiceRelation(
            installContext?.campaignTargetMarket,
            region,
        )
        if (!isLegacyMode && stateToken) {
            reportInstallInteraction({
                base: config.smartLink.installEventBase,
                origin: window.location.origin,
                state: stateToken,
                event_type: 'install_region_selected',
                distribution_region_choice: region,
            })
        }
        trackInstallEvent('install_option_selected', {
            ...analyticsContext,
            distribution_region_choice: region,
            market_choice_relation: relation,
            decision_reason: 'user_region_selected',
        })
    }, [analyticsContext, installContext?.campaignTargetMarket, isLegacyMode, replaceInstallUrl, stateToken])

    const copyInstallLink = useCallback(async () => {
        const url = buildInstallContinuationUrl({
            origin: window.location.origin,
            state: stateToken,
            legacySlug: legacyEntry?.legacySlug,
            clickId: legacyEntry?.clickId,
            choice: effectiveRegionChoice,
        })
        const decisionReason = normalizeInstallReasonCode(url
            ? recoveryReasonRef.current
            : 'copy_continuation_unavailable')
        reportServerInteraction('install_recovery_action_clicked', {
            recovery_action: 'copy_for_external_browser',
            reason_code: decisionReason,
        })
        trackInstallEvent('install_recovery_action_clicked', {
            ...analyticsContext,
            distribution_region_choice: effectiveRegionChoice || 'not_observed',
            decision_reason: decisionReason,
            recovery_action: 'copy_for_external_browser',
        })
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
    }, [analyticsContext, copy, effectiveRegionChoice, legacyEntry?.clickId, legacyEntry?.legacySlug, reportServerInteraction, showRecovery, stateToken])

    const handleOptionSelect = useCallback(option => {
        const needsExternalBrowser = isWeChat
            && (deviceOs === 'android' || deviceOs === 'harmonyos_next')
            && ['apk', 'google_play'].includes(option.channel)

        reportServerInteraction('install_option_selected', {
            option_id: option.optionId,
        })

        trackInstallEvent('install_option_selected', {
            ...analyticsContext,
            distribution_region_choice: effectiveRegionChoice || 'not_observed',
            option_id: option.optionId,
            distribution_channel: option.channel,
            option_region: option.region || 'unknown',
            availability_status: option.status,
            market_choice_relation: marketChoiceRelation,
            artifact_id: option.artifactId || 'unknown',
            decision_reason: 'distribution_option_selected',
        })

        if (needsExternalBrowser) {
            setWechatEmphasis(true)
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

        sessionStorage.setItem(HANDOFF_SESSION_KEY, String(Date.now()))
        window.location.assign(outUrl)
    }, [analyticsContext, deviceOs, effectiveRegionChoice, installContext?.linkId, isLegacyMode, isWeChat, legacyEntry?.clickId, legacyEntry?.legacySlug, marketChoiceRelation, reportServerInteraction, showRecovery, stateToken])

    const handleRecoveryAction = useCallback(action => {
        const decisionReason = normalizeInstallReasonCode(recoveryReasonRef.current)
        reportServerInteraction('install_recovery_action_clicked', {
            recovery_action: action,
            reason_code: decisionReason,
        })
        trackInstallEvent('install_recovery_action_clicked', {
            ...analyticsContext,
            distribution_region_choice: effectiveRegionChoice || 'not_observed',
            decision_reason: decisionReason,
            recovery_action: action,
            ...(action === 'official_website' ? { terminal_outcome: 'branded_recovery' } : {}),
        })
    }, [analyticsContext, effectiveRegionChoice, reportServerInteraction])

    const handleOpenInstalledApp = useCallback(() => {
        handleRecoveryAction('open_installed_app')
    }, [handleRecoveryAction])

    const chooseAgain = useCallback(() => {
        setSelectedRegion(null)
        replaceInstallUrl(null)
        requestAnimationFrame(() => regionFieldRef.current?.focus())
    }, [replaceInstallUrl])

    const reloadOptions = useCallback(() => {
        setReloadNonce(value => value + 1)
    }, [])

    const toggleRecovery = useCallback(() => {
        if (recoveryOpen) {
            setRecoveryOpen(false)
            return
        }
        showRecovery('manual_expand')
    }, [recoveryOpen, showRecovery])

    const showWechatCard = wechatEmphasis && isWeChat && (deviceOs === 'android' || deviceOs === 'harmonyos_next')
    const isTerminalState = ['missing_state', 'failed', 'no_options'].includes(loadStatus)

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#d9f7e8_0,#f7faf9_42%,#eef3f1_100%)] text-slate-950">
            <div aria-live="polite" className="sr-only">{announcement}</div>
            <header className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
                <a href="/" className="flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">
                    <img src={logo} alt="" className="h-11 w-11 rounded-xl" />
                    <span className="text-lg font-black tracking-tight">{copy.brand}</span>
                </a>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="sr-only">{copy.languageLabel}</span>
                    <Globe2 className="h-4 w-4" aria-hidden="true" />
                    <select
                        className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                        value={currentLanguage}
                        onChange={event => changeLanguage(event.target.value)}
                        aria-label={copy.languageLabel}
                    >
                        {INSTALL_LANGUAGE_OPTIONS.map(language => (
                            <option key={language.code} value={language.code}>{language.label}</option>
                        ))}
                    </select>
                </label>
            </header>

            <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-3 sm:px-6 sm:pt-8">
                <div className="mx-auto max-w-2xl text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/15" aria-hidden="true">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{copy.pageTitle}</h1>
                    <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">{copy.pageDescription}</p>
                    {openAppUrl && (
                        <OpenInstalledAppCta
                            copy={copy}
                            href={openAppUrl}
                            onOpen={handleOpenInstalledApp}
                            className="mx-auto mt-5 max-w-sm"
                        />
                    )}
                </div>

                {loadStatus === 'loading' && (
                    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm" aria-live="polite" aria-busy="true">
                        <RefreshCw className="mx-auto h-7 w-7 animate-spin text-emerald-700" aria-hidden="true" />
                        <h2 className="mt-3 text-lg font-bold">{copy.loadingTitle}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{copy.loadingDescription}</p>
                    </section>
                )}

                {loadStatus === 'missing_state' && (
                    <section className="mt-8 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm" role="status">
                        <h2 className="text-xl font-bold">{copy.stateMissingTitle}</h2>
                        <p className="mt-2 leading-7 text-slate-600">{copy.stateMissingDescription}</p>
                    </section>
                )}

                {loadStatus === 'failed' && (
                    <section className="mt-8 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm" role="status">
                        <h2 className="text-xl font-bold">{copy.loadFailedTitle}</h2>
                        <p className="mt-2 leading-7 text-slate-600">{copy.loadFailedDescription}</p>
                    </section>
                )}

                {loadStatus === 'no_options' && (
                    <section className="mt-8 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm" role="status">
                        <h2 className="text-xl font-bold">{copy.noOptionsTitle}</h2>
                        <p className="mt-2 leading-7 text-slate-600">{copy.noOptionsDescription}</p>
                    </section>
                )}

                {loadStatus === 'ready' && (
                    <>
                        {showWechatCard && (
                            <section
                                ref={wechatCardRef}
                                tabIndex={-1}
                                className="mt-8 rounded-3xl border-2 border-blue-300 bg-blue-50 p-5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                                aria-labelledby="wechat-browser-title"
                            >
                                <h2 id="wechat-browser-title" className="flex items-center gap-2 text-lg font-bold text-blue-950">
                                    <ExternalLink className="h-5 w-5" aria-hidden="true" />
                                    {copy.wechatTitle}
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-blue-950">{copy.wechatDescription}</p>
                                <button
                                    type="button"
                                    className="mt-4 min-h-12 w-full rounded-2xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 sm:w-auto"
                                    onClick={copyInstallLink}
                                >
                                    {copy.copyLink}
                                </button>
                            </section>
                        )}

                        {deviceOs === 'harmonyos_next' && (
                            <section className="mt-6 rounded-3xl border border-amber-300 bg-amber-50 p-5" role="status">
                                <h2 className="text-lg font-bold text-amber-950">{copy.harmonyTitle}</h2>
                                <p className="mt-2 text-sm leading-6 text-amber-950">{copy.harmonyDescription}</p>
                            </section>
                        )}

                        {requiresRegionChoice && (
                            <fieldset ref={regionFieldRef} tabIndex={-1} className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 sm:p-6">
                                <legend className="px-1 text-xl font-black text-slate-950">{copy.choiceLegend}</legend>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{copy.choiceHint}</p>
                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    {[
                                        { value: 'cn', title: copy.regionCnTitle, description: copy.regionCnDescription },
                                        { value: 'global', title: copy.regionGlobalTitle, description: copy.regionGlobalDescription },
                                    ].map(region => (
                                        <label key={region.value} className="cursor-pointer">
                                            <input
                                                className="peer sr-only"
                                                type="radio"
                                                name="install-region"
                                                value={region.value}
                                                checked={selectedRegion === region.value}
                                                onChange={() => handleRegionSelect(region.value)}
                                            />
                                            <span className="flex min-h-24 flex-col justify-center rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 transition hover:border-emerald-300 peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-300">
                                                <span className="flex items-center gap-2 font-bold text-slate-950">
                                                    {selectedRegion === region.value && <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />}
                                                    {region.title}
                                                </span>
                                                <span className="mt-1 text-sm leading-5 text-slate-600">{region.description}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-left">
                                    <summary className="flex min-h-11 cursor-pointer items-center font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">
                                        {copy.choiceHelpTitle}
                                    </summary>
                                    <p className="pb-3 text-sm leading-6 text-slate-600">
                                        {copy.choiceHelpDescription}
                                    </p>
                                </details>
                            </fieldset>
                        )}

                        {(!requiresRegionChoice || selectedRegion) && (
                            <div className="mt-8">
                                <div className="flex items-end justify-between gap-4">
                                    <h2 className="text-xl font-black text-slate-950">
                                        {requiresRegionChoice ? copy.otherOptions : copy.androidOptionsTitle}
                                    </h2>
                                    <span className="text-sm text-slate-500">{compatibleOptions.length}</span>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{copy.allOptionsHint}</p>
                                {!hasActionableSelectedRegionOption && (
                                    <section className="mt-4 rounded-3xl border border-amber-300 bg-amber-50 p-5" role="status">
                                        <h3 className="text-lg font-bold text-amber-950">{copy.noCompatibleChoiceTitle}</h3>
                                        <p className="mt-2 text-sm leading-6 text-amber-950">{copy.noCompatibleChoiceDescription}</p>
                                    </section>
                                )}
                                <div className="mt-4 space-y-4">
                                    {compatibleOptions.map((option, index) => (
                                        <OptionCard
                                            key={option.optionId}
                                            copy={copy}
                                            locale={locale}
                                            option={option}
                                            recommended={index === 0
                                                && (!effectiveRegionChoice || !option.region || option.region === effectiveRegionChoice)
                                                && isOptionAvailable(option)
                                                && (option.channel !== 'apk' || isApkMetadataComplete(option))
                                                && !(deviceOs === 'harmonyos_next' && ['apk', 'google_play'].includes(option.channel))}
                                            primary={index === 0
                                                && (!effectiveRegionChoice || !option.region || option.region === effectiveRegionChoice)
                                                && !showWechatCard
                                                && !recoveryOpen
                                                && isOptionAvailable(option)
                                                && (option.channel !== 'apk' || isApkMetadataComplete(option))
                                                && !(deviceOs === 'harmonyos_next' && ['apk', 'google_play'].includes(option.channel))}
                                            selectedRegion={effectiveRegionChoice}
                                            onSelect={handleOptionSelect}
                                            onOpenInstalledApp={handleOpenInstalledApp}
                                            openAppUrl={openAppUrl}
                                            deviceOs={deviceOs}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {(loadStatus === 'ready' || isTerminalState) && (
                    <RecoveryPanel
                        copy={copy}
                        isOpen={recoveryOpen || isTerminalState}
                        onToggle={toggleRecovery}
                        onChooseAgain={chooseAgain}
                        onReload={reloadOptions}
                        onRecoveryAction={handleRecoveryAction}
                        canChooseAgain={loadStatus === 'ready' && requiresRegionChoice && Boolean(selectedRegion)}
                        canReload={Boolean(stateToken || legacyEntry) && loadStatus !== 'missing_state'}
                        onOpenInstalledApp={handleOpenInstalledApp}
                        openAppUrl={openAppUrl}
                        alwaysOpen={isTerminalState}
                    />
                )}
            </main>

            <footer className="border-t border-slate-200/80 bg-white/70 px-4 py-6 text-center text-sm text-slate-600 backdrop-blur">
                <nav className="flex justify-center gap-5" aria-label="Footer">
                    <a className="min-h-11 rounded-lg px-2 py-3 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300" href="/">{copy.backHome}</a>
                    <a className="min-h-11 rounded-lg px-2 py-3 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300" href="/privacy">{copy.privacy}</a>
                </nav>
            </footer>
        </div>
    )
}
