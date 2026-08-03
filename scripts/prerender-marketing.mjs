import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { MARKETING_CONTENT, MARKETING_LOCALES } from '../src/content/marketingLanding.js'
import {
    getMarketingSeoModel,
    MARKETING_HREFLANG_LINKS,
} from '../src/lib/marketingSeo.js'

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const distDirectory = path.join(projectRoot, 'dist')
const builtIndexPath = path.join(distDirectory, 'index.html')
const SEO_BLOCK_PATTERN = /<!-- luta-seo-start -->[\s\S]*?<!-- luta-seo-end -->/

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
}

function renderSeoBlock(content) {
    const seo = getMarketingSeoModel(content)
    const alternateLinks = MARKETING_HREFLANG_LINKS
        .map(({ hreflang, href }) => (
            `    <link rel="alternate" hreflang="${escapeHtml(hreflang)}" href="${escapeHtml(href)}" />`
        ))
        .join('\n')
    const ogLocaleAlternates = seo.ogLocaleAlternates
        .map(locale => `    <meta property="og:locale:alternate" content="${escapeHtml(locale)}" />`)
        .join('\n')

    return `<!-- luta-seo-start -->
    <link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />
${alternateLinks}
    <meta name="luta-homepage-experience" content="marketing-v1" />
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="keywords" content="${escapeHtml(seo.keywords)}" />
    <meta name="author" content="LUTA 汝塔" />

    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:image" content="${escapeHtml(seo.imageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(seo.imageAlt)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(seo.canonicalUrl)}" />
    <meta property="og:site_name" content="LUTA 汝塔" />
    <meta property="og:locale" content="${escapeHtml(seo.ogLocale)}" />
${ogLocaleAlternates}

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
    <meta name="twitter:image" content="${escapeHtml(seo.imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(seo.imageAlt)}" />
    <meta name="twitter:creator" content="@lutaai" />
    <meta name="twitter:site" content="@lutaai" />

    <title>${escapeHtml(seo.title)}</title>
    <!-- luta-seo-end -->`
}

const builtIndex = await readFile(builtIndexPath, 'utf8')
if (!SEO_BLOCK_PATTERN.test(builtIndex)) {
    throw new Error('The built index is missing the bounded LUTA SEO block')
}

const outputDirectory = path.join(distDirectory, 'global')
await mkdir(outputDirectory, { recursive: true })

for (const localeKey of MARKETING_LOCALES) {
    const content = MARKETING_CONTENT[localeKey]
    const localizedHtml = builtIndex
        .replace(/<html lang="[^"]+">/, `<html lang="${escapeHtml(content.locale)}">`)
        .replace(SEO_BLOCK_PATTERN, renderSeoBlock(content))

    await writeFile(path.join(outputDirectory, `${localeKey}.html`), localizedHtml, 'utf8')
}
