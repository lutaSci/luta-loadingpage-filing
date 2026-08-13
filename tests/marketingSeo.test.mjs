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
    const content = MARKETING_CONTENT['zh-cn']
    const seo = getMarketingSeoModel(content, '/')

    assert.equal(seo.canonicalUrl, 'https://lutaai.com/')
    assert.equal(seo.title, content.metadata.title)
    assert.equal(MARKETING_HREFLANG_LINKS.at(-1).hreflang, 'x-default')
    assert.equal(MARKETING_HREFLANG_LINKS.at(-1).href, 'https://lutaai.com/')
})

test('the document shell contains absolute social assets and only active-language alternates', async () => {
    const source = await readFile(new URL('../index.html', import.meta.url), 'utf8')

    assert.match(source, /property="og:image" content="https:\/\/lutaai\.com\/twitter_meta_img\.png"/)
    assert.match(source, /name="twitter:image" content="https:\/\/lutaai\.com\/twitter_meta_img\.png"/)
    for (const { hreflang, href } of MARKETING_HREFLANG_LINKS) {
        assert.ok(source.includes(`hreflang="${hreflang}" href="${href}"`))
    }
    for (const retiredLocale of ['en', 'ja', 'ko']) {
        assert.equal(source.includes(`/global/${retiredLocale}`), false)
    }
    for (const retiredOgLocale of ['en_US', 'ja_JP', 'ko_KR']) {
        assert.equal(source.includes(`content="${retiredOgLocale}"`), false)
    }
})

test('production server prerenders active routes and temporarily redirects retired routes', async () => {
    const source = await readFile(new URL('../nginx.conf', import.meta.url), 'utf8')

    assert.match(source, /location ~ \^\/global\/\(zh-cn\|zh-tw\)\/\?\$/)
    assert.match(
        source,
        /location ~ \^\/global\/\(zh-cn\|zh-tw\)\/\?\$ \{[\s\S]{0,400}add_header Cache-Control \$luta_html_cache_control always;/,
    )
    assert.match(source, /try_files \/global\/\$1\.html =404;/)
    assert.match(
        source,
        /location ~ \^\/global\/\(en\|ja\|ko\)\/\?\$ \{[\s\S]{0,350}absolute_redirect off;[\s\S]{0,350}Cache-Control "no-store, max-age=0"[\s\S]{0,350}return 302 \/\$is_args\$args;/,
    )
})

test('crawler discovery files expose the canonical marketing routes and protect install ingress', async () => {
    const [robots, sitemap] = await Promise.all([
        readFile(new URL('../public/robots.txt', import.meta.url), 'utf8'),
        readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8'),
    ])

    assert.match(robots, /^User-agent: \*$/m)
    assert.match(robots, /^Disallow: \/install$/m)
    assert.match(robots, /^Sitemap: https:\/\/lutaai\.com\/sitemap\.xml$/m)

    for (const href of new Set(MARKETING_HREFLANG_LINKS.map(link => link.href))) {
        assert.ok(sitemap.includes(`<loc>${href}</loc>`), `missing sitemap URL: ${href}`)
    }
    for (const retiredLocale of ['en', 'ja', 'ko']) {
        assert.equal(sitemap.includes(`/global/${retiredLocale}`), false)
    }
})
