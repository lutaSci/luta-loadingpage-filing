import { createContext, useContext, useState, useEffect } from 'react';

// 默认版本号（API加载前显示）
const DEFAULT_VERSION = "1.1.0";

// 语言资源（依据 prd.md 调整为 LUTA/汝塔 的本土化表述，并新增繁体中文）
const translations = {
    zh: {
        title: "汝塔APP",
        subtitle: "您的读经伴侣",
        glitchTextPrefix: "版本",
        appStore: "苹果手机安装",
        googlePlay: "安卓 华为鸿蒙手机安装",
        downloadApk: "下载安装包",
        installDoc: "安装教程",
        puzzleBlessing: "拼图送祝福",
        wecomButton: "加入微信群",
        wecomJoin: "加入官方微信群",
        wecomTipMobile: "长按保存二维码 → 打开微信扫一扫相册",
        wecomTipDesktop: "请使用手机微信扫描下方二维码加入群聊",
        saveImage: "保存二维码",
        openImage: "打开二维码",
        close: "关闭",

        helpButton: "帮助",
        helpToastMessage: "已将客服微信号 {wechatId} 复制到剪贴板，请前往微信添加好友获取帮助",
        copiedToast: "已复制",

        editorChoice: "编辑推荐",
        iosAppleVerified: "🍎 官方认证",
        androidSafeInstall: "✅ 安全安装",

        iosSteps: "只需2步，2分钟安装成功",
        androidSteps: "只需1步，2分钟安装成功",

        iosStep1Title: "第1步 · 安装 TestFlight",
        iosStep1Desc: "Apple 官方安装工具，仅需下载即可，下载后直接返回此页面",
        iosStep1Cta: "前往 App Store 下载",
        iosTip: "💡 下载完成后，直接返回此页面点击第2步，汝塔将自动安装",
        iosStep2Title: "第2步 · 安装汝塔",
        iosStep2Desc: "点击按钮自动打开 TestFlight 并安装，如已打开 TestFlight 请先关闭",
        iosStep2Cta: "立即安装汝塔",

        androidStep1Title: "获取官方安装包",
        androidStep1Desc: "下载完成后按提示点击「允许安装」即可",
        androidStep1Cta: "下载汝塔安装包",
        androidStep1CtaGooglePlay: "前往 Google Play 下载",

        wechatGuideTitle: "在浏览器中安装",
        wechatGuideDesc: "微信中无法直接安装，请先在浏览器中打开本页面",
        wechatGuideCta: "去浏览器打开",

        wechatMaskTitle: "请在浏览器中打开",
        wechatMaskStep1: "点击右上角 「···」按钮",
        wechatMaskStep2: "选择「在浏览器中打开」",

        needHelp: "需要帮助",

        pcTabIos: "苹果 iPhone",
        pcTabAndroid: "安卓 / 华为鸿蒙",

        privacy: "隐私政策",
        terms: "使用协议",
        contact: "联系我们",
        copyright: "© 2024 深圳市师利千秋文化科技有限公司. 保留所有权利.",
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
        glitchTextPrefix: "版本",   
        appStore: "蘋果手機",
        googlePlay: "安卓 華為鴻蒙手機",
        downloadApk: "下載安裝包",
        installDoc: "安裝教學",
        puzzleBlessing: "拼圖送祝福",
        wecomButton: "加入微信群",
        wecomJoin: "加入官方微信群",
        wecomTipMobile: "長按保存二維碼 → 打開微信掃一掃相冊",
        wecomTipDesktop: "請使用手機微信掃描下方二維碼加入群組",
        saveImage: "保存二維碼",
        openImage: "打開二維碼",
        close: "關閉",

        helpButton: "幫助",
        helpToastMessage: "已將客服微信號 {wechatId} 複製到剪貼板，請前往微信添加好友獲取幫助",
        copiedToast: "已複製",

        editorChoice: "編輯推薦",
        iosAppleVerified: "🍎 官方認證",
        androidSafeInstall: "✅ 安全安裝",

        iosSteps: "只需2步，2分鐘安裝成功",
        androidSteps: "只需1步，2分鐘安裝成功",

        iosStep1Title: "第1步 · 安裝 TestFlight",
        iosStep1Desc: "Apple 官方安裝工具，僅需下載即可，下載後直接返回此頁面",
        iosStep1Cta: "前往 App Store 下載",
        iosTip: "💡 下載完成後，直接返回此頁面點擊第2步，汝塔將自動安裝",
        iosStep2Title: "第2步 · 安裝汝塔",
        iosStep2Desc: "點擊按鈕自動打開 TestFlight 並安裝，如已打開 TestFlight 請先關閉",
        iosStep2Cta: "立即安裝汝塔",

        androidStep1Title: "獲取官方安裝包",
        androidStep1Desc: "點擊下方按鈕獲取安裝包，下載完成後按提示點擊「允許安裝」即可",
        androidStep1Cta: "下載汝塔安裝包",
        androidStep1CtaGooglePlay: "前往 Google Play 下載",

        wechatGuideTitle: "在瀏覽器中安裝",
        wechatGuideDesc: "微信中無法直接安裝，請先在瀏覽器中打開本頁面",
        wechatGuideCta: "去瀏覽器打開",

        wechatMaskTitle: "請在瀏覽器中打開",
        wechatMaskStep1: "點擊右上角 「···」按鈕",
        wechatMaskStep2: "選擇「在瀏覽器中打開」",

        needHelp: "需要幫助",

        pcTabIos: "蘋果 iPhone",
        pcTabAndroid: "安卓 / 華為鴻蒙",

        privacy: "隱私政策",
        terms: "使用協議",
        contact: "聯絡我們",
        copyright: "© 2024 深圳市师利千秋文化科技有限公司. 保留所有权利.",
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
        glitchTextPrefix: "Version",
        appStore: "Apple Store",
        googlePlay: "Google Play",
        downloadApk: "Download APK",
        installDoc: "Install Docs",
        puzzleBlessing: "Puzzle Blessings",
        wecomButton: "Join WeChat Group",
        wecomJoin: "Join Official WeChat Group",
        wecomTipMobile: "Long-press to save QR → Open WeChat and scan from album",
        wecomTipDesktop: "Scan the QR code below with WeChat on your phone",
        saveImage: "Save QR Code",
        openImage: "Open QR",
        close: "Close",

        helpButton: "Help",
        helpToastMessage: "WeChat ID {wechatId} has been copied. Please add us on WeChat for support.",
        copiedToast: "Copied",

        editorChoice: "Editor's Choice",
        iosAppleVerified: "🍎 Verified by Apple",
        androidSafeInstall: "✅ Safe to Install",

        iosSteps: "Just 2 steps, ready in 2 min",
        androidSteps: "Just 1 step, ready in 2 min",

        iosStep1Title: "Step 1 · Install TestFlight",
        iosStep1Desc: "Apple's official install tool — just download it, then come back to this page",
        iosStep1Cta: "Get TestFlight from App Store",
        iosTip: "💡 After downloading, return to this page and tap Step 2 — LUTA will install automatically",
        iosStep2Title: "Step 2 · Install LUTA",
        iosStep2Desc: "This button opens TestFlight automatically. If TestFlight is already open, close it first",
        iosStep2Cta: "Install LUTA Now",

        androidStep1Title: "Get the Official App",
        androidStep1Desc: "Tap the button below to download. Once done, tap \"Allow Install\" to continue.",
        androidStep1Cta: "Download LUTA",
        androidStep1CtaGooglePlay: "Get it on Google Play",

        wechatGuideTitle: "Open in Browser to Install",
        wechatGuideDesc: "Cannot install directly in WeChat. Please open this page in your browser first.",
        wechatGuideCta: "Open in Browser",

        wechatMaskTitle: "Please open in browser",
        wechatMaskStep1: "Tap the ··· button at the top right",
        wechatMaskStep2: "Select \"Open in Browser\"",

        needHelp: "Need Help",

        pcTabIos: "iPhone",
        pcTabAndroid: "Android / HarmonyOS",

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
        glitchTextPrefix: "Version",
        appStore: "Apple Store",
        googlePlay: "Google Play",
        downloadApk: "APKダウンロード",
        installDoc: "インストールガイド",
        puzzleBlessing: "パズルで祝福",
        wecomButton: "WeChatグループに参加",
        wecomJoin: "公式WeChatグループに参加",
        wecomTipMobile: "長押しでQR保存 → WeChatでアルバムからスキャン",
        wecomTipDesktop: "携帯のWeChatで下のQRコードをスキャンしてください",
        saveImage: "QRコードを保存",
        openImage: "QRを開く",
        close: "閉じる",

        helpButton: "ヘルプ",
        helpToastMessage: "WeChat ID {wechatId} をコピーしました。WeChatで友達追加してサポートを受けてください。",
        copiedToast: "コピー済み",

        editorChoice: "編集のおすすめ",
        iosAppleVerified: "🍎 Apple公式認証",
        androidSafeInstall: "✅ 安全インストール",

        iosSteps: "たった2ステップ、2分で完了",
        androidSteps: "たった1ステップ、2分で完了",

        iosStep1Title: "ステップ1 · TestFlightをインストール",
        iosStep1Desc: "Apple公式のインストールツール。ダウンロードのみでOK、その後このページに戻ってください",
        iosStep1Cta: "App StoreでTestFlightを取得",
        iosTip: "💡 ダウンロード後、このページに戻ってステップ2をタップすれば、LUTAが自動でインストールされます",
        iosStep2Title: "ステップ2 · LUTAをインストール",
        iosStep2Desc: "ボタンをタップするとTestFlightが自動で開きます。既に開いている場合は先に閉じてください",
        iosStep2Cta: "LUTAをインストール",

        androidStep1Title: "公式アプリを取得",
        androidStep1Desc: "下のボタンをタップしてダウンロード。完了後「インストールを許可」をタップしてください。",
        androidStep1Cta: "LUTAをダウンロード",
        androidStep1CtaGooglePlay: "Google Playで入手",

        wechatGuideTitle: "ブラウザでインストール",
        wechatGuideDesc: "WeChat内では直接インストールできません。ブラウザでこのページを開いてください。",
        wechatGuideCta: "ブラウザで開く",

        wechatMaskTitle: "ブラウザで開いてください",
        wechatMaskStep1: "右上の「···」ボタンをタップ",
        wechatMaskStep2: "「ブラウザで開く」を選択",

        needHelp: "ヘルプ",

        pcTabIos: "iPhone",
        pcTabAndroid: "Android / HarmonyOS",

        privacy: "プライバシーポリシー",
        terms: "利用規約",
        contact: "お問い合わせ",
        copyright: "© 2024 深圳市师利千秋文化科技有限公司. All rights reserved.",
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
        glitchTextPrefix: "Version",
        appStore: "Apple Store",
        googlePlay: "Google Play",
        downloadApk: "APK 다운로드",
        installDoc: "설치 가이드",
        puzzleBlessing: "퍼즐로 축복",
        wecomButton: "위챗 그룹 참여",
        wecomJoin: "공식 위챗 그룹 참여",
        wecomTipMobile: "길게 눌러 QR 저장 → 위챗에서 앨범 스캔",
        wecomTipDesktop: "휴대폰 위챗으로 아래 QR 코드를 스캔하세요",
        saveImage: "QR 저장",
        openImage: "QR 열기",
        close: "닫기",

        helpButton: "도움말",
        helpToastMessage: "WeChat ID {wechatId} 가 복사되었습니다. WeChat에서 친구 추가하여 도움을 받으세요.",
        copiedToast: "복사됨",

        editorChoice: "에디터 추천",
        iosAppleVerified: "🍎 Apple 공식 인증",
        androidSafeInstall: "✅ 안전 설치",

        iosSteps: "단 2단계, 2분이면 완료",
        androidSteps: "단 1단계, 2분이면 완료",

        iosStep1Title: "1단계 · TestFlight 설치",
        iosStep1Desc: "Apple 공식 설치 도구입니다. 다운로드만 하고 이 페이지로 돌아와 주세요",
        iosStep1Cta: "App Store에서 TestFlight 다운로드",
        iosTip: "💡 다운로드 후 이 페이지로 돌아와 2단계를 탭하면 LUTA가 자동으로 설치됩니다",
        iosStep2Title: "2단계 · LUTA 설치",
        iosStep2Desc: "버튼을 누르면 TestFlight가 자동으로 열립니다. 이미 열려 있다면 먼저 닫아주세요",
        iosStep2Cta: "LUTA 설치하기",

        androidStep1Title: "공식 앱 다운로드",
        androidStep1Desc: "아래 버튼을 눌러 다운로드하세요. 완료 후 \"설치 허용\"을 눌러주세요.",
        androidStep1Cta: "LUTA 다운로드",
        androidStep1CtaGooglePlay: "Google Play에서 다운로드",

        wechatGuideTitle: "브라우저에서 설치",
        wechatGuideDesc: "WeChat에서는 직접 설치할 수 없습니다. 브라우저에서 이 페이지를 열어주세요.",
        wechatGuideCta: "브라우저에서 열기",

        wechatMaskTitle: "브라우저에서 열어주세요",
        wechatMaskStep1: "오른쪽 상단 「···」 버튼을 탭",
        wechatMaskStep2: "「브라우저에서 열기」를 선택",

        needHelp: "도움이 필요해요",

        pcTabIos: "iPhone",
        pcTabAndroid: "Android / HarmonyOS",

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
    const [appVersion, setAppVersion] = useState(DEFAULT_VERSION);

    // 从服务端获取版本号（通过代理绕过 HTTPS 混合内容限制）
    useEffect(() => {
        const fetchAppVersion = async () => {
            try {
                const response = await fetch('/api/v1/app/info');
                const result = await response.json();
                if (result.code === 0 && result.data?.appVersion) {
                    // 提取版本号（格式如 "1.6.5 4500"，只取前面的版本号部分）
                    const version = result.data.appVersion;
                    setAppVersion(version);
                }
            } catch (error) {
                console.error('Failed to fetch app version:', error);
                // 保持默认版本号
            }
        };

        fetchAppVersion();
    }, []);

    // 生成带版本号的 glitchText
    const getGlitchText = () => {
        const prefix = translations[currentLanguage]?.glitchTextPrefix || 'Version';
        return `${prefix} V${appVersion}`;
    };

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
        const trans = translations[currentLanguage];
        const glitchText = getGlitchText();
        document.title = `${trans.title} - ${glitchText} | ${trans.subtitle}`;

        // 更新meta描述
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', trans.metaDescription);
        }

        // 更新meta关键词
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) {
            metaKeywords.setAttribute('content', trans.metaKeywords);
        }
    }, [currentLanguage, appVersion]);

    const changeLanguage = (language) => {
        if (translations[language]) {
            setCurrentLanguage(language);
        }
    };

    const t = (key) => {
        // 特殊处理 glitchText，返回动态版本号
        if (key === 'glitchText') {
            return getGlitchText();
        }

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
        translations: {
            ...translations[currentLanguage],
            glitchText: getGlitchText() // 添加动态 glitchText
        },
        availableLanguages: Object.keys(translations),
        appVersion
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export default LanguageContext; 