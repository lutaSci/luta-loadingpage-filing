import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { resolveRootHomepage } from '../src/lib/rootHomepage.js'
import { resolvePreferredLanguage } from '../src/lib/languagePreference.js'

test('root homepage uses the shared marketing experience for all five languages', () => {
    const expected = {
        zh: 'zh-cn',
        zhTW: 'zh-tw',
        en: 'en',
        ja: 'ja',
        ko: 'ko',
    }

    for (const [language, locale] of Object.entries(expected)) {
        assert.deepEqual(resolveRootHomepage(language), { experience: 'marketing', locale })
    }
    assert.deepEqual(resolveRootHomepage('unknown'), { experience: 'legacy' })
})

test('root route uses the compatibility dispatcher and keeps explicit marketing paths', async () => {
    const source = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8')
    const rootHomepage = await readFile(new URL('../src/pages/RootHomepage.jsx', import.meta.url), 'utf8')

    assert.match(source, /path="\/" element=\{<RootHomepage \/>\}/)
    assert.match(source, /path="\/global\/zh-cn" element=\{<MarketingLanding locale="zh-cn" \/>\}/)
    assert.match(source, /path="\/global\/zh-tw" element=\{<MarketingLanding locale="zh-tw" \/>\}/)
    assert.match(source, /path="\/global\/en" element=\{<MarketingLanding locale="en" \/>\}/)
    assert.match(source, /path="\/global\/ja" element=\{<MarketingLanding locale="ja" \/>\}/)
    assert.match(source, /path="\/global\/ko" element=\{<MarketingLanding locale="ko" \/>\}/)
    assert.match(source, /path="\/install" element=\{<SmartLinkInstallEntry \/>\}/)
    assert.match(source, /<SmartLinkJourneyProvider>/)
    assert.match(source, /<\/SmartLinkJourneyProvider>/)
    assert.match(source, /path="\/privacy" element=\{<Privacy \/>\}/)
    assert.match(source, /path="\/terms" element=\{<Terms \/>\}/)
    assert.match(source, /path="\/contact" element=\{<Contact \/>\}/)
    assert.match(rootHomepage, /const transitionLanguage = location\.state\?\.preferredLanguage/)
    assert.match(rootHomepage, /const preferredLanguage = transitionLanguage \|\| currentLanguage/)
    assert.match(rootHomepage, /transitionLanguage !== currentLanguage/)
    assert.match(rootHomepage, /replace: true/)
    assert.match(rootHomepage, /state: null/)
})

test('install compatibility route keeps the legacy page behind an opt-in homepage bridge', async () => {
    const [route, provider, config] = await Promise.all([
        readFile(new URL('../src/pages/SmartLinkInstallEntry.jsx', import.meta.url), 'utf8'),
        readFile(new URL('../src/contexts/SmartLinkJourneyContext.jsx', import.meta.url), 'utf8'),
        readFile(new URL('../src/config/index.js', import.meta.url), 'utf8'),
    ])

    assert.match(route, /usesHomepageSurface \? <RootHomepage \/> : <Install \/>/)
    assert.match(config, /VITE_SMART_LINK_HOMEPAGE_SURFACE === 'true'/)
    assert.match(provider, /location\.pathname === '\/install'/)
    assert.match(provider, /navigate\(`\/\$\{location\.hash \|\| ''\}`,\s*\{ replace: true \}\)/)
    assert.match(provider, /hasSmartLinkBearer\(location\.search\)/)
})

