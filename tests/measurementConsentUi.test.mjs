import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('consent prompt collapses completely and settings move to durable page controls', async () => {
    const banner = await readFile(
        new URL('../src/components/MeasurementConsentBanner.jsx', import.meta.url),
        'utf8',
    )
    const footer = await readFile(
        new URL('../src/components/marketing/MarketingFooter.jsx', import.meta.url),
        'utf8',
    )
    const privacy = await readFile(
        new URL('../src/pages/Privacy.jsx', import.meta.url),
        'utf8',
    )

    assert.match(banner, /if \(!expanded\) return null/)
    assert.doesNotMatch(banner, /fixed bottom-3 left-3/)
    assert.match(footer, /requestMeasurementConsentSettings/)
    assert.match(privacy, /requestMeasurementConsentSettings/)
})

test('compact prompt keeps explicit allow and necessary choices', async () => {
    const banner = await readFile(
        new URL('../src/components/MeasurementConsentBanner.jsx', import.meta.url),
        'utf8',
    )

    assert.match(banner, /role="region"/)
    assert.match(banner, /MEASUREMENT_CONSENT_VALUES\.denied/)
    assert.match(banner, /MEASUREMENT_CONSENT_VALUES\.granted/)
    assert.match(banner, /min-h-11/)
    assert.match(banner, /--ad-measurement-prompt-clearance/)
    assert.match(banner, /ResizeObserver/)
})
