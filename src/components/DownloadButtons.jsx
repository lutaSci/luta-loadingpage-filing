import { motion, AnimatePresence } from 'framer-motion'
import { Apple, Smartphone, QrCode, X, Download as DownloadIcon } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { config } from '../config'
import { memo, useState, useEffect } from 'react'
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

const DownloadButtons = memo(() => {
    const { t } = useLanguage()

    const [androidUrl, setAndroidUrl] = useState(config.downloads.android);

    useEffect(() => {
        console.log('开始请求安卓下载链接...', config.apkApi);
        fetch(config.apkApi)
            .then((res) => {
                console.log('请求响应状态:', res.status, res.statusText);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                console.log('接收到的完整数据:', data);
                if (data.data) {
                    console.log('设置新的安卓下载链接:', data.data);
                    setAndroidUrl(data.data);
                } else {
                    console.warn('API返回的数据中没有data字段，使用默认链接');
                    console.log('可用的字段:', Object.keys(data));
                }
            })
            .catch((error) => {
                console.error('请求安卓下载链接失败:', error);
                console.log('继续使用默认链接:', config.downloads.android);
            });
    }, []);

    // 悬停状态管理
    const [hoverState, setHoverState] = useState({
        ios: { isHovering: false, position: { x: 0, y: 0 } },
        android: { isHovering: false, position: { x: 0, y: 0 } }
    })

    // 响应式屏幕检测
    const [isDesktop, setIsDesktop] = useState(false)
    const [isWecomOpen, setIsWecomOpen] = useState(false)

    useEffect(() => {
        const checkScreenSize = () => {
            setIsDesktop(window.innerWidth >= 1024)
        }

        // 初始检查
        checkScreenSize()

        // 监听窗口大小变化
        window.addEventListener('resize', checkScreenSize)

        return () => {
            window.removeEventListener('resize', checkScreenSize)
        }
    }, [])

    // ESC 关闭模态
    useEffect(() => {
        const onKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal()
            }
        }
        if (isWecomOpen) {
            document.addEventListener('keydown', onKeydown)
        }
        return () => document.removeEventListener('keydown', onKeydown)
    }, [isWecomOpen])

    // 处理按钮悬停
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

    // 关闭模态框函数
    const closeModal = () => {
        console.log('关闭模态框被调用')
        setIsWecomOpen(false)
    }

    return (
        <motion.div
            className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-4 max-w-4xl mx-auto relative z-30 mb-24 md:mb-28"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
        >
            {/* iOS 下载按钮 - 移动端优化尺寸 */}
            <motion.div
                className="group relative"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={(e) => {
                    if (isDesktop) {
                        handleButtonHover('ios', true, e)
                    }
                }}
                onMouseLeave={() => {
                    if (isDesktop) {
                        handleButtonHover('ios', false)
                    }
                }}
                onClick={(e) => {
                    if (!isDesktop) {
                        // 移动端直接跳转
                        window.open(config.downloads.ios, '_blank')
                    } else {
                        // 桌面端阻止默认跳转，显示二维码
                        e.preventDefault()
                    }
                }}
            >
                <div className="relative w-[280px] sm:w-[260px] md:w-[280px] lg:w-[300px] cursor-pointer">
                    <div className="flex items-center justify-center gap-2 md:gap-3 px-5 py-3 md:px-6 md:py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors duration-300 shadow-lg">
                        <Apple className="w-5 h-5 md:w-6 md:h-6 text-white/80 group-hover:scale-110 transition-transform drop-shadow-sm" />
                        <span className="text-sm md:text-base lg:text-lg font-bold text-white/90 drop-shadow-sm">{t('appStore')}</span>
                    </div>
                </div>
            </motion.div>

            {/* Android 下载按钮 - 移动端优化尺寸 */}
            <motion.div
                className="group relative"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={(e) => {
                    if (isDesktop) {
                        handleButtonHover('android', true, e)
                    }
                }}
                onMouseLeave={() => {
                    if (isDesktop) {
                        handleButtonHover('android', false)
                    }
                }}
                onClick={(e) => {
                    if (!isDesktop) {
                        // 移动端直接跳转，使用动态获取的链接
                        window.open(androidUrl, '_blank')
                    } else {
                        // 桌面端阻止默认跳转，显示二维码
                        e.preventDefault()
                    }
                }}
            >
                <div className="relative w-[280px] sm:w-[260px] md:w-[280px] lg:w-[300px] cursor-pointer">
                    <div className="flex items-center justify-center gap-2 md:gap-3 px-5 py-3 md:px-6 md:py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors duration-300 shadow-lg">
                        <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-white/80 group-hover:scale-110 transition-transform drop-shadow-sm" />
                        <span className="text-sm md:text-base lg:text-lg font-bold text-white/90 drop-shadow-sm">{t('googlePlay')}</span>
                    </div>
                </div>
            </motion.div>

            {/* WeCom 入群按钮 - 与下载按钮一致风格 */}
            <motion.div
                className="group relative"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsWecomOpen(true)}
            >
                <div className="relative w-[280px] sm:w-[260px] md:w-[280px] lg:w-[300px] cursor-pointer">
                    <div className="flex items-center justify-center gap-2 md:gap-3 px-5 py-3 md:px-6 md:py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors duration-300 shadow-lg">
                        <QrCode className="w-5 h-5 md:w-6 md:h-6 text-white/80 group-hover:scale-110 transition-transform drop-shadow-sm" />
                        <span className="text-sm md:text-base lg:text-lg font-bold text-white/90 drop-shadow-sm">{t('wecomButton')}</span>
                    </div>
                </div>
            </motion.div>

            {/* 二维码悬浮显示 */}
            <AnimatePresence>
                {isDesktop && hoverState.ios.isHovering && (
                    <QRCodePopover
                        key="ios-qr"
                        url={config.downloads.ios}
                        position={hoverState.ios.position}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isDesktop && hoverState.android.isHovering && (
                    <QRCodePopover
                        key="android-qr"
                        url={androidUrl}
                        position={hoverState.android.position}
                    />
                )}
            </AnimatePresence>

            {/* WeCom 入群二维码模态框 */}
            <AnimatePresence>
                {isWecomOpen && (
                    <motion.div
                        key="wecom-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 10, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="relative w-full max-w-sm sm:max-w-md rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                aria-label={t('close')}
                                type="button"
                                className="absolute right-3 top-3 p-2 rounded-full bg-black/30 hover:bg-black/40 text-white/90 transition-colors z-10"
                                onClick={(e) => { 
                                    e.preventDefault(); 
                                    e.stopPropagation(); 
                                    closeModal(); 
                                }}
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="p-5 sm:p-6 text-center">
                                <h3 className="text-lg sm:text-xl font-extrabold text-white drop-shadow">{t('wecomJoin')}</h3>
                                <p className="mt-2 text-xs sm:text-sm text-white/80">{isDesktop ? t('wecomTipDesktop') : t('wecomTipMobile')}</p>

                                <div className="mt-4 sm:mt-6 mx-auto w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden bg-white/90 p-2 shadow-lg">
                                    <img
                                        src={config.wecomQrCode}
                                        alt={t('wecomJoin')}
                                        className="w-full h-full object-contain rounded-xl"
                                    />
                                </div>

                                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <a
                                        href={config.wecomQrCode}
                                        download
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20"
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                        <span className="text-sm font-semibold">{t('saveImage')}</span>
                                    </a>
                                    {!isDesktop && (
                                        <a
                                            href={config.wecomQrCode}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20"
                                        >
                                            <QrCode className="w-4 h-4" />
                                            <span className="text-sm font-semibold">{t('openImage')}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
})

DownloadButtons.displayName = 'DownloadButtons'

export default DownloadButtons 