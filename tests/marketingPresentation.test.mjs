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

test('mobile landing exposes a viewport-fixed platform selector and synchronized install CTA', async () => {
    const [hero, pageShell, landing, storeGroup, css] = await Promise.all([
        readSource('../src/components/marketing/MarketingHero.jsx'),
        readSource('../src/components/marketing/PageShell.jsx'),
        readSource('../src/pages/MarketingLanding.jsx'),
        readSource('../src/components/marketing/StoreActionGroup.jsx'),
        readSource('../src/components/marketing/marketing.css'),
    ])
    const copyIndex = hero.indexOf('className="luta-marketing-hero-copy"')
    const actionsIndex = hero.indexOf('className="luta-marketing-hero-actions"')
    const visualIndex = hero.indexOf('className="luta-marketing-hero-visual"')

    assert.ok(copyIndex >= 0, 'expected hero copy')
    assert.ok(visualIndex > copyIndex, 'expected product visual after hero copy')
    assert.ok(actionsIndex > visualIndex, 'expected install actions after the product visual')
    assert.doesNotMatch(hero, /useInstallDockVisibility|data-install-dock-visible|new IntersectionObserver/)
    assert.doesNotMatch(hero, /presentation="persistent-mobile"/)
    assert.match(pageShell, /className="luta-marketing-floating-actions"/)
    assert.match(pageShell, /data-slot="persistent-install-actions"/)
    assert.match(landing, /floatingActions={floatingActions}/)
    assert.match(landing, /presentation="persistent-mobile"/)
    assert.match(
        css,
        /@media \(max-width: 63\.999rem\)[\s\S]*?\.luta-marketing-floating-actions\s*\{[^}]*position:\s*fixed/s,
    )
    assert.match(css, /--luta-marketing-floating-action-bottom:\s*4rem/)
    assert.match(css, /inset-block-end:\s*calc\([\s\S]*var\(--luta-marketing-floating-action-bottom\)[\s\S]*env\(safe-area-inset-bottom, 0px\)[\s\S]*\)/)
    assert.doesNotMatch(css, /data-install-dock-visible|backdrop-filter/)
    assert.match(css, /data-presentation="persistent-mobile"/)
    assert.match(css, /\.luta-marketing-store-action:not\(\[data-presented="true"\]\)/)
    assert.match(css, /width:\s*min\(\s*23rem,/)
    assert.match(css, /grid-template-columns:\s*var\(--luta-marketing-floating-action-size\) minmax\(0, 1fr\)/)
    assert.match(css, /min-height:\s*3\.5rem/)
    assert.match(css, /grid-template-columns:\s*1\.25rem minmax\(0, 1fr\) 1\.25rem/)
    assert.match(css, /padding-block-end:\s*calc\(8\.5rem \+ env\(safe-area-inset-bottom, 0px\)\)/)
    assert.match(storeGroup, /aria-haspopup="menu"/)
    assert.match(storeGroup, /role="menuitemradio"/)
    assert.match(storeGroup, /adapter\.changeDesktopTab\(platform\)/)
    assert.match(storeGroup, /selectedPlatform === 'ios' \? Apple : Smartphone/)
    assert.match(storeGroup, /selectedPlatform === 'ios' \? 'iOS' : 'Android'/)
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
    assert.match(source, /valueCtaCopy/)
    assert.match(source, /state\.actionKey === adapter\.primaryAction\?\.actionKey/)
    assert.match(source, /adapter\.primaryAction \|\| adapter\.states\[0\]/)
    assert.match(source, /data-presented=\{isPrimary \|\| undefined\}/)
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
