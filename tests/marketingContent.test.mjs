import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
    ALL_MARKETING_LOCALES,
    formatMarketingCopyright,
    getMarketingContent,
    MARKETING_CONTENT,
    MARKETING_LOCALES,
    RETIRED_MARKETING_LOCALES,
} from '../src/content/marketingLanding.js'
import { MARKETING_LOCALE_REGISTRY } from '../src/lib/marketingLocales.js'

function shape(value) {
    if (Array.isArray(value)) return value.map(shape)
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, shape(child)]))
    }
    return typeof value
}

test('marketing locales are explicit and never silently fall back', () => {
    assert.deepEqual(MARKETING_LOCALES, ['zh-cn', 'zh-tw'])
    assert.deepEqual(RETIRED_MARKETING_LOCALES, ['en', 'ja', 'ko'])
    assert.equal(getMarketingContent('zh-cn').locale, 'zh-CN')
    assert.equal(getMarketingContent('zh-tw').locale, 'zh-TW')
    assert.equal(getMarketingContent('en').languageKey, 'en')
    assert.equal(getMarketingContent('ja').languageKey, 'ja')
    assert.equal(getMarketingContent('ko').languageKey, 'ko')
    assert.throws(() => getMarketingContent('fr'), /Unsupported marketing locale/)
})

test('all retained marketing resources use one component data contract', () => {
    const entries = ALL_MARKETING_LOCALES.map(locale => structuredClone(MARKETING_CONTENT[locale]))

    for (const entry of entries) {
        delete entry.locale
        delete entry.localeKey
        delete entry.languageKey
        delete entry.path
    }

    for (const entry of entries.slice(1)) assert.deepEqual(shape(entries[0]), shape(entry))
    for (const locale of ALL_MARKETING_LOCALES) {
        assert.deepEqual(
            MARKETING_CONTENT[locale].stories.map(story => story.id),
            ['reading', 'practice', 'history'],
        )
    }
})

test('marketing content identity stays aligned with the locale registry', () => {
    for (const registered of MARKETING_LOCALE_REGISTRY) {
        const resource = MARKETING_CONTENT[registered.localeKey]

        assert.ok(resource, registered.localeKey)
        assert.deepEqual(
            {
                localeKey: resource.localeKey,
                languageKey: resource.languageKey,
                path: resource.path,
            },
            {
                localeKey: registered.localeKey,
                languageKey: registered.languageKey,
                path: registered.path,
            },
        )
        assert.equal(resource.locale, registered.htmlLang)
    }
})

test('hero visual contract keeps three accessible screens with one prioritized center image', () => {
    for (const locale of MARKETING_LOCALES) {
        const visuals = MARKETING_CONTENT[locale].hero.visuals

        assert.equal(visuals.length, 3)
        assert.deepEqual(visuals.map(visual => visual.slot), ['start', 'center', 'end'])
        assert.equal(new Set(visuals.map(visual => visual.image)).size, 3)
        assert.equal(visuals.filter(visual => visual.priority).length, 1)
        assert.equal(visuals.find(visual => visual.priority)?.slot, 'center')
        assert.equal(visuals.every(visual => typeof visual.alt === 'string' && visual.alt.trim()), true)
        assert.equal(visuals.every(visual => typeof visual.label === 'string' && visual.label.trim()), true)
        assert.equal(typeof MARKETING_CONTENT[locale].hero.carouselInstructions, 'string')
    }
})

