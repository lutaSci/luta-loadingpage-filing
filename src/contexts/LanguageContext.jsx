import { createContext, useContext, useState, useEffect } from 'react';

// 语言资源（依据 prd.md 调整为 LUTA/汝塔 的本土化表述，并新增繁体中文）
const translations = {
    zh: {
        title: "汝塔APP",
        subtitle: "您的读经伴侣",
        glitchText: "内测 V1.1.0",
        appStore: "App Store",
        googlePlay: "Google Play",
        wecomButton: "加入微信群",
        wecomJoin: "加入官方微信群",
        wecomTipMobile: "长按保存二维码 → 打开微信扫一扫相册",
        wecomTipDesktop: "请使用手机微信扫描下方二维码加入群聊",
        saveImage: "保存二维码",
        openImage: "打开二维码",
        close: "关闭",

        privacy: "隐私政策",
        terms: "使用协议",
        contact: "联系我们",
        copyright: "© 2024 深圳市狮利千秋文化科技有限公司. 保留所有权利.",
        icp: "粤ICP备2025461997号",
        icpFull: "粤ICP备2025461997号-1",
        backToHome: "返回首页",

        contactTitle: "联系我们",
        contactSubtitle: "我们很乐意为您提供帮助",
        contactEmail: "邮箱联系",
        contactEmailDesc: "发送邮件给我们，我们会尽快回复",
        contactSocial: "社交媒体",
        contactSocialDesc: "关注我们获取最新动态",
        contactSupport: "技术支持",
        contactSupportDesc: "如果您在使用过程中遇到任何问题，请随时联系我们",

        metaDescription: "汝塔APP - 您的读经伴侣！",
        metaKeywords: "汝塔, LUTA, 读经伴侣, AI读经, 佛学学习, 经文理解, 闻思修",

        language: "语言",
        languages: {
            zh: "简体中文",
            zhTW: "繁體中文",
            en: "English",
            ja: "日本語",
            ko: "한국어"
        }
    },

    zhTW: {
        title: "汝塔APP",
        subtitle: "您的讀經夥伴",
        glitchText: "內測 V1.1.0",
        appStore: "App Store",
        googlePlay: "Google Play",
        wecomButton: "加入微信群",
        wecomJoin: "加入官方微信群",
        wecomTipMobile: "長按保存二維碼 → 打開微信掃一掃相冊",
        wecomTipDesktop: "請使用手機微信掃描下方二維碼加入群組",
        saveImage: "保存二維碼",
        openImage: "打開二維碼",
        close: "關閉",

        privacy: "隱私政策",
        terms: "使用協議",
        contact: "聯絡我們",
        copyright: "© 2024 深圳市狮利千秋文化科技有限公司. 版權所有。",
        icp: "粤ICP备2025461997号",
        icpFull: "粤ICP备2025461997号-1",
        backToHome: "返回首頁",

        contactTitle: "聯絡我們",
        contactSubtitle: "我們很樂意提供協助",
        contactEmail: "電子郵件",
        contactEmailDesc: "留下訊息，我們將盡快回覆",
        contactSocial: "社群媒體",
        contactSocialDesc: "追蹤我們，掌握最新動態",
        contactSupport: "技術支援",
        contactSupportDesc: "若您在使用過程中遇到任何問題，歡迎隨時與我們聯繫",

        metaDescription: "汝塔APP－您的讀經夥伴！",
        metaKeywords: "汝塔, LUTA, 讀經夥伴, AI讀經, 佛學學習, 經文理解, 聞思修",

        language: "語言",
        languages: {
            zh: "简体中文",
            zhTW: "繁體中文",
            en: "English",
            ja: "日本語",
            ko: "한국어"
        }
    },

    en: {
        title: "LUTA",
        subtitle: "Your scripture companion",
        glitchText: "Beta v1.1.0",
        appStore: "App Store",
        googlePlay: "Google Play",
        wecomButton: "Join WeChat Group",
        wecomJoin: "Join Official WeChat Group",
        wecomTipMobile: "Long-press to save QR → Open WeChat and scan from album",
        wecomTipDesktop: "Scan the QR code below with WeChat on your phone",
        saveImage: "Save QR Code",
        openImage: "Open QR",
        close: "Close",

        privacy: "Privacy Policy",
        terms: "Terms of Service",
        contact: "Contact Us",
        copyright: "© 2024 Shenzhen Shili Qianqiu Culture & Technology Co., Ltd. All rights reserved.",
        icp: "ICP Filing No. 粤ICP备2025461997号",
        icpFull: "ICP Filing No. 粤ICP备2025461997号-1",
        backToHome: "Back to Home",

        contactTitle: "Contact Us",
        contactSubtitle: "We're here to help",
        contactEmail: "Email",
        contactEmailDesc: "Send us a message and we'll respond soon",
        contactSocial: "Social Media",
        contactSocialDesc: "Follow us for updates",
        contactSupport: "Support",
        contactSupportDesc: "If you encounter any issues, feel free to reach out",

        metaDescription: "LUTA - Your scripture companion",
        metaKeywords: "LUTA, scripture, Buddhist study, AI reading, sutra, learning, contemplation",

        language: "Language",
        languages: {
            zh: "简体中文",
            zhTW: "繁體中文",
            en: "English",
            ja: "日本語",
            ko: "한국어"
        }
    },

    ja: {
        title: "LUTA",
        subtitle: "経典学習のパートナー",
        glitchText: "ベータ v1.1.0",
        appStore: "App Store",
        googlePlay: "Google Play",
        wecomButton: "WeChatグループに参加",
        wecomJoin: "公式WeChatグループに参加",
        wecomTipMobile: "長押しでQR保存 → WeChatでアルバムからスキャン",
        wecomTipDesktop: "携帯のWeChatで下のQRコードをスキャンしてください",
        saveImage: "QRコードを保存",
        openImage: "QRを開く",
        close: "閉じる",

        privacy: "プライバシーポリシー",
        terms: "利用規約",
        contact: "お問い合わせ",
        copyright: "© 2024 深圳市狮利千秋文化科技有限公司. All rights reserved.",
        icp: "粤ICP备2025461997号",
        icpFull: "粤ICP备2025461997号-1",
        backToHome: "ホームに戻る",

        contactTitle: "お問い合わせ",
        contactSubtitle: "サポートいたします",
        contactEmail: "メール",
        contactEmailDesc: "メッセージをお送りください。追ってご連絡します",
        contactSocial: "ソーシャルメディア",
        contactSocialDesc: "最新情報をフォローしてください",
        contactSupport: "サポート",
        contactSupportDesc: "ご不明点があればお気軽にお問い合わせください",

        metaDescription: "LUTA - 経典学習のパートナー",
        metaKeywords: "LUTA, 経典, 仏教学習, AI 読書, 経文, 学習, 熟考",

        language: "言語",
        languages: {
            zh: "简体中文",
            zhTW: "繁體中文",
            en: "English",
            ja: "日本語",
            ko: "한국어"
        }
    },

    ko: {
        title: "LUTA",
        subtitle: "경전 학습 동반자",
        glitchText: "베타 v1.1.0",
        appStore: "App Store",
        googlePlay: "Google Play",
        wecomButton: "위챗 그룹 참여",
        wecomJoin: "공식 위챗 그룹 참여",
        wecomTipMobile: "길게 눌러 QR 저장 → 위챗에서 앨범 스캔",
        wecomTipDesktop: "휴대폰 위챗으로 아래 QR 코드를 스캔하세요",
        saveImage: "QR 저장",
        openImage: "QR 열기",
        close: "닫기",

        privacy: "개인정보처리방침",
        terms: "이용약관",
        contact: "문의하기",
        copyright: "© 2024 Shenzhen Shili Qianqiu Culture & Technology Co., Ltd. All rights reserved.",
        icp: "粤ICP备2025461997号",
        icpFull: "粤ICP备2025461997号-1",
        backToHome: "홈으로 돌아가기",

        contactTitle: "문의하기",
        contactSubtitle: "도움이 필요하시면 알려주세요",
        contactEmail: "이메일",
        contactEmailDesc: "메시지를 보내주시면 빠르게 답변드리겠습니다",
        contactSocial: "소셜 미디어",
        contactSocialDesc: "최신 소식을 확인하세요",
        contactSupport: "지원",
        contactSupportDesc: "앱 사용 중 문제가 발생하면 언제든지 문의해 주세요",

        metaDescription: "LUTA - 경전 학습 동반자",
        metaKeywords: "LUTA, 경전, 불교 학습, AI 독서, 수트라, 학습, 성찰",

        language: "언어",
        languages: {
            zh: "简体中文",
            zhTW: "繁體中文",
            en: "English",
            ja: "日本語",
            ko: "한국어"
        }
    }
};

