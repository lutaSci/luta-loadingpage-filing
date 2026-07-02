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

        iosSteps: "App Store 官方下载",
        androidSteps: "只需1步，2分钟安装成功",

        iosAppStoreTitle: "下载汝塔",
        iosAppStoreDesc: "App Store 官方正版，一键安装",
        iosAppStoreCta: "前往 App Store 下载",
        iosWaitlistSteps: "iOS 即将开放",
        iosWaitlistTitle: "汝塔 iOS 版开放时通知我",
        iosWaitlistDesc: "留下邮箱，等你所在地区可以安装 iOS 版时，我们马上通知你。",
        iosWaitlistCta: "开放时通知我",
        iosWaitlistNote: "邮箱仅用于本次 iOS 开放通知。",
        iosWaitlistUnavailableCta: "通知入口待配置",

        iosTestFlightLabel: "参与内测",
        iosTestFlightStep1Title: "第1步 · 准备安装",
        iosTestFlightStep1Desc: "请先下载苹果官方软件「TestFlight」，安装内测版需要用到它",
        iosTestFlightStep1Cta: "去下载 TestFlight",
        iosTestFlightStep1Note: "下载后回到本页面即可，无需打开它",
        iosTestFlightConfirmTitle: "即将前往 App Store",
        iosTestFlightConfirmDo1: "下载后直接回到本页面",
        iosTestFlightConfirmDo2: "点击第2步完成安装",
        iosTestFlightConfirmDont: "无需打开 TestFlight（否则会弹出兑换码）",
        iosTestFlightConfirmBtn: "好的，前往下载",
        iosTestFlightStep2Title: "第2步 · 安装内测版汝塔",
        iosTestFlightStep2Desc: "点击按钮后按照提示完成安装",
        iosTestFlightStep2Cta: "一键安装内测版",
        iosTestFlightStep2Note: "若弹出「兑换码」页面，请先关闭 TestFlight 再点击此按钮",

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

        iosSteps: "App Store 官方下載",
        androidSteps: "只需1步，2分鐘安裝成功",

        iosAppStoreTitle: "下載汝塔",
        iosAppStoreDesc: "App Store 官方正版，一鍵安裝",
        iosAppStoreCta: "前往 App Store 下載",
        iosWaitlistSteps: "iOS 即將開放",
        iosWaitlistTitle: "汝塔 iOS 版開放時通知我",
        iosWaitlistDesc: "留下電子郵件，等你所在地區可以安裝 iOS 版時，我們馬上通知你。",
        iosWaitlistCta: "開放時通知我",
        iosWaitlistNote: "電子郵件僅用於本次 iOS 開放通知。",
        iosWaitlistUnavailableCta: "通知入口待配置",

        iosTestFlightLabel: "參與內測",
        iosTestFlightStep1Title: "第1步 · 準備安裝",
        iosTestFlightStep1Desc: "請先下載蘋果官方軟件「TestFlight」，安裝內測版需要用到它",
        iosTestFlightStep1Cta: "去下載 TestFlight",
        iosTestFlightStep1Note: "下載後回到本頁面即可，無需打開它",
        iosTestFlightConfirmTitle: "即將前往 App Store",
        iosTestFlightConfirmDo1: "下載後直接回到本頁面",
        iosTestFlightConfirmDo2: "點擊第2步完成安裝",
        iosTestFlightConfirmDont: "無需打開 TestFlight（否則會彈出兌換碼）",
        iosTestFlightConfirmBtn: "好的，前往下載",
        iosTestFlightStep2Title: "第2步 · 安裝內測版汝塔",
        iosTestFlightStep2Desc: "點擊按鈕後按照提示完成安裝",
        iosTestFlightStep2Cta: "一鍵安裝內測版",
        iosTestFlightStep2Note: "若彈出「兌換碼」頁面，請先關閉 TestFlight 再點擊此按鈕",

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

        iosSteps: "Available on the App Store",
        androidSteps: "Just 1 step, ready in 2 min",

        iosAppStoreTitle: "Download LUTA",
        iosAppStoreDesc: "Official version on the App Store, one-tap install",
        iosAppStoreCta: "Download on the App Store",
        iosWaitlistSteps: "iOS is coming soon",
        iosWaitlistTitle: "Notify me when LUTA is ready on iOS",
        iosWaitlistDesc: "Leave your email and we'll let you know as soon as LUTA can be installed in your region.",
        iosWaitlistCta: "Notify me",
        iosWaitlistNote: "We'll only use your email for this iOS availability notice.",
        iosWaitlistUnavailableCta: "Notification link pending",

        iosTestFlightLabel: "Join Beta",
        iosTestFlightStep1Title: "Step 1 · Prepare to Install",
        iosTestFlightStep1Desc: "Please download \"TestFlight\", Apple's official app — it's needed to install the beta version",
        iosTestFlightStep1Cta: "Download TestFlight",
        iosTestFlightStep1Note: "After downloading, return to this page. No need to open it",
        iosTestFlightConfirmTitle: "Going to App Store",
        iosTestFlightConfirmDo1: "Return to this page after download",
        iosTestFlightConfirmDo2: "Tap Step 2 to complete installation",
        iosTestFlightConfirmDont: "Don't open TestFlight (it will ask for a redeem code)",
        iosTestFlightConfirmBtn: "OK, go download",
        iosTestFlightStep2Title: "Step 2 · Install Beta LUTA",
        iosTestFlightStep2Desc: "Tap the button and follow the prompts to install",
        iosTestFlightStep2Cta: "Install Beta Version",
        iosTestFlightStep2Note: "If a \"Redeem\" page appears, close TestFlight first, then tap this button again",

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

        iosSteps: "App Storeで入手可能",
        androidSteps: "たった1ステップ、2分で完了",

        iosAppStoreTitle: "LUTAをダウンロード",
        iosAppStoreDesc: "App Store公式版、ワンタップインストール",
        iosAppStoreCta: "App Storeでダウンロード",
        iosWaitlistSteps: "iOS版は準備中",
        iosWaitlistTitle: "LUTA iOS版が使えるようになったらお知らせ",
        iosWaitlistDesc: "メールアドレスを残していただければ、お住まいの地域でLUTA iOS版をインストールできるようになり次第お知らせします。",
        iosWaitlistCta: "通知を受け取る",
        iosWaitlistNote: "メールアドレスは今回のiOS版のお知らせにのみ使用します。",
        iosWaitlistUnavailableCta: "通知リンク未設定",

        iosTestFlightLabel: "ベータ参加",
        iosTestFlightStep1Title: "ステップ1 · インストール準備",
        iosTestFlightStep1Desc: "Apple公式アプリ「TestFlight」を先にダウンロードしてください。ベータ版のインストールに必要です",
        iosTestFlightStep1Cta: "TestFlight をダウンロード",
        iosTestFlightStep1Note: "ダウンロード後はこのページに戻ってください。開く必要はありません",
        iosTestFlightConfirmTitle: "App Storeに移動します",
        iosTestFlightConfirmDo1: "ダウンロード後このページに戻る",
        iosTestFlightConfirmDo2: "ステップ2をタップしてインストール",
        iosTestFlightConfirmDont: "TestFlightを開かないでください（コード入力画面が出ます）",
        iosTestFlightConfirmBtn: "了解、ダウンロードへ",
        iosTestFlightStep2Title: "ステップ2 · ベータ版LUTAをインストール",
        iosTestFlightStep2Desc: "ボタンをタップし、案内に従ってインストールしてください",
        iosTestFlightStep2Cta: "ベータ版をインストール",
        iosTestFlightStep2Note: "「コードを入力」画面が出た場合は、TestFlightを閉じてこのボタンを再度タップしてください",

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

        iosSteps: "App Store에서 다운로드",
        androidSteps: "단 1단계, 2분이면 완료",

        iosAppStoreTitle: "LUTA 다운로드",
        iosAppStoreDesc: "App Store 공식 버전, 원탭 설치",
        iosAppStoreCta: "App Store에서 다운로드",
        iosWaitlistSteps: "iOS 버전 준비 중",
        iosWaitlistTitle: "LUTA iOS 버전이 준비되면 알려드릴게요",
        iosWaitlistDesc: "이메일을 남겨주시면 현재 지역에서 LUTA iOS 버전을 설치할 수 있게 되는 즉시 알려드릴게요.",
        iosWaitlistCta: "알림 받기",
        iosWaitlistNote: "이메일은 이번 iOS 버전 알림 용도로만 사용합니다.",
        iosWaitlistUnavailableCta: "알림 링크 설정 대기 중",

        iosTestFlightLabel: "베타 참여",
        iosTestFlightStep1Title: "1단계 · 설치 준비",
        iosTestFlightStep1Desc: "Apple 공식 앱 \"TestFlight\"를 먼저 다운로드해 주세요. 베타 버전 설치에 필요합니다",
        iosTestFlightStep1Cta: "TestFlight 다운로드",
        iosTestFlightStep1Note: "다운로드 후 이 페이지로 돌아와 주세요. 열 필요 없습니다",
        iosTestFlightConfirmTitle: "App Store로 이동합니다",
        iosTestFlightConfirmDo1: "다운로드 후 이 페이지로 돌아오기",
        iosTestFlightConfirmDo2: "2단계를 눌러 설치 완료",
        iosTestFlightConfirmDont: "TestFlight를 열지 마세요 (코드 입력 화면이 나옵니다)",
        iosTestFlightConfirmBtn: "네, 다운로드하기",
        iosTestFlightStep2Title: "2단계 · 베타 LUTA 설치",
        iosTestFlightStep2Desc: "버튼을 누른 후 안내에 따라 설치하세요",
        iosTestFlightStep2Cta: "베타 버전 설치",
        iosTestFlightStep2Note: "\"코드 입력\" 화면이 나타나면, TestFlight를 닫고 이 버튼을 다시 눌러주세요",

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
