import { useState, useEffect } from 'react';
import PaperDocument from '../components/PaperDocument';
import { useLanguage } from '../contexts/LanguageContext';
import { requestMeasurementConsentSettings } from '../lib/measurementConsent.js';

const Privacy = () => {
    const { currentLanguage } = useLanguage();
    const [content, setContent] = useState('');

    useEffect(() => {
        // 动态导入Markdown内容
        import(`../content/privacy.md?raw`)
            .then(module => {
                setContent(module.default);
            })
            .catch(error => {
                console.error('Error loading privacy content:', error);
                setContent('# 隐私政策\n\n加载中...');
            });
    }, []);

    // 动态更新页面标题
    useEffect(() => {
        const titles = {
            zh: '隐私政策 - 汝塔APP',
            'zhTW': '隱私政策 - 汝塔APP',
            en: 'Privacy Policy - LUTA APP',
            ja: 'プライバシーポリシー - LUTA APP',
            ko: '개인정보 보호정책 - LUTA APP'
        };
        document.title = titles[currentLanguage] || titles.zh;
    }, [currentLanguage]);

    const getTitle = () => {
        const titles = {
            zh: '隐私政策',
            zhTW: '隱私政策',
            en: 'Privacy Policy',
            ja: 'プライバシーポリシー',
            ko: '개인정보 보호정책'
        };
        return titles[currentLanguage] || titles.zh;
    };

    const getMeasurementSettingsLabel = () => {
        const labels = {
            zh: '广告测量设置',
            zhTW: '廣告衡量設定',
            en: 'Ad measurement settings',
            ja: '広告測定設定',
            ko: '광고 측정 설정'
        };
        return labels[currentLanguage] || labels.zh;
    };

    return (
        <PaperDocument
            title={getTitle()}
            content={content}
            headerAction={(
                <button
                    type="button"
                    className="min-h-11 rounded-xl border border-emerald-700 bg-white/70 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                    onClick={() => requestMeasurementConsentSettings()}
                >
                    {getMeasurementSettingsLabel()}
                </button>
            )}
        />
    );
};

export default Privacy;
