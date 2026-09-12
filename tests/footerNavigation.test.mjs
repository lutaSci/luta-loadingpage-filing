import assert from 'node:assert/strict'
import { test } from 'node:test'
import { rememberFooterPosition, restoreFooterPosition } from '../src/lib/footerNavigation.js'

function browser(type = 'back_forward') {
    const frames = new Map()
    const value = {
        scrollY: 6400,
        history: {
            state: { key: 'router-entry', idx: 2, usr: { preferredLanguage: 'zhTW' } },
            replaceState(state) { this.state = state },
        },
        performance: { getEntriesByType: () => [{ type }] },
        requestAnimationFrame(callback) { frames.set(1, callback); return 1 },
        cancelAnimationFrame(id) { frames.delete(id) },
        scrollTo(options) { value.restored = options },
        flush() { frames.forEach(callback => callback()); frames.clear() },
    }
    return value
}

test('mobile footer return restores scroll without losing router history state', () => {
    const target = browser()
    const original = structuredClone(target.history.state)
    rememberFooterPosition({ button: 0 }, target)
    assert.equal(target.history.state.lutaFooterReturnY, 6400)
    restoreFooterPosition(target)
    target.flush()
    assert.deepEqual(target.restored, { top: 6400, behavior: 'instant' })
    assert.deepEqual(target.history.state, original)
})

test('modified clicks do not create a return marker and reloads do not jump', () => {
    for (const event of [{ button: 1 }, { button: 0, metaKey: true }, { button: 0, ctrlKey: true }, { button: 0, defaultPrevented: true }]) {
        const target = browser()
        rememberFooterPosition(event, target)
        assert.equal(target.history.state.lutaFooterReturnY, undefined)
    }
    const target = browser('reload')
    rememberFooterPosition({ button: 0 }, target)
    restoreFooterPosition(target)
    target.flush()
    assert.equal(target.restored, undefined)
    assert.equal(target.history.state.lutaFooterReturnY, undefined)
})

test('invalid positions and an unmounted footer cannot scroll the next page', () => {
    const target = browser()
    target.history.state.lutaFooterReturnY = -1
    assert.equal(restoreFooterPosition(target), undefined)
    rememberFooterPosition({ button: 0 }, target)
    const cancel = restoreFooterPosition(target)
    cancel()
    target.flush()
    assert.equal(target.restored, undefined)
})

// React StrictMode runs setup/cleanup/setup; the cancelled setup must not
// consume the marker before the second setup restores it.
test('a cancelled layout setup leaves the marker for the committed setup', () => {
    const target = browser()
    rememberFooterPosition({ button: 0 }, target)
    restoreFooterPosition(target)()
    restoreFooterPosition(target)
    target.flush()
    assert.equal(target.restored.top, 6400)
    assert.equal(target.history.state.lutaFooterReturnY, undefined)
})
