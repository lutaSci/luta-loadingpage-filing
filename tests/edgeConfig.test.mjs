import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const nginx = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8')

test('legacy Admin API bridge stays ahead of the SPA fallback', () => {
    const apiBridgeStart = nginx.indexOf('location ^~ /api/')
    const spaFallbackStart = nginx.indexOf('location / {')

    assert.notEqual(apiBridgeStart, -1)
    assert.notEqual(spaFallbackStart, -1)
    assert.ok(apiBridgeStart < spaFallbackStart)

    const apiBridge = nginx.slice(apiBridgeStart, spaFallbackStart)
    assert.match(apiBridge, /proxy_ssl_server_name on;/)
    assert.match(apiBridge, /proxy_set_header Host api\.lutaai\.com;/)
    assert.match(apiBridge, /proxy_pass https:\/\/api\.lutaai\.com;/)
    assert.doesNotMatch(apiBridge, /47\.76\.135\.140/)
})
