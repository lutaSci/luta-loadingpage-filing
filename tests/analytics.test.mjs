import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import {
    buildGoogleCtaPayload,
    buildGooglePageViewPayload,
    GOOGLE_ANALYTICS_ID,
    GOOGLE_CTA_EVENT_NAME,
    sanitizeGoogleCampaignValue,
    sanitizePosthogCapture,
    sanitizeWebsiteProperties,
    shouldCaptureGoogleAnalytics,
} from '../src/lib/analytics.js'

function productionWindow(search = '') {
    return {
        location: {
            hostname: 'lutaai.com',
            origin: 'https://lutaai.com',
            pathname: '/global/en',
            protocol: 'https:',
            search,
        },
    }
}

test('Google capture is production-only and fails closed while bearer state is visible', () => {
    assert.equal(
        shouldCaptureGoogleAnalytics(
            { traffic_purpose: 'production' },
            productionWindow(),
        ),
        true,
    )
    assert.equal(
        shouldCaptureGoogleAnalytics(
            { traffic_purpose: 'qa' },
            productionWindow(),
        ),
        false,
    )
    assert.equal(
        shouldCaptureGoogleAnalytics(
            { traffic_purpose: 'production' },
            productionWindow('?state=signed-bearer'),
        ),
        false,
    )
    assert.equal(
        shouldCaptureGoogleAnalytics(
            { traffic_purpose: 'production' },
            {
                location: {
                    ...productionWindow().location,
                    hostname: 'localhost',
                    origin: 'http://localhost:4173',
                    protocol: 'http:',
                },
            },
        ),
        false,
    )
})

test('website allowlist rejects unknown properties and likely personal data', () => {
    const safe = sanitizeWebsiteProperties({
        surface: 'official_website',
        page_path: '/global/en?state=secret',
        entry_type: 'direct_utm',
        traffic_purpose: 'production',
        utm_source: 'newsletter',
        utm_campaign: 'person@example.com',
        operator: '+86 138 0013 8000',
        click_id: 'lclk_0123456789abcdef0123456789abcdef',
        arbitrary_secret: 'must-not-pass',
    })

    assert.equal(safe.page_path, '/global/en')
    assert.equal(safe.utm_source, 'newsletter')
    assert.equal('utm_campaign' in safe, false)
    assert.equal('operator' in safe, false)
    assert.equal('arbitrary_secret' in safe, false)
    assert.equal(safe.click_id, 'lclk_0123456789abcdef0123456789abcdef')
})

test('manual GA page view contains a canonical path and approved campaign fields only', () => {
    const payload = buildGooglePageViewPayload({
        page_path: '/global/en?state=signed',
        traffic_purpose: 'production',
        utm_source: 'xhs',
        utm_medium: 'social',
        utm_campaign: 'launch_2026',
        click_id: 'lclk_0123456789abcdef0123456789abcdef',
        link_id: 'link_internal_1',
        operator: 'ops_internal',
    }, {
        documentTitle: 'LUTA',
        documentReferrer: 'https://example.com/article?email=person%40example.com',
        runtimeWindow: productionWindow('?state=never-copy'),
    })

    assert.deepEqual(payload, {
        send_to: GOOGLE_ANALYTICS_ID,
        page_location: 'https://lutaai.com/global/en',
        page_title: 'LUTA',
        page_referrer: 'https://example.com/article',
        campaign_source: 'xhs',
        campaign_medium: 'social',
        campaign_name: 'launch_2026',
    })
    assert.equal(JSON.stringify(payload).includes('click_id'), false)
    assert.equal(JSON.stringify(payload).includes('link_id'), false)
    assert.equal(JSON.stringify(payload).includes('operator'), false)
    assert.equal(JSON.stringify(payload).includes('state'), false)
})

test('GA CTA projection excludes attribution identity and free-form properties', () => {
    const payload = buildGoogleCtaPayload({
        page_path: '/install',
        entry_type: 'shortlink',
        route_market: 'global',
        device_os: 'ios',
        locale: 'zh-CN',
        cta_target: 'apple_app_store',
        placement: 'marketing_hero',
        click_id: 'click-secret',
        link_id: 'link-secret',
        option_id: 'option-secret',
        utm_campaign: 'free-form-campaign',
        operator: 'ops_internal',
    }, { runtimeWindow: productionWindow('?state=never-copy') })

    assert.deepEqual(payload, {
        send_to: GOOGLE_ANALYTICS_ID,
        page_location: 'https://lutaai.com/install',
        cta_target: 'apple_app_store',
        placement: 'marketing_hero',
        entry_type: 'shortlink',
        route_market: 'global',
        device_os: 'ios',
        locale: 'zh-CN',
        page_path: '/install',
    })
})

test('PostHog send boundary removes query strings and identity-shaped attribution', () => {
    const capture = sanitizePosthogCapture({
        event: 'website_page_viewed',
        properties: {
            token: 'required-project-token',
            $current_url: 'https://lutaai.com/global/en?state=signed-bearer',
            $session_entry_url: 'https://lutaai.com/?email=person%40example.com',
            $referrer: 'https://example.com/article?invite_code=secret',
            $initial_referrer: '$direct',
            $session_entry_utm_campaign: 'person@example.com',
            utm_source: 'newsletter',
            gclid: 'ad-identity',
            $initial_gclid: 'old-ad-identity',
            click_id: 'approved-internal-click-id',
        },
    })

    assert.deepEqual(capture.properties, {
        token: 'required-project-token',
        $current_url: 'https://lutaai.com/global/en',
        $session_entry_url: 'https://lutaai.com/',
        $referrer: 'https://example.com/article',
        $initial_referrer: '$direct',
        utm_source: 'newsletter',
        click_id: 'approved-internal-click-id',
    })
})

test('GA campaign sanitizer permits controlled tokens and rejects identity-shaped values', () => {
    assert.equal(sanitizeGoogleCampaignValue('launch_2026'), 'launch_2026')
    assert.equal(sanitizeGoogleCampaignValue('person@example.com'), null)
    assert.equal(sanitizeGoogleCampaignValue('13800138000'), null)
    assert.equal(sanitizeGoogleCampaignValue('带空格的活动'), null)
})

test('Google provider uses manual page views and a single approved CTA event', async () => {
    const source = await readFile(new URL('../src/lib/analytics.js', import.meta.url), 'utf8')
    assert.match(source, /send_page_view: false/)
    assert.match(source, /ad_storage: 'denied'/)
    assert.match(source, /ad_user_data: 'denied'/)
    assert.match(source, /ad_personalization: 'denied'/)
    assert.match(source, /window\.gtag\('event', 'page_view', payload\)/)
    assert.match(source, /window\.gtag\('event', GOOGLE_CTA_EVENT_NAME/)
    assert.equal(GOOGLE_CTA_EVENT_NAME, 'website_download_cta_clicked')
    assert.equal(source.includes("export const trackEvent"), false)
})

test('install display state never restores bearer identity to browser history', async () => {
    const source = await readFile(
        new URL('../src/hooks/useInstallJourneyController.js', import.meta.url),
        'utf8',
    )
    assert.match(source, /window\.history\.replaceState\(\{\}, '', `\/install\$\{safeChoice\}`\)/)
    assert.doesNotMatch(
        source,
        /window\.history\.replaceState\([^)]*continuationUrl/,
    )
})
