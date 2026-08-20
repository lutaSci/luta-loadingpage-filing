import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useLanguage } from '../contexts/LanguageContext.jsx'
import {
    MEASUREMENT_CONSENT_VALUES,
    readMeasurementConsent,
    subscribeMeasurementConsent,
    writeMeasurementConsent,
} from '../lib/measurementConsent.js'

const COPY = {
    zh: {
        title: '广告效果衡量',
        body: '经你同意后，我们会加载 Meta Pixel，并让 Google 使用广告存储，以衡量页面到达和下载按钮点击。不会发送 Smart Link state、汝塔内部用户/点击 ID 或你输入的内容。',
        necessary: '仅使用必要功能',
        allow: '允许广告效果衡量',
        settings: '广告测量设置',
        close: '关闭设置',
        privacy: '查看隐私政策',
    },
    zhTW: {
        title: '廣告成效衡量',
        body: '經你同意後，我們會載入 Meta Pixel，並讓 Google 使用廣告儲存，以衡量頁面到達和下載按鈕點擊。不會傳送 Smart Link state、汝塔內部使用者/點擊 ID 或你輸入的內容。',
        necessary: '僅使用必要功能',
        allow: '允許廣告成效衡量',
        settings: '廣告衡量設定',
        close: '關閉設定',
        privacy: '查看隱私政策',
    },
    en: {
        title: 'Advertising measurement',
        body: 'With your permission, we load Meta Pixel and allow Google advertising storage to measure page arrivals and download-button clicks. We do not send Smart Link state, Luta internal user/click IDs, or content you enter.',
        necessary: 'Necessary only',
        allow: 'Allow measurement',
        settings: 'Ad measurement settings',
        close: 'Close settings',
        privacy: 'Read privacy policy',
    },
    ja: {
        title: '広告効果の測定',
        body: '同意後、Meta Pixel を読み込み、Google の広告ストレージを使用してページ到達とダウンロードボタンのクリックを測定します。Smart Link state、Luta 内部のユーザー／クリック ID、入力内容は送信しません。',
        necessary: '必要な機能のみ',
        allow: '測定を許可',
        settings: '広告測定設定',
        close: '設定を閉じる',
        privacy: 'プライバシーポリシー',
    },
    ko: {
        title: '광고 성과 측정',
        body: '동의하면 Meta Pixel을 로드하고 Google 광고 저장소를 사용하여 페이지 도착과 다운로드 버튼 클릭을 측정합니다. Smart Link state, Luta 내부 사용자/클릭 ID 또는 입력한 내용은 전송하지 않습니다.',
        necessary: '필수 기능만 사용',
        allow: '측정 허용',
        settings: '광고 측정 설정',
        close: '설정 닫기',
        privacy: '개인정보처리방침',
    },
}

export default function MeasurementConsentBanner() {
    const { currentLanguage } = useLanguage()
    const copy = useMemo(() => COPY[currentLanguage] || COPY.zh, [currentLanguage])
    const [consent, setConsent] = useState(readMeasurementConsent)
    const [expanded, setExpanded] = useState(consent === MEASUREMENT_CONSENT_VALUES.unknown)

    useEffect(() => subscribeMeasurementConsent(setConsent), [])

    const choose = nextValue => {
        const previous = consent
        setConsent(writeMeasurementConsent(nextValue))
        setExpanded(false)
        if (
            previous === MEASUREMENT_CONSENT_VALUES.granted
            && nextValue === MEASUREMENT_CONSENT_VALUES.denied
        ) window.location.reload()
    }

    if (!expanded) {
        return (
            <button
                type="button"
                className="fixed bottom-3 left-3 z-[70] rounded-full border border-slate-300 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                onClick={() => setExpanded(true)}
            >
                {copy.settings}
            </button>
        )
    }

    return (
        <section
            aria-label={copy.title}
            className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-2xl sm:p-5"
            role="dialog"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-bold">{copy.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{copy.body}</p>
                    <Link className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline underline-offset-4" to="/privacy">
                        {copy.privacy}
                    </Link>
                </div>
                {consent !== MEASUREMENT_CONSENT_VALUES.unknown && (
                    <button
                        type="button"
                        aria-label={copy.close}
                        className="rounded-lg px-2 py-1 text-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                        onClick={() => setExpanded(false)}
                    >
                        ×
                    </button>
                )}
            </div>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
                    onClick={() => choose(MEASUREMENT_CONSENT_VALUES.denied)}
                >
                    {copy.necessary}
                </button>
                <button
                    type="button"
                    className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                    onClick={() => choose(MEASUREMENT_CONSENT_VALUES.granted)}
                >
                    {copy.allow}
                </button>
            </div>
        </section>
    )
}
