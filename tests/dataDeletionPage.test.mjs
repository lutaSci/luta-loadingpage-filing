import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('account deletion instructions are public, specific, and crawler readable', async () => {
    const page = await readFile(new URL('../public/data-deletion/index.html', import.meta.url), 'utf8')

    assert.match(page, /<html lang="zh-Hant">/)
    assert.match(page, /https:\/\/lutaai\.com\/data-deletion\//)
    assert.match(page, /com\.luta\.reader/)
    assert.match(page, /帳號安全/)
    assert.match(page, /刪除帳號/)
    assert.match(page, /無法恢復/)
    assert.match(page, /https:\/\/lutaai\.com\/contact/)
    assert.match(page, /https:\/\/lutaai\.com\/privacy/)
    assert.doesNotMatch(page, /password|token|secret/i)
})

test('production server and release gate serve the static deletion page', async () => {
    const [nginx, deploy, sitemap] = await Promise.all([
        readFile(new URL('../nginx.conf', import.meta.url), 'utf8'),
        readFile(new URL('../deploy.sh', import.meta.url), 'utf8'),
        readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8'),
    ])

    assert.match(nginx, /location = \/data-deletion \{[\s\S]{0,200}return 308 \/data-deletion\//)
    assert.match(nginx, /location = \/data-deletion\/ \{[\s\S]{0,200}try_files \/data-deletion\/index\.html =404/)
    assert.match(deploy, /127\.0\.0\.1:8000\/data-deletion\//)
    assert.match(deploy, /PUBLIC_SMOKE_BASE_URL\}\/data-deletion\//)
    assert.match(sitemap, /<loc>https:\/\/lutaai\.com\/data-deletion\/<\/loc>/)
})
