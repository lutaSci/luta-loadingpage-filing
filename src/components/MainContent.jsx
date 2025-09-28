import { motion } from 'framer-motion'
import SplitText from './SplitText'
import GlitchText from './GlitchText'
import DownloadButtons from './DownloadButtons'
import { useLanguage } from '../contexts/LanguageContext'
import logo1 from '../assets/logo_1.png'
import { memo, useMemo, useState, useEffect, useCallback } from 'react'

const MainContent = memo(() => {
    const { t, currentLanguage } = useLanguage()

    // Logo循环切换
    const logos = [logo1]
    const [currentLogoIndex, setCurrentLogoIndex] = useState(0)
    const [isRotationStarted, setIsRotationStarted] = useState(false)
    const [preloadedImages, setPreloadedImages] = useState(new Set())

    // 预加载图片的函数
    const preloadImage = useCallback((src) => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(src)
            img.onerror = () => reject(src)
            img.src = src
        })
    }, [])

    // 预加载下一张图片
    const preloadNextImage = useCallback(async (nextIndex) => {
        const nextSrc = logos[nextIndex]
        if (!preloadedImages.has(nextSrc)) {
            try {
                await preloadImage(nextSrc)
                setPreloadedImages(prev => new Set([...prev, nextSrc]))
                return true
            } catch (error) {
                console.error('Failed to preload image:', nextSrc)
                return false
            }
        }
        return true
    }, [logos, preloadedImages, preloadImage])

    // 初始化：预加载所有图片
    useEffect(() => {
        const preloadAllImages = async () => {
            try {
                await Promise.all(logos.map(logo => preloadImage(logo)))
                setPreloadedImages(new Set(logos))
            } catch (error) {
                console.error('Failed to preload some images:', error)
            }
        }
        preloadAllImages()
    }, [logos, preloadImage])

    // 20秒后开始轮换
    useEffect(() => {
        const startTimer = setTimeout(() => {
            setIsRotationStarted(true)
        }, 20000) // 20秒延迟

        return () => {
            clearTimeout(startTimer)
        }
    }, [])

    // Logo切换定时器 - 只有在轮换开始且下一张图预加载完成后才切换
    useEffect(() => {
        if (!isRotationStarted) return

        const logoTimer = setInterval(async () => {
            const nextIndex = (currentLogoIndex + 1) % logos.length

            // 确保下一张图已预加载完成
            const isPreloaded = await preloadNextImage(nextIndex)

            if (isPreloaded) {
                setCurrentLogoIndex(nextIndex)
            }
        }, 3000) // 每3秒尝试切换

        return () => {
            clearInterval(logoTimer)
        }
    }, [currentLogoIndex, logos.length, isRotationStarted, preloadNextImage])

    // 使用 useMemo 缓存动画配置
    const fadeInUp = useMemo(
        () => ({
            initial: { opacity: 0, y: 40 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.8, ease: "easeOut" },
        }),
        []
    )

    return (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-8 pb-24 md:pb-28" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)' }}>
            <motion.div
                className="text-center space-y-8 md:space-y-12"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ maxWidth: "100%", width: "100%" }}
            >
                {/* 动态标题 - 优化移动端尺寸 */}
                <motion.div {...fadeInUp} className="mb-6 md:mb-8">
                    {/* 主标题 - 移动端优化字体大小 */}
                    <div className="mb-4 md:mb-6">
                        <SplitText
                            key={`title-${currentLanguage}`}
                            text={t("title")}
                            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white drop-shadow-2xl"
                            delay={120}
                            duration={0.8}
                            splitType="chars"
                            from={{ opacity: 0, y: 60, rotationY: 90 }}
                            to={{ opacity: 1, y: 0, rotationY: 0 }}
                            threshold={0}
                            textAlign="center"
                        />
                    </div>

                    {/* 副标题 - 移动端优化字体大小 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.6 }}
                    >
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white/90 drop-shadow-lg">
                            {t("subtitle")}
                        </p>
                    </motion.div>
                </motion.div>

                {/* LOGO区域 - 适中圆角，黑暗阴影 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="mb-6 md:mb-8"
                >
                    {/* 响应式LOGO尺寸 - 适中圆角，黑暗阴影 */}
                    <div className="mx-auto mb-4 md:mb-6 relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56">
                        {/* LOGO图片 - 减少圆角，使用黑暗阴影，每3秒循环切换 */}
                        <motion.img
                            key={currentLogoIndex} // 添加key以触发动画
                            src={logos[currentLogoIndex]}
                            alt="FakeLive Logo"
                            className="w-full h-full object-cover rounded-[2.5rem] md:rounded-[3.5rem] lg:rounded-[3.5rem]"
                            style={{
                                willChange: 'auto',
                                filter: 'drop-shadow(0 4px 12px rgba(34, 69, 25, 0.5))',
                                boxShadow: '0 8px 32px rgba(3, 111, 39, 0.3), 0 4px 16px rgba(0,0,0,0.3), 0 2px 8px rgba(7, 94, 45, 0.3)'
                            }}
                            initial={{
                                opacity: 0,
                                scale: 0.8,
                                y: 30,
                                rotate: -5
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                rotate: 0
                            }}
                            transition={{
                                duration: 0.6,
                                ease: "easeOut",
                                type: "spring",
                                damping: 15,
                                stiffness: 200
                            }}
                        />
                    </div>

                    {/* GlitchText - 手机直播间模拟器 - 增加与按钮的距离 */}
                    {/* <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="mb-12 md:mb-16 lg:mb-20"
                    >
                        <GlitchText speed={0.8} enableShadows={true}>
                            {t("glitchText")}
                        </GlitchText>
                    </motion.div> */}
                     <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.6 }}
                    >
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white/90 drop-shadow-lg">
                            {t("glitchText")}
                        </p>
                    </motion.div>
                </motion.div>

                {/* 下载按钮组 */}
                <DownloadButtons />
            </motion.div>
        </div>
    )
})

MainContent.displayName = 'MainContent'

export default MainContent 