// 语言检测函数
const detectLanguage = () => {
    // 首先检查localStorage中保存的语言设置
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage && translations[savedLanguage]) {
        return savedLanguage;
    }

    // 检测浏览器语言
    const browserLanguage = navigator.language || navigator.userLanguage;
    const languageCode = (browserLanguage || '').toLowerCase();

    // 映射常见的语言代码（含繁体）
    const languageMap = {
        'zh': 'zh',
        'zh-cn': 'zh',
        'zh-hans': 'zh',
        'zhTW': 'zhTW',
        'zh-hk': 'zhTW',
        'zh-hant': 'zhTW',
        'en': 'en',
        'en-us': 'en',
        'ja': 'ja',
        'ja-jp': 'ja',
        'ko': 'ko',
        'ko-kr': 'ko'
    };

    // 尝试全匹配，否则退回到主语言
    return languageMap[languageCode] || languageMap[languageCode.split('-')[0]] || 'zh';
};

// 创建语言上下文
const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState(detectLanguage);

    useEffect(() => {
        // 保存语言设置到localStorage
        localStorage.setItem('preferred-language', currentLanguage);

        // 更新HTML lang属性
        document.documentElement.lang =
            currentLanguage === 'zh' ? 'zh-CN' :
            currentLanguage === 'zhTW' ? 'zhTW' :
            currentLanguage === 'en' ? 'en-US' :
            currentLanguage === 'ja' ? 'ja-JP' : 'ko-KR';

        // 更新页面标题和meta信息
        const t = translations[currentLanguage];
        document.title = `${t.title} - ${t.glitchText} | ${t.subtitle}`;

        // 更新meta描述
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', t.metaDescription);
        }

        // 更新meta关键词
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) {
            metaKeywords.setAttribute('content', t.metaKeywords);
        }
    }, [currentLanguage]);

    const changeLanguage = (language) => {
        if (translations[language]) {
            setCurrentLanguage(language);
        }
    };

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[currentLanguage];

        for (const k of keys) {
            value = value?.[k];
        }

        return value || key;
    };

    const value = {
        currentLanguage,
        changeLanguage,
        t,
        translations: translations[currentLanguage],
        availableLanguages: Object.keys(translations)
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export default LanguageContext; 