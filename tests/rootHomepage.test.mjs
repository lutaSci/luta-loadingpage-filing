import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { resolveRootHomepage } from '../src/lib/rootHomepage.js'
import { resolvePreferredLanguage } from '../src/lib/languagePreference.js'

test('root homepage promotes the approved Chinese marketing experience only', () => {
    assert.deepEqual(resolveRootHomepage('zh'), {
        experience: 'marketing',
        locale: 'zh-cn',
    })
    assert.deepEqual(resolveRootHomepage('zhTW'), {
        experience: 'marketing',
        locale: 'zh-tw',
    })
})

test('root homepage preserves the existing English, Japanese and Korean experience', () => {
    for (const language of ['en', 'ja', 'ko']) {
        assert.deepEqual(resolveRootHomepage(language), { experience: 'legacy' })
    }
})

test('root route uses the compatibility dispatcher and keeps explicit marketing paths', async () => {
    const source = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8')
    const rootHomepage = await readFile(new URL('../src/pages/RootHomepage.jsx', import.meta.url), 'utf8')

    assert.match(source, /path="\/" element=\{<RootHomepage \/>\}/)
    assert.match(source, /path="\/global\/zh-cn" element=\{<MarketingLanding locale="zh-cn" \/>\}/)
    assert.match(source, /path="\/global\/zh-tw" element=\{<MarketingLanding locale="zh-tw" \/>\}/)
    assert.match(source, /path="\/install" element=\{<Install \/>\}/)
    assert.match(source, /path="\/privacy" element=\{<Privacy \/>\}/)
    assert.match(source, /path="\/terms" element=\{<Terms \/>\}/)
    assert.match(source, /path="\/contact" element=\{<Contact \/>\}/)
    assert.match(rootHomepage, /const transitionLanguage = location\.state\?\.preferredLanguage/)
    assert.match(rootHomepage, /const preferredLanguage = transitionLanguage \|\| currentLanguage/)
    assert.match(rootHomepage, /transitionLanguage !== currentLanguage/)
    assert.match(rootHomepage, /replace: true/)
    assert.match(rootHomepage, /state: null/)
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

    assert.match(landing, /content\.localeKey === 'zh-tw' \? 'zhTW' : 'zh'/)
    assert.match(landing, /changeLanguage\(language\)/)
    assert.doesNotMatch(landing, /currentLanguage !== language/)
    assert.match(provider, /window\.location\.pathname\.startsWith\('\/global\/zh-'\)/)
    assert.match(provider, /if \(!isMarketingLanding\)/)
    assert.match(provider, /localStorage\.setItem\('preferred-language', language\)/)
    assert.match(provider, /const changeLanguage = useCallback/)
    assert.doesNotMatch(landing, /document\.title = previous/)
    assert.doesNotMatch(landing, /document\.documentElement\.lang = previous/)
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

    for (const language of ['zh', 'zhTW', 'en', 'ja', 'ko']) {
        assert.match(source, new RegExp(`value: '${language}'`))
    }
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
