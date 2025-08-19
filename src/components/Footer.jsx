import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { Colors } from '../design/colors'
import { DesignSystem } from '../design/designSystem'
import { memo } from 'react'

const Footer = memo(() => {
    const { t } = useLanguage()

    // 链接样式
    const linkStyle = {
        ...DesignSystem.components.link.primary,
        color: Colors.opacity.white70,
    }

    return (
        <motion.footer
            className="absolute bottom-0 left-0 right-0 z-20 text-center py-6 md:py-8 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
        >
            <div className="max-w-4xl mx-auto">
                {/* 简洁的导航按钮 */}
                <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 mb-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                            to="/privacy"
                            style={linkStyle}
                            className="hover:text-white transition-colors duration-300 text-sm md:text-base underline underline-offset-4 decoration-white/30 hover:decoration-white/70"
                        >
                            {t("privacy")}
                        </Link>
                    </motion.div>

                    <span style={{ color: Colors.opacity.white30 }}>|</span>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                            to="/terms"
                            style={linkStyle}
                            className="hover:text-white transition-colors duration-300 text-sm md:text-base underline underline-offset-4 decoration-white/30 hover:decoration-white/70"
                        >
                            {t("terms")}
                        </Link>
                    </motion.div>

                    <span style={{ color: Colors.opacity.white30 }}>|</span>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                            to="/contact"
                            style={linkStyle}
                            className="hover:text-white transition-colors duration-300 text-sm md:text-base underline underline-offset-4 decoration-white/30 hover:decoration-white/70"
                        >
                            {t("contact")}
                        </Link>
                    </motion.div>
                </div>

                {/* 简洁的版权信息 */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 0.8 }}
                >
                    <span
                        style={{ color: Colors.opacity.white50 }}
                        className="text-xs md:text-sm"
                    >
                        {t("copyright")}
                    </span>
                </motion.div>
            </div>
        </motion.footer>
    )
})

Footer.displayName = 'Footer'

export default Footer 