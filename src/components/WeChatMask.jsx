import { motion, AnimatePresence } from 'framer-motion'
import { memo } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

const WeChatMask = memo(({ visible, onClose }) => {
    const { t } = useLanguage()

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={onClose}
                >
                    {/* 右上角指引箭头 + 提示 */}
                    <motion.div
                        className="absolute top-2 right-4 flex flex-col items-end"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* 向上箭头指向微信 ··· 按钮 */}
                        <svg width="60" height="50" viewBox="0 0 60 50" className="mr-4">
                            <path
                                d="M30 2 C30 2 50 15 45 40"
                                stroke="white"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                            />
                            <polygon points="40,35 45,45 50,35" fill="white" />
                        </svg>

                        {/* 操作提示卡片 */}
                        <div className="bg-white rounded-2xl p-5 mt-2 mr-2 shadow-2xl max-w-[280px]">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                {t('wechatMaskTitle')}
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center">
                                        1
                                    </span>
                                    <p className="text-sm text-gray-700 pt-1 leading-relaxed">
                                        {t('wechatMaskStep1')}
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center">
                                        2
                                    </span>
                                    <p className="text-sm text-gray-700 pt-1 leading-relaxed">
                                        {t('wechatMaskStep2')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 底部点击关闭提示 */}
                    <motion.p
                        className="absolute bottom-12 left-0 right-0 text-center text-white/60 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        {t('close')}
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    )
})

WeChatMask.displayName = 'WeChatMask'

export default WeChatMask
