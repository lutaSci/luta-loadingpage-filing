import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
    formatMarketingCopyright,
    getMarketingContent,
    MARKETING_CONTENT,
    MARKETING_LOCALES,
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
    assert.deepEqual(MARKETING_LOCALES, ['zh-cn', 'zh-tw', 'en', 'ja', 'ko'])
    assert.equal(getMarketingContent('zh-cn').locale, 'zh-CN')
    assert.equal(getMarketingContent('zh-tw').locale, 'zh-TW')
    assert.equal(getMarketingContent('en').languageKey, 'en')
    assert.equal(getMarketingContent('ja').languageKey, 'ja')
    assert.equal(getMarketingContent('ko').languageKey, 'ko')
    assert.throws(() => getMarketingContent('fr'), /Unsupported marketing locale/)
})

test('all five marketing resources use one component data contract', () => {
    const entries = MARKETING_LOCALES.map(locale => structuredClone(MARKETING_CONTENT[locale]))

    for (const entry of entries) {
        delete entry.locale
        delete entry.localeKey
        delete entry.languageKey
        delete entry.path
    }

    for (const entry of entries.slice(1)) assert.deepEqual(shape(entries[0]), shape(entry))
    for (const locale of MARKETING_LOCALES) {
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
    const expectedPaths = ['/global/zh-cn', '/global/zh-tw', '/global/en', '/global/ja', '/global/ko']

    assert.deepEqual(MARKETING_LOCALES.map(locale => MARKETING_CONTENT[locale].path), expectedPaths)
    for (const locale of MARKETING_LOCALES) {
        assert.equal('market' in MARKETING_CONTENT[locale], false)
        assert.equal('alternatePath' in MARKETING_CONTENT[locale], false)
    }
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
