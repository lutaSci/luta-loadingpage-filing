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
            zh: '用户协议 - 汝塔APP',
            en: 'Terms of Service - LUTA APP',
            ja: '利用規約 - LUTA APP',
            ko: '이용약관 - LUTA APP'
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