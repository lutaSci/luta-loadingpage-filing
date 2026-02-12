import { motion, AnimatePresence } from 'framer-motion'
import { Apple, FileCheckCorner, Smartphone, Puzzle } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { config } from '../config'
import { memo, useState, useEffect, useMemo } from 'react'
import { detectDevice, detectIsMainlandChina } from '../lib/deviceDetection'
import QRCode from 'qrcode'

// 二维码悬浮组件
const QRCodePopover = memo(({ url, position }) => {
    const [qrDataUrl, setQrDataUrl] = useState('')

    useEffect(() => {
        if (url) {
            QRCode.toDataURL(url, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            }).then(setQrDataUrl).catch(console.error)
        }
    }, [url])

    if (!qrDataUrl) return null

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed z-50 pointer-events-none"
            style={{
                left: position.x,
                top: position.y - 180,
                transform: 'translateX(-50%)'
            }}
        >
            <div className="bg-white/15 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                <img
                    src={qrDataUrl}
                    alt="扫码下载"
                    className="w-40 h-40 mx-auto rounded-xl shadow-lg"
                />
            </div>
            {/* 小箭头指向按钮 */}
            <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-white/20"></div>
        </motion.div>
    )
})

QRCodePopover.displayName = 'QRCodePopover'

// ============================================
// 通用按钮样式组件
// ============================================

// 标准下载按钮（半透明毛玻璃风格）
const DownloadButton = memo(({ icon: Icon, label, onClick, onMouseEnter, onMouseLeave }) => (
    <motion.div
        className="group relative"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
    >
        <div className="relative w-[280px] sm:w-[260px] md:w-[280px] lg:w-[300px] cursor-pointer">
            <div className="flex items-center justify-center gap-2 md:gap-3 px-5 py-3 md:px-6 md:py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors duration-300 shadow-lg">
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-white/80 group-hover:scale-110 transition-transform drop-shadow-sm" />
                <span className="text-sm md:text-base lg:text-lg font-bold text-white/90 drop-shadow-sm">{label}</span>
            </div>
        </div>
    </motion.div>
))

DownloadButton.displayName = 'DownloadButton'

// 春节活动按钮（红金渐变，醒目风格）
const SpringFestivalButton = memo(({ label, onClick }) => (
    <motion.div
        className="group relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
    >
        <div className="relative w-[280px] sm:w-[260px] md:w-[280px] lg:w-[300px] cursor-pointer">
            <div className="flex items-center justify-center gap-2 md:gap-3 px-5 py-3 md:px-6 md:py-3 rounded-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 border border-amber-400/40 hover:from-red-500 hover:via-red-400 hover:to-amber-400 transition-all duration-300 shadow-lg shadow-red-500/25">
                <Puzzle className="w-5 h-5 md:w-6 md:h-6 text-amber-200 group-hover:scale-110 group-hover:rotate-12 transition-transform drop-shadow-sm" />
                <span className="text-sm md:text-base lg:text-lg font-bold text-white drop-shadow-sm">{label}</span>
            </div>
        </div>
    </motion.div>
))

SpringFestivalButton.displayName = 'SpringFestivalButton'

