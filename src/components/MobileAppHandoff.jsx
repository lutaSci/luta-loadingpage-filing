import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { config } from '../config/index.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import { useSmartLinkJourney } from '../contexts/SmartLinkJourneyContext.jsx'
import { trackMobileHandoffEvent } from '../lib/analytics.js'
import { buildContinueUrl, resolveRouteContext } from '../lib/attributionState.js'
import { detectIsMainlandChina } from '../lib/deviceDetection.js'
import { buildControlledOutUrl, buildLegacyControlledOutUrl } from '../lib/installFlow.js'
import { hasSmartLinkBearer } from '../lib/smartLinkEntry.js'
import {
    buildHandoffAppUrl, HANDOFF_FALLBACK_DELAY_MS, readHandoff, readHistoryHandoff,
    resolveHandoffAction, resolveHandoffMarket, resolveMobileHandoff, latestHandoffRecord,
    selectGlobalHandoffOption, WEBSITE_APP_OPEN_URL, writeHandoff, writeHistoryHandoff,
} from '../lib/mobileAppHandoff.js'
import './MobileAppHandoff.css'

function storage() {
    try { return window.sessionStorage } catch { return null }
}

function currentRecord() {
    return latestHandoffRecord(readHandoff(storage()), readHistoryHandoff(window.history.state))
}

