import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const nginx = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8')
const adminCaddy = readFileSync(new URL('../ops/caddy/admin.lutaai.com.caddy', import.meta.url), 'utf8')

test('website exposes only the bounded legacy Admin API bridge', () => {
    const bridge = nginx.match(/location \^~ \/api\/v1\/admin\/ \{[\s\S]*?\n    \}/)?.[0]

    assert.ok(bridge, 'scoped Admin compatibility bridge must exist')
    assert.match(bridge, /proxy_pass https:\/\/api\.lutaai\.com;/)
    assert.match(bridge, /Host api\.lutaai\.com/)
    assert.match(bridge, /Cache-Control "no-store, max-age=0" always/)
    assert.match(bridge, /X-Luta-Compatibility "admin-api-legacy" always/)
    assert.doesNotMatch(nginx, /location \^~ \/api\/ \{/)
    assert.doesNotMatch(nginx, /47\.76\.135\.140/)
})

test('Admin Caddy policy keeps HTML fresh and hashed assets immutable', () => {
    assert.match(adminCaddy, /admin\.lutaai\.com \{/)
    assert.match(adminCaddy, /root \* \/home\/luta-admin/)
    assert.match(adminCaddy, /header @adminHtml Cache-Control "no-store, max-age=0, must-revalidate"/)
    assert.match(adminCaddy, /header @adminAssets Cache-Control "public, max-age=31536000, immutable"/)
    assert.match(adminCaddy, /rewrite @adminSpaFallback \/index\.html/)
})