test('hero leads with reading, understanding, daily practice, and a truthful free-reading action', () => {
    const simplified = MARKETING_CONTENT['zh-cn']
    const traditional = MARKETING_CONTENT['zh-tw']

    assert.equal(simplified.navigation.getApp, '免费开始阅读')
    assert.equal(simplified.hero.eyebrow, '面向全球中文读者的佛教经典阅读与理解工具')
    assert.deepEqual(simplified.hero.desktopTitle, [
        '从阅读经典开始',
        '理解经文中的智慧',
        '让修学融入日常',
    ])
    assert.match(simplified.hero.lead, /白话译文/)
    assert.match(simplified.hero.lead, /AI 辅助理解/)
    assert.deepEqual(simplified.hero.primaryCta, {
        label: '免费开始阅读',
        description: '基础阅读持续免费 · 将前往适合您的官方安装方式',
    })

    assert.equal(traditional.navigation.getApp, '免費開始閱讀')
    assert.match(traditional.hero.lead, /白話譯文/)

    for (const locale of MARKETING_LOCALES) {
        const resource = MARKETING_CONTENT[locale]
        assert.equal(resource.navigation.getApp, resource.hero.primaryCta.label)
        assert.equal(typeof resource.hero.primaryCta.label, 'string')
        assert.equal(resource.hero.primaryCta.label.trim().length > 0, true)
        assert.equal(typeof resource.hero.primaryCta.description, 'string')
        assert.equal(resource.hero.primaryCta.description.trim().length > 0, true)
    }
})

test('public store content excludes internal market and device narration', () => {
    for (const locale of MARKETING_LOCALES) {
        const store = MARKETING_CONTENT[locale].store

        assert.equal('deviceNote' in store, false)
        assert.equal('desktopDeviceNote' in store, false)
        assert.equal('marketLabels' in store, false)
    }
})

test('China beta copy leads with user goals and includes redeem-code recovery', () => {
    const store = MARKETING_CONTENT['zh-cn'].store

    assert.equal(store.actions.expand_testflight.label, '体验新版汝塔')
    assert.equal(store.actions.expand_testflight.description, '内测版，需要完成 2 步')
    assert.match(store.actions.open_testflight_app.label, /苹果官方工具/)
    assert.match(store.actions.open_testflight_app.description, /iOS 16/)
    assert.match(store.actions.open_testflight_app.description, /不要点“打开”/)
    assert.match(store.actions.open_testflight_beta.label, /安装新版汝塔/)
    assert.match(store.testflightNote, /输入兑换码/)
    assert.doesNotMatch(store.actions.expand_testflight.label, /TestFlight/i)
})

test('locale paths only switch content versions', () => {
    const expectedPaths = ['/global/zh-cn', '/global/zh-tw']

    assert.deepEqual(MARKETING_LOCALES.map(locale => MARKETING_CONTENT[locale].path), expectedPaths)
    for (const locale of MARKETING_LOCALES) {
        assert.equal('market' in MARKETING_CONTENT[locale], false)
        assert.equal('alternatePath' in MARKETING_CONTENT[locale], false)
    }

    assert.deepEqual(
        RETIRED_MARKETING_LOCALES.map(locale => MARKETING_CONTENT[locale].path),
        ['/global/en', '/global/ja', '/global/ko'],
    )
})

test('legal filing identity is never localized', () => {
    const canonicalFooter = MARKETING_CONTENT['zh-cn'].footer

    assert.equal(canonicalFooter.icp, '粤ICP备2025461997号-1')
    for (const locale of MARKETING_LOCALES) {
        assert.equal(MARKETING_CONTENT[locale].footer.icp, canonicalFooter.icp)
        assert.equal(MARKETING_CONTENT[locale].footer.copyrightOwner, canonicalFooter.copyrightOwner)
    }
})

test('copyright formatter accepts an explicit year without hardcoded dated copy', () => {
    for (const locale of MARKETING_LOCALES) {
        const footer = MARKETING_CONTENT[locale].footer
        const formatted = formatMarketingCopyright(
            footer.copyrightOwner,
            footer.copyrightRights,
            2031,
        )

        assert.match(formatted, /^© 2031 /)
        assert.equal(formatted.includes(footer.copyrightOwner), true)
        assert.equal(formatted.endsWith(footer.copyrightRights), true)
        assert.equal('copyright' in footer, false)
    }
})
