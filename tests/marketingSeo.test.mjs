import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { test } from 'node:test'

import { MARKETING_CONTENT, MARKETING_LOCALES } from '../src/content/marketingLanding.js'
import {
    getMarketingSeoModel,
    MARKETING_HREFLANG_LINKS,
    MARKETING_SOCIAL_IMAGE,
    MARKETING_SOCIAL_IMAGE_URL,
} from '../src/lib/marketingSeo.js'

function getJpegDimensions(buffer) {
    assert.equal(buffer[0], 0xff, 'JPEG must start with an FF marker')
    assert.equal(buffer[1], 0xd8, 'JPEG must start with the SOI marker')

    const startOfFrameMarkers = new Set([
        0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
        0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
    ])
    let offset = 2

    while (offset + 8 < buffer.length) {
        while (buffer[offset] === 0xff) offset += 1
        const marker = buffer[offset]
        offset += 1

        if (marker === 0xd9 || marker === 0xda) break
        if (marker >= 0xd0 && marker <= 0xd7) continue

        const segmentLength = buffer.readUInt16BE(offset)
        if (startOfFrameMarkers.has(marker)) {
            return {
                height: buffer.readUInt16BE(offset + 3),
                width: buffer.readUInt16BE(offset + 5),
            }
        }
        offset += segmentLength
    }

    throw new Error('JPEG dimensions were not found')
}

function getPngDimensions(buffer) {
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    assert.equal(buffer.subarray(0, 8).equals(pngSignature), true, 'PNG signature must be valid')
    return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
    }
}

function sha256(buffer) {
    return createHash('sha256').update(buffer).digest('hex')
}

test('every explicit locale has self-referencing canonical and localized Open Graph data', () => {
    for (const localeKey of MARKETING_LOCALES) {
        const content = MARKETING_CONTENT[localeKey]
        const seo = getMarketingSeoModel(content)

        assert.equal(seo.canonicalUrl, `https://lutaai.com${content.path}`)
        assert.equal(seo.title, content.metadata.title)
        assert.equal(seo.description, content.metadata.description)
        assert.equal(seo.imageUrl, MARKETING_SOCIAL_IMAGE_URL)
        assert.equal(seo.imageType, MARKETING_SOCIAL_IMAGE.type)
        assert.equal(seo.imageWidth, MARKETING_SOCIAL_IMAGE.width)
        assert.equal(seo.imageHeight, MARKETING_SOCIAL_IMAGE.height)
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

    assert.match(source, /property="og:image" content="https:\/\/lutaai\.com\/luta-social-card-v1\.jpg"/)
    assert.match(source, /property="og:image:secure_url" content="https:\/\/lutaai\.com\/luta-social-card-v1\.jpg"/)
    assert.match(source, /property="og:image:type" content="image\/jpeg"/)
    assert.match(source, /property="og:image:width" content="1200"/)
    assert.match(source, /property="og:image:height" content="630"/)
    assert.match(source, /name="twitter:image" content="https:\/\/lutaai\.com\/luta-social-card-v1\.jpg"/)
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

test('social card assets keep the crawler-safe dimensions and transfer budget', async () => {
    const socialCardUrl = new URL('../public/luta-social-card-v1.jpg', import.meta.url)
    const legacyFallbackUrl = new URL('../public/twitter_meta_img.png', import.meta.url)
    const [socialCard, socialCardStats, legacyFallback, legacyFallbackStats] = await Promise.all([
        readFile(socialCardUrl),
        stat(socialCardUrl),
        readFile(legacyFallbackUrl),
        stat(legacyFallbackUrl),
    ])

    assert.deepEqual(getJpegDimensions(socialCard), { width: 1200, height: 630 })
    assert.ok(
        socialCardStats.size <= 200 * 1024,
        `social card exceeds 200 KiB: ${socialCardStats.size} bytes`,
    )
    assert.equal(
        sha256(socialCard),
        '09aaef525d62a4d28fad5eb4c219ea3b226e91bc67335ccde351c8b3ef2e683b',
    )
    assert.deepEqual(getPngDimensions(legacyFallback), { width: 1200, height: 630 })
    assert.ok(
        legacyFallbackStats.size <= 400 * 1024,
        `legacy social card fallback exceeds 400 KiB: ${legacyFallbackStats.size} bytes`,
    )
    assert.equal(
        sha256(legacyFallback),
        '170c3a11543468f535744dc19e822525bc268ad2982612499b845843789f1c18',
    )
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
