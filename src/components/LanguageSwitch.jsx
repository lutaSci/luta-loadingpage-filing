import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSwitch = () => {
    const { currentLanguage, changeLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'zh', name: '中文', flag: '🇨🇳' },
        { code: 'zhTW', name: '繁體中文', flag: '🇨🇳' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'ja', name: '日本語', flag: '🇯🇵' },
        { code: 'ko', name: '한국어', flag: '🇰🇷' }
    ];

    const currentLang = languages.find(lang => lang.code === currentLanguage);

    return (
        <div className="relative">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Globe className="w-4 h-4 text-white/70" />
                <span className="text-white/70 text-sm font-medium">
                    {currentLang?.flag} {currentLang?.name}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-white/50"
                >
                    ▼
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-2 left-0 min-w-[140px] bg-white/15 backdrop-blur-md rounded-lg border border-white/20 shadow-lg overflow-hidden z-50"
                    >
                        {languages.map((language) => (
                            <motion.button
                                key={language.code}
                                onClick={() => {
                                    changeLanguage(language.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-white/20 transition-colors duration-200 ${currentLanguage === language.code
                                    ? 'bg-white/25 text-white'
                                    : 'text-white/80'
                                    }`}
                                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                            >
                                <span className="text-base">{language.flag}</span>
                                <span className="text-sm font-medium">{language.name}</span>
                                {currentLanguage === language.code && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="ml-auto w-2 h-2 bg-white rounded-full"
                                    />
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 点击外部关闭下拉菜单 */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default LanguageSwitch; 