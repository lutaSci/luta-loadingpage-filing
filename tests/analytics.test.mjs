import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import {
    buildGoogleCtaPayload,
    buildGooglePageViewPayload,
    buildMetaCtaPayload,
    buildPosthogPageViewPayload,
    GOOGLE_ANALYTICS_ID,
    GOOGLE_CTA_EVENT_NAME,
    META_CTA_EVENT_NAME,
    sanitizeGoogleCampaignValue,
    sanitizePosthogCapture,
    sanitizeWebsiteProperties,
    shouldCaptureAdvertisingMeasurement,
    shouldCaptureGoogleAnalytics,
} from '../src/lib/analytics.js'
import {
    MEASUREMENT_CONSENT_STORAGE_KEY,
    readMeasurementConsent,
    requestMeasurementConsentSettings,
    subscribeMeasurementConsentSettings,
    writeMeasurementConsent,
} from '../src/lib/measurementConsent.js'

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
        experiment_key: 'marketing_cta_copy_v1',
        experiment_variant: 'treatment_platform',
        arbitrary_secret: 'must-not-pass',
    })

    assert.equal(safe.page_path, '/global/en')
    assert.equal(safe.utm_source, 'newsletter')
    assert.equal('utm_campaign' in safe, false)
    assert.equal('operator' in safe, false)
    assert.equal('arbitrary_secret' in safe, false)
    assert.equal(safe.click_id, 'lclk_0123456789abcdef0123456789abcdef')
    assert.equal(safe.experiment_key, 'marketing_cta_copy_v1')
    assert.equal(safe.experiment_variant, 'treatment_platform')
})

