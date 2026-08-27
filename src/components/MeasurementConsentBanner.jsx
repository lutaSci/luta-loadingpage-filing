import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'

import { useLanguage } from '../contexts/LanguageContext.jsx'
import {
    MEASUREMENT_CONSENT_VALUES,
    readMeasurementConsent,
    subscribeMeasurementConsent,
    subscribeMeasurementConsentSettings,
    writeMeasurementConsent,
} from '../lib/measurementConsent.js'

const COPY = {
    zh: {
        title: '广告效果衡量',
        body: '允许 Meta 与 Google 衡量页面到达和下载点击。',
        compactTitle: '广告衡量',
        compactBody: 'Meta/Google：到达/下载点击',
        necessary: '仅必要',
        allow: '允许衡量',
        close: '关闭设置',
        privacy: '隐私政策',
    },
    zhTW: {
        title: '廣告成效衡量',
        body: '允許 Meta 與 Google 衡量頁面到達和下載點擊。',
        compactTitle: '廣告衡量',
        compactBody: 'Meta/Google：到達/下載點擊',
        necessary: '僅必要',
        allow: '允許衡量',
        close: '關閉設定',
        privacy: '隱私政策',
    },
    en: {
        title: 'Advertising measurement',
        body: 'Allow Meta and Google to measure page arrivals and download clicks.',
        compactTitle: 'Ad measurement',
        compactBody: 'Meta/Google: arrivals and download clicks',
        necessary: 'Necessary only',
        allow: 'Allow measurement',
        close: 'Close settings',
        privacy: 'Privacy policy',
    },
    ja: {
        title: '広告効果の測定',
        body: 'Meta と Google によるページ到達とダウンロードクリックの測定を許可します。',
        compactTitle: '広告測定',
        compactBody: 'Meta/Google：到達・ダウンロードクリック',
        necessary: '必要な機能のみ',
        allow: '測定を許可',
        close: '設定を閉じる',
        privacy: 'プライバシーポリシー',
    },
    ko: {
        title: '광고 성과 측정',
        body: 'Meta와 Google의 페이지 도착 및 다운로드 클릭 측정을 허용합니다.',
        compactTitle: '광고 측정',
        compactBody: 'Meta/Google: 도착 및 다운로드 클릭',
        necessary: '필수 기능만 사용',
        allow: '측정 허용',
        close: '설정 닫기',
        privacy: '개인정보처리방침',
    },
}

export default function MeasurementConsentBanner() {
    const { currentLanguage } = useLanguage()
    const copy = useMemo(() => COPY[currentLanguage] || COPY.zh, [currentLanguage])
    const [consent, setConsent] = useState(readMeasurementConsent)
    const [expanded, setExpanded] = useState(consent === MEASUREMENT_CONSENT_VALUES.unknown)
    const bannerRef = useRef(null)

    useEffect(() => subscribeMeasurementConsent(setConsent), [])
    useEffect(() => subscribeMeasurementConsentSettings(() => setExpanded(true)), [])
    useLayoutEffect(() => {
        const root = document.documentElement
        if (expanded) root.dataset.adMeasurementPrompt = 'visible'
        else {
            delete root.dataset.adMeasurementPrompt
            root.style.removeProperty('--ad-measurement-prompt-clearance')
        }
        return () => {
            delete root.dataset.adMeasurementPrompt
            root.style.removeProperty('--ad-measurement-prompt-clearance')
        }
    }, [expanded])
    useLayoutEffect(() => {
        if (!expanded) return undefined

        const root = document.documentElement
        const updateClearance = () => {
            const banner = bannerRef.current
            if (!banner) return
            const bannerTop = banner.getBoundingClientRect().top
            const clearance = Math.ceil(window.innerHeight - bannerTop + 8)
            root.style.setProperty('--ad-measurement-prompt-clearance', `${clearance}px`)
        }
        let frameId = null
        const scheduleUpdate = () => {
            if (frameId !== null) window.cancelAnimationFrame(frameId)
            frameId = window.requestAnimationFrame(() => {
                frameId = null
                updateClearance()
            })
        }
        const resizeObserver = typeof ResizeObserver === 'undefined'
            ? null
            : new ResizeObserver(scheduleUpdate)

        if (bannerRef.current) resizeObserver?.observe(bannerRef.current)
        window.addEventListener('resize', scheduleUpdate)
        window.visualViewport?.addEventListener('resize', scheduleUpdate)
        updateClearance()

        return () => {
            if (frameId !== null) window.cancelAnimationFrame(frameId)
            resizeObserver?.disconnect()
            window.removeEventListener('resize', scheduleUpdate)
            window.visualViewport?.removeEventListener('resize', scheduleUpdate)
            root.style.removeProperty('--ad-measurement-prompt-clearance')
        }
    }, [copy, expanded])

    const choose = nextValue => {
        const previous = consent
        setConsent(writeMeasurementConsent(nextValue))
        setExpanded(false)
        if (
            previous === MEASUREMENT_CONSENT_VALUES.granted
            && nextValue === MEASUREMENT_CONSENT_VALUES.denied
        ) window.location.reload()
    }

    if (!expanded) return null

    const canDismiss = consent !== MEASUREMENT_CONSENT_VALUES.unknown

    return (
        <section
            ref={bannerRef}
            aria-label={copy.title}
            className="fixed inset-x-2 z-[70] mx-auto max-w-[80rem] rounded-xl border border-slate-200 bg-white/98 px-2.5 py-1.5 text-slate-800 shadow-xl backdrop-blur-sm lg:inset-x-4 lg:rounded-2xl lg:px-4 lg:py-3"
            role="region"
            style={{ bottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
        >
            <div className="lg:flex lg:items-center lg:justify-between lg:gap-6">
                <div className={`flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0 lg:flex-nowrap lg:gap-3 lg:pr-0 ${canDismiss ? 'pr-7' : ''}`}>
                    <h2 className="shrink-0 text-xs font-bold leading-4 text-slate-900 lg:text-sm">
                        <span className="lg:hidden">{copy.compactTitle}</span>
                        <span className="hidden lg:inline">{copy.title}</span>
                    </h2>
                    <p className="min-w-0 text-[11px] leading-4 text-slate-600 lg:text-sm lg:leading-5">
                        <span className="lg:hidden">{copy.compactBody}</span>
                        <span className="hidden lg:inline">{copy.body}{' '}
                            <Link className="font-semibold text-emerald-700 underline underline-offset-2" to="/privacy">
                                {copy.privacy}
                            </Link>
                        </span>
                    </p>
                    <Link className="shrink-0 text-[11px] font-semibold leading-4 text-emerald-700 underline underline-offset-2 lg:hidden" to="/privacy">
                        {copy.privacy}
                    </Link>
                </div>
                {canDismiss && (
                    <button
                        type="button"
                        aria-label={copy.close}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                        onClick={() => setExpanded(false)}
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}
                <div className="mt-1 grid grid-cols-2 gap-2 lg:mt-0 lg:flex lg:shrink-0">
                    <button
                        type="button"
                        className="min-h-11 rounded-lg border border-slate-300 px-3 text-xs font-bold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 lg:min-w-28 lg:text-sm"
                        onClick={() => choose(MEASUREMENT_CONSENT_VALUES.denied)}
                    >
                        {copy.necessary}
                    </button>
                    <button
                        type="button"
                        className="min-h-11 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 lg:min-w-28 lg:text-sm"
                        onClick={() => choose(MEASUREMENT_CONSENT_VALUES.granted)}
                    >
                        {copy.allow}
                    </button>
                </div>
            </div>
        </section>
    )
}
