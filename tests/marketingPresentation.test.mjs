import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const readSource = relativePath => readFile(new URL(relativePath, import.meta.url), 'utf8')

test('hero turns the three-screen contract into an accessible draggable carousel', async () => {
    const [hero, visual] = await Promise.all([
        readSource('../src/components/marketing/MarketingHero.jsx'),
        readSource('../src/components/marketing/ProductVisual.jsx'),
    ])

    assert.match(hero, /<HeroVisualFan\s+visuals=\{content\.hero\.visuals\}/s)
    assert.match(visual, /visuals\.map\(visual\s*=>/)
    assert.match(visual, /drag="x"/)
    assert.match(visual, /dragMomentum=\{false\}/)
    assert.match(visual, /useReducedMotion/)
    assert.match(visual, /loading="eager"/)
    assert.match(visual, /fetchPriority=\{isActive \? 'high' : 'low'\}/)
    assert.match(visual, /aria-live="polite"/)
    assert.match(visual, /ArrowLeft/)
    assert.match(visual, /ArrowRight/)
    assert.match(visual, /aria-current=/)
    assert.match(visual, /practice:\s*practiceImage/)
})

test('hero viewport fills the first visual viewport without clipping short or zoomed content', async () => {
    const css = await readSource('../src/components/marketing/marketing.css')

    assert.match(css, /--luta-marketing-size-first-view:\s*100vh/)
    assert.match(css, /--luta-marketing-size-first-view:\s*100svh/)
    assert.match(css, /--luta-marketing-size-first-view:\s*100dvh/)
    assert.match(css, /min-block-size:\s*max\(0px,\s*calc\(var\(--luta-marketing-size-first-view\) - var\(--luta-marketing-size-header-current\)\)\)/)
    assert.match(css, /touch-action:\s*pan-y pinch-zoom/)
    assert.match(css, /\.luta-marketing-hero-pagination button\s*\{[^}]*width:\s*2\.75rem;[^}]*height:\s*2\.75rem/s)
    assert.doesNotMatch(css, /\.luta-marketing-hero-layout\s*\{[^}]*min-height:\s*(?:48\.75rem|51rem)/s)
})

test('store action presentation contains no internal market or device narration', async () => {
    const source = await readSource('../src/components/marketing/StoreActionGroup.jsx')

    assert.doesNotMatch(
        source,
        /luta-marketing-device-note|marketLabels|desktopDeviceNote|deviceNote/,
    )
    assert.doesNotMatch(source, /data-(?:action-key|channel|market|placement)=/)
    assert.match(source, /data-status=\{state\.status\}/)
    assert.match(source, /data-variant=/)
})

test('footer renders copyright through the dynamic formatter', async () => {
    const source = await readSource('../src/components/marketing/MarketingFooter.jsx')

    assert.match(source, /formatMarketingCopyright\(/)
    assert.match(source, /content\.footer\.copyrightOwner/)
    assert.match(source, /content\.footer\.copyrightRights/)
    assert.doesNotMatch(source, /©\s*20\d{2}|['"]2024['"]/)
})

test('sticky header has no bottom divider declaration', async () => {
    const css = await readSource('../src/components/marketing/marketing.css')
    const headerRule = css.match(/(?:^|\n)\.luta-marketing-header\s*\{([^}]*)\}/)?.[1]

    assert.ok(headerRule, 'expected the base marketing header rule')
    assert.match(headerRule, /position:\s*sticky/)
    assert.doesNotMatch(headerRule, /border-(?:bottom|block-end)\s*:/)
})

test('rounded surfaces and controls consume semantic radius tokens', async () => {
    const css = await readSource('../src/components/marketing/marketing.css')

    assert.match(css, /--luta-marketing-radius-control:\s*[^;]+;/)
    assert.match(css, /--luta-marketing-radius-surface-small:\s*[^;]+;/)
    assert.match(css, /--luta-marketing-radius-surface:\s*[^;]+;/)
    assert.match(
        css,
        /\.luta-marketing-store-tabs\s*\{[^}]*border-radius:\s*var\(--luta-marketing-radius-action\)/s,
    )
    assert.match(
        css,
        /\.luta-marketing-store-action\s*\{[^}]*border-radius:\s*var\(--luta-marketing-radius-action\)/s,
    )
    assert.match(
        css,
        /\.luta-marketing-feature-map\s*>\s*div\s*\{[^}]*border-radius:\s*var\(--luta-marketing-radius-surface-small\)/s,
    )
    assert.match(
        css,
        /\.luta-marketing-principle-field article\s*\{[^}]*border-radius:\s*var\(--luta-marketing-radius-surface\)/s,
    )
})
