import { motion, AnimatePresence } from 'framer-motion'
import { Apple, Download, ExternalLink, ExternalLinkIcon, HelpCircle, Info, Smartphone } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { config } from '../config'
import { Colors } from '../design/colors'
import { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { detectDevice, detectIsMainlandChina, detectIsWeChat } from '../lib/deviceDetection'
import WeChatMask from './WeChatMask'

const SILK_COLOR = `rgb(${Colors.background.silk.join(',')})` // rgb(52,152,118)
const SILK_COLOR_HOVER = `rgb(${Colors.background.silk.map(c => Math.min(255, Math.round(c * 1.15))).join(',')})`
const SILK_COLOR_ACTIVE = `rgb(${Colors.background.silk.map(c => Math.round(c * 0.85)).join(',')})`

// ============================================
// 分步引导卡片
// ============================================
const StepCard = memo(({ stepLabel, title, description, ctaText, ctaIcon: CtaIcon, onClick, delay = 0 }) => (
    <motion.div
        className="w-full max-w-sm mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    >
        <div className="bg-white/8 backdrop-blur-md rounded-2xl border border-white/15 overflow-hidden">
            {stepLabel && (
                <div className="px-5 pt-4 pb-1">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: SILK_COLOR }}>
                        {stepLabel}
                    </span>
                </div>
            )}
            <div className="px-5 pt-2 pb-3">
                <h3 className="text-base font-bold text-white/95 mb-1">{title}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{description}</p>
            </div>
            <div className="px-5 pb-5">
                <motion.button
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all duration-200 shadow-lg"
                    style={{
                        backgroundColor: SILK_COLOR,
                        boxShadow: `0 4px 14px rgba(${Colors.background.silk.join(',')}, 0.35)`,
                    }}
                    whileHover={{ scale: 1.02, backgroundColor: SILK_COLOR_HOVER }}
                    whileTap={{ scale: 0.97, backgroundColor: SILK_COLOR_ACTIVE }}
                    onClick={onClick}
                >
                    {CtaIcon && <CtaIcon className="w-4 h-4" />}
                    <span>{ctaText}</span>
                </motion.button>
            </div>
        </div>
    </motion.div>
))
StepCard.displayName = 'StepCard'

// ============================================
// 底部辅助链接按钮
// ============================================
const HelpLinkButton = memo(({ label, onClick, delay = 0 }) => (
    <motion.button
        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-200 text-white/60 hover:text-white/80 text-sm"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
    >
        <HelpCircle className="w-3.5 h-3.5" />
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
            onClick={() => onTabChange('ios')}
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
            onClick={() => onTabChange('android')}
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

    // 测量当前内容高度，保留最大值
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
                            <IOSGuide t={t} />
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
                                ? <AndroidGuideChina t={t} apkUrl={androidApkUrl} />
                                : <AndroidGuideOverseas t={t} />
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
// iOS 引导内容
// ============================================
const IOSTip = memo(({ text, delay = 0 }) => (
    <motion.div
        className="w-full max-w-sm mx-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-400/20 backdrop-blur-sm">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">{text}</p>
        </div>
    </motion.div>
))
IOSTip.displayName = 'IOSTip'

const IOSGuide = memo(({ t }) => (
    <div className="space-y-3">
        <StepCard
            title={t('iosStep1Title')}
            description={t('iosStep1Desc')}
            ctaText={t('iosStep1Cta')}
            ctaIcon={Apple}
            onClick={() => window.open(config.downloads.testFlightAppStore, '_blank')}
            delay={0.1}
        />
        <IOSTip text={t('iosTip')} delay={0.15} />
        <StepCard
            title={t('iosStep2Title')}
            description={t('iosStep2Desc')}
            ctaText={t('iosStep2Cta')}
            ctaIcon={Download}
            onClick={() => { window.location.href = config.downloads.iosTestFlight }}
            delay={0.2}
        />
    </div>
))
IOSGuide.displayName = 'IOSGuide'

// ============================================
// Android 引导内容（国内，非微信）
// ============================================
const AndroidGuideChina = memo(({ t, apkUrl }) => (
    <div className="space-y-3">
        <StepCard
            title={t('androidStep1Title')}
            description={t('androidStep1Desc')}
            ctaText={t('androidStep1Cta')}
            ctaIcon={Download}
            onClick={() => window.open(apkUrl, '_blank')}
            delay={0.1}
        />
    </div>
))
AndroidGuideChina.displayName = 'AndroidGuideChina'

// ============================================
// 微信环境统一引导（所有设备）
// ============================================
const WeChatGuide = memo(({ t, onShowMask }) => (
    <div className="space-y-3">
        <StepCard
            title={t('wechatGuideTitle')}
            description={t('wechatGuideDesc')}
            ctaText={t('wechatGuideCta')}
            ctaIcon={ExternalLinkIcon}
            onClick={onShowMask}
            delay={0.1}
        />
    </div>
))
WeChatGuide.displayName = 'WeChatGuide'

// ============================================
// Android 引导内容（海外 - Google Play）
// ============================================
const AndroidGuideOverseas = memo(({ t }) => (
    <div className="space-y-3">
        <StepCard
            title={t('androidStep1Title')}
            description={t('androidStep1Desc')}
            ctaText={t('androidStep1CtaGooglePlay')}
            ctaIcon={ExternalLink}
            onClick={() => window.open(config.downloads.googlePlay, '_blank')}
            delay={0.1}
        />
    </div>
))
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
    const [showWeChatMask, setShowWeChatMask] = useState(isWeChat)

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
        window.open(config.downloads.installDoc, '_blank')
    }, [])

    const handleShowMask = useCallback(() => {
        setShowWeChatMask(true)
    }, [])

    const renderContent = () => {
        // 微信环境：所有设备统一引导去浏览器打开
        if (isWeChat) {
            return <WeChatGuide t={t} onShowMask={handleShowMask} />
        }

        // 非微信 - 移动端 iOS
        if (device.isIOS) {
            return <IOSGuide t={t} />
        }

        // 非微信 - 移动端 Android / 鸿蒙
        if (device.isAndroid || device.isHarmonyOS) {
            if (isMainlandChina) {
                return <AndroidGuideChina t={t} apkUrl={androidApkUrl} />
            }
            return <AndroidGuideOverseas t={t} />
        }

        // 非微信 - PC 端：标签切换
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