export default function MobileAppHandoff() {
    const location = useLocation()
    const { currentLanguage: language } = useLanguage()
    const { controller, entry, handoffReturned } = useSmartLinkJourney()
    const [phase, setPhase] = useState(() => currentRecord()?.phase === 'browse' ? 'browse' : 'idle')
    const [copied, setCopied] = useState(false)
    const startedRef = useRef(false)
    const leftPageRef = useRef(false)
    const timerRef = useRef(null)
    const context = controller.installContext
    const market = resolveHandoffMarket({
        entryChoice: entry?.choice,
        campaignTargetMarket: entry ? context?.campaignTargetMarket : null,
        recommendedRegion: entry ? context?.recommendedRegion : null,
        defaultMarket: resolveRouteContext(detectIsMainlandChina()).market,
    })
    const policy = resolveMobileHandoff({
        enabled: config.mobileHandoff.enabled, pathname: location.pathname, market,
        userAgent: navigator.userAgent, hasEntry: Boolean(entry), loadStatus: controller.loadStatus,
    })
    const option = selectGlobalHandoffOption(context?.options, policy.platform)
    const journey = entry ? `${context?.linkId || ''}:${context?.clickId || ''}` : 'direct'
    // Legacy links retain their existing identity on the controlled store route.
    const appUrl = entry?.mode === 'v2' ? controller.openAppUrl : entry ? null : WEBSITE_APP_OPEN_URL
    const storeUrl = entry ? option && (entry.mode === 'legacy'
        ? buildLegacyControlledOutUrl({ base: config.smartLink.legacyOutBase,
            legacySlug: entry.legacyEntry?.legacySlug, clickId: entry.legacyEntry?.clickId, optionId: option.optionId })
        : buildControlledOutUrl({ base: config.smartLink.outBase,
            state: entry.stateToken, linkId: context?.linkId, optionId: option.optionId }))
        : buildContinueUrl(policy.platform === 'ios' ? 'apple' : 'google', 'mobile_handoff')
            || (policy.platform === 'ios' ? config.downloads.appStoreGlobal : config.downloads.googlePlay)
    const eligible = policy.eligible
    const traditional = language === 'zhTW'
    const storeName = policy.platform === 'ios' ? 'App Store' : 'Google Play'

    const report = action => trackMobileHandoffEvent(action, {
        page_path: location.pathname, device_os: policy.platform, route_market: market,
        ...(entry ? { entry_type: 'shortlink', link_id: context?.linkId, click_id: context?.clickId,
            traffic_purpose: context?.trafficPurpose } : {}),
    })
    const clearPending = () => {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
    }
    const remember = next => {
        const now = Date.now()
        const session = writeHandoff(storage(), next, journey, now)
        const history = writeHistoryHandoff(window.history, next, journey, now)
        return { session, history }
    }
    const recover = () => {
        clearPending()
        setPhase('recovery')
    }
    const browse = () => {
        clearPending()
        remember('browse')
        setPhase('browse')
        report('browse_clicked')
    }
    const openStore = (automatic = false) => {
        clearPending()
        if (!storeUrl) return recover()
        const receipt = remember('store')
        // A history receipt is sufficient for Back/reload when sessionStorage is blocked.
        // If neither can be written, only an explicit user action may leave this page.
        if (automatic && !receipt.session && !receipt.history) return recover()
        setPhase('routing')
        report(automatic ? 'automatic_store_attempt' : 'store_clicked')
        timerRef.current = window.setTimeout(recover, HANDOFF_FALLBACK_DELAY_MS)
        try { window.location.assign(storeUrl) } catch { recover() }
    }
    const openApp = (automatic = false, nativeNavigation = false) => {
        clearPending()
        leftPageRef.current = false
        const target = appUrl && buildHandoffAppUrl(appUrl, automatic ? 'automatic' : 'continue')
        // The App -> API -> website round trip needs cross-document storage.
        // Without it, go directly to the known store, guarded by browser history.
        if (!target || !remember(automatic ? 'attempted' : 'continue_pending').session) {
            openStore(automatic)
            return false
        }
        setPhase('routing')
        report(automatic ? 'automatic_attempt' : 'retry_clicked')
        timerRef.current = window.setTimeout(() => {
            // This is an automatic routing policy, not an installed-app detector.
            // A hidden/unloaded page cancels this timer; returning never restarts it.
            if (document.visibilityState === 'visible' && !leftPageRef.current) openStore(true)
        }, HANDOFF_FALLBACK_DELAY_MS)
        // Explicit retries keep the browser's native link activation instead
        // of replacing that user gesture with a script navigation.
        if (!nativeNavigation) {
            try { window.location.assign(target) } catch { openStore(true) }
        }
        return true
    }

    useEffect(() => {
        if (!eligible || hasSmartLinkBearer(location.search) || startedRef.current) return undefined
        const timer = window.setTimeout(() => {
            startedRef.current = true
            const action = resolveHandoffAction({
                record: currentRecord(), journey, returnedByResolver: handoffReturned,
                historyReturn: performance.getEntriesByType('navigation')[0]?.type === 'back_forward',
                requiresBrowser: policy.requiresBrowser,
                canOpenApp: Boolean(appUrl && buildHandoffAppUrl(appUrl)), canOpenStore: Boolean(storeUrl),
            })
            if (action === 'app') openApp(true)
            else if (action === 'store') openStore(true)
            else if (action === 'browse') setPhase('browse')
            else { remember('returned'); recover() }
        }, 0)
        return () => { window.clearTimeout(timer); clearPending() }
        // Consume each document's resolved routing snapshot after bearer cleanup.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eligible, location.search, journey, storeUrl, appUrl, policy.requiresBrowser, handoffReturned])

    useEffect(() => {
        if (!eligible) return undefined
        const hidden = () => { leftPageRef.current = true; clearPending() }
        const returned = () => {
            if (!startedRef.current || currentRecord()?.phase === 'browse') return
            remember('returned')
            recover()
        }
        const visibility = () => {
            if (document.visibilityState === 'hidden') hidden()
            else if (leftPageRef.current) returned()
        }
        const pageshow = event => { if (event.persisted) returned() }
        window.addEventListener('pagehide', hidden)
        window.addEventListener('pageshow', pageshow)
        document.addEventListener('visibilitychange', visibility)
        return () => {
            clearPending()
            window.removeEventListener('pagehide', hidden)
            window.removeEventListener('pageshow', pageshow)
            document.removeEventListener('visibilitychange', visibility)
        }
        // Event handlers operate on the current document's journey, not UI phases.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eligible, journey])

    const copyLink = async () => {
        if (entry) return controller.copyInstallLink()
        try {
            await navigator.clipboard.writeText(window.location.origin + location.pathname)
            setCopied(true)
        } catch { setCopied(false) }
    }

    // No modal or confirmation step on the successful App/store path.
    // A normal-flow section appears only after return, interruption or failure.
    if (!eligible || phase !== 'recovery') return null
    return <section className="mobile-handoff-recovery" aria-labelledby="mobile-handoff-title">
        <h2 id="mobile-handoff-title">{traditional ? '繼續瀏覽汝塔' : '继续浏览汝塔'}</h2>
        <p role="status">{policy.requiresBrowser
            ? (traditional ? '如果此瀏覽器無法開啟商店，請複製連結，在 Safari 或 Chrome 中開啟。' : '如果此浏览器无法打开商店，请复制链接，在 Safari 或 Chrome 中打开。')
            : (traditional ? '您可以繼續瀏覽官網，需要時再嘗試開啟 App 或商店。' : '您可以继续浏览官网，需要时再尝试打开 App 或商店。')}</p>
        <div className="mobile-handoff-actions">
            {appUrl && <a href={buildHandoffAppUrl(appUrl, 'continue')} onClick={event => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                if (!openApp(false, true)) event.preventDefault()
            }}>{traditional ? '重試開啟 App' : '重试打开 App'}</a>}
            {storeUrl && <button onClick={() => openStore(false)}>{traditional ? `前往 ${storeName}` : `前往 ${storeName}`}</button>}
            {policy.requiresBrowser && <button onClick={copyLink}>
                {copied ? (traditional ? '已複製連結' : '已复制链接') : (traditional ? '複製連結' : '复制链接')}</button>}
            <button onClick={browse}>{traditional ? '收起提示，繼續瀏覽' : '收起提示，继续浏览'}</button>
        </div>
        {controller.announcement && <p role="status">{controller.announcement}</p>}
    </section>
}
