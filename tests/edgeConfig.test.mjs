import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const nginx = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8')
const adminCaddy = readFileSync(new URL('../ops/caddy/admin.lutaai.com.caddy', import.meta.url), 'utf8')
const downloadCaddy = readFileSync(new URL('../ops/caddy/download.lutaai.com.caddy', import.meta.url), 'utf8')

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

test('APK delivery route logs only opaque aggregate-delivery fields', () => {
    assert.match(downloadCaddy, /log apk_delivery \{/)
    assert.match(downloadCaddy, /no_hostname/)
    assert.match(downloadCaddy, /\{\$APK_DELIVERY_LOG_PATH:\/var\/log\/caddy\/apk-delivery\.json\}/)
    assert.match(downloadCaddy, /mode 0640/)
    assert.match(downloadCaddy, /roll_at 00:00/)
    assert.match(downloadCaddy, /roll_keep 0/)
    assert.match(downloadCaddy, /roll_keep_for 840h/)
    assert.match(downloadCaddy, /request delete/)
    assert.match(downloadCaddy, /resp_headers delete/)
    assert.match(downloadCaddy, /size rename bytes_written/)
    assert.match(downloadCaddy, /map \{header\.User-Agent\} \{known_bot\}/)
    assert.match(downloadCaddy, /production\|qa\|smoke\|internal\|development/)
    assert.match(downloadCaddy, /dl_\[0-9a-f\]\{32\}/)
    assert.match(downloadCaddy, /artifact_size_bytes/)
    assert.match(downloadCaddy, /log_append <traffic_purpose/)
    assert.match(downloadCaddy, /log_append <download_id/)
    assert.match(downloadCaddy, /log_append <artifact_id/)
    assert.match(downloadCaddy, /log_append <request_method/)
    assert.match(downloadCaddy, /log_append <app_version/)
    assert.match(downloadCaddy, /log_append <build_number/)
    assert.match(downloadCaddy, /log_append response_content_range \{http\.response\.header\.Content-Range\}/)
    assert.match(downloadCaddy, /log_append <known_bot/)
    assert.match(downloadCaddy, /rewrite \{re\.qualified_apk_delivery\.object_path\}/)
    assert.match(downloadCaddy, /@invalid_apk_delivery path \/dl\/\*/)
    assert.doesNotMatch(downloadCaddy, /X-Forwarded-For/)
    assert.doesNotMatch(downloadCaddy, /log_append <range_header/)
})
