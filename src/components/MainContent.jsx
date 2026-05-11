import { motion, AnimatePresence } from 'framer-motion'
import SplitText from './SplitText'
import DownloadButtons from './DownloadButtons'
import { useLanguage } from '../contexts/LanguageContext'
import { Colors } from '../design/colors'
import logo1 from '../assets/logo_1.png'
import { memo, useMemo, useState, useCallback } from 'react'
import { detectDevice, detectIsWeChat } from '../lib/deviceDetection'
import { Award } from 'lucide-react'

const device = detectDevice()
const isWeChat = detectIsWeChat()
const isMobile = device.isMobile

const SILK_COLOR = `rgb(${Colors.background.silk.join(',')})` // rgb(52,152,118)
const SILK_COLOR_DARK = `rgb(${Colors.background.silk.map(c => Math.round(c * 0.75)).join(',')})` // 暗一档用于渐变

const MainContent = memo(() => {
    const { t, currentLanguage } = useLanguage()

    const [pcTab, setPcTab] = useState('ios')

    const showIOSContent = device.isIOS || (device.isDesktop && pcTab === 'ios')

    const stepsText = isWeChat
        ? t('wechatGuideDesc')
        : showIOSContent ? t('iosSteps') : t('androidSteps')

    const handlePcTabChange = useCallback((tab) => {
        setPcTab(tab)
    }, [])

    const fadeInUp = useMemo(
        () => ({
            initial: { opacity: 0, y: 40 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.8, ease: "easeOut" },
        }),
        []
    )

    return (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-16 sm:pt-8 pb-24 md:pb-28" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)' }}>
            <motion.div
                className="text-center space-y-6 md:space-y-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ maxWidth: "100%", width: "100%" }}
            >
                {/* 标题 + 副标题 + 版本号（移动端隐藏副标题和版本号） */}
                <motion.div {...fadeInUp} className={isMobile ? "mb-2" : "mb-4 md:mb-6"}>
                    <div className={isMobile ? "mb-2" : "mb-3 md:mb-4"}>
                        <SplitText
                            key={`title-${currentLanguage}`}
                            text={t("title")}
                            className={isMobile
                                ? "text-4xl font-black text-white drop-shadow-2xl"
                                : "text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white drop-shadow-2xl"
                            }
                            delay={120}
                            duration={0.8}
                            splitType="chars"
                            from={{ opacity: 0, y: 60, rotationY: 90 }}
                            to={{ opacity: 1, y: 0, rotationY: 0 }}
                            threshold={0}
                            textAlign="center"
                        />
                    </div>

                    {!isMobile && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="space-y-1"
                        >
                            <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white/90 drop-shadow-lg">
                                {t("subtitle")}
                            </p>
                            <p className="text-xs sm:text-sm md:text-base text-white/50 font-medium">
                                {t("glitchText")}
                            </p>
                        </motion.div>
                    )}
                </motion.div>

                {/* LOGO + 认证标签（移动端缩小logo并隐藏徽章和步骤文字） */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className={isMobile ? "mb-2" : "mb-4 md:mb-6"}
                >
                    <div className={isMobile
                        ? "mx-auto mb-2 relative w-24 h-24"
                        : "mx-auto mb-3 md:mb-4 relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56"
                    }>
                        <motion.img
                            src={logo1}
                            alt="汝塔 Logo"
                            className={isMobile
                                ? "w-full h-full object-cover rounded-[2rem]"
                                : "w-full h-full object-cover rounded-[2.5rem] md:rounded-[3.5rem] lg:rounded-[3.5rem]"
                            }
                            style={{
                                willChange: 'auto',
                                filter: Colors.logoShadow.filter,
                                boxShadow: Colors.logoShadow.boxShadow,
                            }}
                            initial={{ opacity: 0, scale: 0.8, y: 30, rotate: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                            transition={{
                                duration: 0.6,
                                ease: "easeOut",
                                type: "spring",
                                damping: 15,
                                stiffness: 200
                            }}
                        />
                        {!isMobile && (
                            <motion.div
                                className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-xl"
                                style={{
                                    background: `linear-gradient(135deg, ${SILK_COLOR}, ${SILK_COLOR_DARK})`,
                                    color: 'white',
                                    border: '2px solid rgba(255,255,255,0.25)',
                                    boxShadow: `0 4px 16px rgba(52,152,118,0.4), 0 2px 6px rgba(0,0,0,0.2)`,
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.4 }}
                            >
                                <Award className="w-3.5 h-3.5" />
                                <span>{showIOSContent ? 'App Store' : t('editorChoice')}</span>
                            </motion.div>
                        )}
                    </div>

                    {!isMobile && (
                        <div className="mt-6 relative h-8 sm:h-9 md:h-10">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={stepsText}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 flex items-center justify-center text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white/90 drop-shadow-lg"
                                >
                                    {stepsText}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>

                <DownloadButtons pcTab={pcTab} onPcTabChange={handlePcTabChange} />
            </motion.div>
        </div>
    )
})

MainContent.displayName = 'MainContent'

export default MainContent
