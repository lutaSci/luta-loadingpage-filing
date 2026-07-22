import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
    formatMarketingCopyright,
    getMarketingContent,
    MARKETING_CONTENT,
    MARKETING_LOCALES,
} from '../src/content/marketingLanding.js'

function shape(value) {
    if (Array.isArray(value)) return value.map(shape)
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, shape(child)]))
    }
    return typeof value
}

test('marketing locales are explicit and never silently fall back', () => {
    assert.deepEqual(MARKETING_LOCALES, ['zh-cn', 'zh-tw'])
    assert.equal(getMarketingContent('zh-cn').locale, 'zh-CN')
    assert.equal(getMarketingContent('zh-tw').locale, 'zh-TW')
    assert.throws(() => getMarketingContent('en'), /Unsupported marketing locale/)
})

test('simplified and traditional resources use one component data contract', () => {
    const simplified = structuredClone(MARKETING_CONTENT['zh-cn'])
    const traditional = structuredClone(MARKETING_CONTENT['zh-tw'])

    for (const entry of [simplified, traditional]) {
        delete entry.locale
        delete entry.localeKey
        delete entry.path
        delete entry.alternatePath
    }

    assert.deepEqual(shape(simplified), shape(traditional))
    assert.deepEqual(
        MARKETING_CONTENT['zh-cn'].stories.map(story => story.id),
        ['reading', 'practice', 'history'],
    )
    assert.deepEqual(
        MARKETING_CONTENT['zh-tw'].stories.map(story => story.id),
        ['reading', 'practice', 'history'],
    )
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

test('locale paths only switch content versions', () => {
    const cn = MARKETING_CONTENT['zh-cn']
    const tw = MARKETING_CONTENT['zh-tw']

    assert.equal(cn.path, '/global/zh-cn')
    assert.equal(cn.alternatePath, '/global/zh-tw')
    assert.equal(tw.path, '/global/zh-tw')
    assert.equal(tw.alternatePath, '/global/zh-cn')
    assert.equal('market' in cn, false)
    assert.equal('market' in tw, false)
})

test('legal filing identity is never localized', () => {
    assert.equal(
        MARKETING_CONTENT['zh-cn'].footer.icp,
        '粤ICP备2025461997号-1',
    )
    assert.equal(
        MARKETING_CONTENT['zh-tw'].footer.icp,
        MARKETING_CONTENT['zh-cn'].footer.icp,
    )
    assert.equal(
        MARKETING_CONTENT['zh-tw'].footer.copyrightOwner,
        MARKETING_CONTENT['zh-cn'].footer.copyrightOwner,
    )
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
