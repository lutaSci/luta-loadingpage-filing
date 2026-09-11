import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { resolveDeployment } from '../src/config/deployment.js'
import { buildLegacyControlledOutUrl } from '../src/lib/installFlow.js'
import { config } from '../src/config/index.js'
import { initializeAnalytics } from '../src/lib/analytics.js'

const qa = {
    VITE_DEPLOYMENT_ENV: 'qa',
    VITE_LUTA_API_BASE: 'https://qa-api.lutaai.com',
    VITE_ATTRIBUTION_CONTINUE_BASE: 'https://qa-go.lutaai.com',
    VITE_POSTHOG_ENABLED: 'false',
}

test('QA requires a complete isolated deployment, not a production fallback', () => {
    const deployment = resolveDeployment(qa)
    assert.equal(deployment.apiBase, qa.VITE_LUTA_API_BASE)
    assert.equal(deployment.continueBase, qa.VITE_ATTRIBUTION_CONTINUE_BASE)
    assert.equal(deployment.appLinkBase, '')
    assert.equal(deployment.outBase, '')
    assert.equal(deployment.posthogEnabled, false)
    for (const field of ['VITE_LUTA_API_BASE', 'VITE_ATTRIBUTION_CONTINUE_BASE', 'VITE_POSTHOG_ENABLED']) {
        const incomplete = { ...qa }
        delete incomplete[field]
        assert.throws(() => resolveDeployment(incomplete), /QA deployment/)
    }
    for (const value of ['https://api.lutaai.com', 'http://qa-api.lutaai.com',
        'https://qa-api.lutaai.com.evil.test', 'https://u@qa-api.lutaai.com',
        'https://qa-api.lutaai.com:8443', 'https://qa-api.lutaai.com?secret=x']) {
        assert.throws(() => resolveDeployment({ ...qa, VITE_LUTA_API_BASE: value }), /QA deployment/)
    }
    assert.throws(() => resolveDeployment({ ...qa, VITE_ATTRIBUTION_CONTINUE_BASE: 'https://go.lutaai.com' }))
    for (const field of ['VITE_GLOBAL_MOBILE_HANDOFF', 'VITE_SMART_LINK_HOMEPAGE_SURFACE',
        'VITE_META_PIXEL_ENABLED', 'VITE_POSTHOG_ENABLED']) {
        assert.throws(() => resolveDeployment({ ...qa, [field]: 'true' }), /QA deployment/)
    }
    assert.throws(() => resolveDeployment({ VITE_DEPLOYMENT_ENV: 'qaa' }), /deployment environment/)
})

test('production defaults and existing opt-in behavior remain unchanged', () => {
    const prod = resolveDeployment({})
    assert.equal(prod.continueBase, 'https://go.lutaai.com')
    assert.equal(prod.appLinkBase, 'https://link.lutaai.com/l')
    assert.equal(prod.outBase, 'https://go.lutaai.com/out')
    assert.equal(prod.posthogEnabled, true)
    assert.equal(config.api.base, 'https://api.lutaai.com')
})

test('legacy out trusts only the build-configured origin and preserves opaque identity', () => {
    const args = { legacySlug: 'global-store', clickId: `lclk_${'a'.repeat(32)}`,
        optionId: 'global_google_play', trustedOrigin: qa.VITE_ATTRIBUTION_CONTINUE_BASE }
    const url = new URL(buildLegacyControlledOutUrl({ ...args, base: `${args.trustedOrigin}/r` }))
    assert.equal(url.origin, args.trustedOrigin)
    assert.equal(url.pathname, '/r/global-store/out')
    assert.deepEqual([...url.searchParams.keys()], ['click_id', 'option_id'])
    for (const base of ['https://go.lutaai.com/r', 'https://qa-go.lutaai.com.evil.test/r',
        'https://u@qa-go.lutaai.com/r', 'https://qa-go.lutaai.com:444/r',
        'http://qa-go.lutaai.com/r', 'https://qa-go.lutaai.com/out']) {
        assert.equal(buildLegacyControlledOutUrl({ ...args, base }), null)
    }
    assert.equal(buildLegacyControlledOutUrl({ ...args, trustedOrigin: 'https://go.lutaai.com',
        base: 'https://qa-go.lutaai.com/r' }), null)
})

test('disabled analytics never initialize PostHog on a public QA host', async () => {
    const originalWindow = globalThis.window
    const originalEnabled = config.analytics.posthogEnabled
    try {
        globalThis.window = { location: { hostname: 'qa.lutaai.com', search: '', pathname: '/install' } }
        config.analytics.posthogEnabled = false
        assert.equal(await initializeAnalytics(), null)
    } finally {
        config.analytics.posthogEnabled = originalEnabled
        if (originalWindow === undefined) delete globalThis.window
        else globalThis.window = originalWindow
    }
})

test('QA edge has no production proxy or analytics network escape', () => {
    const nginx = readFileSync(new URL('../ops/qa/nginx.conf', import.meta.url), 'utf8')
    assert.doesNotMatch(nginx, /proxy_pass|https:\/\/api\.lutaai\.com/)
    assert.match(nginx, /connect-src 'self' https:\/\/qa-api\.lutaai\.com/)
    assert.match(nginx, /location \^~ \/api\//)
    assert.match(nginx, /location \^~ \/share\//)
    assert.match(nginx, /no-store/)
    assert.match(nginx, /X-Robots-Tag/)
    const logFormat = nginx.match(/log_format\s+qa_path_only\s+([^;]+);/)[1]
    assert.doesNotMatch(logFormat, /\$request(?:_uri)?\b|\$args\b/)
    assert.match(nginx, /return 302 \/\$is_args\$args;/)
})