test('production release forwards, persists and validates the Smart Link homepage flag', async () => {
    const [dockerfile, compose, deploy, nginx] = await Promise.all([
        readFile(new URL('../dockerfile', import.meta.url), 'utf8'),
        readFile(new URL('../docker-compose.yml', import.meta.url), 'utf8'),
        readFile(new URL('../deploy.sh', import.meta.url), 'utf8'),
        readFile(new URL('../nginx.conf', import.meta.url), 'utf8'),
    ])

    assert.match(dockerfile, /ARG VITE_SMART_LINK_HOMEPAGE_SURFACE=false/)
    assert.match(dockerfile, /COPY nginx\.conf \/etc\/nginx\/conf\.d\/default\.conf\s+RUN nginx -t/)
    assert.match(
        dockerfile,
        /ENV VITE_SMART_LINK_HOMEPAGE_SURFACE=\$\{VITE_SMART_LINK_HOMEPAGE_SURFACE\}/,
    )
    assert.match(
        compose,
        /VITE_SMART_LINK_HOMEPAGE_SURFACE:\s*\$\{VITE_SMART_LINK_HOMEPAGE_SURFACE:-false\}/,
    )
    assert.ok(deploy.includes('.smart-link-homepage-surface.local'))
    assert.ok(deploy.includes('VITE_SMART_LINK_HOMEPAGE_SURFACE="${VITE_SMART_LINK_HOMEPAGE_SURFACE:-false}"'))
    assert.ok(deploy.includes('export VITE_SMART_LINK_HOMEPAGE_SURFACE'))
    assert.ok(nginx.includes('~*(^|&)(state|legacy_slug|click_id)= 0;'))
    assert.ok(nginx.includes('~*(^|&)(state|legacy_slug|click_id)= "no-store, max-age=0";'))
    assert.ok(nginx.includes('access_log /var/log/nginx/access.log combined if=$luta_log_request;'))
    assert.match(nginx, /location = \/install \{[\s\S]*Cache-Control "no-store, max-age=0"/)
})

test('traditional Chinese browser detection and html language use the standard tag', async () => {
    const source = await readFile(new URL('../src/contexts/LanguageContext.jsx', import.meta.url), 'utf8')

    assert.match(source, /currentLanguage === 'zhTW' \? 'zh-TW'/)
    assert.equal(resolvePreferredLanguage({ browserLanguage: 'zh-TW' }), 'zhTW')
    assert.equal(resolvePreferredLanguage({ browserLanguage: 'zh-Hant' }), 'zhTW')
    assert.equal(resolvePreferredLanguage({ browserLanguage: 'zh-Hant-TW' }), 'zhTW')
    assert.equal(resolvePreferredLanguage({ browserLanguage: 'zh-HK' }), 'zhTW')
    assert.equal(resolvePreferredLanguage({ browserLanguage: 'zh-MO' }), 'zhTW')
    assert.equal(resolvePreferredLanguage({ browserLanguage: 'zh-Hans-SG' }), 'zh')
})

test('marketing routes persist their explicit locale and own page metadata', async () => {
    const landing = await readFile(new URL('../src/pages/MarketingLanding.jsx', import.meta.url), 'utf8')
    const provider = await readFile(new URL('../src/contexts/LanguageContext.jsx', import.meta.url), 'utf8')

    assert.match(landing, /changeLanguage\(content\.languageKey\)/)
    assert.doesNotMatch(landing, /currentLanguage !== language/)
    assert.match(provider, /isMarketingPath\(window\.location\.pathname\)/)
    assert.match(provider, /if \(!isMarketingLanding\)/)
    assert.match(provider, /localStorage\.setItem\('preferred-language', language\)/)
    assert.match(provider, /const changeLanguage = useCallback/)
    assert.doesNotMatch(landing, /document\.title = previous/)
    assert.doesNotMatch(landing, /document\.documentElement\.lang = previous/)
})

test('marketing path detection accepts canonical locale routes with a trailing slash', async () => {
    const { isMarketingPath } = await import('../src/lib/marketingLocales.js')

    for (const path of ['/', '/global/zh-cn/', '/global/zh-tw/', '/global/en/', '/global/ja/', '/global/ko/']) {
        assert.equal(isMarketingPath(path), true, path)
    }

    assert.equal(isMarketingPath('/contact/'), false)
})

test('static share metadata matches the released root positioning', async () => {
    const source = await readFile(new URL('../index.html', import.meta.url), 'utf8')

    assert.match(source, /<title>汝塔 LUTA｜经典阅读与个人修学工具<\/title>/)
    assert.match(source, /name="luta-homepage-experience" content="marketing-v1"/)
    assert.match(source, /property="og:title" content="汝塔 LUTA｜经典阅读与个人修学工具"/)
    assert.match(source, /name="twitter:title" content="汝塔 LUTA｜经典阅读与个人修学工具"/)
})

test('production deploy smoke verifies the root marketing shell', async () => {
    const source = await readFile(new URL('../deploy.sh', import.meta.url), 'utf8')

    assert.match(source, /http:\/\/127\.0\.0\.1:8000\//)
    assert.match(source, /\$\{PUBLIC_SMOKE_BASE_URL\}\//)
    assert.match(source, /luta-homepage-experience.*marketing-v1/)
    assert.match(source, /git status --porcelain --untracked-files=all/)
    assert.match(source, /必须再用真实浏览器验证/)
})

test('marketing header preserves access to all five existing languages', async () => {
    const source = await readFile(new URL('../src/components/marketing/LocaleSwitcher.jsx', import.meta.url), 'utf8')
    const registry = await import('../src/lib/marketingLocales.js')

    assert.deepEqual(
        registry.MARKETING_LOCALE_REGISTRY.map(locale => locale.languageKey),
        ['zh', 'zhTW', 'en', 'ja', 'ko'],
    )
    assert.deepEqual(
        registry.MARKETING_LOCALE_REGISTRY.map(locale => locale.path),
        ['/global/zh-cn', '/global/zh-tw', '/global/en', '/global/ja', '/global/ko'],
    )
    assert.match(source, /MARKETING_LOCALE_REGISTRY/)
    assert.match(source, /const currentValue = content\.languageKey/)
    assert.match(source, /changeLanguage\(option\.value\)/)
    assert.match(source, /location\.search/)
    assert.match(source, /location\.hash/)
    assert.match(source, /state: \{ preferredLanguage: option\.value \}/)
    assert.doesNotMatch(source, /<select/)
    assert.match(source, /aria-haspopup="menu"/)
    assert.match(source, /role="menuitemradio"/)
    assert.match(source, /ArrowDown/)
    assert.match(source, /ArrowUp/)
    assert.match(source, /Home/)
    assert.match(source, /End/)
    assert.match(source, /Escape/)
})

test('legal routes consume currentLanguage and include Traditional Chinese keys', async () => {
    for (const path of ['../src/pages/Privacy.jsx', '../src/pages/Terms.jsx', '../src/pages/Contact.jsx']) {
        const source = await readFile(new URL(path, import.meta.url), 'utf8')
        assert.match(source, /currentLanguage/)
        assert.match(source, /zhTW:/)
    }
})

test('public document shells expose no generated internal document identifiers', async () => {
    for (const path of ['../src/components/PaperDocument.jsx', '../src/pages/pages/Contact.jsx']) {
        const source = await readFile(new URL(path, import.meta.url), 'utf8')
        assert.doesNotMatch(source, /Document ID/)
        assert.doesNotMatch(source, /Date\.now\(\)\.toString/)
    }

    const paperDocument = await readFile(new URL('../src/components/PaperDocument.jsx', import.meta.url), 'utf8')
    assert.match(paperDocument, /t\('backToHome'\)/)
})