test('experiment fields reject free-form or personal values', () => {
    const safe = sanitizeWebsiteProperties({
        experiment_key: 'person@example.com',
        experiment_variant: 'treatment platform',
    })

    assert.deepEqual(safe, {})
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
        experiment_key: 'marketing_cta_copy_v1',
        experiment_variant: 'treatment_platform',
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

test('Meta measurement requires explicit consent and uses the same production/bearer gate', () => {
    assert.equal(shouldCaptureAdvertisingMeasurement(
        { traffic_purpose: 'production' },
        productionWindow(),
        'granted',
    ), true)
    assert.equal(shouldCaptureAdvertisingMeasurement(
        { traffic_purpose: 'production' },
        productionWindow(),
        'denied',
    ), false)
    assert.equal(shouldCaptureAdvertisingMeasurement(
        { traffic_purpose: 'production' },
        productionWindow('?state=signed-bearer'),
        'granted',
    ), false)
})

test('Meta CTA projection excludes Luta identity and campaign free text', () => {
    assert.deepEqual(buildMetaCtaPayload({
        page_path: '/install?state=signed',
        entry_type: 'shortlink',
        route_market: 'global',
        device_os: 'android',
        locale: 'zh-CN',
        cta_target: 'google_play',
        placement: 'install_gate',
        click_id: 'internal-click',
        link_id: 'internal-link',
        utm_campaign: 'free-form-campaign',
    }), {
        cta_target: 'google_play',
        placement: 'install_gate',
        entry_type: 'shortlink',
        route_market: 'global',
        device_os: 'android',
        locale: 'zh-CN',
        page_path: '/install',
    })
    assert.equal(META_CTA_EVENT_NAME, 'WebsiteDownloadCtaClicked')
})

test('advertising measurement consent is explicit and persisted without a default grant', () => {
    const values = new Map()
    const storage = {
        getItem: key => values.get(key) || null,
        setItem: (key, value) => values.set(key, String(value)),
    }
    assert.equal(readMeasurementConsent(storage), 'unknown')
    assert.equal(writeMeasurementConsent('granted', storage), 'granted')
    assert.equal(values.get(MEASUREMENT_CONSENT_STORAGE_KEY), 'granted')
    assert.equal(readMeasurementConsent(storage), 'granted')
    assert.equal(writeMeasurementConsent('invalid', storage), 'unknown')
})

test('advertising measurement settings reopen through an explicit shared event', () => {
    const listeners = new Map()
    class RuntimeCustomEvent {
        constructor(type) {
            this.type = type
        }
    }
    const runtimeWindow = {
        CustomEvent: RuntimeCustomEvent,
        addEventListener: (type, listener) => listeners.set(type, listener),
        removeEventListener: type => listeners.delete(type),
        dispatchEvent: event => listeners.get(event.type)?.(event),
    }
    let requests = 0
    const unsubscribe = subscribeMeasurementConsentSettings(
        () => { requests += 1 },
        runtimeWindow,
    )

    assert.equal(requestMeasurementConsentSettings(runtimeWindow), true)
    assert.equal(requests, 1)
    unsubscribe()
    assert.equal(requestMeasurementConsentSettings(runtimeWindow), true)
    assert.equal(requests, 1)
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

test('manual PostHog page view carries raw browser source without Smart Link identity', () => {
    const payload = buildPosthogPageViewPayload({
        surface: 'official_website',
        page_path: '/?state=signed-bearer',
        traffic_purpose: 'production',
        route_market: 'global',
        route_market_source: 'smart_link_context',
        device_os: 'ios',
        locale: 'zh-TW',
        utm_source: 'fb',
        utm_medium: 'paid',
        click_id: 'internal-click-id',
        link_id: 'internal-link-id',
        operator: 'ops-internal',
    }, {
        documentReferrer: 'https://M.Facebook.com/story.php?fbclid=secret#fragment',
        runtimeWindow: productionWindow('?state=never-copy'),
    })

    assert.deepEqual(payload, {
        surface: 'official_website',
        page_path: '/',
        traffic_purpose: 'production',
        device_os: 'ios',
        locale: 'zh-TW',
        utm_source: 'fb',
        utm_medium: 'paid',
        $current_url: 'https://lutaai.com/',
        $host: 'lutaai.com',
        $pathname: '/',
        $referrer: 'https://m.facebook.com/story.php',
        $referring_domain: 'm.facebook.com',
    })
    assert.equal(JSON.stringify(payload).includes('click_id'), false)
    assert.equal(JSON.stringify(payload).includes('link_id'), false)
    assert.equal(JSON.stringify(payload).includes('operator'), false)
    assert.equal(JSON.stringify(payload).includes('fbclid'), false)
    assert.equal(JSON.stringify(payload).includes('state'), false)
})

test('manual PostHog page view marks a missing browser referrer as direct', () => {
    const payload = buildPosthogPageViewPayload({
        surface: 'official_website',
        page_path: '/global/zh-tw',
        traffic_purpose: 'production',
    }, {
        documentReferrer: '',
        runtimeWindow: productionWindow(),
    })

    assert.equal(payload.$referrer, '$direct')
    assert.equal(payload.$referring_domain, '$direct')
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
    assert.match(source, /ad_storage: googleAdStorageConsent\(\)/)
    assert.match(source, /ad_user_data: 'denied'/)
    assert.match(source, /ad_personalization: 'denied'/)
    assert.match(source, /window\.gtag\('event', 'page_view', payload\)/)
    assert.match(source, /window\.gtag\('event', GOOGLE_CTA_EVENT_NAME/)
    assert.equal(GOOGLE_CTA_EVENT_NAME, 'website_download_cta_clicked')
    assert.equal(source.includes("export const trackEvent"), false)
})

test('PostHog provider keeps auto-capture off and emits native then custom page views', async () => {
    const source = await readFile(new URL('../src/lib/analytics.js', import.meta.url), 'utf8')
    assert.match(source, /capture_pageview: false/)
    assert.match(source, /if \(shouldCaptureNativePageView\) posthog\.capture\('\$pageview', pageViewPayload\)/)
    assert.match(source, /posthog\.capture\('website_page_viewed'/)
})

test('Meta provider is config-gated, consent-gated and emits only approved events', async () => {
    const source = await readFile(new URL('../src/lib/analytics.js', import.meta.url), 'utf8')
    assert.match(source, /config\.analytics\.metaPixelEnabled/)
    assert.match(source, /shouldCaptureAdvertisingMeasurement/)
    assert.match(source, /connect\.facebook\.net\/en_US\/fbevents\.js/)
    assert.match(source, /window\.fbq\('track', 'PageView'\)/)
    assert.match(source, /window\.fbq\('trackCustom', META_CTA_EVENT_NAME/)
    assert.doesNotMatch(source, /advancedMatching/i)
})

test('install display state never restores bearer identity to browser history', async () => {
    const source = await readFile(
        new URL('../src/hooks/useInstallJourneyController.js', import.meta.url),
        'utf8',
    )
    assert.match(source, /resolveInstallDisplayLocation/)
    assert.doesNotMatch(
        source,
        /window\.history\.replaceState\([^)]*continuationUrl/,
    )
})
