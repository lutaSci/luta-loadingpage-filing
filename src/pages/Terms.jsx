import { useState, useEffect } from 'react';
import PaperDocument from '../components/PaperDocument';
import { useLanguage } from '../contexts/LanguageContext';

const Terms = () => {
    const { language } = useLanguage();
    const [content, setContent] = useState('');

    useEffect(() => {
        // 动态导入Markdown内容
        import(`../content/terms.md?raw`)
            .then(module => {
                setContent(module.default);
            })
            .catch(error => {
                console.error('Error loading terms content:', error);
                setContent('# 用户服务协议\n\n加载中...');
            });
    }, []);

    // 动态更新页面标题
    useEffect(() => {
        const titles = {
            zh: '用户协议 - 口袋粉丝App',
            en: 'Terms of Service - Lulufans',
            ja: '利用規約 - Lulufans',
            ko: '이용약관 - Lulufans'
        };
        document.title = titles[language];
    }, [language]);

    const getTitle = () => {
        const titles = {
            zh: '用户服务协议',
            en: 'Terms of Service',
            ja: '利用規約',
            ko: '이용약관'
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

export default Terms; 