export const config = {
    app: {
        name: '汝塔APP',
        version: '1.1.0',
        description: '读经伴侣 - 让每个读经都充满生机'
    },
    downloads: {
        appStore: 'https://apps.apple.com/cn/app/%E6%B1%9D%E5%A1%94/id6752280249',
        iosTestFlight: 'itms-beta://testflight.apple.com/join/48vCAeVp',
        testFlightAppStore: 'https://apps.apple.com/us/app/testflight/id899247664?mt=8',
        iosOverseasWaitlistFormUrl: 'https://gcnrjk2sw7wg.feishu.cn/share/base/shrcn2HYMn0YfFKUUtle6orQqIh',
        android: 'https://download.lutaai.com/v1.1/android-app-release.apk',
        googlePlay: 'https://play.google.com/store/apps/details?id=com.luta.reader',
        installDoc: 'https://gcnrjk2sw7wg.feishu.cn/docx/GvqHdM6ikoXXhhxcavYcq0owndb'
    },
    attribution: {
        continueBase: import.meta.env?.VITE_ATTRIBUTION_CONTINUE_BASE || 'https://go.lutaai.com',
        defaultSlug: import.meta.env?.VITE_ATTRIBUTION_DEFAULT_SLUG || 'website-direct',
    },
    springFestival: {
        puzzleUrl: 'https://game.lutaai.com',
    },
    support: {
        wechatId: 'aiyoooxin',
    },
    apkApi: '',
    pages: {
        privacy: '/privacy',
        terms: '/terms',
        contact: '/contact'
    },
    social: {
        twitter: 'https://x.com/yooxin_tech',
        github: 'https://github.com/lutaSci',
        email: 'aivor@lutaai.com'
    },
    wecomQrCode: 'https://luta-app.oss-cn-beijing.aliyuncs.com/assets/%E6%B1%9D%E5%A1%94%E5%86%85%E6%B5%8B%E9%80%9A%E7%9F%A5%E7%BE%A4.png'
} 