// ============================================
// 主组件
// ============================================
const DownloadButtons = memo(() => {
    const { t } = useLanguage()

    // 设备与地区检测（仅初始化一次）
    const device = useMemo(() => detectDevice(), [])
    const isMainlandChina = useMemo(() => detectIsMainlandChina(), [])

    // Android APK 下载链接（中国大陆用户使用）
    const [androidApkUrl, setAndroidApkUrl] = useState(config.downloads.android)

    useEffect(() => {
        if (!isMainlandChina) return // 非大陆用户不需要 APK 链接
        if (!config.apkApi) return

        fetch(config.apkApi)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
                return res.json()
            })
            .then((data) => {
                if (data.data) {
                    setAndroidApkUrl(data.data)
                }
            })
            .catch((error) => {
                console.error('请求安卓下载链接失败:', error)
            })
    }, [isMainlandChina])

    // 悬停状态管理（桌面端二维码）
    const [hoverState, setHoverState] = useState({
        ios: { isHovering: false, position: { x: 0, y: 0 } },
        android: { isHovering: false, position: { x: 0, y: 0 } }
    })

    // 响应式屏幕检测（用于二维码显示逻辑）
    const [isLargeScreen, setIsLargeScreen] = useState(false)

    useEffect(() => {
        const checkScreenSize = () => {
            setIsLargeScreen(window.innerWidth >= 1024)
        }
        checkScreenSize()
        window.addEventListener('resize', checkScreenSize)
        return () => window.removeEventListener('resize', checkScreenSize)
    }, [])

    // 处理按钮悬停（桌面端二维码）
    const handleButtonHover = (type, isEntering, event) => {
        if (isEntering && event) {
            const rect = event.currentTarget.getBoundingClientRect()
            const x = rect.left + rect.width / 2
            const y = rect.top
            setHoverState(prev => ({
                ...prev,
                [type]: { isHovering: true, position: { x, y } }
            }))
        } else {
            setHoverState(prev => ({
                ...prev,
                [type]: { isHovering: false, position: { x: 0, y: 0 } }
            }))
        }
    }

    // ============================================
    // 按钮点击处理函数
    // ============================================

    // 春节活动 - 拼图送祝福
    const handlePuzzleClick = () => {
        window.open(config.springFestival.puzzleUrl, '_blank')
    }

    // iOS App Store
    const handleIOSClick = (e) => {
        if (device.isDesktop && isLargeScreen) {
            // 桌面端大屏：不跳转，通过悬停显示二维码
            e.preventDefault()
        } else {
            // 移动端：直接跳转
            window.open(config.downloads.ios, '_blank')
        }
    }

    // Android / 鸿蒙 - 中国大陆（APK 直接下载）
    const handleAndroidChinaClick = (e) => {
        if (device.isDesktop && isLargeScreen) {
            e.preventDefault()
        } else {
            window.open(androidApkUrl, '_blank')
        }
    }

    // Android / 鸿蒙 - 海外（Google Play Store 链接）
    const handleGooglePlayClick = () => {
        // 无论移动端还是桌面端，都直接打开 Google Play 链接
        window.open(config.downloads.googlePlay, '_blank')
    }

    // Install Docs - 所有设备直接打开链接
    const handleInstallDocClick = () => {
        window.open(config.downloads.installDoc, '_blank')
    }

    // ============================================
    // 渲染按钮列表
    // ============================================
    const renderButtons = () => {
        const buttons = []

        // 1. 春节活动按钮 - 所有用户可见，排在第一个
        buttons.push(
            <SpringFestivalButton
                key="puzzle"
                label={t('puzzleBlessing')}
                onClick={handlePuzzleClick}
            />
        )

        if (device.isIOS) {
            // ====== iOS 设备 ======
            // [App Store] [Install Docs]
            buttons.push(
                <DownloadButton
                    key="ios"
                    icon={Apple}
                    label={t('appStore')}
                    onClick={handleIOSClick}
                />
            )
        } else if (device.isAndroid || device.isHarmonyOS) {
            // ====== Android / 鸿蒙 ======
            if (isMainlandChina) {
                // 中国大陆：APK 下载
                buttons.push(
                    <DownloadButton
                        key="android-china"
                        icon={Smartphone}
                        label={t('downloadApk')}
                        onClick={handleAndroidChinaClick}
                        onMouseEnter={(e) => {
                            if (isLargeScreen) handleButtonHover('android', true, e)
                        }}
                        onMouseLeave={() => {
                            if (isLargeScreen) handleButtonHover('android', false)
                        }}
                    />
                )
            } else {
                // 海外：Google Play
                buttons.push(
                    <DownloadButton
                        key="google-play"
                        icon={Smartphone}
                        label={t('googlePlay')}
                        onClick={handleGooglePlayClick}
                    />
                )
            }
        } else {
            // ====== 桌面端 ======
            // 显示 App Store + Android 按钮
            buttons.push(
                <DownloadButton
                    key="ios-desktop"
                    icon={Apple}
                    label={t('appStore')}
                    onClick={handleIOSClick}
                    onMouseEnter={(e) => {
                        if (isLargeScreen) handleButtonHover('ios', true, e)
                    }}
                    onMouseLeave={() => {
                        if (isLargeScreen) handleButtonHover('ios', false)
                    }}
                />
            )

            if (isMainlandChina) {
                // 桌面端 + 中国大陆：APK 下载（悬停二维码）
                buttons.push(
                    <DownloadButton
                        key="android-desktop-china"
                        icon={Smartphone}
                        label={t('downloadApk')}
                        onClick={handleAndroidChinaClick}
                        onMouseEnter={(e) => {
                            if (isLargeScreen) handleButtonHover('android', true, e)
                        }}
                        onMouseLeave={() => {
                            if (isLargeScreen) handleButtonHover('android', false)
                        }}
                    />
                )
            } else {
                // 桌面端 + 海外：Google Play（直接链接跳转）
                buttons.push(
                    <DownloadButton
                        key="google-play-desktop"
                        icon={Smartphone}
                        label={t('googlePlay')}
                        onClick={handleGooglePlayClick}
                    />
                )
            }
        }

        // Install Docs - 所有用户都显示，所有设备直接打开链接
        buttons.push(
            <DownloadButton
                key="install-doc"
                icon={FileCheckCorner}
                label={t('installDoc')}
                onClick={handleInstallDocClick}
            />
        )

        return buttons
    }

    return (
        <motion.div
            className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 justify-center items-center px-4 max-w-4xl mx-auto relative z-30 mb-24 md:mb-28"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
        >
            {renderButtons()}

            {/* 桌面端二维码悬浮显示 */}
            <AnimatePresence>
                {isLargeScreen && hoverState.ios.isHovering && (
                    <QRCodePopover
                        key="ios-qr"
                        url={config.downloads.ios}
                        position={hoverState.ios.position}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isLargeScreen && hoverState.android.isHovering && (
                    <QRCodePopover
                        key="android-qr"
                        url={androidApkUrl}
                        position={hoverState.android.position}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    )
})

DownloadButtons.displayName = 'DownloadButtons'

export default DownloadButtons
