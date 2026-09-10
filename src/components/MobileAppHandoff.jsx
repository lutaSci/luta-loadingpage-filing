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
    buildHandoffAppUrl, canContinueToStore, readHandoff, resolveMobileHandoff,
    selectGlobalHandoffOption, WEBSITE_APP_OPEN_URL, writeHandoff,
} from '../lib/mobileAppHandoff.js'
import './MobileAppHandoff.css'

function storage() {
    try { return window.sessionStorage } catch { return null }
}

export default function MobileAppHandoff() {
    const location = useLocation()
    const { language } = useLanguage()
    const { controller, entry, handoffReturned } = useSmartLinkJourney()
    const [phase, setPhase] = useState(() => readHandoff(storage())?.phase === 'browse' ? 'browse' : 'ready')
    const [copied, setCopied] = useState(false)
    const dialogRef = useRef(null)
    const startedRef = useRef(false)
    const context = controller.installContext
    const market = entry ? context?.campaignTargetMarket : resolveRouteContext(detectIsMainlandChina()).market
    const policy = resolveMobileHandoff({
        enabled: config.mobileHandoff.enabled, pathname: location.pathname, market,
        userAgent: navigator.userAgent, hasEntry: Boolean(entry), loadStatus: controller.loadStatus,
    })
    const option = selectGlobalHandoffOption(context?.options, policy.platform)
    const journey = entry ? `${context?.linkId || ''}:${context?.clickId || ''}` : 'direct'
    const appUrl = entry?.mode === 'v2' ? controller.openAppUrl : WEBSITE_APP_OPEN_URL
    const storeUrl = entry ? option && (entry.mode === 'legacy'
        ? buildLegacyControlledOutUrl({ base: config.smartLink.legacyOutBase,
            legacySlug: entry.legacyEntry?.legacySlug, clickId: entry.legacyEntry?.clickId, optionId: option.optionId })
        : buildControlledOutUrl({ base: config.smartLink.outBase,
            state: entry.stateToken, linkId: context?.linkId, optionId: option.optionId }))
        : buildContinueUrl(policy.platform === 'ios' ? 'apple' : 'google', 'mobile_handoff')
            || (policy.platform === 'ios' ? config.downloads.appStoreGlobal : config.downloads.googlePlay)
    const eligible = policy.eligible && Boolean(storeUrl) && entry?.choice !== 'cn'
        && (!entry || Boolean(option)) && phase !== 'browse'
    const traditional = language === 'zhTW'
    const storeName = policy.platform === 'ios' ? 'App Store' : 'Google Play'

    const report = action => trackMobileHandoffEvent(action, {
        page_path: location.pathname, device_os: policy.platform, route_market: market,
        ...(entry ? { entry_type: 'shortlink', link_id: context?.linkId, click_id: context?.clickId,
            traffic_purpose: context?.trafficPurpose } : {}),
    })

    const browse = () => {
        writeHandoff(storage(), 'browse', journey)
        setPhase('browse')
        report('browse_clicked')
    }

    useEffect(() => {
        if (!eligible || hasSmartLinkBearer(location.search) || startedRef.current) return undefined
        const timer = window.setTimeout(() => {
            startedRef.current = true
            const record = readHandoff(storage())
            if (canContinueToStore({ record, returnedByResolver: handoffReturned, journey }) && storeUrl) {
                writeHandoff(storage(), 'store', journey)
                report('browser_fallback')
                window.location.assign(storeUrl)
                return
            }
            // No persistent storage means no safe way to bound a round trip.
            // Keep the one-click fallback instead of creating a redirect loop.
            if (record || handoffReturned || policy.requiresBrowser || entry?.mode === 'legacy') return
            const target = buildHandoffAppUrl(appUrl)
            if (!target || !writeHandoff(storage(), 'attempted', journey)) return
            report('automatic_attempt')
            setPhase('opening')
            window.location.assign(target)
        }, 0)
        return () => window.clearTimeout(timer)
        // The effect consumes the current routing snapshot once per document.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eligible, location.search, journey, storeUrl, appUrl, policy.requiresBrowser, entry?.mode, handoffReturned])

    useEffect(() => {
        if (!eligible) return undefined
        const dialog = dialogRef.current
        if (!dialog.open) dialog.showModal()
        return () => dialog.close()
    }, [eligible])

    useEffect(() => {
        const returned = () => {
            if (document.visibilityState !== 'visible' || !startedRef.current) return
            if (readHandoff(storage())?.phase === 'browse') return
            writeHandoff(storage(), 'attempted', journey)
            setPhase('ready')
        }
        window.addEventListener('pageshow', returned)
        document.addEventListener('visibilitychange', returned)
        // The timeout only restores controls. It never routes to a store.
        const timer = phase === 'opening' ? window.setTimeout(() => setPhase('ready'), 1800) : null
        return () => {
            window.removeEventListener('pageshow', returned)
            document.removeEventListener('visibilitychange', returned)
            window.clearTimeout(timer)
        }
    }, [phase, journey])

    if (!eligible) return null

    const continueToApp = () => {
        const target = buildHandoffAppUrl(appUrl, 'continue')
        // Without a usable app path or a durable one-shot receipt, Continue
        // uses the explicit store fallback instead of repeating a round trip.
        if (!target || !writeHandoff(storage(), 'continue_pending', journey)) {
            openStore()
            return
        }
        report('continue_clicked')
        setPhase('opening')
        window.location.assign(target)
    }
    const openStore = () => {
        if (!storeUrl) return
        writeHandoff(storage(), 'store', journey)
        report('store_clicked')
        window.location.assign(storeUrl)
    }
    const copyLink = async () => {
        if (entry) return controller.copyInstallLink()
        try {
            await navigator.clipboard.writeText(window.location.origin + location.pathname)
            setCopied(true)
        } catch { setCopied(false) }
    }

    return <dialog ref={dialogRef} className="mobile-handoff" aria-labelledby="mobile-handoff-title"
        onCancel={event => { event.preventDefault(); browse() }}>
        <div className="mobile-handoff-brand">汝塔</div>
        <h2 id="mobile-handoff-title">{phase === 'opening'
            ? (traditional ? '正在開啟汝塔…' : '正在打开汝塔…')
            : (traditional ? '在 App 中開始閱讀' : '在 App 中开始阅读')}</h2>
        <p aria-live="polite">{policy.requiresBrowser
            ? (traditional ? '請在 Safari 或 Chrome 中開啟此頁，繼續前往汝塔。' : '请在 Safari 或 Chrome 中打开此页，继续前往汝塔。')
            : (traditional ? `優先開啟汝塔；未能開啟時，前往 ${storeName} 下載。` : `优先打开汝塔；未能打开时，前往 ${storeName} 下载。`)}</p>
        <button className="mobile-handoff-primary" onClick={continueToApp}>
            {traditional ? '繼續前往汝塔' : '继续前往汝塔'}</button>
        <button onClick={openStore}>{traditional ? `前往 ${storeName} 下載` : `前往 ${storeName} 下载`}</button>
        {policy.requiresBrowser && <button onClick={copyLink}>
            {copied ? (traditional ? '已複製連結' : '已复制链接') : (traditional ? '複製連結' : '复制链接')}</button>}
        {policy.requiresBrowser && controller.announcement && <p role="status">{controller.announcement}</p>}
        <button className="mobile-handoff-browse" onClick={browse}>{traditional ? '繼續瀏覽官網' : '继续浏览官网'}</button>
        <nav aria-label={traditional ? '政策與協助' : '政策与帮助'}>
            <a href="/privacy">{traditional ? '隱私政策' : '隐私政策'}</a>
            <a href="/terms">{traditional ? '用戶協議' : '用户协议'}</a>
            <a href="/contact">{traditional ? '聯絡我們' : '联系我们'}</a>
        </nav>
    </dialog>
}
