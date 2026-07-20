import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const nginx = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8')

test('website does not expose a legacy Admin API bridge', () => {
    assert.doesNotMatch(nginx, /location \^~ \/api\//)
    assert.doesNotMatch(nginx, /https:\/\/lutaai\.com\/api/)
    assert.doesNotMatch(nginx, /47\.76\.135\.140/)
})
