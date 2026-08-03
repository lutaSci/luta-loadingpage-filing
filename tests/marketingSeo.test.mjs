import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { MARKETING_CONTENT, MARKETING_LOCALES } from '../src/content/marketingLanding.js'
import {
    getMarketingSeoModel,
    MARKETING_HREFLANG_LINKS,
    MARKETING_SOCIAL_IMAGE_URL,
} from '../src/lib/marketingSeo.js'

test('every explicit locale has self-referencing canonical and localized Open Graph data', () => {
    for (const localeKey of MARKETING_LOCALES) {
        const content = MARKETING_CONTENT[localeKey]
        const seo = getMarketingSeoModel(content)

        assert.equal(seo.canonicalUrl, `https://lutaai.com${content.path}`)
        assert.equal(seo.title, content.metadata.title)
        assert.equal(seo.description, content.metadata.description)
        assert.equal(seo.imageUrl, MARKETING_SOCIAL_IMAGE_URL)
        assert.equal(seo.ogLocaleAlternates.length, MARKETING_LOCALES.length - 1)
    }
})

test('root metadata remains x-default while preserving the rendered language', () => {
    const content = MARKETING_CONTENT.en
    const seo = getMarketingSeoModel(content, '/')

    assert.equal(seo.canonicalUrl, 'https://lutaai.com/')
    assert.equal(seo.title, content.metadata.title)
    assert.equal(MARKETING_HREFLANG_LINKS.at(-1).hreflang, 'x-default')
    assert.equal(MARKETING_HREFLANG_LINKS.at(-1).href, 'https://lutaai.com/')
})

test('the document shell contains absolute social assets and the complete hreflang cluster', async () => {
    const source = await readFile(new URL('../index.html', import.meta.url), 'utf8')

    assert.match(source, /property="og:image" content="https:\/\/lutaai\.com\/twitter_meta_img\.png"/)
    assert.match(source, /name="twitter:image" content="https:\/\/lutaai\.com\/twitter_meta_img\.png"/)
    for (const { hreflang, href } of MARKETING_HREFLANG_LINKS) {
        assert.ok(source.includes(`hreflang="${hreflang}" href="${href}"`))
    }
})

test('production server maps all localized routes to prerendered HTML', async () => {
    const source = await readFile(new URL('../nginx.conf', import.meta.url), 'utf8')

    assert.match(source, /location ~ \^\/global\/\(zh-cn\|zh-tw\|en\|ja\|ko\)\/\?\$/)
    assert.match(source, /try_files \/global\/\$1\.html =404;/)
})
