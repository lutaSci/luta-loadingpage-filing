import { motion, AnimatePresence } from 'framer-motion'
import { Apple, Download, ExternalLink, ExternalLinkIcon, HelpCircle, AlertTriangle, CheckCircle2, XCircle, Smartphone, FlaskConical, ChevronDown, Mail } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { config } from '../config'
import { Colors } from '../design/colors'
import { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { detectDevice, detectIsMainlandChina, detectIsWeChat } from '../lib/deviceDetection'
import { trackEvent } from '../lib/analytics'
import { buildContinueUrl, getAttributionState } from '../lib/attributionState'
import WeChatMask from './WeChatMask'

const SILK_COLOR = `rgb(${Colors.background.silk.join(',')})` // rgb(52,152,118)
const SILK_COLOR_HOVER = `rgb(${Colors.background.silk.map(c => Math.min(255, Math.round(c * 1.15))).join(',')})`
const SILK_COLOR_ACTIVE = `rgb(${Colors.background.silk.map(c => Math.round(c * 0.85)).join(',')})`

// ============================================
// 分步引导卡片
// ============================================
const StepCard = memo(({ title, description, ctaText, ctaIcon: CtaIcon, onClick, note, delay = 0, disabled = false }) => (
    <motion.div
        className="w-full max-w-sm mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    >
        <div className="bg-white/8 backdrop-blur-md rounded-2xl border border-white/15 overflow-hidden">
            <div className="px-5 pt-5 pb-3">
                <h3 className="text-lg font-bold text-white/95 mb-1.5">{title}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{description}</p>
            </div>
            <div className="px-5 pb-5">
                <motion.button
                    className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-white font-bold text-base transition-all duration-200 shadow-lg ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
                    style={{
                        backgroundColor: disabled ? 'rgba(255,255,255,0.16)' : SILK_COLOR,
                        boxShadow: disabled ? 'none' : `0 4px 14px rgba(${Colors.background.silk.join(',')}, 0.35)`,
                    }}
                    whileHover={disabled ? undefined : { scale: 1.02, backgroundColor: SILK_COLOR_HOVER }}
                    whileTap={disabled ? undefined : { scale: 0.97, backgroundColor: SILK_COLOR_ACTIVE }}
                    onClick={onClick}
                    disabled={disabled}
                >
                    {CtaIcon && <CtaIcon className="w-5 h-5" />}
                    <span>{ctaText}</span>
                </motion.button>
            </div>
            {note && (
                <div className="px-5 pb-5">
                    <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-400/20">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-200/90 leading-relaxed">{note}</p>
                    </div>
                </div>
            )}
        </div>
    </motion.div>
))
StepCard.displayName = 'StepCard'

// ============================================
// TestFlight 确认弹层
// ============================================
const TestFlightConfirmOverlay = memo(({ visible, t, onConfirm, onClose }) => {
    return createPortal(
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative w-full max-w-sm mx-4 mb-6 sm:mb-0"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/15 p-6 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-4 text-center">
                                {t('iosTestFlightConfirmTitle')}
                            </h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                    <span className="text-base text-emerald-200 font-medium">
                                        {t('iosTestFlightConfirmDo1')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                    <span className="text-base text-emerald-200 font-medium">
                                        {t('iosTestFlightConfirmDo2')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-400/20">
                                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <span className="text-base text-red-200 font-medium">
                                        {t('iosTestFlightConfirmDont')}
                                    </span>
                                </div>
                            </div>

                            <motion.button
                                className="w-full flex items-center justify-center gap-2.5 px-5 py-4 rounded-xl text-white font-bold text-base shadow-lg"
                                style={{
                                    backgroundColor: SILK_COLOR,
                                    boxShadow: `0 4px 14px rgba(${Colors.background.silk.join(',')}, 0.35)`,
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={onConfirm}
                            >
                                <Apple className="w-5 h-5" />
                                <span>{t('iosTestFlightConfirmBtn')}</span>
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
})
TestFlightConfirmOverlay.displayName = 'TestFlightConfirmOverlay'

// ============================================
// 底部辅助链接按钮
// ============================================
const HelpLinkButton = memo(({ label, onClick, delay = 0 }) => (
    <motion.button
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-200 text-white/60 hover:text-white/80 text-sm"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
    >
        <HelpCircle className="w-4 h-4" />
        <span>{label}</span>
    </motion.button>
))
HelpLinkButton.displayName = 'HelpLinkButton'

// ============================================
// PC 端标签切换
// ============================================
const PcTabSwitcher = memo(({ activeTab, onTabChange, iosLabel, androidLabel }) => (
    <motion.div
        className="flex items-center justify-center gap-1 p-1 rounded-full bg-white/8 backdrop-blur-sm border border-white/10 mb-6 max-w-xs mx-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
    >
        <button
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'ios'
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/50 hover:text-white/70'
            }`}
            onClick={() => {
                onTabChange('ios')
                trackEvent('pc_tab_switch', { tab: 'ios' })
            }}
        >
            <Apple className="w-3.5 h-3.5" />
            {iosLabel}
        </button>
        <button
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'android'
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/50 hover:text-white/70'
            }`}
            onClick={() => {
                onTabChange('android')
                trackEvent('pc_tab_switch', { tab: 'android' })
            }}
        >
            <Smartphone className="w-3.5 h-3.5" />
            {androidLabel}
        </button>
    </motion.div>
))
PcTabSwitcher.displayName = 'PcTabSwitcher'

// ============================================
// PC 端标签内容切换（固定高度容器，防止布局抖动）
// ============================================
const PcTabContent = memo(({ pcTab, onPcTabChange, t, isMainlandChina, androidApkUrl }) => {
    const containerRef = useRef(null)
    const [containerHeight, setContainerHeight] = useState(0)

    useEffect(() => {
        if (!containerRef.current) return
        const measure = () => {
            const h = containerRef.current.scrollHeight
            setContainerHeight(prev => Math.max(prev, h))
        }
        measure()
        const timer = setTimeout(measure, 100)
        return () => clearTimeout(timer)
    }, [pcTab])

    return (
        <div>
            <PcTabSwitcher
                activeTab={pcTab}
                onTabChange={onPcTabChange}
                iosLabel={t('pcTabIos')}
                androidLabel={t('pcTabAndroid')}
            />
            <div
                ref={containerRef}
                style={{ minHeight: containerHeight || undefined }}
                className="transition-[min-height] duration-300"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {pcTab === 'ios' ? (
                        <motion.div
                            key="ios"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {isMainlandChina
                                ? <IOSGuide t={t} placement="desktop_ios_tab" />
                                : <IOSWaitlistGuide t={t} placement="desktop_ios_tab" />
                            }
                        </motion.div>
                    ) : (
                        <motion.div
                            key="android"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {isMainlandChina
                                ? <AndroidGuideChina t={t} apkUrl={androidApkUrl} placement="desktop_android_tab" />
                                : <AndroidGuideOverseas t={t} placement="desktop_android_tab" />
                            }
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
})
PcTabContent.displayName = 'PcTabContent'

// ============================================
// 海外 iOS 开放通知
// ============================================
const IOSWaitlistGuide = memo(({ t, placement }) => {
    const waitlistUrl = config.downloads.iosOverseasWaitlistFormUrl?.trim()
    const hasWaitlistUrl = Boolean(waitlistUrl)

    useEffect(() => {
        trackEvent('ios_waitlist_impression', { placement })
    }, [placement])

    const handleWaitlistClick = useCallback(() => {
        if (!waitlistUrl) return
        const attrs = getAttributionState()
        trackEvent('ios_waitlist_click', {
            placement,
            click_id: attrs?.click_id,
            utm_campaign: attrs?.utm_campaign,
            content_id: attrs?.content_id,
        })
        const url = buildContinueUrl('waitlist', placement) || waitlistUrl
        window.open(url, '_blank', 'noopener,noreferrer')
    }, [placement, waitlistUrl])

    return (
        <div className="space-y-3">
            <StepCard
                title={t('iosWaitlistTitle')}
                description={t('iosWaitlistDesc')}
                ctaText={hasWaitlistUrl ? t('iosWaitlistCta') : t('iosWaitlistUnavailableCta')}
                ctaIcon={Mail}
                onClick={handleWaitlistClick}
                note={t('iosWaitlistNote')}
                delay={0.1}
                disabled={!hasWaitlistUrl}
            />
        </div>
    )
})
IOSWaitlistGuide.displayName = 'IOSWaitlistGuide'

// ============================================
// iOS 引导 — App Store 主按钮 + 可展开的 TestFlight 内测流程
// ============================================
const IOSGuide = memo(({ t, placement = 'mobile_ios' }) => {
    const [showBeta, setShowBeta] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const handleAppStoreClick = useCallback(() => {
        const attrs = getAttributionState()
        trackEvent('ios_appstore_click', {
            click_id: attrs?.click_id,
            utm_campaign: attrs?.utm_campaign,
            content_id: attrs?.content_id,
        })
        const url = buildContinueUrl('apple', placement) || config.downloads.appStore
        window.open(url, '_blank')
    }, [placement])

    const handleBetaToggle = useCallback(() => {
        setShowBeta(prev => {
            const next = !prev
            trackEvent('ios_beta_toggle', { expanded: next })
            return next
        })
    }, [])

    const handleBetaStep1Click = useCallback(() => {
        trackEvent('ios_beta_step1_click')
        setShowConfirm(true)
    }, [])

    const handleBetaStep1Confirm = useCallback(() => {
        trackEvent('ios_beta_step1_confirm')
        setShowConfirm(false)
        window.open(config.downloads.testFlightAppStore, '_blank')
    }, [])

    const handleBetaStep2Click = useCallback(() => {
        trackEvent('ios_beta_step2_click')
        window.location.href = config.downloads.iosTestFlight
    }, [])

    return (
        <>
            <div className="space-y-3">
                <StepCard
                    title={t('iosAppStoreTitle')}
                    description={t('iosAppStoreDesc')}
                    ctaText={t('iosAppStoreCta')}
                    ctaIcon={Apple}
                    onClick={handleAppStoreClick}
                    delay={0.1}
                />

                <motion.button
                    className="flex items-center justify-center gap-2 mx-auto px-3.5 py-2 rounded-full bg-white/6 border border-white/10 text-sm sm:text-base font-semibold text-white/65 hover:bg-white/10 hover:text-white/90 transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBetaToggle}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                >
                    <FlaskConical className="w-4 h-4" />
                    <span>{t('iosTestFlightLabel')}</span>
                    <motion.span
                        animate={{ rotate: showBeta ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.span>
                </motion.button>

                <AnimatePresence>
                    {showBeta && (
                        <motion.div
                            className="space-y-3"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            style={{ overflow: 'hidden' }}
                        >
                            <StepCard
                                title={t('iosTestFlightStep1Title')}
                                description={t('iosTestFlightStep1Desc')}
                                ctaText={t('iosTestFlightStep1Cta')}
                                ctaIcon={Apple}
                                onClick={handleBetaStep1Click}
                                note={t('iosTestFlightStep1Note')}
                                delay={0}
                            />
                            <StepCard
                                title={t('iosTestFlightStep2Title')}
                                description={t('iosTestFlightStep2Desc')}
                                ctaText={t('iosTestFlightStep2Cta')}
                                ctaIcon={Download}
                                onClick={handleBetaStep2Click}
                                note={t('iosTestFlightStep2Note')}
                                delay={0}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <TestFlightConfirmOverlay
                visible={showConfirm}
                t={t}
                onConfirm={handleBetaStep1Confirm}
                onClose={() => setShowConfirm(false)}
            />
        </>
    )
})
IOSGuide.displayName = 'IOSGuide'

// ============================================
// Android 引导内容（国内，非微信）
// ============================================
const AndroidGuideChina = memo(({ t, apkUrl, placement = 'mobile_android_china' }) => {
    const handleClick = useCallback(() => {
        const attrs = getAttributionState()
        trackEvent('android_download_click', {
            source: 'apk',
            click_id: attrs?.click_id,
            utm_campaign: attrs?.utm_campaign,
            content_id: attrs?.content_id,
        })
        const url = buildContinueUrl('apk', placement) || apkUrl
        window.open(url, '_blank')
    }, [apkUrl, placement])

    return (
        <div className="space-y-3">
            <StepCard
                title={t('androidStep1Title')}
                description={t('androidStep1Desc')}
                ctaText={t('androidStep1Cta')}
                ctaIcon={Download}
                onClick={handleClick}
                delay={0.1}
            />
        </div>
    )
})
AndroidGuideChina.displayName = 'AndroidGuideChina'

// ============================================
// 微信环境引导（仅 Android/鸿蒙 —— iOS 在微信中可直接跳 App Store）
// ============================================
const WeChatGuide = memo(({ t, onShowMask }) => (
    <div className="space-y-3">
        <StepCard
            title={t('wechatGuideTitle')}
            description={t('wechatGuideDesc')}
            ctaText={t('wechatGuideCta')}
            ctaIcon={ExternalLinkIcon}
            onClick={() => {
                trackEvent('wechat_guide_click')
                onShowMask()
            }}
            delay={0.1}
        />
    </div>
))
WeChatGuide.displayName = 'WeChatGuide'

// ============================================
// Android 引导内容（海外 - Google Play）
// ============================================
const AndroidGuideOverseas = memo(({ t, placement = 'mobile_android_overseas' }) => {
    const handleClick = useCallback(() => {
        const attrs = getAttributionState()
        trackEvent('android_download_click', {
            source: 'google_play',
            click_id: attrs?.click_id,
            utm_campaign: attrs?.utm_campaign,
            content_id: attrs?.content_id,
        })
        const url = buildContinueUrl('google', placement) || config.downloads.googlePlay
        window.open(url, '_blank')
    }, [placement])

    return (
        <div className="space-y-3">
            <StepCard
                title={t('androidStep1Title')}
                description={t('androidStep1Desc')}
                ctaText={t('androidStep1CtaGooglePlay')}
                ctaIcon={ExternalLink}
                onClick={handleClick}
                delay={0.1}
            />
        </div>
    )
})
AndroidGuideOverseas.displayName = 'AndroidGuideOverseas'

// ============================================
// 主组件
// ============================================
const DownloadButtons = memo(({ pcTab = 'ios', onPcTabChange }) => {
    const { t } = useLanguage()

    const device = useMemo(() => detectDevice(), [])
    const isMainlandChina = useMemo(() => detectIsMainlandChina(), [])
    const isWeChat = useMemo(() => detectIsWeChat(), [])

    const [androidApkUrl, setAndroidApkUrl] = useState(config.downloads.android)
    const needWeChatMask = isWeChat && !device.isIOS
    const [showWeChatMask, setShowWeChatMask] = useState(needWeChatMask)

    useEffect(() => {
        if (!isMainlandChina || !config.apkApi) return
        fetch(config.apkApi)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            })
            .then(data => { if (data.data) setAndroidApkUrl(data.data) })
            .catch(err => console.error('APK URL fetch failed:', err))
    }, [isMainlandChina])

    const handleInstallDocClick = useCallback(() => {
        trackEvent('install_doc_click')
        window.open(config.downloads.installDoc, '_blank')
    }, [])

    const handleShowMask = useCallback(() => {
        setShowWeChatMask(true)
    }, [])

    const renderContent = () => {
        if (device.isIOS) {
            if (!isMainlandChina) {
                return <IOSWaitlistGuide t={t} placement="mobile_ios" />
            }
            return <IOSGuide t={t} placement="mobile_ios" />
        }

        if (isWeChat && (device.isAndroid || device.isHarmonyOS)) {
            return <WeChatGuide t={t} onShowMask={handleShowMask} />
        }

        if (device.isAndroid || device.isHarmonyOS) {
            if (isMainlandChina) {
                return <AndroidGuideChina t={t} apkUrl={androidApkUrl} placement="mobile_android_china" />
            }
            return <AndroidGuideOverseas t={t} placement="mobile_android_overseas" />
        }

        return <PcTabContent
            pcTab={pcTab}
            onPcTabChange={onPcTabChange}
            t={t}
            isMainlandChina={isMainlandChina}
            androidApkUrl={androidApkUrl}
        />
    }

    return (
        <>
            <motion.div
                className="flex flex-col items-center px-4 max-w-lg mx-auto relative z-30 mb-24 md:mb-28"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
            >
                {renderContent()}

                <div className="mt-4">
                    <HelpLinkButton
                        label={t('needHelp')}
                        onClick={handleInstallDocClick}
                        delay={0.5}
                    />
                </div>
            </motion.div>

            <WeChatMask
                visible={showWeChatMask}
                onClose={() => setShowWeChatMask(false)}
            />
        </>
    )
})

DownloadButtons.displayName = 'DownloadButtons'

export default DownloadButtons
