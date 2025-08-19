import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Twitter, Github, Copy, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { config } from '../config';

const Contact = () => {
    const { t, currentLanguage } = useLanguage();
    const [copySuccess, setCopySuccess] = useState(false);

    // ═══════════════════════════════════════════════════════════════════
    // 🎯 页面标题动态更新
    // ═══════════════════════════════════════════════════════════════════
    useEffect(() => {
        const titles = {
            zh: '联系我们 - 汝塔APP',
            'zh-TW': '聯繫我們 - 汝塔APP',
            en: 'Contact Us - Luta App',
            ja: 'お問い合わせ - 汝塔APP',
            ko: '문의하기 - 汝塔APP'
        };
        document.title = titles[currentLanguage];
    }, [currentLanguage]);

    // ═══════════════════════════════════════════════════════════════════
    // 🎨 复制邮箱功能
    // ═══════════════════════════════════════════════════════════════════
    const copyEmail = async () => {
        try {
            await navigator.clipboard.writeText(config.social.email);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy email:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50/70 flex items-start justify-center p-6">
            <div className="w-full max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-4"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors duration-300 text-slate-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>← {t('backToHome')}</span>
                    </Link>
                </motion.div>

                <motion.div
                    className="relative bg-white/40 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'radial-gradient(1200px 600px at 0% 0%, rgba(255,255,255,0.5), rgba(255,255,255,0)), radial-gradient(1200px 600px at 100% 100%, rgba(255,255,255,0.4), rgba(255,255,255,0))'
                    }} />

                    <div className="relative px-6 md:px-10 py-8 md:py-10">
                        <motion.div
                            className="mb-8 border-b border-white/40 pb-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-800">
                                {t('contactTitle')}
                            </h1>
                            <div className="mt-2 text-xs text-slate-500">
                                Document ID: CONTACT-{Date.now().toString(36).toUpperCase()}
                            </div>
                        </motion.div>

                        <motion.div
                            className="space-y-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            {/* 邮箱联系 */}
                            <div className="border-b border-white/30 pb-6">
                                <h2 className="text-lg md:text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <Mail className="w-5 h-5" />
                                    {t('contactEmail')}
                                </h2>
                                <p className="text-slate-700 mb-4 leading-relaxed">
                                    {t('contactEmailDesc')}
                                </p>

                                <div className="bg-white/50 backdrop-blur-md border border-white/40 p-4 rounded-xl mb-4 shadow">
                                    <div className="flex items-center justify-between">
                                        <code className="text-slate-800">
                                            {config.social.email}
                                        </code>
                                        <button
                                            onClick={copyEmail}
                                            className="ml-3 p-2 rounded hover:bg-white/50 transition-colors"
                                        >
                                            {copySuccess ? (
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-slate-700" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <a
                                    href={`mailto:${config.social.email}`}
                                    className="inline-flex items-center gap-2 text-slate-800 underline decoration-white/40 underline-offset-4 hover:opacity-80 transition"
                                >
                                    → 发送邮件
                                </a>
                            </div>

                            {/* 社交媒体 */}
                            <div className="border-b border-white/30 pb-6">
                                <h2 className="text-lg md:text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <Twitter className="w-5 h-5" />
                                    {t('contactSocial')}
                                </h2>
                                <p className="text-slate-700 mb-4 leading-relaxed">
                                    {t('contactSocialDesc')}
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Twitter className="w-4 h-4 text-slate-600" />
                                        <span className="text-slate-700">Twitter / X:</span>
                                        <a
                                            href={config.social.twitter}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-800 underline decoration-white/40 underline-offset-4 hover:opacity-80 transition"
                                        >
                                            @lutaai
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Github className="w-4 h-4 text-slate-600" />
                                        <span className="text-slate-700">GitHub:</span>
                                        <a
                                            href={config.social.github}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-800 underline decoration-white/40 underline-offset-4 hover:opacity-80 transition"
                                        >
                                            @lutaai
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* 技术支持 */}
                            <div>
                                <h2 className="text-lg md:text-xl font-semibold text-slate-800 mb-3">
                                    {t('contactSupport')}
                                </h2>
                                <p className="text-slate-700 leading-relaxed">
                                    {t('contactSupportDesc')}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Contact; 