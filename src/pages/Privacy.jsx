import { useState, useEffect } from 'react';
import PaperDocument from '../components/PaperDocument';
import { useLanguage } from '../contexts/LanguageContext';

const Privacy = () => {
    const { language } = useLanguage();
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
            zh: '隐私政策 - 口袋粉丝App',
            'zhTW': '隱私政策 - 口袋粉絲App',
            en: 'Privacy Policy - Lulufans',
            ja: 'プライバシーポリシー - Lulufans',
            ko: '개인정보 보호정책 - Lulufans'
        };
        document.title = titles[language];
    }, [language]);

    const getTitle = () => {
        const titles = {
            zh: '隐私政策',
            en: 'Privacy Policy',
            ja: 'プライバシーポリシー',
            ko: '개인정보 보호정책'
        };
        return titles[language];
    };

    return (
        <PaperDocument
            title={getTitle()}
            content={content}
        />
    );
};

export default Privacy; 